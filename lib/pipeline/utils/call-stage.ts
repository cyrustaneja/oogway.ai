/**
 * call-stage.ts — Single chokepoint for ALL Gemini API calls in the pipeline.
 *
 * Features:
 *  - Structured-output mode (responseMimeType: application/json + responseSchema)
 *  - jsonrepair fallback if JSON.parse fails
 *  - Per-class retry policies (not a shared budget):
 *      RateLimit429  → up to 4 retries, backoff [1s, 3s, 8s, 20s]
 *      ServerError5xx→ up to 3 retries, backoff [1s, 3s, 8s]
 *      MaxTokensError→ up to 2 retries, double budget, no backoff
 *      TimeoutError  → max 1 retry, NO backoff (immediate)
 *      ParseError    → max 1 retry, original budget
 *      OtherError    → max 2 retries, linear backoff [500ms, 1500ms]
 *  - Total wall-clock ceiling: max(timeoutMs * 2, 90_000). Throws immediately
 *    if exceeded even if retries remain.
 *  - Per-call wall-clock logging (feeds cost-tracker in Phase 5)
 *
 * DO NOT add Gemini calls anywhere else in the codebase.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { jsonrepair } from 'jsonrepair'
import { LIMITS } from '@/lib/config/limits'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ── Public API ───────────────────────────────────────────────────────────────

export type StageCallParams = {
  model: string
  system: string
  user: string
  responseSchema: any   // JSON schema object (not Zod)
  initialBudget: number
  maxBudget: number
  stageName: string
  timeoutMs?: number    // hard timeout per call attempt
  onUsage?: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void
}

// ── Internal Error Classification ────────────────────────────────────────────

type ErrorClass =
  | 'RateLimit429'
  | 'ServerError5xx'
  | 'MaxTokensError'
  | 'TimeoutError'
  | 'ParseError'
  | 'OtherError'

/** Sentinel thrown by our Promise.race timeout */
class StageTimeoutError extends Error {
  readonly errorClass = 'TimeoutError' as const
  constructor(stageName: string, ms: number) {
    super(`${stageName}: timed out after ${ms}ms`)
    this.name = 'StageTimeoutError'
  }
}

/** Classify any caught error into one of our retry buckets */
function classifyError(err: any): ErrorClass {
  if (err instanceof StageTimeoutError || err?.errorClass === 'TimeoutError') {
    return 'TimeoutError'
  }
  const msg = String(err?.message ?? err ?? '')
  const status = err?.status ?? err?.statusCode ?? 0

  if (
    msg.includes('MAX_TOKENS') ||
    err?.finishReason === 'MAX_TOKENS' ||
    msg.includes('finish_reason') && msg.includes('MAX_TOKENS')
  ) return 'MaxTokensError'

  if (
    msg.includes('429') ||
    status === 429 ||
    msg.toLowerCase().includes('rate') ||
    msg.toLowerCase().includes('quota')
  ) return 'RateLimit429'

  if (
    status >= 500 ||
    msg.toLowerCase().includes('internal server error') ||
    msg.toLowerCase().includes('service unavailable') ||
    msg.toLowerCase().includes('bad gateway') ||
    msg.toLowerCase().includes('gateway timeout')
  ) return 'ServerError5xx'

  // ParseError is never thrown from this classifier —
  // it's detected inline and a ParseErrorSignal is thrown below.
  return 'OtherError'
}

/** Synthetic error to represent a parse failure after jsonrepair also fails */
class ParseErrorSignal extends Error {
  readonly errorClass = 'ParseError' as const
  constructor(stageName: string, preview: string) {
    super(`${stageName}: JSON parse failed after jsonrepair. Preview: ${preview}`)
    this.name = 'ParseErrorSignal'
  }
}

// ── Retry Policies ───────────────────────────────────────────────────────────

const RETRY_POLICY: Record<ErrorClass, { maxRetries: number; backoffMs: number[] }> = {
  RateLimit429:   { 
    maxRetries: LIMITS.maxAttemptsPerStage, 
    backoffMs: LIMITS.rateLimit429RetryDelayMs 
  },
  ServerError5xx: { 
    maxRetries: LIMITS.maxAttemptsPerStage, 
    backoffMs: [2000, 5000, 10000] 
  },
  MaxTokensError: { maxRetries: 2, backoffMs: [] },          // budget-doubling, no sleep
  TimeoutError:   { maxRetries: 3, backoffMs: [2000, 5000] }, // bumped for production stability
  ParseError:     { maxRetries: 3, backoffMs: [1000, 2000] }, 
  OtherError:     { maxRetries: 2, backoffMs: [1000, 3000] },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function withTimeout<T>(promise: Promise<T>, ms: number, stageName: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new StageTimeoutError(stageName, ms)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// ── Main call wrapper ────────────────────────────────────────────────────────

export async function callStage<T>(params: StageCallParams): Promise<T> {
  const wallClock = Date.now()
  // Total wall-clock ceiling: max(timeoutMs * 2, 90_000)
  const wallCeiling = params.timeoutMs
    ? Math.max(params.timeoutMs * 2, 90_000)
    : 90_000

  // Per-class retry counters (each error class has its OWN counter)
  const retryCount: Record<ErrorClass, number> = {
    RateLimit429: 0,
    ServerError5xx: 0,
    MaxTokensError: 0,
    TimeoutError: 0,
    ParseError: 0,
    OtherError: 0,
  }

  let budget = params.initialBudget

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // ── Wall-clock ceiling check ─────────────────────────────────────────
    const elapsed = Date.now() - wallClock
    if (elapsed >= wallCeiling) {
      throw new Error(
        `[call-stage] ${params.stageName}: wall-clock ceiling ${wallCeiling}ms exceeded after ${elapsed}ms`
      )
    }

    const attemptStart = Date.now()

    try {
      const model = genAI.getGenerativeModel({
        model: params.model,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
          maxOutputTokens: budget,
          temperature: 0.2,
        },
        systemInstruction: params.system,
      })

      const generatePromise = model.generateContent(params.user)
      const result = params.timeoutMs
        ? await withTimeout(generatePromise, params.timeoutMs, params.stageName)
        : await generatePromise

      // Explicitly check for truncation. The SDK text() method might return 
      // partial JSON which jsonrepair then "fixes", hiding the data loss.
      const candidate = result.response.candidates?.[0]
      if (candidate?.finishReason === 'MAX_TOKENS') {
        const err = new Error('finish_reason: MAX_TOKENS')
        ;(err as any).finishReason = 'MAX_TOKENS'
        throw err
      }

      const callMs = Date.now() - attemptStart
      console.log(`[call-stage] ${params.stageName}: OK — ${callMs}ms budget=${budget}`)

      if (params.onUsage && result.response.usageMetadata) {
        const usage = result.response.usageMetadata
        params.onUsage({
          promptTokens: usage.promptTokenCount ?? 0,
          completionTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
        })
      }

      const text = result.response.text()

      // Primary JSON parse
      try {
        return JSON.parse(text) as T
      } catch {
        // jsonrepair fallback (runs inline — does NOT count as a ParseError retry yet)
        try {
          const repaired = JSON.parse(jsonrepair(text))
          console.warn(`[call-stage] ${params.stageName}: jsonrepair used`)
          return repaired as T
        } catch {
          // Both parse attempts failed — treat as ParseError
          throw new ParseErrorSignal(params.stageName, text.slice(0, 200))
        }
      }
    } catch (err: any) {
      const callMs = Date.now() - attemptStart
      const totalElapsed = Date.now() - wallClock

      // Classify the error
      const errClass: ErrorClass =
        err instanceof ParseErrorSignal
          ? 'ParseError'
          : classifyError(err)

      const policy = RETRY_POLICY[errClass]
      const attemptN = retryCount[errClass]

      // Check if this class still has retries available
      if (attemptN >= policy.maxRetries) {
        console.error(
          `[call-stage] ${params.stageName}: no retries left for ${errClass} ` +
          `(used ${attemptN}/${policy.maxRetries}) total=${totalElapsed}ms`
        )
        throw err
      }

      // MaxTokensError: double budget (no sleep)
      if (errClass === 'MaxTokensError') {
        const nextBudget = Math.min(budget * 2, params.maxBudget)
        if (nextBudget === budget) {
          console.error(
            `[call-stage] ${params.stageName}: MaxTokensError at budget cap ${budget}, giving up`
          )
          throw err
        }
        budget = nextBudget
        retryCount[errClass]++
        console.warn(
          `[call-stage] retry ${retryCount[errClass]}/${policy.maxRetries} ` +
          `reason=${errClass} elapsed=${callMs}ms new_budget=${budget}`
        )
        continue
      }

      // All other classes: optional backoff, then retry
      const backoffMs = policy.backoffMs[attemptN] ?? (policy.backoffMs.length > 0 ? policy.backoffMs[policy.backoffMs.length - 1] : 2000)
      retryCount[errClass]++

      console.warn(
        `[call-stage] retry ${retryCount[errClass]}/${policy.maxRetries} ` +
        `reason=${errClass} elapsed=${callMs}ms backoff=${backoffMs}ms`
      )

      if (backoffMs > 0) {
        await sleep(backoffMs)
      }
      // continue loop → re-attempt with same budget (except MaxTokens which doubled above)
    }
  }
}
