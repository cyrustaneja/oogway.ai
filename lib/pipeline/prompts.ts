// lib/pipeline/prompts.ts
import { PROMPT_BOOK, SHARED_RULES } from "./prompt-book";

/**
 * PROMPT ASSEMBLY
 * 
 * These constants are used by the pipeline stages. They combine the shared extraction
 * rules with the specific stage instructions and schemas from the Prompt Book.
 */

function assemblePrompt(stageKey: keyof typeof PROMPT_BOOK): string {
  const config = PROMPT_BOOK[stageKey];
  return `
${SHARED_RULES}

${config.instruction}

OUTPUT TARGET SCHEMA (Strict JSON):
${JSON.stringify(config.schema, null, 2)}
`.trim();
}

// ── 1. CHAPTER INSIGHTS (Extracted per 15-minute slice) ───────────────────
export const PROMPT_CHAPTER_INSIGHTS = assemblePrompt("chapter_insights");

// ── 2. OVERALL SUMMARY (Aggregated at the end) ─────────────────────────
export const PROMPT_OVERALL_SUMMARY = assemblePrompt("overall_summary");

// ── 3. EXPERT ANALYSIS (Aggregated at the end) ─────────────────────────
export const PROMPT_EXPERT_ANALYSIS = assemblePrompt("expert_analysis");

// ── 4. STUDENT ANALYSIS (Aggregated at the end) ─────────────────────────
export const PROMPT_STUDENT_ANALYSIS = assemblePrompt("student_analysis");
