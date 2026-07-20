/**
 * GET /api/analysis/[id]/status
 *
 * Lightweight polling endpoint used by the analysis page's progress widget.
 * Returns the minimal info needed to render a progress bar and the current
 * stage label without shipping the full analysis JSON across the wire.
 *
 * Auth: requires a logged-in user (matches /api/analysis/[id]).
 */
import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'

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
    UPLOADED:           [0,   5],
    PREPROCESSED:       [5,  15],
    CHAPTERS_DETECTED: [15,  75],   // chapter-by-chapter fills this band
    EXTRACTING:        [25,  75],   // fallback for status-based extraction
    EXTRACTED:         [75,  80],
    SYNTHESIZED:       [80,  92],
    FLAGGED:           [92,  98],
    COMPLETE:          [100,100],
    FAILED:            [0,   0],
  }
  
  // If we are in the extraction phase (either stage or status), use chapter math
  const isExtracting = stage === 'CHAPTERS_DETECTED' || stage === 'EXTRACTING' || v3Status === 'EXTRACTING';
  const effectiveStage = isExtracting ? 'CHAPTERS_DETECTED' : stage;
  
  const [lo, hi] = bands[effectiveStage] ?? [0, 0]
  
  if (isExtracting && chaptersPlanned > 0) {
    const frac = Math.min(1, chaptersDone / chaptersPlanned)
    // Start the extraction band at 15% and go up to 75%
    return Math.round(lo + (hi - lo) * frac)
  }
  // Return the start of the band for other stages to avoid jumping to the middle
  return lo;
}

// Final Schema Sync: 2026-05-02T12:46:00
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

    // Inject PULSE_PENDING logic dynamically
    let progress = 0;
    if (isFailed) progress = 0;
    else if (isComplete) progress = 100;
    else if (stage === 'PULSE_PENDING') progress = 45; // Just a static mid-way progress for Pulse
    else progress = stageProgress(stage, chaptersDone, chaptersPlanned, s.v3Status);

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
