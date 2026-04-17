/**
 * STAGE 3 — PER-CHAPTER EXTRACTION
 * Runs a single unified extraction task to populate the Session Flow chapter insight.
 */

import { callGeminiJSON } from "./gemini";
import { ChapterSlice } from "./stage2-slicer";
import { PROMPT_CHAPTER_INSIGHTS } from "./prompts";

export interface ExtractionResult {
  chapterIndex: number;
  chapterTitle: string;
  resultJson: unknown;
}

function buildChapterUserPrompt(slice: ChapterSlice): string {
  return `Chapter ${slice.chapter.chapterIndex}: "${slice.chapter.chapterTitle}" (${slice.chapter.startTime} – ${slice.chapter.endTime})\n\nTranscript:\n${slice.transcriptSlice}`;
}

export async function extractChapter(
  slice: ChapterSlice,
  sessionNotes: string
): Promise<ExtractionResult> {
  const resultJson = await callGeminiJSON<unknown>({
    systemPrompt: PROMPT_CHAPTER_INSIGHTS,
    userPrompt: buildChapterUserPrompt(slice),
    maxOutputTokens: 8192,
  });
  
  return {
    chapterIndex: slice.chapter.chapterIndex,
    chapterTitle: slice.chapter.chapterTitle,
    resultJson,
  };
}
