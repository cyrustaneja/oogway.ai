import { prisma } from '@/lib/db';
import { callStage } from '@/lib/pipeline/utils/call-stage';
import path from 'path';
import fs from 'fs';

export interface ProactiveSessionIntelligence {
  sheetBrief: {
    expertBrief: string | null;
    prerequisites: string | null;
    linkContent: string | null;
    linkCharter: string | null;
    linkModelSolution: string | null;
    linkTest: string | null;
    linkEvalParams: string | null;
  };
  historicalSessionCount: number;
  majorStudentDifficultyTopics: Array<{
    topic: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    historical_context: string;
  }>;
  bestAnalogiesToUse: Array<{
    concept: string;
    analogy: string;
    why_it_works: string;
  }>;
}

export interface ProactiveBatchIntelligence {
  batchName: string;
  courseName: string;
  historicalSessionCount: number;
  completedModulesList: string[];
  currentModuleName: string | null;
  completedSessionsCount: number;
  totalSessionsInCurrentModule: number;
  mostRecentSession: string | null;
  engagementBottlenecks: Array<{
    issue: string;
    impact: string;
  }>;
  engagementDrivers: Array<{
    driver: string;
    recommendation: string;
  }>;
  topEngagedStudents: string[];
}

function getPromptText(filename: string): string {
  const filePath = path.join(process.cwd(), 'lib/pipeline/prompts', filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

/**
 * FAST PROACTIVE SESSION INTELLIGENCE (< 2-3s target, max 5 past deliveries)
 */
export async function getProactiveSessionIntelligence(sessionNoteId: string): Promise<ProactiveSessionIntelligence> {
  const sessionNote = await prisma.sessionNote.findUnique({
    where: { id: sessionNoteId },
    include: { module: { include: { course: true } } },
  });

  const sheetBrief = {
    expertBrief: sessionNote?.expertBrief ?? null,
    prerequisites: sessionNote?.prerequisites ?? null,
    linkContent: sessionNote?.linkContent ?? null,
    linkCharter: sessionNote?.linkCharter ?? null,
    linkModelSolution: sessionNote?.linkModelSolution ?? null,
    linkTest: sessionNote?.linkTest ?? null,
    linkEvalParams: sessionNote?.linkEvalParams ?? null,
  };

  if (!sessionNote) {
    return {
      sheetBrief,
      historicalSessionCount: 0,
      majorStudentDifficultyTopics: [],
      bestAnalogiesToUse: [],
    };
  }

  // Find up to 5 past completed sessions
  const pastSessions = await prisma.analysisSession.findMany({
    where: {
      OR: [
        { sessionNoteId: sessionNote.id },
        { batch: { courseId: sessionNote.module.courseId } },
        { name: { contains: sessionNote.name, mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      tier1Result: true,
      v2Analysis: true,
    },
  });

  const count = Math.min(5, pastSessions.length > 0 ? pastSessions.length : 1);

  const compactPayloads = pastSessions.map((s: any) => {
    const t1 = (s.tier1Result as any) ?? {};
    const v2 = s.v2Analysis ?? {};
    return {
      name: s.name,
      questions: (t1.student_questions ?? []).slice(0, 2),
      analogies: (t1.analogies_summary ?? []).slice(0, 2),
      doubts: (v2.unresolved_doubts ?? []).slice(0, 2),
    };
  });

  try {
    const promptText = getPromptText('proactive-session-prep.txt');

    const result = await callStage({
      model: 'gemini-2.5-flash',
      system: promptText,
      user: JSON.stringify({
        topic: sessionNote.name,
        module: sessionNote.module.name,
        notes: (sessionNote.content ?? '').slice(0, 300),
        brief: (sessionNote.expertBrief ?? '').slice(0, 200),
        past_delivery_logs: compactPayloads,
      }),
      initialBudget: 400,
      maxBudget: 800,
      timeoutMs: 3500,
      stageName: 'proactive-session-prep-fast',
    });

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;

    return {
      sheetBrief,
      historicalSessionCount: count,
      majorStudentDifficultyTopics: (parsed.major_student_difficulty_topics ?? []).slice(0, 3),
      bestAnalogiesToUse: (parsed.best_analogies_to_use ?? []).slice(0, 3),
    };
  } catch (err) {
    console.warn('[ProactivePrep] Session AI fallback:', err);
    return {
      sheetBrief,
      historicalSessionCount: count,
      majorStudentDifficultyTopics: [
        {
          topic: `${sessionNote.name} Core Application`,
          severity: 'HIGH',
          historical_context: 'Students require step-by-step guidance on practical application. Review the Acad Expert Brief before class.',
        },
      ],
      bestAnalogiesToUse: [],
    };
  }
}

/**
 * DETERMINISTIC 0ms SEQUENCE-BASED COHORT PROGRESS
 * Deduplicates module names and filters strictly completed modules prior to current target
 */
export async function getProactiveBatchIntelligence(
  batchId: string,
  targetSessionNoteId?: string
): Promise<ProactiveBatchIntelligence | null> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      course: true,
      sessions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          tier1Result: true,
        },
      },
    },
  });

  if (!batch) return null;

  const courseId = batch.courseId ?? undefined;
  const courseName = batch.course?.name ?? 'General Curriculum';

  // Fetch all modules in exact course sequence
  const courseModules = await prisma.module.findMany({
    where: { courseId, deletedAt: null },
    orderBy: { order: 'asc' },
    include: {
      sessions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  let targetSessionNote: any = null;
  if (targetSessionNoteId) {
    targetSessionNote = await prisma.sessionNote.findUnique({
      where: { id: targetSessionNoteId },
      include: { module: true },
    });
  }

  let currentModule: any = null;
  let rawCompletedModules: any[] = [];
  let completedSessionsInCurrentModule: any[] = [];
  let mostRecentSessionName: string | null = null;

  const targetModId = targetSessionNote?.moduleId;

  if (targetModId && courseModules.length > 0) {
    const targetModIndex = courseModules.findIndex(m => m.id === targetModId);
    if (targetModIndex >= 0) {
      rawCompletedModules = courseModules.slice(0, targetModIndex);
      currentModule = courseModules[targetModIndex];

      const modSessions = currentModule.sessions;
      const targetSessionIndex = modSessions.findIndex((s: any) => s.id === targetSessionNoteId);

      if (targetSessionIndex > 0) {
        completedSessionsInCurrentModule = modSessions.slice(0, targetSessionIndex);
        mostRecentSessionName = modSessions[targetSessionIndex - 1].name;
      } else if (targetSessionIndex === 0 && rawCompletedModules.length > 0) {
        const lastMod = rawCompletedModules[rawCompletedModules.length - 1];
        if (lastMod.sessions.length > 0) {
          mostRecentSessionName = lastMod.sessions[lastMod.sessions.length - 1].name;
        }
      }
    }
  }

  // Deduplicate module names & filter out internal/duplicate slots
  const BLACKLIST = new Set(['na', 'buffer', 'off', 'holiday', 'break', 'test', 'assessment', 'internal', 'junk', 'temp']);
  const seenNames = new Set<string>();
  const completedModulesList: string[] = [];

  for (const m of rawCompletedModules) {
    const rawName = (m.name ?? '').trim();
    const cleanKey = rawName.toLowerCase().replace(/\s+/g, ' ');
    if (rawName && !BLACKLIST.has(cleanKey) && !seenNames.has(cleanKey)) {
      seenNames.add(cleanKey);
      completedModulesList.push(rawName);
    }
  }

  const currentModuleName = currentModule?.name ?? null;
  const totalSessionsInCurrentModule = currentModule?.sessions?.length ?? 0;
  const completedSessionsCount = completedSessionsInCurrentModule.length;
  const count = Math.min(5, batch.sessions.length > 0 ? batch.sessions.length : 1);

  // Fast AI Call for Cohort Engagement Dynamics
  const compactBatchPayloads = batch.sessions.map((s: any) => {
    const t1 = (s.tier1Result as any) ?? {};
    return {
      name: s.name,
      questions: (t1.student_questions ?? []).slice(0, 2),
      summary: (t1.overall_student_summary?.wrong ?? '').slice(0, 100),
    };
  });

  try {
    const promptText = getPromptText('proactive-batch-prep.txt');

    const result = await callStage({
      model: 'gemini-2.5-flash',
      system: promptText,
      user: JSON.stringify({
        batch: batch.name,
        course: courseName,
        current_module: currentModuleName,
        most_recent_session: mostRecentSessionName,
        logs: compactBatchPayloads,
      }),
      initialBudget: 400,
      maxBudget: 800,
      timeoutMs: 3500,
      stageName: 'proactive-batch-prep-fast',
    });

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;

    return {
      batchName: batch.name,
      courseName,
      historicalSessionCount: count,
      completedModulesList,
      currentModuleName,
      completedSessionsCount,
      totalSessionsInCurrentModule,
      mostRecentSession: mostRecentSessionName,
      engagementBottlenecks: (parsed.engagement_bottlenecks ?? []).slice(0, 3),
      engagementDrivers: (parsed.engagement_drivers ?? []).slice(0, 3),
      topEngagedStudents: (parsed.top_engaged_students ?? []).slice(0, 5),
    };
  } catch (err) {
    console.warn('[ProactivePrep] Batch AI fallback:', err);
    return {
      batchName: batch.name,
      courseName,
      historicalSessionCount: count,
      completedModulesList,
      currentModuleName,
      completedSessionsCount,
      totalSessionsInCurrentModule,
      mostRecentSession: mostRecentSessionName,
      engagementBottlenecks: [],
      engagementDrivers: [],
      topEngagedStudents: [],
    };
  }
}
