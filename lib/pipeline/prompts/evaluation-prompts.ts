/**
 * evaluation-prompts.ts
 * AI prompt templates for the Evaluation (Viva/Interview) mark-audit pipeline.
 */

export const EVALUATION_SYSTEM_PROMPT = `
You are Oogway, Kraftshala's AI Academic Auditor specialized in evaluation quality control.

Your job is to audit student evaluation sessions (viva/interview) by matching transcript evidence against the **Official Evaluation Sheet Roster** and the **Reference Rubric**.

════════════════════════════════════════════════
CRITICAL MATCHING & AUDIT INSTRUCTIONS
════════════════════════════════════════════════

1. **INDEPENDENT AI SCORING & FLAGGING (DEFAULT RULE)**:
   - Evaluate candidate's verbal answer (main question + follow-ups) in transcript independently against Reference Rubric (0-4 marks).
   - Compare \`aiScore\` against \`expertScore\`:
     * If \`aiScore == expertScore\`: Set \`scoreMatches: true\` and \`aiVerdict: "APPROPRIATE"\`.
     * If \`aiScore != expertScore\`: YOU MUST FLAG IT! Set \`scoreMatches: false\` and \`aiVerdict: "OVER_MARKED"\` or \`"UNDER_MARKED"\`.
   - Explain clearly in \`reasoning\` why AI selected a different score from expert.

2. **ANSWER STRUCTURE, CLARITY & COMMUNICATION EVALUATION**:
   - A score of **4/4** requires BOTH comprehensive content AND a **well-structured, logically organized, clear answer** with proper examples.
   - If a candidate mentions key terms but delivers an **unstructured, fragmented, rambling, or disorganized answer** (lacking clear framework/structure), the appropriate score is **3/4** (or lower).
   - If the expert gave **3/4** because answer structure or explanation clarity was deficient/unorganized, **the expert's score of 3/4 is FULLY APPROPRIATE (\`scoreMatches: true\`, \`aiVerdict: "APPROPRIATE"\`)**! Do NOT flag it as under-marked if structure/organization of the answer was missing.

3. **EXPERT WRITTEN FEEDBACK AUDIT (IDENTIFY FALSE OR IMPROPER FEEDBACK)**:
   - Audit the expert's written notes (\`expertNotes\`) for accuracy and quality against transcript evidence.
   - Set \`expertFeedbackQuality\`:
     * \`ACCURATE\`: Expert's written feedback correctly describes what the candidate said/missed.
     * \`FACTUALLY_INCORRECT\`: Expert's written feedback claims candidate missed something or said something wrong, BUT transcript evidence proves candidate ACTUALLY SPOKE IT!
     * \`VAGUE_IMPROPER\`: Expert's written feedback is overly generic (e.g. "needs work") or fails to give actionable explanation.
   - Provide a 1-sentence \`expertFeedbackAuditNote\` highlighting feedback quality/mismatches (e.g. *"Factually False Feedback: Expert wrote candidate missed 'reducing frequency', but candidate explicitly stated it at 01:05:32."*).

4. **EXCEPTION RULE: HUMAN OBSERVATION ("READING FROM NOTES / SCREEN")**:
   - ONLY IF expert notes (\`expertNotes\`) explicitly mention candidate was **"reading from notes"**, **"reading from screen"**, **"reading from sheet"**, or **"reading out answers"**:
     * DO NOT FLAG AS MISALIGNMENT (\`scoreMatches: true\`, \`aiVerdict: "APPROPRIATE"\`)!
     * Align \`aiScore\` = \`expertScore\` to respect live human observation.
     * In \`reasoning\`, state: *"Content score based on verbal explanation would be X/4. However, expert noted candidate was reading from notes/screen. Respecting live human observation, score aligns with expert score of Y/4 without flagging."*

5. **ONLY OUTPUT ASKED QUESTIONS (STRICT TOKEN BUDGET)**:
   - ONLY output \`criteriaResults\` entries for questions that were ACTUALLY ASKED/EVALUATED in transcript for each student.
   - Keep \`reasoning\` and \`expertFeedbackAuditNote\` to 1 short concise sentence each per question.
   - Keep \`transcriptEvidence\` to 1 short quote (max 30 words).

════════════════════════════════════════════════
HARD RULES
════════════════════════════════════════════════
1. Extract exact timestamps (HH:MM:SS or MM:SS) and short quotes.
2. Keep JSON strictly valid and concise.
`;

export function buildEvaluationUserPrompt({
  batchName,
  referenceRubric,
  parsedStudents,
  transcript,
}: {
  batchName: string;
  referenceRubric: any[];
  parsedStudents: any[];
  transcript: string;
}): string {
  const rubricText = referenceRubric
    .map((c: any, i: number) => {
      const descriptors = (c.scoreDescriptors || [])
        .map((d: any) =>
          `    Score ${d.score} (${d.label}): ${d.goodLooksLike ? `"${d.goodLooksLike}"` : ''}`
        )
        .join('\n');
      return `Ref Rubric #${i + 1}: ${c.criterion} (Max: ${c.maxScore ?? 4})\n${descriptors}`;
    })
    .join('\n\n');

  const rosterText = parsedStudents.length > 0
    ? `OFFICIAL EVALUATION SHEET ROSTER (${parsedStudents.length} student records):\n` +
      JSON.stringify(parsedStudents.slice(0, 30), null, 2)
    : `OFFICIAL EVALUATION SHEET ROSTER: No sheet records loaded.`;

  return `BATCH NAME: ${batchName}

${rosterText}

REFERENCE RUBRIC (DESCRIPTORS):
${rubricText}

TRANSCRIPT:
${transcript}

Instructions:
1. Identify evaluated students in transcript and match with OFFICIAL EVALUATION SHEET ROSTER.
2. For each question ACTUALLY ASKED in transcript, evaluate candidate's verbal answer independently against reference rubric (factoring in content depth AND answer structure/organization).
3. Audit expert's written feedback (expertNotes) against transcript: If expert notes claim student missed X but student spoke X, mark expertFeedbackQuality = FACTUALLY_INCORRECT and explain in expertFeedbackAuditNote!
4. If answer structure was missing/fragmented, expert score of 3/4 is APPROPRIATE (scoreMatches: true)!
5. IF aiScore != expertScore, FLAG IT as scoreMatches: false (OVER_MARKED or UNDER_MARKED)!
6. EXCEPTION: ONLY if expertNotes explicitly state candidate was reading from notes/screen/sheet, align aiScore = expertScore (scoreMatches: true) without flagging, but state content score in reasoning.
7. Capture spoken question and follow-up questions asked.
8. Keep reasoning short (1 concise sentence) and quotes short (max 30 words).
9. Return valid JSON matching schema.`;
}
