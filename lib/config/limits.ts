export const LIMITS = {
  // ─── Concurrency & Scheduling ─────────────────────────────────────────────
  pipelineConcurrency: parseInt(process.env.PIPELINE_CONCURRENCY ?? '5'),
  stage2ChaptersInParallel: 3,        // bumped from 2 for throughput at scale
  tickClaimWindowMins: 5,             // sessions stuck >5 min without heartbeat re-queued
  sessionMaxAgeMins: 240,             // sessions stuck >4h → FAILED (covers 2-3hr transcripts)

  // ─── Token Budgets (initial per call) ─────────────────────────────────────
  stage1TokenBudget: 6000,        // production-ready: supports up to 25+ granular chapters
  stage1TokenCap: 20000,
  stage2TokenBudget: 5000,        // bumped to prevent first-try truncation
  stage2TokenCap: 12000,
  stage3TokenBudget: 6000,        // bumped — full session_log + analogies_summary + flags
  stage3TokenCap: 32000,
  stage4TokenBudget: 1000,
  stage4TokenCap: 4000,

  // ─── Transcript Size Guards ────────────────────────────────────────────────
  maxTranscriptTokens: 80000,         // hard reject anything bigger; alert team
  longTranscriptThreshold: 30000,     // sessions >30k tokens get extra logging

  // ─── Per-Call Hard Timeouts (ms) ──────────────────────────────────────────
  stage1TimeoutMs: 300_000,           // Stage 1 = 5 min max
  stage2TimeoutMs: 300_000,            // per-chapter call = 5 min max
  stage3TimeoutMs: 300_000,
  stage4TimeoutMs: 60_000,

  // ─── Output Caps ──────────────────────────────────────────────────────────
  maxAnalogiesPerChapter: 5,
  maxDoubtsPerChapter: 5,
  maxConfusionPointsPerChapter: 5,
  maxQuoteChars: 210,

  // ─── Retry Policy ─────────────────────────────────────────────────────────
  maxAttemptsPerStage: 10,
  retryCooldownMs: 15_000,
  rateLimit429RetryDelayMs: [2000, 5000, 10000, 20000, 40000, 60000],

  // Stage 2 chapter-level validator retries: how many times we'll re-run the
  // AI for a chapter that failed label-validator or quote-verifier before
  // accepting the (still flagged) result and moving on.
  // Sequence: attempt 1 = primary model. attempts 2-3 = fallback model. After
  // stage2MaxValidatorRetries the row stays needs_review=true and Stage 3
  // proceeds without it (downstream code checks needs_review before trusting).
  stage2MaxValidatorRetries: 3,

  // ─── Chapter Count Safety Net ──────────────────────────────────────────────
  // These are MINIMUMS to catch degenerate 1-chapter outputs. The model should
  // segment by topic, not by hitting a target count. Keep these low — they're
  // a floor, not a goal. Format: [maxMinutes, minChapters] tested in order.
  // A 78-min session covering 3 topics should produce 3–5 chapters, not 8.
  chapterMinimums: [
    [20,  2],   // < 20 min → at least 2
    [45,  2],   // 20–45 min → at least 2
    [75,  3],   // 45–75 min → at least 3
    [120, 3],   // 75–120 min → at least 3
    [180, 4],   // 120–180 min → at least 4
    [240, 5],   // 180–240 min → at least 5
  ] as [number, number][],
  chapterMinimumDefault: 6,  // > 240 min

  // ─── Model Names ──────────────────────────────────────────────────────────
  stage1Model: 'gemini-2.5-flash',
  stage1FallbackModel: 'gemini-2.5-pro',
  stage2PrimaryModel: 'gemini-2.5-flash',
  stage2FallbackModel: 'gemini-2.5-pro',
  stage3Model: 'gemini-2.5-pro',
  stage4Model: 'gemini-2.5-pro',
}
