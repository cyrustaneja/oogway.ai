/**
 * STAGE 5 — AGGREGATION (pure computation, no LLM)
 *
 * Takes all ChapterExtractionResult rows for a session and computes
 * the structured aggregates that feed into SessionOverallAnalysis:
 *
 *   sessionCounts   — totals across the whole session
 *   sessionFlow     — chapter-by-chapter timeline for UI rendering
 *   studentProfiles — per-student aggregate across all chapters
 *   pedagogicalGaps — factual absences detected across chapters
 */

// ─── INPUT TYPES ──────────────────────────────────────────────────────────────

/** Shape of a 3A result JSON */
interface Result3A {
  chapter_index: number;
  depth_classification: string;
  depth_evidence: Array<{ type: string; concept: string; timestamp: string; verbatim_quote: string }>;
  trainer_questions: Array<{ timestamp: string; verbatim_quote: string; type: string; directed_at: string; response_received: boolean }>;
  analogies_and_examples: Array<{ timestamp: string; verbatim_quote: string; type: string; concept_explained: string }>;
  live_demo: { present: boolean; timestamp_start: string | null; timestamp_end: string | null; narration_quote: string | null };
  jargon_without_definition: Array<{ term: string; timestamp: string; verbatim_quote: string }>;
  pacing: string;
}

/** Shape of a 3B result JSON */
interface Result3B {
  chapter_index: number;
  student_interactions: Array<{
    student_name: string;
    timestamp: string;
    type: string;
    verbatim_quote: string;
    trainer_response_type: string;
    trainer_response_quote: string | null;
    resolution: string;
  }>;
  confusion_points: Array<{ student_name: string; timestamp: string; verbatim_quote: string; topic: string; resolution: string }>;
  student_callouts: Array<{ student_name: string; timestamp: string; trainer_quote: string; student_response_quote: string }>;
  unique_student_names: string[];
}

/** Shape of a 3C result JSON */
interface Result3C {
  chapter_index: number;
  topics_from_notes_covered: Array<{ topic: string; evidence_quote: string; timestamp: string }>;
  topics_from_notes_skipped: string[];
  topics_taught_not_in_notes: Array<{ topic: string; verbatim_quote: string; timestamp: string }>;
}

export interface ChapterRow {
  chapterIndex: number;
  chapterTitle: string;
  startTime: string;
  endTime: string;
  result3A: Result3A | null;
  result3B: Result3B | null;
  result3C: Result3C | null;
}

// ─── OUTPUT TYPES ──────────────────────────────────────────────────────────────

export interface SessionCounts {
  totalTrainerQuestions: number;
  totalStudentInteractions: number;
  totalConfusionPoints: number;
  totalAnalogiesAndExamples: number;
  totalJargonWithoutDefinition: number;
  totalStudentCallouts: number;
  uniqueStudentCount: number;
  chaptersWithLiveDemo: number;
  chapterDepthBreakdown: Array<{ chapterIndex: number; chapterTitle: string; depth: string }>;
  pacingBreakdown: Array<{ chapterIndex: number; chapterTitle: string; pacing: string }>;
  topicSkippedCount: number;
  topicExtraCount: number;
}

export interface ChapterFlowItem {
  chapterIndex: number;
  chapterTitle: string;
  startTime: string;
  endTime: string;
  depthClassification: string;
  pacing: string;
  trainerQuestionsCount: number;
  studentInteractionsCount: number;
  confusionCount: number;
  hasLiveDemo: boolean;
  topicsCovered: string[];
  topicsSkipped: string[];
}

export interface StudentProfile {
  studentName: string;
  totalInteractions: number;
  questionsAsked: number;
  confusionSignals: number;
  correctAnswers: number;
  calloutCount: number;
  resolvedDoubts: number;
  unresolvedDoubts: number;
  chaptersActive: number[];
}

export interface PedagogicalGap {
  gapType: "skipped_topic" | "no_examples" | "no_trainer_questions" | "low_depth" | "no_callouts";
  chapterIndex: number;
  chapterTitle: string;
  factualStatement: string;
  curriculumReference: string | null;
}

export interface AggregationResult {
  sessionCounts: SessionCounts;
  sessionFlow: ChapterFlowItem[];
  studentProfiles: StudentProfile[];
  pedagogicalGaps: PedagogicalGap[];
}

// ─── AGGREGATION LOGIC ────────────────────────────────────────────────────────

function safeArr<T>(val: T[] | null | undefined): T[] {
  return Array.isArray(val) ? val : [];
}

function collectUniqueStudents(rows: ChapterRow[]): string[] {
  const names = new Set<string>();
  for (const row of rows) {
    for (const name of safeArr(row.result3B?.unique_student_names)) {
      if (name && name !== "unidentified") names.add(name.trim());
    }
  }
  return Array.from(names);
}

export function aggregateResults(chapters: ChapterRow[]): AggregationResult {
  const sorted = [...chapters].sort((a, b) => a.chapterIndex - b.chapterIndex);

  // ── sessionCounts ────────────────────────────────────────────────────────
  let totalTrainerQuestions = 0;
  let totalStudentInteractions = 0;
  let totalConfusionPoints = 0;
  let totalAnalogies = 0;
  let totalJargon = 0;
  let totalCallouts = 0;
  let chaptersWithLiveDemo = 0;
  let topicSkippedCount = 0;
  let topicExtraCount = 0;
  const chapterDepthBreakdown: SessionCounts["chapterDepthBreakdown"] = [];
  const pacingBreakdown: SessionCounts["pacingBreakdown"] = [];

  // ── sessionFlow ────────────────────────────────────────────────────────
  const sessionFlow: ChapterFlowItem[] = [];

  // ── studentMap ─────────────────────────────────────────────────────────
  const studentMap = new Map<string, StudentProfile>();

  for (const row of sorted) {
    const a = row.result3A;
    const b = row.result3B;
    const c = row.result3C;

    const tq = safeArr(a?.trainer_questions).length;
    const si = safeArr(b?.student_interactions).length;
    const cp = safeArr(b?.confusion_points).length;
    const ae = safeArr(a?.analogies_and_examples).length;
    const jw = safeArr(a?.jargon_without_definition).length;
    const co = safeArr(b?.student_callouts).length;
    const hasDemo = a?.live_demo?.present ?? false;
    const ts = safeArr(c?.topics_from_notes_skipped).length;
    const te = safeArr(c?.topics_taught_not_in_notes).length;

    totalTrainerQuestions     += tq;
    totalStudentInteractions  += si;
    totalConfusionPoints      += cp;
    totalAnalogies            += ae;
    totalJargon               += jw;
    totalCallouts             += co;
    if (hasDemo) chaptersWithLiveDemo++;
    topicSkippedCount += ts;
    topicExtraCount   += te;

    chapterDepthBreakdown.push({ chapterIndex: row.chapterIndex, chapterTitle: row.chapterTitle, depth: a?.depth_classification ?? "unknown" });
    pacingBreakdown.push({ chapterIndex: row.chapterIndex, chapterTitle: row.chapterTitle, pacing: a?.pacing ?? "unknown" });

    sessionFlow.push({
      chapterIndex: row.chapterIndex,
      chapterTitle: row.chapterTitle,
      startTime: row.startTime,
      endTime: row.endTime,
      depthClassification: a?.depth_classification ?? "unknown",
      pacing: a?.pacing ?? "unknown",
      trainerQuestionsCount: tq,
      studentInteractionsCount: si,
      confusionCount: cp,
      hasLiveDemo: hasDemo,
      topicsCovered: safeArr(c?.topics_from_notes_covered).map((t) => t.topic),
      topicsSkipped: safeArr(c?.topics_from_notes_skipped),
    });

    // Build student profiles
    for (const interaction of safeArr(b?.student_interactions)) {
      const name = interaction.student_name?.trim();
      if (!name || name === "unidentified") continue;
      if (!studentMap.has(name)) {
        studentMap.set(name, {
          studentName: name,
          totalInteractions: 0,
          questionsAsked: 0,
          confusionSignals: 0,
          correctAnswers: 0,
          calloutCount: 0,
          resolvedDoubts: 0,
          unresolvedDoubts: 0,
          chaptersActive: [],
        });
      }
      const profile = studentMap.get(name)!;
      profile.totalInteractions++;
      if (interaction.type === "question" || interaction.type === "clarification_request") profile.questionsAsked++;
      if (interaction.type === "confusion_signal") profile.confusionSignals++;
      if (interaction.type === "correct_answer") profile.correctAnswers++;
      if (interaction.resolution === "resolved") profile.resolvedDoubts++;
      if (interaction.resolution === "unresolved") profile.unresolvedDoubts++;
      if (!profile.chaptersActive.includes(row.chapterIndex)) profile.chaptersActive.push(row.chapterIndex);
    }

    for (const callout of safeArr(b?.student_callouts)) {
      const name = callout.student_name?.trim();
      if (!name || name === "unidentified") continue;
      if (!studentMap.has(name)) {
        studentMap.set(name, {
          studentName: name,
          totalInteractions: 0,
          questionsAsked: 0,
          confusionSignals: 0,
          correctAnswers: 0,
          calloutCount: 0,
          resolvedDoubts: 0,
          unresolvedDoubts: 0,
          chaptersActive: [],
        });
      }
      studentMap.get(name)!.calloutCount++;
    }
  }

  const uniqueStudents = collectUniqueStudents(sorted);

  // ── pedagogicalGaps ───────────────────────────────────────────────────
  const gaps: PedagogicalGap[] = [];

  for (const row of sorted) {
    const a = row.result3A;
    const b = row.result3B;
    const c = row.result3C;

    // No examples or analogies in this chapter
    if (safeArr(a?.analogies_and_examples).length === 0) {
      gaps.push({
        gapType: "no_examples",
        chapterIndex: row.chapterIndex,
        chapterTitle: row.chapterTitle,
        factualStatement: `analogies_and_examples_count: 0 in chapter ${row.chapterIndex}.`,
        curriculumReference: null,
      });
    }

    // No trainer questions
    if (safeArr(a?.trainer_questions).length === 0) {
      gaps.push({
        gapType: "no_trainer_questions",
        chapterIndex: row.chapterIndex,
        chapterTitle: row.chapterTitle,
        factualStatement: `trainer_questions_count: 0 in chapter ${row.chapterIndex}.`,
        curriculumReference: null,
      });
    }

    // Low depth
    const lowDepthValues = ["surface_only", "definitions_only"];
    if (a?.depth_classification && lowDepthValues.includes(a.depth_classification)) {
      gaps.push({
        gapType: "low_depth",
        chapterIndex: row.chapterIndex,
        chapterTitle: row.chapterTitle,
        factualStatement: `depth_classification: "${a.depth_classification}" in chapter ${row.chapterIndex}.`,
        curriculumReference: null,
      });
    }

    // Skipped curriculum topics
    for (const topic of safeArr(c?.topics_from_notes_skipped)) {
      gaps.push({
        gapType: "skipped_topic",
        chapterIndex: row.chapterIndex,
        chapterTitle: row.chapterTitle,
        factualStatement: `Topic listed in session notes not found in chapter transcript: "${topic}".`,
        curriculumReference: topic,
      });
    }

    // No student callouts
    if (safeArr(b?.student_callouts).length === 0) {
      gaps.push({
        gapType: "no_callouts",
        chapterIndex: row.chapterIndex,
        chapterTitle: row.chapterTitle,
        factualStatement: `student_callouts_count: 0 in chapter ${row.chapterIndex}.`,
        curriculumReference: null,
      });
    }
  }

  return {
    sessionCounts: {
      totalTrainerQuestions,
      totalStudentInteractions,
      totalConfusionPoints,
      totalAnalogiesAndExamples: totalAnalogies,
      totalJargonWithoutDefinition: totalJargon,
      totalStudentCallouts: totalCallouts,
      uniqueStudentCount: uniqueStudents.length,
      chaptersWithLiveDemo,
      chapterDepthBreakdown,
      pacingBreakdown,
      topicSkippedCount,
      topicExtraCount,
    },
    sessionFlow,
    studentProfiles: Array.from(studentMap.values()).sort((a, b) => b.totalInteractions - a.totalInteractions),
    pedagogicalGaps: gaps,
  };
}
