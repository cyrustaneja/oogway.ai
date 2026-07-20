/**
 * Stage 1 handler — Segmenter.
 *
 * Reads the FULL cleaned transcript, sends it to Gemini with the segmenter
 * prompt + the explicit duration and minimum chapter count, and writes the
 * chapter list to AnalysisSession.chapters_json.
 *
 * Transitions pipeline_stage from PREPROCESSED → CHAPTERS_DETECTED.
 *
 * Quality strategy: if the model under-segments (e.g. 1 chapter for a 90-min
 * session), we retry UP TO 2 MORE TIMES with an augmented prompt that tells
 * the model exactly what went wrong. If after 3 total attempts we still can't
 * hit the minimum, we accept whatever we have — a thin analysis is the last
 * resort, not the first choice.
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/config/limits'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { sliceForStage1 } from '@/lib/pipeline/utils/transcript-slicer'
import { getSessionNotes } from '@/lib/pipeline/utils/session-notes'
import { stage1ResponseSchema } from '@/lib/pipeline/schemas/stage1.schema'

function getPrompt() {
  return fs.readFileSync(
    path.join(process.cwd(), 'lib/pipeline/prompts/stage1-segmenter.txt'),
    'utf-8'
  )
}

type Stage1Output = {
  chapters: Array<{
    chapter_index: number
    title: string
    t_start: number
    t_end: number
    planned_topic_match: string | null
    type: string
    one_line_summary: string
    transcript_quality_local: string
  }>
}

/**
 * Returns minimum chapter count given session duration in seconds.
 * Reads thresholds from LIMITS.chapterMinimums — edit lib/config/limits.ts
 * to tune without touching code.
 */
export function minChaptersForDuration(durationSeconds: number): number {
  const mins = durationSeconds / 60
  for (const [maxMins, minCh] of LIMITS.chapterMinimums) {
    if (mins < maxMins) return minCh
  }
  return LIMITS.chapterMinimumDefault
}

/**
 * Parse timestamps from a transcript and return total span in seconds.
 * Supports VTT cleaned (00:01:23.456), bracketed ([0:01:23]), bare (00:01:23).
 */
function computeTranscriptDurationSeconds(transcript: string): number {
  const tsRegex = /(?:^|\[)(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?(?:\]|(?=\s|$))/gm
  let firstTs: number | null = null
  let lastTs: number | null = null

  let match: RegExpExecArray | null
  while ((match = tsRegex.exec(transcript)) !== null) {
    const seconds =
      parseInt(match[1], 10) * 3600 +
      parseInt(match[2], 10) * 60 +
      parseInt(match[3], 10)
    if (firstTs === null) firstTs = seconds
    lastTs = seconds
  }

  if (firstTs === null || lastTs === null) return 0
  return Math.max(0, lastTs - firstTs)
}

import { trackCost } from '@/lib/pipeline/utils/cost-tracker'

// ── Internal: single segmentation attempt ────────────────────────────────────

async function attemptSegmentation(
  sessionId: string,
  model: string,
  systemPrompt: string,
  userPayload: string,
  budget: number,
  label: string,
): Promise<Stage1Output> {
  console.log(`[Stage1] ${sessionId.slice(0, 8)}: ${label} — model=${model}, budget=${budget}`)

  return callStage<Stage1Output>({
    model,
    system: systemPrompt,
    user: userPayload,
    responseSchema: stage1ResponseSchema,
    initialBudget: budget,
    maxBudget: LIMITS.stage1TokenCap,
    stageName: `Stage1[${sessionId.slice(0, 8)}]`,
    timeoutMs: LIMITS.stage1TimeoutMs,
    onUsage: (usage) => trackCost(sessionId, model, usage),
  })
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function handleStage1(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { expert: { select: { name: true } }, batch: { select: { name: true } } },
  })
  if (!session) throw new Error(`[Stage1] Session ${sessionId} not found`)

  const transcript = (session as any).transcript_clean ?? (session as any).transcriptRaw ?? ''
  const fullTranscript = sliceForStage1(transcript)
  const notes = await getSessionNotes(sessionId)

  const durationSeconds = computeTranscriptDurationSeconds(fullTranscript)
  const minChapters = minChaptersForDuration(durationSeconds)
  const durationMins = Math.round(durationSeconds / 60)
  const basePrompt = getPrompt()

  const basePayload = {
    expert_name: session.expert?.name ?? 'Unknown',
    batch_name: notes.batch_name ?? session.batch?.name ?? 'Unknown',
    planned_topics: notes.planned_topics,
    duration_seconds: durationSeconds,
    duration_minutes: durationMins,
    min_chapters_required: minChapters,
    transcript: fullTranscript,
  }

  console.log(
    `[Stage1] ${sessionId.slice(0, 8)}: duration=${durationMins}min, ` +
    `min_chapters=${minChapters}, transcript_chars=${fullTranscript.length}`,
  )

  // ── Attempt 1: standard call ───────────────────────────────────────────────
  let result = await attemptSegmentation(
    sessionId,
    LIMITS.stage1Model,
    basePrompt,
    JSON.stringify(basePayload),
    LIMITS.stage1TokenBudget,
    'Attempt 1 (standard)',
  )

  const MAX_SEGMENTATION_RETRIES = 2

  // ── Retry with feedback if under-segmented ─────────────────────────────────
  for (let retry = 0; retry < MAX_SEGMENTATION_RETRIES; retry++) {
    const chapterCount = result.chapters?.length ?? 0
    if (chapterCount >= minChapters) break  // good enough

    if (chapterCount === 0) break  // nothing to work with, will throw below

    // Build augmented prompt with explicit feedback
    const topics = notes.planned_topics?.length > 0
      ? notes.planned_topics.join(', ')
      : 'not provided — infer from transcript'

    const feedbackPayload = {
      ...basePayload,
      _retry_feedback: {
        previous_chapter_count: chapterCount,
        required_minimum: minChapters,
        instruction: `Your previous response returned only ${chapterCount} chapter(s) for a ${durationMins}-minute session. `
          + `This is NOT acceptable. A ${durationMins}-minute session covering topics like [${topics}] `
          + `MUST have at least ${minChapters} distinct chapters. `
          + `Look for topic shifts, Q&A blocks, breaks, and activity changes. `
          + `Read the ENTIRE transcript from start to finish — do not stop early.`,
      },
    }

    // Use higher budget on retry — the model may need more output tokens
    const retryBudget = Math.min(
      LIMITS.stage1TokenBudget * (retry + 2),
      LIMITS.stage1TokenCap,
    )

    console.warn(
      `[Stage1] ${sessionId.slice(0, 8)}: under-segmented (${chapterCount}/${minChapters}), ` +
      `retrying with feedback (attempt ${retry + 2}/${MAX_SEGMENTATION_RETRIES + 1})`,
    )

    try {
      result = await attemptSegmentation(
        sessionId,
        LIMITS.stage1Model,
        basePrompt,
        JSON.stringify(feedbackPayload),
        retryBudget,
        `Attempt ${retry + 2} (feedback retry, budget=${retryBudget})`,
      )
    } catch (err: any) {
      console.error(`[Stage1] ${sessionId.slice(0, 8)}: feedback retry ${retry + 2} failed: ${err?.message}`)
      break  // keep whatever we had from the previous attempt
    }
  }

  // ── Validate result ────────────────────────────────────────────────────────
  if (!result.chapters || result.chapters.length === 0) {
    throw new Error(`[Stage1] No chapters returned for session ${sessionId}`)
  }

  const finalCount = result.chapters.length
  if (finalCount < minChapters) {
    console.warn(
      `[Stage1] ${sessionId.slice(0, 8)}: accepting ${finalCount} chapter(s) after all retries ` +
      `(minimum was ${minChapters}). Analysis quality may be reduced.`,
    )
  }

  // Filter out truly malformed chapters
  result.chapters = result.chapters.filter(ch =>
    ch.title &&
    typeof ch.t_start === 'number' &&
    typeof ch.t_end === 'number'
  )

  if (result.chapters.length === 0) {
    throw new Error(`[Stage1] No valid chapters after filtering for session ${sessionId}`)
  }

  // ── Sort and normalize ─────────────────────────────────────────────────────
  result.chapters.sort((a, b) => a.chapter_index - b.chapter_index)

  // Find last timestamp in transcript
  const allTsMatches = [...fullTranscript.matchAll(/\[?(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?\]?/g)]
  let lastTsSeconds = 0
  if (allTsMatches.length > 0) {
    const last = allTsMatches[allTsMatches.length - 1]
    lastTsSeconds = parseInt(last[1], 10) * 3600 + parseInt(last[2], 10) * 60 + parseInt(last[3], 10)
  }

  // Normalize chapter indexes (fix 'chundefined' bug)
  result.chapters = result.chapters
    .filter(ch => ch.t_start !== undefined && ch.t_start !== null)
    .map((ch, idx) => ({
      ...ch,
      chapter_index: typeof ch.chapter_index === 'number' && !isNaN(ch.chapter_index)
        ? ch.chapter_index
        : idx + 1,
    }))

  // Patch t_end gaps
  result.chapters.forEach((ch, idx) => {
    if (idx === result.chapters.length - 1) {
      ch.t_end = Math.max(lastTsSeconds, ch.t_start + 60)
    } else if (!ch.t_end || ch.t_end <= ch.t_start) {
      ch.t_end = result.chapters[idx + 1].t_start
    }
  })

  console.log(
    `[Stage1] ${sessionId.slice(0, 8)}: accepted ${result.chapters.length} chapters ` +
    `(${result.chapters[0].t_start}s – ${result.chapters[result.chapters.length - 1].t_end}s)`,
  )

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      chapters_json: result.chapters as any,
      pipeline_stage: 'WAITING_FOR_DEEP_ANALYSIS', // Pause here for Two-Stage Architecture
      v3Status: 'PREPROCESSING', // Or use a custom status if added, keeping it valid for Prisma enum
      next_action_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year in the future, wait for manual trigger
    } as any,
  })
}
