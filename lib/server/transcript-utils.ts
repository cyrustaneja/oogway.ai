/**
 * Finds the exact timestamp in the transcript that matches a given quote.
 * Employs word-level fuzzy match with fallback to partial sentence bounds.
 */
export function findTimestampInTranscript(transcript: string | null | undefined, quote: string): string | null {
  if (!transcript || !quote) return null;

  // Normalize quote: lowercase, strip punctuation, strip extra whitespace
  const cleanString = (str: string) => 
    str.toLowerCase()
       .replace(/[\u2018\u2019\u201C\u201D''""]/g, '') // remove smart and straight quotes
       .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\u2026\u2014]/g, ' ') // replace punctuation/ellipses/em-dashes with spaces
       .replace(/\s+/g, ' ')
       .trim();

  const cleanQuote = cleanString(quote);
  if (!cleanQuote) return null;

  const lines = transcript.split('\n');
  const words: { word: string; timestamp: string }[] = [];
  let currentTimestamp = '00:00:00';

  // Matches hh:mm:ss or mm:ss with optional milliseconds
  const TS_REGEX = /\b(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:\.\d+)?\b/;

  for (const line of lines) {
    const tsMatch = line.match(TS_REGEX);
    if (tsMatch) {
      const hours = tsMatch[1] ? tsMatch[1].padStart(2, '0') : '00';
      const minutes = tsMatch[2].padStart(2, '0');
      const seconds = tsMatch[3].padStart(2, '0');
      currentTimestamp = `${hours}:${minutes}:${seconds}`;
    }
    
    const lineTextWithoutTs = line.replace(/\[?\b(?:\d{1,2}:)?\d{2}:\d{2}(?:\.\d+)?\]?/g, '');
    const cleanedLine = cleanString(lineTextWithoutTs);
    if (!cleanedLine) continue;

    const lineWords = cleanedLine.split(' ');
    for (const w of lineWords) {
      if (w) {
        words.push({ word: w, timestamp: currentTimestamp });
      }
    }
  }

  if (words.length === 0) return null;

  const reconstructed = words.map(w => w.word).join(' ');
  let matchIndex = reconstructed.indexOf(cleanQuote);
  
  if (matchIndex === -1) {
    const firstPart = cleanQuote.split(' ').slice(0, 5).join(' ');
    if (firstPart.length > 5) {
      matchIndex = reconstructed.indexOf(firstPart);
    }
  }
  
  if (matchIndex === -1) {
    const quoteParts = cleanQuote.split(' ');
    const lastPart = quoteParts.slice(Math.max(0, quoteParts.length - 5)).join(' ');
    if (lastPart.length > 5) {
      matchIndex = reconstructed.indexOf(lastPart);
    }
  }

  if (matchIndex === -1) return null;

  let charAcc = 0;
  for (let i = 0; i < words.length; i++) {
    if (charAcc >= matchIndex) {
      return words[i].timestamp;
    }
    charAcc += words[i].word.length + 1;
  }

  return words[words.length - 1].timestamp;
}

import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';

/**
 * Traverses synthesis properties, correcting 0:00 / missing timestamps.
 * Resolves the transcript asynchronously and on-demand only if corrections are actually required.
 */
export async function enrichSynthesisTimestamps(
  synthesis: SessionAnalysis | Record<string, unknown>,
  getTranscript: () => Promise<string | null | undefined>,
  chapters?: ChapterResult[]
): Promise<SessionAnalysis | Record<string, unknown>> {
  if (!synthesis) return synthesis;

  // Clone to prevent mutating reference data
  const data = JSON.parse(JSON.stringify(synthesis));
  let transcriptLoaded = false;
  let transcriptVal: string | null | undefined = undefined;

  const resolveTranscript = async () => {
    if (!transcriptLoaded) {
      transcriptVal = await getTranscript();
      transcriptLoaded = true;
    }
    return transcriptVal;
  };

  // 1. analogies_summary
  if (data.expert_audit?.analogies_summary && Array.isArray(data.expert_audit.analogies_summary)) {
    for (let i = 0; i < data.expert_audit.analogies_summary.length; i++) {
      const summaryAnalogy = data.expert_audit.analogies_summary[i];
      let ts = summaryAnalogy.timestamp;
      if (!ts || ts === '0:00' || ts === '00:00:00' || ts === '00:00') {
        const transcript = await resolveTranscript();
        const fuzzyTs = findTimestampInTranscript(transcript, summaryAnalogy.verbatim_quote || summaryAnalogy.concept);
        if (fuzzyTs) {
          ts = fuzzyTs;
        } else if (chapters) {
          const chapterResult = chapters.find(c => c.chapter_num === summaryAnalogy.chapter);
          if (chapterResult && chapterResult.analogies && Array.isArray(chapterResult.analogies)) {
            const match = chapterResult.analogies.find((a: { verbatim_quote?: string, concept_explained?: string, timestamp?: string }) => 
              a.verbatim_quote === summaryAnalogy.verbatim_quote ||
              a.concept_explained === summaryAnalogy.concept
            );
            if (match && match.timestamp && match.timestamp !== '0:00' && match.timestamp !== '00:00' && match.timestamp !== '00:00:00') {
              ts = match.timestamp;
            }
          }
        }
      }
      data.expert_audit.analogies_summary[i] = { ...summaryAnalogy, timestamp: ts || '0:00' };
    }
  }

  // 2. unresolved_doubts
  if (data.student_log?.unresolved_doubts && Array.isArray(data.student_log.unresolved_doubts)) {
    for (let i = 0; i < data.student_log.unresolved_doubts.length; i++) {
      const d = data.student_log.unresolved_doubts[i];
      let ts = d.timestamp;
      if (!ts || ts === '0:00' || ts === '00:00:00' || ts === '00:00') {
        const transcript = await resolveTranscript();
        const fuzzyTs = findTimestampInTranscript(transcript, d.doubt);
        if (fuzzyTs) {
          ts = fuzzyTs;
        }
      }
      data.student_log.unresolved_doubts[i] = { ...d, timestamp: ts || '0:00' };
    }
  }

  // 3. student_questions
  if (data.student_log?.student_questions && Array.isArray(data.student_log.student_questions)) {
    for (let i = 0; i < data.student_log.student_questions.length; i++) {
      const q = data.student_log.student_questions[i];
      let ts = q.timestamp;
      if (!ts || ts === '0:00' || ts === '00:00:00' || ts === '00:00') {
        const transcript = await resolveTranscript();
        const fuzzyTs = findTimestampInTranscript(transcript, q.question);
        if (fuzzyTs) {
          ts = fuzzyTs;
        }
      }
      data.student_log.student_questions[i] = { ...q, timestamp: ts || '0:00' };
    }
  }

  return data;
}
