/**
 * transcript-slicer.ts — Transcript windowing for Stage 1 and Stage 2.
 *
 * Stage 1 needs the FULL transcript (one call, whole session).
 * Stage 2 needs ONLY the utterances inside a specific chapter's time window,
 * plus 30s of context on each side to handle chapter boundary utterances.
 *
 * Token counting uses a tiktoken-style approximator (chars/4) — accurate
 * enough for budget decisions without pulling in an extra dependency.
 *
 * Supported transcript formats:
 *  - VTT: lines with "HH:MM:SS.mmm --> HH:MM:SS.mmm" or standalone timestamps
 *  - Plain text with HH:MM:SS markers at start of line
 *  - Fallback: returns the full string if no timestamps are found
 */

import { LIMITS } from '@/lib/config/limits'

// ── Token approximation ──────────────────────────────────────────────────────

/** Approximate token count (chars / 4). Good enough for budget gating. */
export function approximateTokens(text: string): number {
  return Math.ceil((text ?? '').length / 4)
}

// ── Time parsing ─────────────────────────────────────────────────────────────

/** Parse HH:MM:SS (or HH:MM:SS.mmm) → seconds */
function toSec(t: string): number {
  const parts = t.split(':').map(Number)
  if (parts.length === 3) {
    const [h, m, s] = parts
    return h * 3600 + m * 60 + s
  }
  if (parts.length === 2) {
    const [m, s] = parts
    return m * 60 + s
  }
  return 0
}

// Matches HH:MM:SS or HH:MM:SS.mmm anywhere in a line
const TS_REGEX = /(\d{1,2}:\d{2}:\d{2})(?:\.\d+)?/

// ── Public API ───────────────────────────────────────────────────────────────

export class TranscriptTooLargeError extends Error {
  constructor(public readonly measuredTokens: number) {
    super(
      `Transcript too large: ${measuredTokens} tokens exceeds hard limit of ${LIMITS.maxTranscriptTokens}`
    )
    this.name = 'TranscriptTooLargeError'
  }
}

/**
 * Stage 1: returns the full transcript verbatim.
 * Throws TranscriptTooLargeError if the transcript exceeds the hard token cap.
 * Logs a warning (does NOT throw) for long-but-within-limit transcripts.
 */
export function sliceForStage1(transcript: string): string {
  const tokens = approximateTokens(transcript)

  if (tokens > LIMITS.maxTranscriptTokens) {
    throw new TranscriptTooLargeError(tokens)
  }

  if (tokens > LIMITS.longTranscriptThreshold) {
    console.warn(
      `[transcript-slicer] Long session detected: ~${tokens} tokens (threshold ${LIMITS.longTranscriptThreshold}). ` +
      `Pipeline will proceed but this session may be slow.`
    )
  }

  return transcript
}

/**
 * Stage 2: extract only the lines whose timestamp falls within
 * [startTime - 30s, endTime + 30s].
 *
 * @param transcript - Full cleaned transcript text
 * @param startTime  - Chapter start in HH:MM:SS
 * @param endTime    - Chapter end in HH:MM:SS
 * @returns Sliced transcript substring (with 30s padding on each side)
 */
export function sliceForStage2(
  transcript: string,
  startTime: string,
  endTime: string
): string {
  const CONTEXT_PAD_SEC = 30
  const startSec = Math.max(0, toSec(startTime) - CONTEXT_PAD_SEC)
  const endSec = toSec(endTime) + CONTEXT_PAD_SEC

  const lines = transcript.split('\n')
  const result: string[] = []
  let currentSec: number | null = null

  for (const line of lines) {
    const match = line.match(TS_REGEX)
    if (match) {
      currentSec = toSec(match[1])
    }
    // Include line if we're inside the window, OR if we haven't seen a
    // timestamp yet (header lines, speaker labels, etc.)
    if (currentSec === null || (currentSec >= startSec && currentSec <= endSec)) {
      result.push(line)
    }
  }

  if (result.length === 0) {
    // Slicing found nothing — fall back to full transcript
    console.warn(
      `[transcript-slicer] sliceForStage2: no lines found in window ` +
      `${startTime}–${endTime}, falling back to full transcript`
    )
    return transcript
  }

  return result.join('\n')
}

/**
 * Legacy compat alias — used by Stage 2 before the chapter object is available.
 * Prefer sliceForStage2.
 */
export function sliceTranscript(
  transcript: string,
  startTime: string,
  endTime: string
): string {
  return sliceForStage2(transcript, startTime, endTime)
}
