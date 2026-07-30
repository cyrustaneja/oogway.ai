import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { callStage } from '@/lib/pipeline/utils/call-stage';

const STUDENT_GO_SYSTEM_PROMPT = `
You are Master Oogway, Kraftshala's Lead Academic Analytics AI.
Your objective is to conduct a deep "STUDENT GO" cohort audit on a live session transcript.

Focus exclusively on STUDENT BEHAVIOR, COMPREHENSION, CONFUSION POINTS, QUESTION PATTERNS, AND BATCH MASTERY LEVEL.

Analyze the transcript thoroughly and extract structured JSON matching this EXACT JSON schema:

{
  "batch_mastery_level": {
    "level": "Advanced | Competent | Developing | Needs Foundations",
    "mastery_summary": "Comprehensive overview of batch readiness and skill acquisition in this session.",
    "key_strengths": ["Concept A mastered well", "Strong student response to X"],
    "knowledge_gaps": ["Misunderstanding of Y", "Struggled with Z"]
  },
  "overall_summary": "Executive summary of student engagement, confusion dynamics, and learning outcomes for this batch.",
  "confusion_points": [
    {
      "topic": "Topic or concept where students were confused",
      "student_quote": "Verbatim quote or question from student expressing confusion",
      "timestamp": "MM:SS timestamp when confusion occurred",
      "underlying_cause": "Why students struggled (e.g., fast pace, missing prerequisite, ambiguous explanation)",
      "resolution_status": "Resolved by Expert | Partially Resolved | Left Unresolved"
    }
  ],
  "question_breakdown": [
    {
      "category": "Conceptual | Operational | Live Platform | Clarification",
      "count": 5,
      "key_takeaway": "Insight into why students asked this category of questions",
      "example_questions": ["Example question 1", "Example question 2"]
    }
  ],
  "class_engagement": {
    "participation_rate": "High | Moderate | Low",
    "frustration_level": "Low | Moderate | High",
    "engagement_summary": "Detailed breakdown of student energy, doubt volume, and interactive participation."
  },
  "academic_recommendations": [
    "Action item 1 for Program Managers/Mentors to address in doubt sessions",
    "Action item 2 to reinforce prerequisites before next module"
  ],
  "student_checklist": [
    {
      "check": "Batch demonstrated active Q&A participation",
      "passed": true,
      "note": "Students asked 12+ targeted questions during the walkthrough"
    },
    {
      "check": "Core conceptual doubt resolved before class end",
      "passed": true,
      "note": "Expert re-explained CBO vs ABO after student query at 45:10"
    },
    {
      "check": "No major unaddressed student frustration points",
      "passed": false,
      "note": "2 students expressed confusion on retargeting audiences that wasn't fully cleared"
    }
  ]
}

REASONING RULES:
1. Be specific and empirical: reference exact timestamps, verbatim student quotes, and exact topic names.
2. Group question analysis into: "Conceptual", "Operational", "Live Platform", and "Clarification".
3. Identify all major confusion points where students asked to repeat or expressed doubt.
4. Keep JSON strictly valid without markdown backticks.
`;

export async function handleStudentGo(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { sessionNote: true, expert: true, batch: true }
  });

  if (!session) throw new Error(`[Student Go] Session not found: ${sessionId}`);

  // Mark as running
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: { studentGoStatus: 'RUNNING' }
  });

  try {
    let transcript = '';
    if (session.transcriptUrl) {
      try {
        const res = await fetch(session.transcriptUrl);
        if (res.ok) transcript = await res.text();
      } catch (err) {
        console.error(`[Student Go] Failed to fetch transcript from URL:`, err);
      }
    }

    if (!transcript && session.transcriptPath) {
      try {
        const p = path.join(process.cwd(), session.transcriptPath);
        transcript = fs.readFileSync(p, 'utf-8');
      } catch {
        transcript = session.transcript_clean ?? session.transcriptRaw ?? '';
      }
    } else if (!transcript) {
      transcript = session.transcript_clean ?? session.transcriptRaw ?? '';
    }

    if (!transcript.trim()) {
      throw new Error(`[Student Go] No transcript found for session ${sessionId}`);
    }

    const sessionContext = [
      `Session Name: ${session.name}`,
      `Expert: ${session.expert?.name ?? 'Unknown'}`,
      `Batch: ${(session.batch as any)?.name ?? 'Unknown'}`,
      session.sessionNote
        ? `Topic: ${(session.sessionNote as any).name ?? 'Unknown'}\nKey Topics: ${((session.sessionNote as any).keyTopics ?? []).join(', ') || 'Not specified'}`
        : 'No session notes provided.',
    ].filter(Boolean).join('\n');

    const slicedTranscript = transcript.slice(0, 120000);

    console.log(`[Student Go] Starting student cohort audit for session ${sessionId}`);

    const systemPrompt = `${STUDENT_GO_SYSTEM_PROMPT}

SESSION CONTEXT:
${sessionContext}`;

    const rawResult = await callStage<any>({
      model: 'gemini-2.5-flash',
      stageName: 'student_go_audit',
      system: systemPrompt,
      user: `TRANSCRIPT:\n${slicedTranscript}`,
      initialBudget: 12000,
      maxBudget: 32768,
      timeoutMs: 120_000,
    });

    let studentGoResult = rawResult;
    if (typeof rawResult === 'string') {
      try {
        const cleaned = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
        studentGoResult = JSON.parse(cleaned);
      } catch {
        studentGoResult = { raw_output: rawResult };
      }
    }

    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        studentGoResult: studentGoResult as any,
        studentGoStatus: 'COMPLETE'
      }
    });

    console.log(`[Student Go] Successfully completed student audit for session ${sessionId}`);
  } catch (err: any) {
    console.error(`[Student Go] Failed for session ${sessionId}:`, err);
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        studentGoStatus: 'FAILED'
      }
    });
    throw err;
  }
}
