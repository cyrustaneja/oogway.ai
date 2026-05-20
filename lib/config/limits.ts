export const LIMITS = {
  // ─── Concurrency & Scheduling ─────────────────────────────────────────────
  pipelineConcurrency: parseInt(process.env.PIPELINE_CONCURRENCY ?? '5'),
  stage2ChaptersInParallel: parseInt(process.env.STAGE2_CHAPTERS_IN_PARALLEL ?? '3'), // Set to 3 for faster parallel chapter extraction on paid keys
  tickClaimWindowMins: 5,             // sessions stuck >5 min without heartbeat re-queued
  sessionMaxAgeMins: 240,             // sessions stuck >4h → FAILED (covers 2-3hr transcripts)

  // Per-stage lock windows for atomic claim (Bottleneck #4 fix).
  // Keep these tight: a crash during Stage 2 (fast) should re-queue quickly.
  // Stage 3 gets the full window because synthesis can genuinely take minutes.
  tickClaimWindowStage0Ms:  45_000,   // 45s (handler timeout 30s)
  tickClaimWindowStage1Ms: 330_000,   // 5.5 min (handler timeout 5 min)
  tickClaimWindowStage2Ms: 330_000,   // 5.5 min (handler timeout 5 min)
  tickClaimWindowStage3Ms: 330_000,   // 5.5 min (handler timeout 5 min)
  tickClaimWindowStage4Ms:  90_000,   // 90s (handler timeout 60s)

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
  // Set to 1 as per user request for accurate analysis on Flash: allows 1 attempt
  // to self-correct a hallucinated quote, then guarantees the pipeline moves on.
  stage2MaxValidatorRetries: 1,

  // Bottleneck #5 fix: dynamic batch cooldown replacing the old hardcoded 15s.
  // Set to 4s — tuned to precisely hit 15 RPM limit (60s / 4s = 15) for maximum efficiency on the Gemini Free Tier.
  stage2BatchCooldownMs: 4_000,

  // Bottleneck #3 fix: cap the per-chapter payload sent to Stage 3 to avoid
  // bloating the synthesis prompt. Each chapter's result is trimmed to this
  // length in characters before being sent. Bumped to 6000 to "fetch everything".
  stage3ChapterSummaryMaxChars: 6_000,

  // ─── Chapter Count Safety Net ──────────────────────────────────────────────
  // These are MINIMUMS to catch degenerate 1-chapter outputs. The model should
  // segment by topic, not by hitting a target count. Keep these low — they're
  // a floor, not a goal. Format: [maxMinutes, minChapters] tested in order.
  // A 78-min session covering 3 topics should produce 3–5 chapters, not 8.
  chapterMinimums: [
    [30,  2],   // < 30 min → at least 2
    [60,  3],   // 30–60 min → at least 3
    [120, 4],   // 60–120 min → at least 4
    [180, 5],   // 120–180 min → at least 5
    [240, 6],   // 180–240 min → at least 6
  ] as [number, number][],
  chapterMinimumDefault: 4,  // > 240 min

  // ─── Model Names ──────────────────────────────────────────────────────────
  stage1Model: process.env.GEMINI_MODEL_FLASH || 'gemini-2.5-flash',
  stage1FallbackModel: process.env.GEMINI_MODEL_FLASH || 'gemini-2.5-flash',
  stage2PrimaryModel: process.env.GEMINI_MODEL_FLASH || 'gemini-2.5-flash',
  stage2FallbackModel: process.env.GEMINI_MODEL_PRO || 'gemini-2.5-flash',
  stage3Model: process.env.GEMINI_MODEL_FLASH || 'gemini-2.5-flash',
  stage4Model: process.env.GEMINI_MODEL_FLASH || 'gemini-2.5-flash',
}
