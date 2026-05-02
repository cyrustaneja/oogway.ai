/**
 * label-validator.ts
 *
 * Validates that every AI-emitted label in a chapter result is a canonical
 * rubric label from lib/config/rubrics.ts. Free-form labels (e.g. "Quite Deep")
 * are rejected here — they would cause broken rendering and invalid DB rows.
 *
 * Called by Stage 2 before writing AnalysisChapterResult. If any violations
 * are found the chapter is written with needs_review = true.
 */

import { isValidLabel } from '@/lib/config/rubrics'

export type LabelValidationResult = {
  valid: boolean
  violations: string[]
}

export function validateChapterLabels(c: any): LabelValidationResult {
  const v: string[] = []

  const chk = (val: string | undefined, rubric: string, ctx?: string) => {
    if (val === undefined || val === null || val === '') return
    if (!isValidLabel(rubric, val)) {
      v.push(`${ctx ?? rubric}: "${val}" is not a valid label for rubric '${rubric}'`)
    }
  }

  // Session-level rubrics used per chapter
  chk(c?.teaching_depth?.label, 'teaching_depth')
  chk(c?.pacing?.label, 'pacing')
  chk(c?.engagement?.label, 'engagement')
  chk(c?.example_gap?.label, 'example_gap')
  chk(c?.accuracy_check?.label, 'accuracy')
  // NOTE: unresolved_doubt_flag was removed — the field isn't in the Stage 2
  // schema and the rubric key 'unresolved_doubt' doesn't exist in rubrics.ts.
  // Doubt resolution is validated per-doubt below via 'doubt_resolution'.

  // Per-analogy
  ;(c?.analogies ?? []).forEach((a: any, i: number) => {
    chk(a?.quality?.label, 'analogy_quality', `analogies[${i}].quality`)
  })

  // Per-doubt
  ;(c?.doubts ?? []).forEach((d: any, i: number) => {
    chk(d?.resolution?.label, 'doubt_resolution', `doubts[${i}].resolution`)
    chk(d?.resolution_accuracy?.label, 'resolution_accuracy', `doubts[${i}].resolution_accuracy`)
  })

  // Per-confusion-point
  ;(c?.confusion_points ?? []).forEach((p: any, i: number) => {
    chk(p?.severity?.label, 'confusion_severity', `confusion_points[${i}].severity`)
  })

  return { valid: v.length === 0, violations: v }
}

/** Convenience export matching the verification checklist's expected API */
export function isValid(rubricKey: string, label: string): boolean {
  return isValidLabel(rubricKey, label)
}
