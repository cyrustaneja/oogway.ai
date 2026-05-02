/**
 * quote-verifier.ts — Anti-hallucination check for verbatim quotes.
 *
 * Every AI-generated verbatim_quote must be a substring of the chapter
 * transcript it came from. Quotes that can't be found are logged and the
 * chapter is marked needs_review.
 *
 * Key design decisions:
 *  - NFC normalization on BOTH sides before comparison. Without this,
 *    Devanagari/Hindi quotes silently fail due to Unicode composition
 *    differences between the AI output and the source VTT.
 *  - Case-insensitive, whitespace-normalized comparison — transcript
 *    formatting is not guaranteed to be consistent.
 *  - Quotes shorter than 8 chars are skipped (too short to be meaningful
 *    and too likely to cause false positives).
 *  - Trailing "..." is stripped before the check (AI often truncates quotes).
 */

function nfc(s: string): string {
  if (!s) return ''
  return s
    .normalize('NFC')
    .replace(/â€¦/g, '…')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Check whether a single quote exists in the transcript.
 * Exported for use in the verification checklist.
 */
export function verifyQuote(chapterTranscript: string, quote: string): boolean {
  if (!quote || !chapterTranscript) return false
  
  // Normalize the transcript once
  const normalizedTranscript = nfc(chapterTranscript)

  // Split on any ellipsis-like markers (middle or end)
  const parts = quote
    .split(/\.\.\.|…/g)
    .map(p => nfc(p))
    .filter(p => p.length >= 8) // only verify meaningful segments

  if (parts.length === 0) return true // no verifiable parts; pass through

  // All non-empty parts must exist in the transcript
  return parts.every(part => normalizedTranscript.includes(part))
}

/**
 * Verify all quotes inside a chapter result object.
 * Returns an array of violation strings (empty = all good).
 */
export function verifyChapterQuotes(chapterTranscript: string, c: any): string[] {
  const violations: string[] = []

  const check = (q: string | undefined, where: string) => {
    if (!q) return
    if (!verifyQuote(chapterTranscript, q)) {
      violations.push(`${where}: "${q.slice(0, 80)}…" not found in chapter transcript`)
    }
  }

  // Score-level evidence arrays
  const scoredFields: Array<[any, string]> = [
    [c?.teaching_depth, 'teaching_depth'],
    [c?.pacing, 'pacing'],
    [c?.engagement, 'engagement'],
    [c?.example_gap, 'example_gap'],
  ]
  for (const [score, name] of scoredFields) {
    ;(score?.evidence ?? []).forEach((e: any, i: number) => {
      check(e?.verbatim_quote, `${name}.evidence[${i}]`)
    })
  }

  // Analogies
  ;(c?.analogies ?? []).forEach((a: any, i: number) => {
    check(a?.verbatim_quote, `analogy[${i}]`)
  })

  // Doubts — both the doubt itself and the resolution
  ;(c?.doubts ?? []).forEach((d: any, i: number) => {
    check(d?.doubt_verbatim, `doubt[${i}]`)
    if (d?.resolution_verbatim) {
      check(d.resolution_verbatim, `doubt[${i}].resolution`)
    }
  })

  // Confusion points
  ;(c?.confusion_points ?? []).forEach((p: any, i: number) => {
    check(p?.why_verbatim, `confusion[${i}]`)
  })

  // Accuracy check
  if (c?.accuracy_check?.verbatim_quote) {
    check(c.accuracy_check.verbatim_quote, 'accuracy_check')
  }

  return violations
}
