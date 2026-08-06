import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { callStage } from '@/lib/pipeline/utils/call-stage';
import { EVALUATION_SYSTEM_PROMPT, buildEvaluationUserPrompt } from '@/lib/pipeline/prompts/evaluation-prompts';
import { evaluationResponseSchema } from '@/lib/pipeline/schemas/evaluation.schema';
import { fetchAndParseSheet, ParsedStudentEvaluation } from '@/lib/server/evaluation-sheet-parser';
import { LIMITS } from '@/lib/config/limits';

export async function handleEvaluation(sessionId: string): Promise<void> {
  console.log(`[Evaluation] Starting automated multi-student mark audit for session ${sessionId}`);

  // ── 1. Load session + evaluation config ──────────────────────────────────
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: {
      expert: true,
      batch: true,
      sessionNote: true,
      evaluationConfig: true,
    },
  });

  if (!session) throw new Error(`[Evaluation] Session not found: ${sessionId}`);

  if (!session.evaluationConfig) {
    throw new Error(
      `[Evaluation] No EvaluationConfig linked to session ${sessionId} (evaluationTypeId: ${session.evaluationTypeId})`
    );
  }

  const config = session.evaluationConfig;
  const rubric = (config.rubric as any[]) ?? [];
  const batchName = (session.batch as any)?.name ?? 'General Cohort';

  // ── 2. Fetch transcript ───────────────────────────────────────────────────
  let transcript = '';
  if (session.transcriptUrl) {
    try {
      const res = await fetch(session.transcriptUrl);
      if (res.ok) transcript = await res.text();
    } catch (err) {
      console.error('[Evaluation] Failed to fetch transcript from URL:', err);
    }
  }

  if (!transcript && session.transcriptPath) {
    try {
      const p = path.isAbsolute(session.transcriptPath)
        ? session.transcriptPath
        : path.resolve(process.cwd(), session.transcriptPath);
      if (fs.existsSync(p)) {
        transcript = fs.readFileSync(p, 'utf-8');
      } else {
        transcript = session.transcript_clean ?? session.transcriptRaw ?? '';
      }
    } catch {
      transcript = session.transcript_clean ?? session.transcriptRaw ?? '';
    }
  } else if (!transcript) {
    transcript = session.transcript_clean ?? session.transcriptRaw ?? '';
  }

  if (!transcript.trim()) {
    throw new Error(`[Evaluation] No transcript found for session ${sessionId}`);
  }

  // ── 3. Fetch & parse evaluation sheet ────────────────────────────────────
  let parsedStudents: ParsedStudentEvaluation[] = [];

  if (!config.sheetUrl) {
    throw new Error(
      `[Evaluation] Google Sheet CSV Export link is MANDATORY for evaluation audit. Please update the evaluation criteria for module "${config.moduleId}" with a valid Google Sheet URL.`
    );
  }

  try {
    console.log(`[Evaluation] Fetching mandatory evaluation sheet from ${config.sheetUrl}`);
    parsedStudents = await fetchAndParseSheet(config.sheetUrl);
    console.log(`[Evaluation] Sheet parsed successfully: ${parsedStudents.length} student records loaded`);
  } catch (err: any) {
    console.error('[Evaluation] Sheet fetch/parse error:', err);
    throw new Error(`[Evaluation] Failed to load mandatory evaluation sheet from ${config.sheetUrl}: ${err.message}`);
  }

  // ── 4. Smart match & deduplicate student records in transcript ───────────
  const transcriptLower = transcript.toLowerCase();
  const seen = new Set<string>();
  const uniqueStudents: ParsedStudentEvaluation[] = [];

  for (const s of parsedStudents) {
    const norm = s.studentName.toLowerCase().trim();
    if (!norm || norm.includes('sample')) continue;

    const parts = norm.split(' ');
    const firstName = parts[0];

    const fullNameMatch = transcriptLower.includes(norm);
    const firstNameMatch = firstName.length > 2 && transcriptLower.includes(firstName);

    if ((fullNameMatch || firstNameMatch) && !seen.has(norm)) {
      seen.add(norm);
      uniqueStudents.push(s);
    }
  }

  const rosterToPass = uniqueStudents.length > 0 ? uniqueStudents : parsedStudents.slice(0, 20);
  console.log(`[Evaluation] Smart matched ${uniqueStudents.length} unique student records from transcript for audit`);

  const slicedTranscript = transcript.slice(0, 120_000);

  const userPrompt = buildEvaluationUserPrompt({
    batchName,
    referenceRubric: rubric,
    parsedStudents: rosterToPass,
    transcript: slicedTranscript,
  });

  console.log(`[Evaluation] Calling AI for session ${sessionId}, batch: ${batchName}`);

  const result = await callStage<any>({
    model: LIMITS.stage1Model || 'gemini-2.5-flash',
    stageName: 'evaluation_mark_audit',
    system: EVALUATION_SYSTEM_PROMPT,
    user: userPrompt,
    responseSchema: evaluationResponseSchema,
    initialBudget: 12000,
    maxBudget: 24000,
    timeoutMs: LIMITS.evaluationTimeoutMs ?? 180_000,
  });

  // ── 5. Save result ────────────────────────────────────────────────────────
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      evaluationResult: result as any,
      v3Status: 'COMPLETE',
      pipeline_stage: 'COMPLETE',
      updatedAt: new Date(),
    },
  });

  console.log(`[Evaluation] Multi-student mark audit complete for session ${sessionId}`);
}

export { handleEvaluation as default };
