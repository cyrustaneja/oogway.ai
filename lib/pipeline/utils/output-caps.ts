/**
 * output-caps.ts — Enforce maximum output counts per chapter result.
 *
 * Stage 2 can over-generate in long transcripts. These caps prevent:
 *  - Bloated DB rows
 *  - Dashboard render performance issues
 *  - Quote-verifier running too long
 *
 * Priority rules when capping doubts:
 *  - Unresolved doubts (resolved_flag = false) are kept first.
 *  - Resolved doubts fill remaining slots.
 *
 * All verbatim quotes are hard-truncated to maxQuoteChars (210).
 * A trailing "..." is added to truncated quotes so the verifier knows to
 * strip it before the substring check.
 */

import { LIMITS } from '@/lib/config/limits'

export function enforceOutputCaps(c: any): any {
  if (!c || typeof c !== 'object') return c

  // ── Analogies cap ────────────────────────────────────────────────────────
  if (Array.isArray(c.analogies)) {
    c.analogies = c.analogies.slice(0, LIMITS.maxAnalogiesPerChapter)
  }

  // ── Doubts cap — unresolved first ────────────────────────────────────────
  if (Array.isArray(c.doubts)) {
    const unresolved = c.doubts.filter((d: any) => !d.resolved_flag)
    const resolved = c.doubts.filter((d: any) => d.resolved_flag)
    c.doubts = [...unresolved, ...resolved].slice(0, LIMITS.maxDoubtsPerChapter)
  }

  // ── Confusion points cap ─────────────────────────────────────────────────
  if (Array.isArray(c.confusion_points)) {
    c.confusion_points = c.confusion_points.slice(0, LIMITS.maxConfusionPointsPerChapter)
  }

  // ── Quote truncation ─────────────────────────────────────────────────────
  const truncate = (s: string): string => {
    if (!s || s.length <= LIMITS.maxQuoteChars) return s
    return s.slice(0, LIMITS.maxQuoteChars - 3) + '...'
  }

  ;(c.analogies ?? []).forEach((a: any) => {
    if (a.verbatim_quote) a.verbatim_quote = truncate(a.verbatim_quote)
  })

  ;(c.doubts ?? []).forEach((d: any) => {
    if (d.doubt_verbatim) d.doubt_verbatim = truncate(d.doubt_verbatim)
    if (d.resolution_verbatim) d.resolution_verbatim = truncate(d.resolution_verbatim)
  })

  ;(c.confusion_points ?? []).forEach((p: any) => {
    if (p.why_verbatim) p.why_verbatim = truncate(p.why_verbatim)
  })

  // Evidence quotes on scored fields
  const scoredFields = ['teaching_depth', 'pacing', 'engagement', 'example_gap']
  for (const field of scoredFields) {
    ;(c[field]?.evidence ?? []).forEach((e: any) => {
      if (e.verbatim_quote) e.verbatim_quote = truncate(e.verbatim_quote)
    })
  }

  if (c.accuracy_check?.verbatim_quote) {
    c.accuracy_check.verbatim_quote = truncate(c.accuracy_check.verbatim_quote)
  }

  return c
}
