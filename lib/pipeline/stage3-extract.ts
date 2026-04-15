/**
 * STAGE 3 — PER-CHAPTER EXTRACTION
 *
 * Runs three parallel LLM tasks for each chapter slice:
 *   3A — Teaching mechanics (depth, analogies, trainer questions, live demo)
 *   3B — Student engagement (interactions, confusion points, callouts)
 *   3C — Curriculum alignment (what was covered vs. session notes)
 *
 * Results are stored as ChapterExtractionResult rows (task: "3A" | "3B" | "3C").
 */

import { callGeminiJSON } from "./gemini";
import { ChapterSlice } from "./stage2-slicer";

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const SHARED_RULES = `
ABSOLUTE EXTRACTION RULES:
1. You are a fact extractor. Extract only what is present in the transcript. Do not infer, assume, or invent.
2. Every text field must contain exact words copied from the transcript (verbatim quotes).
3. If something did not happen, return an empty array []. Never fill arrays with invented content.
4. All timestamps must come directly from the transcript. Use format HH:MM:SS.
5. Output strict JSON only. No markdown fences. No preamble. No trailing commas.
6. Use only the enum values listed in the schema. Do not invent new enum values.
`.trim();

// ── 3A: Teaching Mechanics ────────────────────────────────────────────────────
const PROMPT_3A_SYSTEM = `
${SHARED_RULES}

You analyse a chapter of a teaching session transcript and extract teaching mechanics.

OUTPUT — strict JSON with these exact keys:
{
  "chapter_index": <number>,
  "depth_classification": "surface_only | definitions_only | definitions_with_examples | reasoning_and_examples | deep_with_edge_cases",
  "depth_evidence": [
    { "type": "definition | reasoning_shown | worked_example | edge_case | first_principles | misconception_addressed", "concept": "<exact technical term>", "timestamp": "HH:MM:SS", "verbatim_quote": "<exact words>" }
  ],
  "trainer_questions": [
    { "timestamp": "HH:MM:SS", "verbatim_quote": "<exact question>", "type": "rhetorical | checking_understanding | socratic | cold_call | open_ended", "directed_at": "<whole_class | student_name | null>", "response_received": <true|false> }
  ],
  "analogies_and_examples": [
    { "timestamp": "HH:MM:SS", "verbatim_quote": "<exact words>", "type": "analogy | real_world_example | code_example | counter_example", "concept_explained": "<technical concept>" }
  ],
  "live_demo": { "present": <true|false>, "timestamp_start": "<HH:MM:SS|null>", "timestamp_end": "<HH:MM:SS|null>", "narration_quote": "<null|verbatim>" },
  "jargon_without_definition": [
    { "term": "<exact term>", "timestamp": "HH:MM:SS", "verbatim_quote": "<sentence where term appeared>" }
  ],
  "pacing": "fast | balanced | slow"
}
`.trim();

// ── 3B: Student Engagement ────────────────────────────────────────────────────
const PROMPT_3B_SYSTEM = `
${SHARED_RULES}

You analyse a chapter of a teaching session transcript and extract student engagement signals.

OUTPUT — strict JSON with these exact keys:
{
  "chapter_index": <number>,
  "student_interactions": [
    {
      "student_name": "<exact name as spoken, or 'unidentified'>",
      "timestamp": "HH:MM:SS",
      "type": "question | confusion_signal | correct_answer | wrong_answer | observation | clarification_request | off_topic",
      "verbatim_quote": "<exact student words>",
      "trainer_response_type": "thorough | brief | redirected | deferred | ignored | null",
      "trainer_response_quote": "<verbatim trainer reply or null>",
      "resolution": "resolved | partially_resolved | unresolved | not_applicable"
    }
  ],
  "confusion_points": [
    { "student_name": "<name or unidentified>", "timestamp": "HH:MM:SS", "verbatim_quote": "<exact confusion words>", "topic": "<concept student is confused about>", "resolution": "resolved | partially_resolved | unresolved" }
  ],
  "student_callouts": [
    { "student_name": "<exact name>", "timestamp": "HH:MM:SS", "trainer_quote": "<verbatim call-on words>", "student_response_quote": "<verbatim reply or no_response>" }
  ],
  "unique_student_names": ["<name1>", "<name2>"]
}
`.trim();

// ── 3C: Curriculum Alignment ──────────────────────────────────────────────────
const PROMPT_3C_SYSTEM = `
${SHARED_RULES}

You compare what was actually taught in this chapter transcript against the provided session/curriculum notes.

OUTPUT — strict JSON with these exact keys:
{
  "chapter_index": <number>,
  "topics_from_notes_covered": [
    { "topic": "<exact topic from notes>", "evidence_quote": "<verbatim transcript quote>", "timestamp": "HH:MM:SS" }
  ],
  "topics_from_notes_skipped": ["<exact topic name from notes>"],
  "topics_taught_not_in_notes": [
    { "topic": "<what was taught>", "verbatim_quote": "<exact words>", "timestamp": "HH:MM:SS" }
  ]
}
`.trim();

// ─── USER PROMPT BUILDERS ─────────────────────────────────────────────────────

function buildChapterContext(slice: ChapterSlice): string {
  return `Chapter ${slice.chapter.chapterIndex}: "${slice.chapter.chapterTitle}" (${slice.chapter.startTime} – ${slice.chapter.endTime})`;
}

function build3AUserPrompt(slice: ChapterSlice): string {
  return `${buildChapterContext(slice)}\n\nTranscript:\n${slice.transcriptSlice}`;
}

function build3BUserPrompt(slice: ChapterSlice): string {
  return `${buildChapterContext(slice)}\n\nTranscript:\n${slice.transcriptSlice}`;
}

function build3CUserPrompt(slice: ChapterSlice, sessionNotes: string): string {
  return `${buildChapterContext(slice)}\n\nSession/Curriculum Notes:\n${sessionNotes}\n\nTranscript:\n${slice.transcriptSlice}`;
}

// ─── TASK RUNNER ─────────────────────────────────────────────────────────────

export type ExtractionTask = "3A" | "3B" | "3C";

export interface ExtractionResult {
  task: ExtractionTask;
  chapterIndex: number;
  chapterTitle: string;
  resultJson: unknown;
}

async function runTask(
  task: ExtractionTask,
  systemPrompt: string,
  userPrompt: string,
  chapterIndex: number,
  chapterTitle: string
): Promise<ExtractionResult> {
  const resultJson = await callGeminiJSON<unknown>({
    systemPrompt,
    userPrompt,
    maxOutputTokens: 6144,
  });
  return { task, chapterIndex, chapterTitle, resultJson };
}

/**
 * Run all three extraction tasks for a single chapter slice in parallel.
 */
export async function extractChapter(
  slice: ChapterSlice,
  sessionNotes: string
): Promise<ExtractionResult[]> {
  const [resultA, resultB, resultC] = await Promise.all([
    runTask("3A", PROMPT_3A_SYSTEM, build3AUserPrompt(slice), slice.chapter.chapterIndex, slice.chapter.chapterTitle),
    runTask("3B", PROMPT_3B_SYSTEM, build3BUserPrompt(slice), slice.chapter.chapterIndex, slice.chapter.chapterTitle),
    runTask("3C", PROMPT_3C_SYSTEM, build3CUserPrompt(slice, sessionNotes), slice.chapter.chapterIndex, slice.chapter.chapterTitle),
  ]);
  return [resultA, resultB, resultC];
}
