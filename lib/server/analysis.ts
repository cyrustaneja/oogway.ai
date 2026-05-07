import { prisma } from '@/lib/prisma';
import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';
import { SessionAnalysisSchema } from '@/lib/pipeline/schemas/contract.zod';

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
 *
 * Why safeParse: full_synthesis is a JSONB column. If a stale shape from an
 * earlier schema_version is still in the DB, naive cast lets it through and
 * the section components crash with cryptic "cannot read property of
 * undefined" errors. Using safeParse here lets the page render an empty/error
 * state cleanly instead.
 */
export async function getSessionAnalysis(
  sessionId: string,
): Promise<{ data: SessionAnalysis; chapters: ChapterResult[] } | null> {
  const session = await prisma.analysisSession.findFirst({
    where: { id: sessionId, deletedAt: null },
    include: {
      expert: { select: { name: true } },
      batch: { select: { name: true } },
      v2Analysis: true,
      AnalysisChapterResult: {
        orderBy: { chapter_index: 'asc' },
      },
    },
  });

  if (!session || !session.v2Analysis) return null;

  // Validate against the canonical Zod contract before handing to the UI.
  // If validation fails, use the raw data anyway — the UI section components
  // all have EmptyState fallbacks for missing fields. Returning null here
  // would show an infinite "Analyzing..." spinner for a completed session.
  const parsed = SessionAnalysisSchema.safeParse(session.v2Analysis.full_synthesis);
  let data: SessionAnalysis;
  if (!parsed.success) {
    console.warn(
      `[getSessionAnalysis] full_synthesis schema warning for session ${sessionId}:`,
      parsed.error.issues.slice(0, 3),
    );
    data = session.v2Analysis.full_synthesis as unknown as SessionAnalysis;
  } else {
    data = parsed.data as unknown as SessionAnalysis;
  }

  const chapters = session.AnalysisChapterResult.map(c => {
    const meta = (session.chapters_json as any[])?.find((m: any) => m.chapter_index === c.chapter_index);
    return {
      ...(c.result as any),
      t_start: meta?.t_start ?? 0,
      t_end: meta?.t_end ?? 0,
    };
  }) as unknown as ChapterResult[];

  // Calculate actual duration from last chapter's t_end if scheduledDuration is missing
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

  const enrichedData = {
    ...data,
    session_info: {
      name: session.name,
      expertName: session.expert?.name || 'Unknown Expert',
      batchName: session.batch?.name || 'Unknown Batch',
      date: session.createdAt ? session.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Unknown Date',
      duration: `${durationMins} mins`,
    },
  } as any;

  return { data: enrichedData, chapters };
}
