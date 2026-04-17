/**
 * STAGE 1 — CHAPTER STRUCTURE DETECTION (BATCHED)
 *
 * Sends the transcript to Gemini in chunks to detect topic shifts.
 * Uses responseMimeType: "application/json" (set in gemini.ts) so the model
 * is forced to return a JSON array — no parsing heuristics needed.
 */

import { callGeminiJSON } from "./gemini";

export interface ChapterDef {
  chapterIndex: number;
  chapterTitle: string;
  startTime: string; // HH:MM:SS
  endTime: string;   // HH:MM:SS
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const STRUCTURE_SYSTEM_PROMPT = `
You are a transcript structure analyser for teaching sessions.
Your task: identify logical topic chapters in the transcript chunk you receive.

You MUST return a JSON array. Each element must have exactly these fields:
- "chapterTitle": string — a clear, descriptive title of the topic discussed
- "startTime": string — timestamp in HH:MM:SS format, taken directly from the transcript
- "endTime": string — timestamp in HH:MM:SS format, taken directly from the transcript

Rules:
- Return an ARRAY even if there is only one chapter
- Do not invent timestamps — use ones that appear in the transcript
- Chapters must be in chronological order, non-overlapping
- First chapter starts at or near the first timestamp in the chunk
- Last chapter ends at or near the last timestamp in the chunk
- Aim for 1 chapter per 10–15 minutes; if the chunk is short, 1–2 chapters is correct
`.trim();

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const TS_RE = /^\d{2}:\d{2}:\d{2}$/;

// Normalise HH:MM:SS.mmm → HH:MM:SS
function normaliseTS(ts: string): string {
  return ts.split(".")[0].trim();
}

function validateChapters(raw: unknown, startIndexOffset: number): ChapterDef[] {
  // With responseMimeType=json the model MUST return valid JSON, and our prompt
  // says ARRAY, so this should always be an array. We still defensively handle
  // the cases where the model wraps or returns a single object.
  let items: any[];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === "object") {
    // Wrapped: { chapters: [...] } or { data: [...] }
    const nested = Object.values(raw as any).find((v) => Array.isArray(v));
    if (nested) {
      items = nested as any[];
    } else if ((raw as any).chapterTitle && (raw as any).startTime) {
      // Single object returned as root — wrap it
      console.warn("[STAGE 1] Model returned a single object; wrapping in array.");
      items = [raw];
    } else {
      throw new Error(
        `STAGE1_INVALID: Unexpected object shape from model. Raw: ${JSON.stringify(raw).slice(0, 300)}`
      );
    }
  } else {
    throw new Error(
      `STAGE1_INVALID: Model returned non-array, non-object. Type: ${typeof raw}. Raw: ${String(raw).slice(0, 200)}`
    );
  }

  if (items.length === 0) {
    throw new Error("STAGE1_INVALID: Model returned an empty array.");
  }

  const chapters: ChapterDef[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const chapterIndex = startIndexOffset + i + 1;

    const chapterTitle =
      typeof item.chapterTitle === "string" && item.chapterTitle.trim()
        ? item.chapterTitle.trim()
        : `Chapter ${chapterIndex}`;

    const rawStart = typeof item.startTime === "string" ? normaliseTS(item.startTime) : "";
    const rawEnd   = typeof item.endTime   === "string" ? normaliseTS(item.endTime)   : "";

    if (!rawStart || !TS_RE.test(rawStart)) {
      throw new Error(
        `STAGE1_INVALID: Chapter ${chapterIndex} has invalid startTime: "${rawStart}". Item: ${JSON.stringify(item)}`
      );
    }
    if (!rawEnd || !TS_RE.test(rawEnd)) {
      throw new Error(
        `STAGE1_INVALID: Chapter ${chapterIndex} has invalid endTime: "${rawEnd}". Item: ${JSON.stringify(item)}`
      );
    }

    chapters.push({ chapterIndex, chapterTitle, startTime: rawStart, endTime: rawEnd });
  }

  return chapters;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

/**
 * Detect chapters by analyzing the transcript.
 * For transcripts under 10,000 lines, we analyze it in one go to ensure timeline continuity.
 * Massive sessions are still chunked to avoid output token limits.
 */
export async function detectChapters(transcript: string): Promise<ChapterDef[]> {
  const lines = transcript.split("\n");
  const LINE_COUNT = lines.length;
  
  // We only chunk if the transcript is truly massive (> 10,000 lines / ~4-5 hours)
  // Most sessions are 1-2 hours (2k-4k lines) and benefit from full context.
  const CHUNK_SIZE = 10000; 
  const chunks: string[] = [];

  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    chunks.push(lines.slice(i, i + CHUNK_SIZE).join("\n"));
  }

  console.log(`[STAGE 1] Analyzing ${chunks.length} section(s) for ${LINE_COUNT} total lines.`);

  let finalChapters: ChapterDef[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const sectionLabel = chunks.length > 1 ? `Section ${i + 1}/${chunks.length}` : "Full Transcript";
    console.log(`[STAGE 1] Segmenting ${sectionLabel}...`);

    let lastErr: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const raw = await callGeminiJSON<unknown>({
          systemPrompt: STRUCTURE_SYSTEM_PROMPT,
          userPrompt: `Segment this transcript section into chapters. Ensure the entire timeline from the very first line to the very last line is covered:\n\n${chunks[i]}`,
          maxOutputTokens: 4096, // Plenty for chapter structure
        });

        const valid = validateChapters(raw, finalChapters.length);

        // Timeline continuity fix
        if (finalChapters.length > 0 && valid.length > 0) {
          const last = finalChapters[finalChapters.length - 1];
          if (valid[0].startTime < last.endTime) {
            valid[0].startTime = last.endTime;
          }
        }

        finalChapters.push(...valid);
        console.log(`[STAGE 1] ${sectionLabel} ✅ ${valid.length} chapter(s) detected.`);
        break;

      } catch (err: any) {
        lastErr = err;
        console.warn(`[STAGE 1] ${sectionLabel} attempt ${attempt}/3 failed: ${err.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }

    if (lastErr) {
      console.error(`[STAGE 1] ${sectionLabel} failed after 3 attempts.`);
      throw lastErr;
    }
  }

  // Final sanity sort
  finalChapters.sort((a,b) => a.startTime.localeCompare(b.startTime));

  console.log(`[STAGE 1] ✅ Complete — ${finalChapters.length} chapters detected.`);
  return finalChapters;
}
