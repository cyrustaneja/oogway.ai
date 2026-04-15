/**
 * STAGE 6 — SYNTHESIS (two sub-stages)
 *
 * 6A — Context Setting & Logistics Detection (LLM)
 *      Reads the first 20 min of transcript to classify how (or if)
 *      the trainer set context, and extracts session start/end times.
 *
 * 6B — Overall Narrative Synthesis (LLM)
 *      Given all chapter flow data + computed aggregates, produces a
 *      final overallSynthesis JSON that captures holistic session quality.
 */

import { callGeminiJSON } from "./gemini";
import { AggregationResult } from "./stage5-aggregate";

// ─── STAGE 6A ─────────────────────────────────────────────────────────────────

const STAGE_6A_SYSTEM = `
You are a transcript extraction engine. Your output is LIMITED to two tasks.

TASK 1 — CONTEXT SETTING CLASSIFICATION:
Read the provided transcript slice (first ~20 minutes of the session).
Determine whether and how the trainer established context for the topic before diving into instruction.

Classify as exactly ONE of:
- "not_set"                       — trainer went straight to teaching, no framing at all
- "set_without_examples"          — trainer stated objectives or relevance, but no concrete example or use-case
- "set_with_examples_and_usecases"— trainer gave at least one concrete example or real-world scenario before teaching

TASK 2 — SESSION LOGISTICS:
From the provided logistics slice (first 3 min + last 3 min of session), extract:
- When the trainer first spoke (timestamp + verbatim quote)
- When the trainer last spoke (timestamp + verbatim quote)
- Whether camera was mentioned as on or off (with verbatim evidence)
- Whether screen share was mentioned (with verbatim evidence)

OUTPUT — strict JSON only, these two keys:
{
  "context_setting": {
    "classification": "not_set | set_without_examples | set_with_examples_and_usecases",
    "timestamp": "HH:MM:SS or null",
    "findings": [
      { "type": "why_topic_matters | real_world_use | example_before_teaching | curiosity_created | objective_stated | prior_knowledge_connected", "verbatim_quote": "<exact words>", "timestamp": "HH:MM:SS" }
    ]
  },
  "session_logistics": {
    "expert_join_time": "HH:MM:SS or null",
    "expert_join_quote": "<verbatim or null>",
    "expert_leave_time": "HH:MM:SS or null",
    "expert_leave_quote": "<verbatim or null>",
    "camera_on": true | false | null,
    "camera_evidence_quote": "<verbatim or null>",
    "screen_share_on": true | false | null,
    "screen_share_evidence_quote": "<verbatim or null>"
  }
}

No markdown fences. No prose. Output only the JSON object.
`.trim();

export interface ContextSettingResult {
  context_setting: {
    classification: "not_set" | "set_without_examples" | "set_with_examples_and_usecases";
    timestamp: string | null;
    findings: Array<{ type: string; verbatim_quote: string; timestamp: string }>;
  };
  session_logistics: {
    expert_join_time: string | null;
    expert_join_quote: string | null;
    expert_leave_time: string | null;
    expert_leave_quote: string | null;
    camera_on: boolean | null;
    camera_evidence_quote: string | null;
    screen_share_on: boolean | null;
    screen_share_evidence_quote: string | null;
  };
}

export async function runStage6A(
  contextSlice: string,
  logisticsSlice: string,
  trainerName: string
): Promise<ContextSettingResult> {
  const userPrompt = `
Trainer name: ${trainerName}

CONTEXT DETECTION SLICE (first ~20 minutes):
${contextSlice}

LOGISTICS SLICE (first 3 min + last 3 min):
${logisticsSlice}
`.trim();

  return callGeminiJSON<ContextSettingResult>({
    systemPrompt: STAGE_6A_SYSTEM,
    userPrompt,
    maxOutputTokens: 4096,
  });
}

// ─── STAGE 6B ─────────────────────────────────────────────────────────────────

const STAGE_6B_SYSTEM = `
You are a session synthesis engine.
You receive aggregated, computed metrics about a teaching session.
Your job is to produce a concise, structured narrative synthesis.

RULES:
1. Do not add opinions or advice.
2. Base every statement on the data provided — cite counts or facts.
3. Output strict JSON only. No markdown fences. No prose.

OUTPUT schema:
{
  "session_summary": "<2–3 sentence factual summary of what was taught and how>",
  "key_strengths": ["<factual strength 1, citing evidence>", "..."],
  "notable_patterns": [
    { "pattern": "<what pattern was observed>", "evidence": "<count or quote from data>" }
  ],
  "chapter_highlights": [
    { "chapterIndex": <n>, "chapterTitle": "<title>", "highlight": "<1 sentence factual observation>" }
  ],
  "student_engagement_summary": "<1–2 sentence factual summary of student participation>",
  "curriculum_coverage_summary": "<1 sentence on topic coverage vs. session notes>"
}
`.trim();

export interface SynthesisResult {
  session_summary: string;
  key_strengths: string[];
  notable_patterns: Array<{ pattern: string; evidence: string }>;
  chapter_highlights: Array<{ chapterIndex: number; chapterTitle: string; highlight: string }>;
  student_engagement_summary: string;
  curriculum_coverage_summary: string;
}

export async function runStage6B(
  sessionName: string,
  trainerName: string,
  aggregation: AggregationResult,
  contextResult: ContextSettingResult
): Promise<SynthesisResult> {
  const userPrompt = `
Session: "${sessionName}" — Trainer: ${trainerName}

COMPUTED SESSION COUNTS:
${JSON.stringify(aggregation.sessionCounts, null, 2)}

CHAPTER FLOW:
${JSON.stringify(aggregation.sessionFlow, null, 2)}

PEDAGOGICAL GAPS DETECTED:
${JSON.stringify(aggregation.pedagogicalGaps, null, 2)}

CONTEXT SETTING:
${JSON.stringify(contextResult.context_setting, null, 2)}

UNIQUE STUDENTS: ${aggregation.sessionCounts.uniqueStudentCount}
TOP STUDENT PROFILES (by interaction count):
${JSON.stringify(aggregation.studentProfiles.slice(0, 5), null, 2)}
`.trim();

  return callGeminiJSON<SynthesisResult>({
    systemPrompt: STAGE_6B_SYSTEM,
    userPrompt,
    maxOutputTokens: 4096,
  });
}
