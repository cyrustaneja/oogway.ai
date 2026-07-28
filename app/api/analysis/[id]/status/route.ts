/**
 * GET /api/analysis/[id]/status
 *
 * Lightweight polling endpoint used by the analysis page's progress widget.
 * Returns realistic progress percentage and stage information.
 */
import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'
import { POST as triggerTick } from '@/app/api/pipeline/tick/route'

export const dynamic = 'force-dynamic'

const STAGE_ORDER = [
  'UPLOADED',
  'PREPROCESSED',
  'CHAPTERS_DETECTED',
  'EXTRACTING',
  'EXTRACTED',
  'SYNTHESIZED',
  'FLAGGED',
  'COMPLETE',
] as const

function stageProgress(stage: string, chaptersDone: number, chaptersPlanned: number, v3Status?: string): number {
  // Coarse base bands per stage
  const bands: Record<string, [number, number]> = {
    UPLOADED:           [5,  15],
    PREPROCESSED:       [15, 30],
    CHAPTERS_DETECTED: [30,  75],   // chapter-by-chapter fills this band
    EXTRACTING:        [30,  75],   // fallback for status-based extraction
    EXTRACTED:         [75,  85],
    SYNTHESIZED:       [85,  92],
    FLAGGED:           [92,  98],
    COMPLETE:          [100,100],
    FAILED:            [0,   0],
  }
  
  const isExtracting = stage === 'CHAPTERS_DETECTED' || stage === 'EXTRACTING' || v3Status === 'EXTRACTING';
  const effectiveStage = isExtracting ? 'CHAPTERS_DETECTED' : stage;
  
  const [lo, hi] = bands[effectiveStage] ?? [10, 20]
  
  if (isExtracting && chaptersPlanned > 0) {
    const frac = Math.min(1, chaptersDone / chaptersPlanned)
    return Math.round(lo + (hi - lo) * frac)
  }
  return lo;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const s = await prisma.analysisSession.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        pipeline_stage: true,
        v3Status: true,
        v3Error: true,
        chapters_json: true,
        createdAt: true,
        updatedAt: true,
        tier1Result: true,
        v2Analysis: { select: { sessionId: true, status: true } },
        AnalysisChapterResult: { select: { chapter_index: true } },
        expert: { select: { name: true } },
      },
    })

    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const chaptersPlanned = Array.isArray(s.chapters_json)
      ? (s.chapters_json as any[]).length
      : 0
    const chaptersDone = s.AnalysisChapterResult.length
    const stage = s.pipeline_stage ?? 'UPLOADED'
    const isComplete = (stage === 'COMPLETE' && !!s.v2Analysis) || (stage === 'WAITING_FOR_DEEP_ANALYSIS')
    const isFailed = stage === 'FAILED'

    // Smooth, realistic progress percentage calculation
    let progress = 0;
    if (isFailed) {
      progress = 0;
    } else if (isComplete) {
      progress = 100;
    } else if (stage === 'PULSE_PENDING' || stage === 'UPLOADED' || s.v3Status === 'PENDING') {
      // Trigger tick non-blocking if session hasn't been claimed yet
      void triggerTick(
        new Request("https://master-oogway-ai.vercel.app/api/pipeline/tick", {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.CRON_SECRET || ""}` },
        })
      ).catch(() => {});

      // Calculate realistic progress over time (advances smoothly from 15% to 92%)
      const elapsedSec = Math.max(0, (Date.now() - new Date(s.createdAt).getTime()) / 1000);
      progress = Math.min(92, Math.round(15 + 77 * (1 - Math.exp(-elapsedSec / 12))));
    } else {
      progress = stageProgress(stage, chaptersDone, chaptersPlanned, s.v3Status);
    }

    return NextResponse.json({
      id: s.id,
      name: s.name,
      expertName: s.expert?.name ?? 'Expert',
      stage,
      v3Status: s.v3Status,
      v3Error: s.v3Error ?? null,
      chaptersDone,
      chaptersPlanned,
      progress,
      isComplete,
      isFailed,
      isReady: (stage === 'COMPLETE' && !!s.v2Analysis) || (stage === 'WAITING_FOR_DEEP_ANALYSIS' && !!(s as any).tier1Result),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      stageOrder: STAGE_ORDER,
    })
  } catch (error: any) {
    console.error(`[GET /api/analysis/${id}/status] Error:`, error)
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}
