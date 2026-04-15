/**
 * STAGE 1 — CHAPTER STRUCTURE DETECTION
 *
 * Sends the full (or compressed) transcript to Gemini and asks it to
 * identify logical chapters/topics with timestamps.
 *
 * Returns a validated array of ChapterDef objects that are then stored
 * as AnalysisChapter records in the database.
 */

import { callGeminiJSON } from "./gemini";

export interface ChapterDef {
  chapterIndex: number;
  chapterTitle: string;
  startTime: string; // HH:MM:SS
  endTime: string;   // HH:MM:SS
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const STRUCTURE_SYSTEM_PROMPT = `
You are a transcript structure analyser. Your only job is to segment a teaching session transcript into logical chapters by detecting topic shifts.

OUTPUT FORMAT — a JSON array, nothing else:
[
  {
    "chapterIndex": 1,
    "chapterTitle": "Clear descriptive title of the topic",
    "startTime": "HH:MM:SS",
    "endTime": "HH:MM:SS"
  }
]

STRICT RULES:
1. Produce strictly 8 to 10 chapters for full sessions. Sessions less than 30 min → 3–5 chapters.
2. Every chapter must have a startTime and endTime taken directly from transcript timestamps. No invented timestamps.
3. Chapters must be non-overlapping and in chronological order.
4. The first chapter must start at or near the first timestamp in the transcript.
5. The last chapter must end at or near the last timestamp in the transcript.
6. chapterIndex must be 1-based integers, sequential, with no gaps.
7. Each chapter should cover around 10 to 15 minutes of the session unless the session is very short.
8. Output ONLY the JSON array. No markdown fences. No prose. No explanation.
`.trim();

// ─── USER PROMPT ──────────────────────────────────────────────────────────────

function buildUserPrompt(transcript: string): string {
  return `Segment this teaching session transcript into chapters:\n\n${transcript}`;
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const TS_RE = /^\d{2}:\d{2}:\d{2}$/;

function validateChapters(raw: unknown): ChapterDef[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("STAGE1_INVALID: Model did not return a non-empty array.");
  }

  const chapters: ChapterDef[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Record<string, unknown>;

    const chapterIndex = typeof item.chapterIndex === "number" ? item.chapterIndex : i + 1;
    const chapterTitle = typeof item.chapterTitle === "string" && item.chapterTitle.trim()
      ? item.chapterTitle.trim()
      : `Chapter ${chapterIndex}`;

    const startTime = typeof item.startTime === "string" ? item.startTime.split(".")[0].trim() : null;
    const endTime   = typeof item.endTime   === "string" ? item.endTime.split(".")[0].trim()   : null;

    if (!startTime || !TS_RE.test(startTime)) {
      throw new Error(`STAGE1_INVALID: Chapter ${chapterIndex} has invalid startTime: "${startTime}"`);
    }
    if (!endTime || !TS_RE.test(endTime)) {
      throw new Error(`STAGE1_INVALID: Chapter ${chapterIndex} has invalid endTime: "${endTime}"`);
    }

    chapters.push({ chapterIndex, chapterTitle, startTime, endTime });
  }

  // Re-index sequentially to avoid gaps
  return chapters.map((c, idx) => ({ ...c, chapterIndex: idx + 1 }));
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

/**
 * Detect chapters from a clean transcript string.
 * For very long transcripts (>100k chars), pass a compressed sample
 * (e.g. every 3rd line) to stay within token limits.
 */
export async function detectChapters(transcript: string): Promise<ChapterDef[]> {
  // If transcript is very large, thin it out to keep within ~30k tokens
  let input = transcript;
  if (transcript.length > 120_000) {
    const lines = transcript.split("\n");
    // Keep every 3rd line but always keep the first and last 50 lines for timestamps
    const head = lines.slice(0, 50);
    const tail = lines.slice(-50);
    const middle = lines.slice(50, -50).filter((_, i) => i % 3 === 0);
    input = [...head, ...middle, ...tail].join("\n");
  }

  const raw = await callGeminiJSON<unknown>({
    systemPrompt: STRUCTURE_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    maxOutputTokens: 4096,
  });

  return validateChapters(raw);
}
