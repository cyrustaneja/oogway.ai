/**
 * stage0-preprocessor.ts — Rule-based transcript cleaning and quality assessment.
 *
 * NO Gemini calls in this file. Pure string processing only.
 *
 * Responsibilities:
 *  1. Clean raw VTT/text transcript (strip cue numbers, normalize whitespace).
 *  2. Detect transcript quality: Good | Degraded | Poor | LongSession | TooLarge.
 *  3. Detect language: English | Hindi | Hinglish.
 *     - Devanagari: Unicode range \u0900-\u097F detected directly.
 *     - Latin-script Hindi (Hinglish): word frequency against top-200 list.
 *     - A pure-English transcript NEVER triggers Hindi detection.
 *  4. Guard transcript size:
 *     - > maxTranscriptTokens → set quality = 'TooLarge', add signal, STOP pipeline.
 *     - > longTranscriptThreshold → add 'long_session' signal (informational only).
 *  5. Write transcript_clean, transcript_quality, transcript_quality_signals,
 *     pipeline_stage = 'PREPROCESSED' to DB.
 */

import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/config/limits'
import { approximateTokens } from '@/lib/pipeline/utils/transcript-slicer'

// ── Language Detection ────────────────────────────────────────────────────────

/** Unicode range for Devanagari script (Hindi, Marathi, Sanskrit, etc.) */
const DEVANAGARI_REGEX = /[\u0900-\u097F]/

/**
 * Top-200 common Hinglish/Hindi-in-Latin words.
 * Presence of ≥5 of these in a transcript triggers 'hinglish' detection.
 * Only applied to Latin-script transcripts (no Devanagari detected).
 */
// Only genuinely Hindi/Hinglish words — no English words like 'campaign',
// 'funnel', 'basically' etc. that cause false positives on marketing transcripts.
const HINGLISH_WORDS = new Set([
  // Core Hindi function words
  'aur', 'hai', 'hain', 'nahi', 'nhi', 'kya', 'kaise', 'kyun', 'toh',
  'matlab', 'baat', 'samajh', 'samajhte', 'yaar', 'bhai', 'agar',
  'lekin', 'magar', 'phir', 'abhi', 'jab', 'tab', 'bohot', 'bahut',
  'thoda', 'sirf', 'bilkul', 'accha', 'acha', 'theek',
  // Hindi verb forms
  'hoga', 'hogi', 'hote', 'karo', 'karna', 'karte', 'karke', 'karein',
  'lagta', 'lagti', 'dekhte', 'dekho', 'dekh', 'suno', 'sun', 'bolo',
  'bol', 'chalte', 'chalo', 'batao', 'samjho', 'padh', 'padhna',
  'likh', 'likhna', 'dikha', 'dikhao',
  // Hindi pronouns/determiners
  'woh', 'wo', 'yeh', 'ye', 'iska', 'iski', 'iske', 'uska', 'uski',
  'uske', 'kuch', 'koi', 'humne', 'unhone', 'hume', 'unhe', 'muje',
  'mujhe', 'aapne', 'aap', 'aapko', 'tumne', 'tum', 'tumko',
  // Hindi adverbs/adjectives
  'pata', 'puri', 'poori', 'sab', 'sabse', 'sahi', 'galat', 'seedha',
  'seedhe', 'baad', 'pehle', 'zyada', 'kam', 'kitna', 'kitne',
  'dono', 'teeno', 'waise', 'waisa', 'jaise', 'aisa', 'aise',
  'kaafi', 'kafi', 'zaroor', 'zaruri', 'cheez', 'cheeze', 'chiz',
  // Hindi fillers
  'na', 'haan', 'naa', 'ji',
])

type Language = 'english' | 'hindi' | 'hinglish'

function detectLanguage(text: string): Language {
  // Check for Devanagari first (definitive)
  if (DEVANAGARI_REGEX.test(text)) {
    return 'hindi'
  }

  // Check for Latin-script Hinglish by word frequency
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) ?? []
  if (words.length === 0) return 'english'

  const hinglishCount = words.filter(w => HINGLISH_WORDS.has(w)).length
  const hinglishRatio = hinglishCount / words.length

  // ≥8% Hinglish words → Hinglish (not Hindi; no Devanagari found)
  if (hinglishRatio >= 0.08) return 'hinglish'

  return 'english'
}

// ── VTT/Transcript Cleaning ───────────────────────────────────────────────────

/**
 * Clean a raw VTT or plain-text transcript.
 * - Strip VTT cue numbers (lines that are purely an integer)
 * - Strip VTT header "WEBVTT" line
 * - Strip VTT timestamp arrows (keep just the start timestamp on the line)
 * - Normalize CRLF → LF
 * - Collapse 3+ consecutive blank lines to 2
 */
export function cleanTranscriptText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')              // CRLF → LF
    .replace(/^WEBVTT.*$/m, '')          // VTT header
    .replace(/^\d+\s*$/gm, '')           // VTT cue sequence numbers
    .replace(
      /^(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*-->\s*\d{2}:\d{2}:\d{2}(?:\.\d+)?.*$/gm,
      '$1'                               // "00:01:23.456 --> 00:01:27.000" → "00:01:23"
    )
    .replace(/\n{3,}/g, '\n\n')          // collapse blank lines
    .trim()
}

// ── Quality Assessment ────────────────────────────────────────────────────────

type QualityLevel = 'Good' | 'Degraded' | 'Poor' | 'TooLarge'

type QualityResult = {
  quality: QualityLevel
  signals: string[]
  language: Language
  tokenCount: number
}

export function assessTranscriptQuality(text: string): QualityResult {
  const signals: string[] = []
  const tokenCount = approximateTokens(text)
  const language = detectLanguage(text)

  // ── Hard size reject ───────────────────────────────────────────────────
  if (tokenCount > LIMITS.maxTranscriptTokens) {
    signals.push(`too_large:${tokenCount}_tokens`)
    return { quality: 'TooLarge', signals, language, tokenCount }
  }

  // ── Informational long session ─────────────────────────────────────────
  if (tokenCount > LIMITS.longTranscriptThreshold) {
    signals.push(`long_session:${tokenCount}_tokens`)
  }

  const lines = text.split('\n').filter(l => l.trim().length > 0)
  const totalLines = lines.length

  if (totalLines === 0) {
    signals.push('empty_transcript')
    return { quality: 'Poor', signals, language, tokenCount }
  }

  // ── Noise ratio: too many very short lines ─────────────────────────────
  const shortLines = lines.filter(l => l.trim().length < 10)
  if (shortLines.length / totalLines > 0.35) {
    signals.push('high_noise_ratio')
  }

  // ── Overlapping audio markers [Speaker A] [Speaker B] ─────────────────
  const overlapMatches = text.match(/\[.*?\]\s+\[.*?\]/g) ?? []
  if (overlapMatches.length > 10) {
    signals.push('audio_overlap')
  }

  // ── Incomplete utterances (word...) ───────────────────────────────────
  const trailingDots = text.match(/\b\w+\.{3}/g) ?? []
  if (trailingDots.length > 20) {
    signals.push('incomplete_utterances')
  }

  // ── [inaudible] markers ───────────────────────────────────────────────
  const inaudible = text.match(/\[inaudible.*?\]/gi) ?? []
  if (inaudible.length > 0) {
    signals.push(`inaudible_markers:${inaudible.length}`)
  }

  // ── Language signal (informational) ───────────────────────────────────
  if (language !== 'english') {
    signals.push(`language:${language}`)
  }

  // ── Derive overall quality ─────────────────────────────────────────────
  // Count only "bad" signals (not informational ones like long_session, language)
  const badSignals = signals.filter(
    s =>
      s !== `long_session:${tokenCount}_tokens` &&
      !s.startsWith('language:')
  )

  const quality: QualityLevel =
    badSignals.length === 0
      ? 'Good'
      : badSignals.length === 1
      ? 'Degraded'
      : 'Poor'

  return { quality, signals, language, tokenCount }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handlePreprocessor(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
  })
  if (!session) throw new Error(`[Stage0] Session ${sessionId} not found`)

  const raw: string = (session as any).transcriptRaw ?? ''
  if (!raw.trim()) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        transcript_quality: 'Poor',
        transcript_quality_signals: ['empty_transcript'] as any,
        pipeline_stage: 'FAILED',
        v3Error: 'Transcript is empty — nothing to process',
        next_action_at: new Date(),
      } as any,
    })
    console.error(`[Stage0] Session ${sessionId}: empty transcript`)
    return
  }

  const cleaned = cleanTranscriptText(raw)
  const qa = assessTranscriptQuality(cleaned)

  console.log(
    `[Stage0] Session ${sessionId}: quality=${qa.quality} lang=${qa.language} ` +
    `tokens≈${qa.tokenCount} signals=${qa.signals.join(',')}`
  )

  // If TooLarge, stop the pipeline — do not advance to PREPROCESSED
  if (qa.quality === 'TooLarge') {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        transcript_clean: cleaned,
        transcript_quality: 'TooLarge' as any,
        transcript_quality_signals: qa.signals as any,
        pipeline_stage: 'FAILED',
        v3Error: `Transcript too large: ~${qa.tokenCount} tokens (limit ${LIMITS.maxTranscriptTokens})`,
        next_action_at: new Date(),
      } as any,
    })
    return
  }

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      transcript_clean: cleaned,
      transcript_quality: qa.quality as any,
      transcript_quality_signals: qa.signals as any,
      pipeline_stage: 'PREPROCESSED',
      v3Status: 'PREPROCESSING',
      next_action_at: new Date(),
    } as any,
  })
}
