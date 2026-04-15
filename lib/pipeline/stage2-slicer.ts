/**
 * STAGE 2 — TRANSCRIPT SLICER
 *
 * Given a full transcript and chapter definitions from Stage 1,
 * returns the subset of transcript lines that fall within each chapter's
 * time window. No LLM call — pure string manipulation.
 */

import { ChapterDef } from "./stage1-structure";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Convert HH:MM:SS → total seconds (integer).
 */
function toSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length !== 3) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/**
 * Extract the timestamp from a serialised transcript line.
 * Expected format: "[HH:MM:SS] some text"
 * Returns null if the line doesn't match.
 */
function extractLineTimestamp(line: string): string | null {
  const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
  return match ? match[1] : null;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export interface ChapterSlice {
  chapter: ChapterDef;
  transcriptSlice: string;
}

/**
 * Slice a serialised transcript (from Stage 0) into per-chapter strings
 * based on the chapter definitions returned by Stage 1.
 *
 * Lines without timestamps are kept with the last chapter they belong to.
 * Adds a small 30-second overlap on both sides of each boundary for context.
 */
export function sliceTranscriptByChapters(
  transcript: string,
  chapters: ChapterDef[],
  overlapSeconds = 30
): ChapterSlice[] {
  const lines = transcript.split("\n");

  return chapters.map((chapter) => {
    const startSec = Math.max(0, toSeconds(chapter.startTime) - overlapSeconds);
    const endSec   = toSeconds(chapter.endTime)   + overlapSeconds;

    const sliceLines: string[] = [];
    for (const line of lines) {
      const ts = extractLineTimestamp(line);
      if (!ts) continue; // skip lines without timestamps in boundary check
      const sec = toSeconds(ts);
      if (sec >= startSec && sec <= endSec) {
        sliceLines.push(line);
      }
    }

    return {
      chapter,
      transcriptSlice: sliceLines.join("\n"),
    };
  });
}

/**
 * Extract the first N minutes of a serialised transcript string.
 * Used to prepare the context-setting slice for Stage 6.
 */
export function sliceFirstNMinutes(transcript: string, minutes: number): string {
  const limitSec = minutes * 60;
  return transcript
    .split("\n")
    .filter((line) => {
      const ts = extractLineTimestamp(line);
      return ts ? toSeconds(ts) <= limitSec : false;
    })
    .join("\n");
}

/**
 * Extract the last N minutes of a serialised transcript string.
 * Used for session logistics extraction in Stage 6.
 */
export function sliceLastNMinutes(transcript: string, minutes: number): string {
  const lines = transcript.split("\n");
  const lastTs = lines
    .map((l) => extractLineTimestamp(l))
    .filter(Boolean)
    .pop();

  if (!lastTs) return "";

  const lastSec = toSeconds(lastTs);
  const limitSec = lastSec - minutes * 60;

  return lines
    .filter((line) => {
      const ts = extractLineTimestamp(line);
      return ts ? toSeconds(ts) >= limitSec : false;
    })
    .join("\n");
}
