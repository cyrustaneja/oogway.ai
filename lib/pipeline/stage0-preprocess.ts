/**
 * STAGE 0 — PREPROCESSOR
 *
 * Accepts raw .vtt content (as string).
 * Strips WebVTT headers, cue identifiers, timestamps, and malformed encoding artifacts.
 * Returns a clean, timestamped transcript string suitable for LLM input.
 */

export interface TranscriptLine {
  timestamp: string; // HH:MM:SS
  text: string;
}

/**
 * Repairs common UTF-8 mojibake found in Zoom-exported .vtt files.
 */
function repairMojibake(input: string): string {
  return input
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, "—")
    .replace(/â€¦/g, "…")
    .replace(/Ã©/g, "é")
    .replace(/Ã /g, "à")
    .replace(/Ã¨/g, "è")
    .replace(/\u00a0/g, " "); // non-breaking space
}

/**
 * Converts HH:MM:SS.mmm --> HH:MM:SS
 */
function normalizeTimestamp(ts: string): string {
  return ts.split(".")[0].trim(); // strip milliseconds
}

/**
 * Parses a WebVTT string into an ordered array of {timestamp, text} objects.
 * Duplicate consecutive lines (echo artifacts) are collapsed.
 */
export function parseVTT(raw: string): TranscriptLine[] {
  const fixed = repairMojibake(raw);
  const lines = fixed.split(/\r?\n/);
  const result: TranscriptLine[] = [];

  let currentTimestamp: string | null = null;
  let currentText: string[] = [];

  const TIMESTAMP_RE = /^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/;
  const CUE_ID_RE = /^\d+$/;

  const flushCue = () => {
    if (currentTimestamp && currentText.length > 0) {
      const joined = currentText.join(" ").replace(/\s+/g, " ").trim();
      if (joined) {
        result.push({ timestamp: normalizeTimestamp(currentTimestamp), text: joined });
      }
    }
    currentText = [];
    currentTimestamp = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "WEBVTT" || trimmed === "" || trimmed.startsWith("NOTE") || CUE_ID_RE.test(trimmed)) {
      if (trimmed === "" && currentTimestamp) {
        flushCue();
      }
      continue;
    }

    const tsMatch = trimmed.match(TIMESTAMP_RE);
    if (tsMatch) {
      flushCue();
      currentTimestamp = tsMatch[1]; // use start time of cue
      continue;
    }

    // Strip inline VTT tags like <00:01:23.456><c>text</c>
    const cleaned = trimmed.replace(/<[^>]+>/g, "").trim();
    if (cleaned && currentTimestamp) {
      currentText.push(cleaned);
    }
  }
  flushCue();

  // Collapse duplicate consecutive lines (common in Zoom exports)
  const deduped: TranscriptLine[] = [];
  for (const line of result) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.text === line.text) continue;
    deduped.push(line);
  }

  return deduped;
}

/**
 * Serialises parsed transcript lines to a plain-text string:
 * [HH:MM:SS] Speaker text...
 *
 * Also optionally strips speaker labels if they're present in format "Name: text"
 */
export function serializeTranscript(lines: TranscriptLine[]): string {
  return lines.map((l) => `[${l.timestamp}] ${l.text}`).join("\n");
}

/**
 * Main export: given raw VTT string, return clean transcript string.
 * Tags lines containing administrative keywords (attendance, tech issues, logistics)
 * as [ADMIN] to help Stage 1 classification.
 */
export function preprocessWebVTT(rawVtt: string): string {
  const lines = parseVTT(rawVtt);
  if (lines.length === 0) {
    throw new Error("PREPROCESS_EMPTY: No transcript lines extracted. The VTT file may be empty or malformed.");
  }

  const ADMIN_KEYWORDS = [
    "attendance", "hear me", "share screen", "am i audible", "let me join",
    "can you see", "recording", "started now", "wait for everyone", "good morning",
    "good evening", "hall ticket", "exam", "technical issue", "low bandwidth"
  ];

  const processed = lines.map(line => {
    const isCandidate = ADMIN_KEYWORDS.some(k => line.text.toLowerCase().includes(k));
    return `[${line.timestamp}]${isCandidate ? ' [ADMIN]' : ''} ${line.text}`;
  });

  return processed.join("\n");
}

/**
 * Extract first N minutes of transcript (for context detection / logistics).
 */
export function extractFirstNMinutes(transcript: string, minutes: number): string {
  const lines = transcript.split("\n");
  const cutoff = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;

  const result: string[] = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
    if (match && match[1] > cutoff) break;
    result.push(line);
  }
  return result.join("\n");
}

/**
 * Extract last N minutes of transcript (for logistics extraction).
 */
export function extractLastNMinutes(transcript: string, minutes: number): string {
  const lines = transcript.split("\n");
  const lastLine = lines[lines.length - 1];
  const lastMatch = lastLine?.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
  if (!lastMatch) return "";

  const [h, m, s] = lastMatch[1].split(":").map(Number);
  const totalSeconds = h * 3600 + m * 60 + s;
  const cutoffSeconds = totalSeconds - minutes * 60;

  const cutoff = [
    String(Math.floor(cutoffSeconds / 3600)).padStart(2, "0"),
    String(Math.floor((cutoffSeconds % 3600) / 60)).padStart(2, "0"),
    String(cutoffSeconds % 60).padStart(2, "0"),
  ].join(":");

  return lines.filter((line) => {
    const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
    return match ? match[1] >= cutoff : false;
  }).join("\n");
}
