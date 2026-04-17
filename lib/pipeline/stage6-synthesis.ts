/**
 * STAGE 6 — OVERALL SYNTHESIS
 * Resolves the 3 main pillars (Overall, Expert, Student) using the 
 * SessionFlow array and the official curriculum tracking notes.
 */

import { callGeminiJSON } from "./gemini";
import { PROMPT_OVERALL_SUMMARY, PROMPT_EXPERT_ANALYSIS, PROMPT_STUDENT_ANALYSIS } from "./prompts";
import { SessionFlowChapter } from "./stage5-aggregate";

export interface SynthesisResult {
  overallSummary: any;
  expertAnalysis: any;
  studentAnalysis: any;
}

export async function runStage6Synthesis(
  sessionFlow: SessionFlowChapter[],
  sessionNotes: string,
  trainerName: string
): Promise<SynthesisResult> {
  const payloadData = JSON.stringify(sessionFlow, null, 2);
  const userPromptText = `
Trainer Name: ${trainerName}

Curriculum / Session Notes:
${sessionNotes}

Session Flow (Extracted Truth):
${payloadData}
  `.trim();

  // Run all 3 synthesis tasks in parallel
  const [overallSummary, expertAnalysis, studentAnalysis] = await Promise.all([
    callGeminiJSON<any>({
      systemPrompt: PROMPT_OVERALL_SUMMARY,
      userPrompt: userPromptText,
      maxOutputTokens: 8192,
    }),
    callGeminiJSON<any>({
      systemPrompt: PROMPT_EXPERT_ANALYSIS,
      userPrompt: userPromptText,
      maxOutputTokens: 8192,
    }),
    callGeminiJSON<any>({
      systemPrompt: PROMPT_STUDENT_ANALYSIS,
      userPrompt: userPromptText,
      maxOutputTokens: 8192,
    })
  ]);

  return {
    overallSummary,
    expertAnalysis,
    studentAnalysis
  };
}
