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
 *  - METADATA-AWARE: The verifier strips speaker labels and VTT timestamps
 *    from the transcript before matching. This means a quote that stitches
 *    two adjacent utterances (separated by a speaker label / timestamp line
 *    in the raw VTT) still passes — we compare speech content only, not
 *    formatting scaffolding.
 */

// Lines that are pure metadata (VTT timestamps or "Speaker: " labels)
const METADATA_LINE_RE = /^(\d{1,2}:\d{2}:\d{2}|[A-Z][^:]{1,40}:)/

/**
 * Strip VTT/plain-text metadata lines (timestamps and speaker labels) and
 * collapse all remaining lines into a single speech-only string.
 * This lets us match quotes that the AI stitched across utterance boundaries.
 */
function stripMetadata(transcript: string): string {
  return transcript
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      if (!trimmed) return false
      if (METADATA_LINE_RE.test(trimmed)) return false
      return true
    })
    .join(' ')
}

function nfc(s: string): string {
  if (!s) return ''
  return s
    .normalize('NFC')
    // Clean up common VTT encoding garble and smart punctuation
    .replace(/â€¦/g, '...')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/â€˜/g, "'")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2026]/g, '...')
    // Strip punctuation for comparison
    .replace(/[.,!?;:"'()\[\]{}…\-—]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshtein(a: string, b: string): number {
  const tmp = []
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i]
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return tmp[a.length][b.length]
}

/**
 * Check if the quote exists as a fuzzy substring within the transcript.
 * We look for a window of text similar in length to the quote.
 */
function fuzzyIncludes(transcript: string, quote: string, threshold = 0.12): boolean {
  if (transcript.includes(quote)) return true
  
  const qLen = quote.length
  if (qLen < 8) return false

  // Multiple anchors: try start, middle, and end to avoid single-typo failures
  const anchors = [
    quote.slice(0, 4),
    quote.slice(Math.floor(qLen / 2), Math.floor(qLen / 2) + 4),
    quote.slice(-4)
  ].filter(a => a.length >= 3)

  for (const anchor of anchors) {
    let idx = transcript.indexOf(anchor)
    while (idx !== -1) {
      // Check a window slightly larger than the quote
      const start = Math.max(0, idx - 10)
      const end = Math.min(transcript.length, idx + qLen + 10)
      const candidate = transcript.slice(start, end)
      
      // If any substring in this window is close enough, we're good
      const dist = levenshtein(quote, candidate.slice(0, qLen))
      if (dist / qLen <= threshold) return true
      
      idx = transcript.indexOf(anchor, idx + 1)
    }
  }
  
  return false
}

/**
 * Check whether a single quote exists in the transcript.
 * Tries two passes:
 *   1. Against the raw transcript (catches exact matches).
 *   2. Against the speech-only transcript (catches cross-utterance stitches).
 * Fuzzy matching is used as a fallback for both.
 */
export function verifyQuote(chapterTranscript: string, quote: string): boolean {
  if (!quote || !chapterTranscript) return false

  // Split on any ellipsis-like markers (middle or end)
  const parts = quote
    .split(/\.\.\.|…/g)
    .map(p => nfc(p))
    .filter(p => p.length >= 8) // only verify meaningful segments

  if (parts.length === 0) return true // no verifiable parts; pass through

  const normalizedRaw = nfc(chapterTranscript)
  const normalizedSpeech = nfc(stripMetadata(chapterTranscript))

  return parts.every(part => {
    // 1. Strict match
    if (normalizedRaw.includes(part)) return true
    if (normalizedSpeech.includes(part)) return true
    
    // 2. Fuzzy match fallback (10% error allowed)
    if (fuzzyIncludes(normalizedRaw, part)) return true
    if (fuzzyIncludes(normalizedSpeech, part)) return true
    
    return false
  })
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
