import { prisma } from '@/lib/prisma';
import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';
import { SessionAnalysisSchema } from '@/lib/pipeline/schemas/contract.zod';
import { enrichSynthesisTimestamps } from './transcript-utils';

/**
 * Reads the v2Analysis.full_synthesis column for a session, validates it
 * against the canonical Zod contract, and attaches non-AI session metadata
 * (expert name, batch, date, duration) for the header.
 *
 * Returns null when:
 *   - the session doesn't exist
 *   - the session is soft-deleted
 *   - the session has no v2Analysis row yet (still mid-pipeline / FAILED)
 *   - the stored full_synthesis doesn't match the schema
 */
export async function getSessionAnalysis(
  sessionId: string,
): Promise<{ data: SessionAnalysis | any; chapters?: ChapterResult[]; tier?: string } | null> {
  const session = await prisma.analysisSession.findFirst({
    where: { id: sessionId, deletedAt: null },
    select: {
      id: true,
      name: true,
      scheduledDuration: true,
      chapters_json: true,
      createdAt: true,
      expert: { select: { name: true } },
      batch: { select: { name: true } },
      tier: true,
      videoUrl: true,
      transcriptUrl: true,
      transcript_clean: true,
      transcriptRaw: true,
      tier1Result: true,
      v2Analysis: true,
      AnalysisChapterResult: {
        orderBy: { chapter_index: 'asc' },
      },
      pipeline_stage: true,
    },
  });

  if (!session) return null;

  let durationMins = session.scheduledDuration || 0;
  if (durationMins === 0 && session.chapters_json && Array.isArray(session.chapters_json)) {
    const chaptersJson = session.chapters_json as any[];
    if (chaptersJson.length > 0) {
      const lastChapter = chaptersJson[chaptersJson.length - 1];
      if (lastChapter.t_end) {
        durationMins = Math.round(lastChapter.t_end / 60);
      }
    }
  }

  const session_info = {
    name: session.name,
    expertName: session.expert?.name || 'Unknown Expert',
    batchName: session.batch?.name || 'Unknown Batch',
    date: session.createdAt ? session.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Unknown Date',
    duration: `${durationMins} mins`,
    costEstimate: session.v2Analysis?.costEstimate || 0,
  };

  if (session.tier === 'TIER1') {
    if (!session.tier1Result) return null;
    return { data: { ...((session.tier1Result as any) || {}), session_info, videoUrl: session.videoUrl, transcriptUrl: session.transcriptUrl }, tier: 'TIER1' };
  }

  let data: any = { session_info, pipeline_stage: session.pipeline_stage, videoUrl: session.videoUrl, transcriptUrl: session.transcriptUrl };
  if (session.tier1Result) {
    data = { ...data, ...(session.tier1Result as any) };
  }

  if (!session.v2Analysis) {
    if (session.pipeline_stage !== 'WAITING_FOR_DEEP_ANALYSIS') {
      return null;
    }
  } else {
    const parsed = SessionAnalysisSchema.safeParse(session.v2Analysis.full_synthesis);
    if (!parsed.success) {
      console.warn(
        `[getSessionAnalysis] full_synthesis schema warning for session ${sessionId}:`,
        parsed.error.issues.slice(0, 3),
      );
      data = { ...data, ...(session.v2Analysis.full_synthesis as any) };
    } else {
      data = { ...data, ...(parsed.data as any) };
    }
  }

  let chapters: ChapterResult[] = [];
  if (session.AnalysisChapterResult && session.AnalysisChapterResult.length > 0) {
    chapters = session.AnalysisChapterResult.map(c => {
      const meta = (session.chapters_json as any[])?.find((m: any) => m.chapter_index === c.chapter_index);
      return {
        ...(c.result as any),
        t_start: meta?.t_start ?? 0,
        t_end: meta?.t_end ?? 0,
      };
    }) as unknown as ChapterResult[];
  } else if (session.chapters_json && Array.isArray(session.chapters_json)) {
    chapters = session.chapters_json as unknown as ChapterResult[];
  }

  const getTranscript = async () => {
    let t = (session as any).transcript_clean || (session as any).transcriptRaw || '';
    if (!t && session.transcriptUrl) {
      try {
        const res = await fetch(session.transcriptUrl);
        if (res.ok) t = await res.text();
      } catch (err) {
        console.error(`[getSessionAnalysis] Failed to fetch transcript from ${session.transcriptUrl}`);
      }
    }
    return t;
  };

  const rawTranscript = await getTranscript();

  // Dynamically enrich data (analogies, unresolved doubts, student questions) with timestamps
  const enrichedData = await enrichSynthesisTimestamps(data, async () => rawTranscript, chapters);

  // Calculate punctuality on the fly without extra AI calls
  if (enrichedData && session.scheduledDuration) {
    const scheduledSeconds = session.scheduledDuration * 60;
    
    // Find first timestamp for the Expert
    const expertNameRegex = new RegExp(`\\[(\\d{1,2}:\\d{2}:\\d{2})(?:\\.\\d+)?\\]\\s*${session.expert?.name?.split(' ')[0]}`, 'i');
    const firstExpertMatch = rawTranscript.match(expertNameRegex);
    let expertStartSeconds = 0;
    if (firstExpertMatch) {
      const p = firstExpertMatch[1].split(':');
      expertStartSeconds = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
    } else {
      // Fallback: very first timestamp in transcript
      const firstTsMatch = rawTranscript.match(/\[(\d{1,2}:\d{2}:\d{2})(?:\.\d+)?\]/);
      if (firstTsMatch) {
        const p = firstTsMatch[1].split(':');
        expertStartSeconds = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
      }
    }

    let lastTsSeconds = 0;
    const allTsMatches = [...rawTranscript.matchAll(/\[(\d{1,2}:\d{2}:\d{2})(?:\.\d+)?\]/g)];
    if (allTsMatches.length > 0) {
      const last = allTsMatches[allTsMatches.length - 1];
      lastTsSeconds = parseInt(last[1]) * 3600 + parseInt(last[2]) * 60 + parseInt(last[3]);
    }

    const activeDuration = Math.max(0, lastTsSeconds - expertStartSeconds);
    const isLate = activeDuration < 0.9 * scheduledSeconds;

    const ed = enrichedData as any;
    if (!ed.hygiene) ed.hygiene = {} as any;
    if (!ed.hygiene.punctuality) ed.hygiene.punctuality = {} as any;
    
    ed.hygiene.punctuality.label = isLate ? 'Late' : 'On Time';
    ed.hygiene.punctuality.rationale = `Expert taught for ${Math.round(activeDuration / 60)} mins out of scheduled ${session.scheduledDuration} mins (started at ${Math.round(expertStartSeconds / 60)}m mark).`;
  }

  // Calculate actual duration from last chapter's t_end if scheduledDuration is missing
  // (Handled above now)

  const finalEnrichedData = {
    ...enrichedData,
    session_info,
  } as any;

  return { data: finalEnrichedData, chapters, tier: 'TIER3' };
}

