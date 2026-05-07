/**
 * Stage 2 handler — Chapter Extractor.
 *
 * Processes up to LIMITS.stage2ChaptersInParallel chapters per tick via
 * Promise.allSettled (one chapter failing does NOT block others).
 *
 * Caches each AI result in AnalysisChapterResult BEFORE validation, so a
 * crash mid-validation never re-charges us for the AI call.
 *
 * Validator-failure retry sequence (per chapter):
 *   - failures = 0 → primary model (gemini-2.5-flash)
 *   - failures ≥ 1 → fallback model (gemini-2.5-pro)
 *   - failures ≥ LIMITS.stage2MaxValidatorRetries → accept needs_review=true
 *     and stop retrying. Row stays in DB. Stage 3 reads needs_review and
 *     downweights those chapters in the synthesis.
 *
 * A chapter is "final" when its row has needs_review=false OR its retry
 * budget is exhausted. Stage 2 transitions to EXTRACTED only when every
 * chapter is final.
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/config/limits'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { sliceForStage2 } from '@/lib/pipeline/utils/transcript-slicer'
import { validateChapterLabels } from '@/lib/pipeline/utils/label-validator'
import { verifyChapterQuotes } from '@/lib/pipeline/utils/quote-verifier'
import { enforceOutputCaps } from '@/lib/pipeline/utils/output-caps'
import { getSessionNotes } from '@/lib/pipeline/utils/session-notes'
import { stage2ResponseSchema } from '@/lib/pipeline/schemas/stage2.schema'

function getPrompt() {
  return fs.readFileSync(
    path.join(process.cwd(), 'lib/pipeline/prompts/stage2-chapter-extractor.txt'),
    'utf-8'
  )
}

type ChapterDef = {
  chapter_index: number
  title: string
  t_start: number
  t_end: number
  planned_topic_match: string | null
  type: string
  transcript_quality_local: string
}

function toTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

async function processOneChapter(
  sessionId: string,
  chapter: ChapterDef,
  transcript: string,
  expertName: string,
  batchName: string,
  stageAttempts: Record<string, any>,
  model: string,
): Promise<{ chapterIndex: number; needsReview: boolean; reviewReasons: string[] }> {
  const chapterTranscript = sliceForStage2(
    transcript,
    toTimestamp(chapter.t_start),
    toTimestamp(chapter.t_end),
  )

  const userPayload = JSON.stringify({
    expert_name: expertName,
    batch_name: batchName,
    chapter_title: chapter.title,
    chapter_index: chapter.chapter_index,
    planned_topic_match: chapter.planned_topic_match,
    transcript_quality_local: chapter.transcript_quality_local,
    utterances: chapterTranscript,
  })

  const stageName = `Stage2[${sessionId.slice(0, 8)}:ch${chapter.chapter_index}]`

  const result = await callStage<any>({
    model,
    system: getPrompt(),
    user: userPayload,
    responseSchema: stage2ResponseSchema,
    initialBudget: LIMITS.stage2TokenBudget,
    maxBudget: LIMITS.stage2TokenCap,
    stageName,
    timeoutMs: LIMITS.stage2TimeoutMs,
  })

  // Apply output caps
  const capped = enforceOutputCaps(result)

  // Cache in DB BEFORE validation (saves AI cost on retry)
  await prisma.analysisChapterResult.upsert({
    where: {
      session_id_chapter_index: {
        session_id: sessionId,
        chapter_index: chapter.chapter_index,
      },
    },
    create: {
      id: `${sessionId}_ch${chapter.chapter_index}`,
      session_id: sessionId,
      chapter_index: chapter.chapter_index,
      result: capped as any,
      needs_review: false,
      review_reasons: [] as any,
    },
    update: {
      result: capped as any,
      needs_review: false,
      review_reasons: [] as any,
    },
  })

  // Run validators
  const labelResult = validateChapterLabels(capped)
  const quoteViolations = verifyChapterQuotes(chapterTranscript, capped)
  const allViolations = [...labelResult.violations, ...quoteViolations]

  if (allViolations.length > 0) {
    // Update row with needs_review
    await prisma.analysisChapterResult.update({
      where: {
        session_id_chapter_index: {
          session_id: sessionId,
          chapter_index: chapter.chapter_index,
        },
      },
      data: {
        needs_review: true,
        review_reasons: allViolations as any,
      },
    })

    console.warn(
      `[Stage2] ch${chapter.chapter_index} validation issues (model=${model}): ` +
      allViolations.join('; ')
    )

    return {
      chapterIndex: chapter.chapter_index,
      needsReview: true,
      reviewReasons: allViolations,
    }
  }

  return { chapterIndex: chapter.chapter_index, needsReview: false, reviewReasons: [] }
}

export async function handleStage2(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { expert: { select: { name: true } }, batch: { select: { name: true } } },
  })
  if (!session) throw new Error(`[Stage2] Session ${sessionId} not found`)

  const chapters: ChapterDef[] = (session as any).chapters_json as ChapterDef[] ?? []
  if (chapters.length === 0) throw new Error(`[Stage2] No chapters_json for session ${sessionId}`)

  const transcript = (session as any).transcript_clean ?? (session as any).transcriptRaw ?? ''
  const notes = await getSessionNotes(sessionId)
  const expertName = session.expert?.name ?? 'Unknown'
  const batchName = notes.batch_name ?? session.batch?.name ?? 'Unknown'
  const stageAttempts: Record<string, any> = ((session as any).stage_attempts as any) ?? {}

  // Find which chapters still need extraction.
  //
  // A chapter is "final" (not pending) when:
  //   (a) it has a row with needs_review=false (validator passed), OR
  //   (b) validator has failed >= LIMITS.stage2MaxValidatorRetries times
  //       (we've exhausted primary + fallback model — accept best effort).
  //
  // Without this, a chapter that failed validation on its first attempt is
  // permanently flagged needs_review and the fallback-model retry path is
  // dead code: doneIndices would already contain its index. This is the bug
  // that lets a Hindi/Hinglish chapter with a borderline label sit in the
  // DB as "Quite deep" instead of being re-scored by gemini-2.5-pro.
  const existingResults = await prisma.analysisChapterResult.findMany({
    where: { session_id: sessionId },
    select: { chapter_index: true, needs_review: true },
  })
  const finalIndices = new Set<number>()
  for (const r of existingResults) {
    if (!r.needs_review) {
      finalIndices.add(r.chapter_index)
      continue
    }
    const failKey = `stage2_ch${r.chapter_index}_validator_failures`
    const fails = (stageAttempts[failKey] ?? 0) as number
    if (fails >= LIMITS.stage2MaxValidatorRetries) {
      finalIndices.add(r.chapter_index)
    }
  }
  const pending = chapters.filter(c => !finalIndices.has(c.chapter_index))

  if (pending.length === 0) {
    // All chapters done — transition
    console.log(`[Stage2] ${sessionId}: all ${chapters.length} chapters extracted`)
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { pipeline_stage: 'EXTRACTED', next_action_at: new Date() } as any,
    })
    return
  }

  // Process batch
  const batch = pending.slice(0, LIMITS.stage2ChaptersInParallel)

  console.log(
    `[Stage2] ${sessionId}: processing chapters ` +
    `[${batch.map(c => c.chapter_index).join(',')}] ` +
    `(${pending.length} remaining of ${chapters.length})`
  )

  const results = await Promise.allSettled(
    batch.map(async chapter => {
      const failKey = `stage2_ch${chapter.chapter_index}_validator_failures`
      const consecutiveFailures = stageAttempts[failKey] ?? 0

      // Model escalation:
      //   attempt 1 (failures = 0) → primary  (gemini-2.5-flash)
      //   attempt 2+               → fallback (gemini-2.5-pro)
      const model =
        consecutiveFailures >= 1
          ? LIMITS.stage2FallbackModel
          : LIMITS.stage2PrimaryModel

      try {
        let result = await processOneChapter(
          sessionId, chapter, transcript, expertName, batchName, stageAttempts, model,
        )

        // Bottleneck #2 fix: immediate in-process escalation.
        // If the primary (Flash) model fails validation AND we still have
        // retries left AND we haven't already used the fallback, escalate to
        // Pro right now — no need to wait for the next tick.
        if (
          result.needsReview &&
          model === LIMITS.stage2PrimaryModel &&
          LIMITS.stage2PrimaryModel !== LIMITS.stage2FallbackModel &&
          consecutiveFailures < LIMITS.stage2MaxValidatorRetries
        ) {
          console.warn(
            `[Stage2] ch${chapter.chapter_index}: validator failure on primary, ` +
            `escalating to ${LIMITS.stage2FallbackModel} immediately (same tick)`,
          )
          stageAttempts[failKey] = consecutiveFailures + 1
          // Retry with fallback in the same tick
          result = await processOneChapter(
            sessionId, chapter, transcript, expertName, batchName, stageAttempts,
            LIMITS.stage2FallbackModel,
          )
        }

        if (result.needsReview && (stageAttempts[failKey] ?? 0) < LIMITS.stage2MaxValidatorRetries) {
          stageAttempts[failKey] = (stageAttempts[failKey] ?? 0) + 1
          if ((stageAttempts[failKey] ?? 0) >= LIMITS.stage2MaxValidatorRetries) {
            console.warn(
              `[Stage2] ch${chapter.chapter_index}: exhausted ${LIMITS.stage2MaxValidatorRetries} ` +
              `validator retries, accepting needs_review=true and moving on`,
            )
          }
        } else if (!result.needsReview) {
          // Clear failure counter on success
          stageAttempts[failKey] = 0
        }

        return result
      } catch (err) {
        console.error(`[Stage2] ch${chapter.chapter_index} error:`, err)
        throw err
      }
    })
  )

  // Add 15s spacing between Stage 2 batches to spread Gemini calls.
  // When more chapters remain, a tiny delay prevents 5 concurrent sessions
  // each firing 3 parallel calls simultaneously (= 15 Gemini calls/tick).
  // Check if ALL chapters are now "final" — same gate as the pending filter
  // above, otherwise we would transition to EXTRACTED while some chapters are
  // still mid-validator-retry sequence (row exists with needs_review=true but
  // failure counter hasn't hit the cap yet).
  const allResults = await prisma.analysisChapterResult.findMany({
    where: { session_id: sessionId },
    select: { chapter_index: true, needs_review: true },
  })
  const finalCount = allResults.reduce((acc, r) => {
    if (!r.needs_review) return acc + 1
    const fails =
      (stageAttempts[`stage2_ch${r.chapter_index}_validator_failures`] ?? 0) as number
    return fails >= LIMITS.stage2MaxValidatorRetries ? acc + 1 : acc
  }, 0)

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      stage_attempts: stageAttempts as any,
      // Bottleneck #5 fix: use centralised LIMITS value instead of hardcoded 15s.
      // In practice the next tick fires at most every 60s (Vercel Cron),
      // so setting this to 0 effectively means "process on next available tick".
      next_action_at: new Date(Date.now() + LIMITS.stage2BatchCooldownMs),
      v3Progress: `Extracted ${finalCount} of ${chapters.length} chapters`,
      v3Status: 'EXTRACTING',
    } as any,
  })

  if (finalCount >= chapters.length) {
    const nrCount = allResults.filter(r => r.needs_review).length
    console.log(
      `[Stage2] ${sessionId}: all ${chapters.length} chapters final ` +
      `(${nrCount} needs_review), transitioning to EXTRACTED`,
    )
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { pipeline_stage: 'EXTRACTED', next_action_at: new Date() } as any,
    })
  }

  // Log settled results
  const fulfilled = results.filter(r => r.status === 'fulfilled').length
  const rejected = results.filter(r => r.status === 'rejected').length
  console.log(`[Stage2] ${sessionId}: batch done — ${fulfilled} ok, ${rejected} failed`)

  // If EVERY chapter in the batch failed, throw so the tick-level retry
  // counter kicks in. Otherwise the handler looks "successful" to the tick
  // and the session loops until the 4-hour deadline.
  if (fulfilled === 0 && rejected > 0) {
    const firstErr = results.find(r => r.status === 'rejected') as PromiseRejectedResult
    throw new Error(
      `[Stage2] All ${rejected} chapters in batch failed. Last error: ` +
      `${firstErr?.reason?.message?.slice(0, 200) ?? 'unknown'}`,
    )
  }
}
