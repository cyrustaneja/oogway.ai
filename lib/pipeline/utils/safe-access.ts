/**
 * safe-access.ts — Null-safety wrappers for AI output.
 *
 * The dashboard must NEVER crash due to a missing field in the AI output.
 * Every accessor in the UI should pass data through these wrappers.
 * Defaults are chosen to be "least alarming" — they show blanks rather
 * than triggering red alerts for missing data.
 */

export function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : []
}

export function safeString(v: any, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export function safeNumber(v: any, fallback = 0): number {
  return typeof v === 'number' && !isNaN(v) ? v : fallback
}

export function safeBoolean(v: any, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

/**
 * Wraps a score/label object. Guarantees score, label, rationale, evidence.
 * Used for rubric score cells in the dashboard.
 */
export function safeScore(
  v: any,
  defaultScore = 0,
  defaultLabel = ''
): { score: number; label: string; narrative: string; evidence: any[]; rationale: string } {
  return {
    score: safeNumber(v?.score, defaultScore),
    label: safeString(v?.label, defaultLabel),
    narrative: safeString(v?.narrative, ''),
    evidence: safeArray(v?.evidence),
    rationale: safeString(v?.rationale, ''),
  }
}

/**
 * Full session analysis null-safety wrapper.
 * Pass raw JSON from DB; receive a shape the UI can safely destructure.
 */
export function safeSessionAnalysis(raw: any): any {
  return {
    schema_version: safeString(raw?.schema_version, 'v1'),

    context_setup: safeScore(raw?.context_setup, 0, 'No Context'),

    topics_covered: safeArray(raw?.topics_covered),
    topics_missed_from_notes: safeArray(raw?.topics_missed_from_notes),
    key_learning_points: safeArray(raw?.key_learning_points),

    expert_audit: {
      pedagogical_health_summary: safeString(raw?.expert_audit?.pedagogical_health_summary),
      teaching_depth_map: safeArray(raw?.expert_audit?.teaching_depth_map),
      pacing_map: safeArray(raw?.expert_audit?.pacing_map),
      analogies_summary: safeArray(raw?.expert_audit?.analogies_summary),
      example_gaps: safeArray(raw?.expert_audit?.example_gaps),
      doubt_resolution_summary: safeArray(raw?.expert_audit?.doubt_resolution_summary),
      accuracy_issues: safeArray(raw?.expert_audit?.accuracy_issues),
      most_engaged_student: raw?.expert_audit?.most_engaged_student ?? null,
      most_engaged_topic: raw?.expert_audit?.most_engaged_topic ?? null,
    },

    student_log: {
      engagement_by_chapter: safeArray(raw?.student_log?.engagement_by_chapter),
      confusion_summary: safeArray(raw?.student_log?.confusion_summary),
      unresolved_doubts: safeArray(raw?.student_log?.unresolved_doubts),
      student_questions: safeArray(raw?.student_log?.student_questions),
      verified_outcomes: safeArray(raw?.student_log?.verified_outcomes),
    },

    session_completeness: safeScore(raw?.session_completeness, 0, 'Incomplete'),

    hygiene: {
      camera: safeScore(raw?.hygiene?.camera, 2, 'On'),
      punctuality: safeScore(raw?.hygiene?.punctuality, 1, 'On Time'),
    },
  }
}
