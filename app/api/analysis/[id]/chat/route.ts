import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Fetches a VTT/SRT transcript from a remote URL and converts it to plain
 * readable text by stripping all WebVTT/SRT metadata (timestamps, NOTE,
 * WEBVTT header, numeric cue identifiers, etc.).
 */
async function fetchAndParseVTT(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return '';
    const raw = await res.text();

    // Strip WEBVTT header, NOTE blocks, cue timings, and HTML tags
    const lines = raw.split('\n');
    const textLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip blank lines, WEBVTT header, NOTE blocks, and cue timing lines (00:00:00.000 --> ...)
      if (!trimmed) continue;
      if (trimmed.startsWith('WEBVTT') || trimmed.startsWith('NOTE')) continue;
      if (/^\d+$/.test(trimmed)) continue; // SRT sequence numbers
      if (/-->/i.test(trimmed)) continue;   // Timing lines
      if (trimmed.startsWith('<') && trimmed.endsWith('>')) continue; // Pure HTML tags

      // Strip inline HTML tags (e.g. <c.colorE5E5E5>) and keep the text
      const cleaned = trimmed.replace(/<[^>]*>/g, '').trim();
      if (cleaned) textLines.push(cleaned);
    }

    // Deduplicate adjacent identical lines (VTT sometimes has overlapping cues)
    const deduped: string[] = [];
    for (const l of textLines) {
      if (deduped[deduped.length - 1] !== l) deduped.push(l);
    }

    return deduped.join(' ').substring(0, 40_000); // max 40k chars to stay in context
  } catch (err) {
    console.error('[fetchAndParseVTT] Failed to fetch VTT:', err);
    return '';
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
  }

  if (!genAI) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const session = await prisma.analysisSession.findUnique({
      where: { id, deletedAt: null },
      select: {
        transcriptUrl: true,
        tier1Result: true,
        sessionNote: { select: { name: true, keyTopics: true } },
      },
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch transcript on-demand from the VTT URL (never rely on DB storage)
    const transcript = session.transcriptUrl
      ? await fetchAndParseVTT(session.transcriptUrl)
      : '';

    // Serialize the Oogway Pulse analysis data for the model to reference
    const pulseData = session.tier1Result
      ? JSON.stringify(session.tier1Result, null, 2).substring(0, 8_000)
      : null;

    const systemInstruction = `You are Oogway, KraftShala's AI educational evaluator.
CRITICAL INSTRUCTIONS:
1. Your primary job is to objectively JUDGE THE EXPERT'S TEACHING PERFORMANCE.
2. Do NOT give abstract, preachy "gyan", philosophical lectures, or generic advice.
3. Be direct, clear, and objective. Speak in plain, simple, everyday English. Avoid complicated jargon or flowery metaphors.
4. Directly evaluate whether the expert succeeded or failed at context setting, pacing, analogy clarity, doubt resolution, or student engagement.
5. Support your evaluation with specific moments or quotes from the session transcript.

Session Context:
Topic: ${session.sessionNote?.name ?? 'Unknown'}
Planned Topics: ${(session.sessionNote?.keyTopics ?? []).join(', ') || 'Not specified'}

${pulseData ? `=== OOGWAY PULSE ANALYSIS (structured) ===\n${pulseData}\n===` : ''}

${transcript ? `=== TRANSCRIPT (first 40,000 chars) ===\n${transcript}\n===` : '(No transcript available — answer based on the Pulse analysis above.)'}
`;

    // Map conversation history — filter out the initial greeting from history
    const geminiHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error(`[POST /api/analysis/${id}/chat] Error:`, error);
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
