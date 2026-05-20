/**
 * Pipeline Tick — POST /api/pipeline/tick
 *
 * Cron entry point, called every minute by Vercel Cron.
 * Claims up to LIMITS.pipelineConcurrency sessions per invocation using
 * raw SQL with FOR UPDATE SKIP LOCKED.
 *
 * Dispatches each session to the handler matching its pipeline_stage.
 * On error: increments stage_attempts.<stage>.attempts, sets next_action_at
 * 60s in the future. After LIMITS.maxAttemptsPerStage → FAILED.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // allow up to 5 minutes for serverless functions on Vercel Pro

import { LIMITS } from '@/lib/config/limits'
import { handlePreprocessor } from '@/lib/pipeline/stage0-preprocessor'
import { handleStage1 } from '@/lib/pipeline/handlers/stage1-segmenter'
import { handleStage2 } from '@/lib/pipeline/handlers/stage2-chapter-extractor'
import { handleStage3 } from '@/lib/pipeline/handlers/stage3-synthesizer'
import { handleStage4 } from '@/lib/pipeline/handlers/stage4-flag-generator'

// Map pipeline_stage → handler + timeout
const STAGE_MAP: Record<string, {
  handler: (id: string) => Promise<void>
  timeoutMs: number
  stageKey: string
  lockWindowMs: number
}> = {
  UPLOADED:           { handler: handlePreprocessor, timeoutMs: 30_000,                  stageKey: 'stage0', lockWindowMs: LIMITS.tickClaimWindowStage0Ms },
  PREPROCESSED:       { handler: handleStage1,       timeoutMs: LIMITS.stage1TimeoutMs,   stageKey: 'stage1', lockWindowMs: LIMITS.tickClaimWindowStage1Ms },
  CHAPTERS_DETECTED:  { handler: handleStage2,       timeoutMs: LIMITS.stage2TimeoutMs,   stageKey: 'stage2', lockWindowMs: LIMITS.tickClaimWindowStage2Ms },
  EXTRACTED:          { handler: handleStage3,       timeoutMs: LIMITS.stage3TimeoutMs,   stageKey: 'stage3', lockWindowMs: LIMITS.tickClaimWindowStage3Ms },
  SYNTHESIZED:        { handler: handleStage4,       timeoutMs: LIMITS.stage4TimeoutMs,   stageKey: 'stage4', lockWindowMs: LIMITS.tickClaimWindowStage4Ms },
}

const TERMINAL_STAGES = new Set(['COMPLETE', 'FAILED'])

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  // CRITICAL: clear the timer on resolution. Without this, every successful
  // handler leaks a setTimeout that fires after `ms` and would log a phantom
  // rejection on a long-lived process. Under 200 sessions/day this is
  // hundreds of stale timers per hour.
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label}: handler timed out after ${ms}ms`)),
          ms,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function POST(req: Request) {
  // ── Auth: verify CRON_SECRET for production. Skip in dev if not set. ────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const tickStart = Date.now()
  const summary = { claimed: 0, advanced: 0, failed: 0, timed_out: 0, errors: [] as string[] }

  try {
    // ── Deadline check: fail sessions stuck > sessionMaxAgeMins ─────────
    // Use createdAt (NOT updatedAt). updatedAt is bumped on every heartbeat
    // and every retry, so a session that's been thrashing in retries for
    // hours would never trip an updatedAt deadline. createdAt is the only
    // timestamp that anchors the absolute end-to-end deadline.
    const deadlineResult = await prisma.$executeRawUnsafe(`
      UPDATE "AnalysisSession"
      SET
        pipeline_stage = 'FAILED',
        "v3Status" = 'FAILED',
        "v3Error" = 'Session timed out after ${LIMITS.sessionMaxAgeMins} minutes',
        stage_attempts = stage_attempts || '{"failure_reason": "session_timeout"}'::jsonb,
        "updatedAt" = NOW()
      WHERE
        pipeline_stage NOT IN ('COMPLETE', 'FAILED')
        AND "createdAt" < NOW() - INTERVAL '${LIMITS.sessionMaxAgeMins} minutes'
    `)
    if (deadlineResult > 0) {
      console.warn(`[tick] Expired ${deadlineResult} stale sessions`)
    }

    // ── Atomic claim: SELECT ... FOR UPDATE SKIP LOCKED + UPDATE in one
    // statement. This is the production-correct pattern: a bare SELECT FOR
    // UPDATE in $queryRawUnsafe runs in its own implicit transaction that
    // commits the moment the query returns, releasing the row lock before
    // we get a chance to bump next_action_at. Two concurrent ticks could
    // then claim the same session and run handlers twice in parallel.
    //
    // The CTE pattern below keeps the FOR UPDATE lock alive for the
    // duration of the UPDATE — the row's next_action_at is bumped 90s
    // into the future as part of the same statement, so the next tick
    // will skip it via the next_action_at <= NOW() filter. heartbeat is
    // also stamped here so monitoring can see "claimed but not yet run".
    // Claim rows and immediately stamp their next_action_at with a per-stage
    // lock window (Bottleneck #4 fix). Since the claimed rows come back with
    // their pipeline_stage, we do a two-step: claim all with a safe 90s window,
    // then immediately re-stamp each row with its stage-specific window.
    // The two-step is necessary because a single SQL CTE can't do conditional
    // UPDATE values based on the returned stage in the same statement.
    const claimed: Array<{ id: string; pipeline_stage: string }> =
      await prisma.$queryRawUnsafe(`
        WITH due AS (
          SELECT id
          FROM "AnalysisSession"
          WHERE
            next_action_at <= NOW()
            AND pipeline_stage NOT IN ('COMPLETE', 'FAILED')
            AND "deletedAt" IS NULL
          ORDER BY next_action_at ASC
          LIMIT ${LIMITS.pipelineConcurrency}
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "AnalysisSession" s
        SET
          next_action_at = NOW() + INTERVAL '90 seconds',
          heartbeat = NOW(),
          "updatedAt" = NOW()
        FROM due
        WHERE s.id = due.id
        RETURNING s.id, s.pipeline_stage
      `)

    // Re-stamp each claimed row with its precise per-stage lock window.
    // This is a tiny write — only fires for claimed sessions (<=5 at a time).
    for (const row of claimed) {
      const stageConfig = STAGE_MAP[row.pipeline_stage]
      if (stageConfig) {
        await prisma.$executeRawUnsafe(
          `UPDATE "AnalysisSession" SET next_action_at = NOW() + INTERVAL '${Math.ceil(stageConfig.lockWindowMs / 1000)} seconds' WHERE id = $1`,
          row.id,
        )
      }
    }

    summary.claimed = claimed.length

    if (claimed.length === 0) {
      return NextResponse.json({ ...summary, elapsed_ms: Date.now() - tickStart })
    }

    // ── Dispatch each session ──────────────────────────────────────────
    const results = await Promise.allSettled(
      claimed.map(async (row) => {
        const stageConfig = STAGE_MAP[row.pipeline_stage]
        if (!stageConfig) {
          console.warn(`[tick] Unknown stage '${row.pipeline_stage}' for session ${row.id}`)
          return
        }

        try {
          await withTimeout(
            stageConfig.handler(row.id),
            stageConfig.timeoutMs,
            `tick:${stageConfig.stageKey}[${row.id.slice(0, 8)}]`,
          )
          summary.advanced++

          // Update heartbeat
          await prisma.analysisSession.update({
            where: { id: row.id },
            data: { heartbeat: new Date(), updatedAt: new Date() },
          })
        } catch (err: any) {
          console.error(`[tick] ${stageConfig.stageKey}[${row.id.slice(0, 8)}] error:`, err?.message)
          summary.errors.push(`${row.id.slice(0, 8)}:${stageConfig.stageKey}:${err?.message?.slice(0, 100)}`)

          // Increment stage attempts
          const session = await prisma.analysisSession.findUnique({
            where: { id: row.id },
            select: { stage_attempts: true },
          })
          const attempts = ((session?.stage_attempts as any) ?? {}) as Record<string, any>
          const key = `${stageConfig.stageKey}_attempts`
          attempts[key] = (attempts[key] ?? 0) + 1

          if (attempts[key] >= LIMITS.maxAttemptsPerStage) {
            // Transition to FAILED
            attempts.failure_reason = `max_attempts_exceeded:${stageConfig.stageKey}`
            await prisma.analysisSession.update({
              where: { id: row.id },
              data: {
                pipeline_stage: 'FAILED',
                v3Status: 'FAILED',
                v3Error: `Max attempts (${LIMITS.maxAttemptsPerStage}) exceeded for ${stageConfig.stageKey}: ${err?.message?.slice(0, 200)}`,
                stage_attempts: attempts as any,
                updatedAt: new Date(),
              } as any,
            })
            summary.failed++
          } else {
            // Retry after cooldown
            await prisma.analysisSession.update({
              where: { id: row.id },
              data: {
                next_action_at: new Date(Date.now() + LIMITS.retryCooldownMs),
                stage_attempts: attempts as any,
                updatedAt: new Date(),
              } as any,
            })
          }
        }
      })
    )

    const elapsed = Date.now() - tickStart
    console.log(
      `[tick] Done in ${elapsed}ms: claimed=${summary.claimed} advanced=${summary.advanced} ` +
      `failed=${summary.failed} errors=${summary.errors.length}`
    )

    return NextResponse.json({ ...summary, elapsed_ms: elapsed })
  } catch (err: any) {
    console.error('[tick] Fatal error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Internal tick error', ...summary },
      { status: 500 },
    )
  }
}
