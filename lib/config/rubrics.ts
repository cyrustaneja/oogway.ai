export type RubricLevel = { 
  score: number; 
  label: string; 
  color: 'red' | 'amber' | 'green' | 'darkgreen' | 'grey'; 
  help: string 
}

export type Rubric = { 
  key: string; 
  name: string; 
  what_it_measures: string; 
  per: 'session' | 'chapter' | 'analogy' | 'doubt' | 'topic'; 
  levels: RubricLevel[] 
}

export const RUBRICS: Record<string, Rubric> = {
  teaching_depth: {
    key: 'teaching_depth', name: 'Teaching Depth', per: 'chapter',
    what_it_measures: 'Was the mechanism explained with decision context, or just defined?',
    levels: [
      { score: 0, label: 'Definitional', color: 'red', help: 'Stated what only. No mechanism, no why.' },
      { score: 1, label: 'Explained', color: 'amber', help: 'Stated what + how the mechanism works.' },
      { score: 2, label: 'Deep', color: 'green', help: 'What + how + why + connected to a real decision.' },
    ],
  },
  pacing: {
    key: 'pacing', name: 'Pacing', per: 'chapter',
    what_it_measures: 'Is time proportionate to concept complexity?',
    levels: [
      { score: -1, label: 'Rushed', color: 'red', help: '3+ sub-concepts in <5 mins, no check-in.' },
      { score: 0, label: 'Balanced', color: 'green', help: 'Time proportionate to complexity.' },
      { score: 1, label: 'Overdwelled', color: 'amber', help: 'Simple topic held beyond student need.' },
    ],
  },
  engagement: {
    key: 'engagement', name: 'Engagement', per: 'chapter',
    what_it_measures: 'Student-initiated activity only.',
    levels: [
      { score: 0, label: 'Silent', color: 'red', help: 'Zero student-initiated interaction.' },
      { score: 1, label: 'Responsive', color: 'amber', help: 'Students respond but do not initiate.' },
      { score: 2, label: 'Active', color: 'green', help: 'Students ask or share without prompts.' },
    ],
  },
  analogy_quality: {
    key: 'analogy_quality', name: 'Analogy Quality', per: 'analogy',
    what_it_measures: 'Does the analogy explain the mechanism, or just decorate?',
    levels: [
      { score: 0, label: 'Weak', color: 'red', help: 'Restatement. Does not explain mechanism.' },
      { score: 1, label: 'Partial', color: 'amber', help: 'Maps to some aspects but breaks down.' },
      { score: 2, label: 'Strong', color: 'green', help: 'Maps to core mechanic and enables a decision.' },
    ],
  },
  example_gap: {
    key: 'example_gap', name: 'Example Gap', per: 'chapter',
    what_it_measures: 'How much did absence of examples hurt understanding?',
    levels: [
      { score: 0, label: 'No Gap', color: 'green', help: 'Sufficient examples given.' },
      { score: 1, label: 'Minor Gap', color: 'amber', help: 'One more example would help.' },
      { score: 2, label: 'Notable Gap', color: 'amber', help: 'Worked example clearly missing.' },
      { score: 3, label: 'Major Gap', color: 'red', help: 'Zero examples, confusion resulted.' },
    ],
  },
  doubt_resolution: {
    key: 'doubt_resolution', name: 'Doubt Resolution', per: 'doubt',
    what_it_measures: 'How was each student doubt handled?',
    levels: [
      { score: 0, label: 'Ignored', color: 'red', help: 'Doubt raised, expert moved on.' },
      { score: 1, label: 'Answered', color: 'grey', help: 'Direct answer, no example.' },
      { score: 2, label: 'Answered+Anchored', color: 'green', help: 'Answer + concrete example or counter-question.' },
      { score: 3, label: 'Reframed', color: 'darkgreen', help: 'Addressed doubt and corrected misconception.' },
    ],
  },
  confusion_severity: {
    key: 'confusion_severity', name: 'Confusion Severity', per: 'topic',
    what_it_measures: 'How widespread was confusion on this topic?',
    levels: [
      { score: 0, label: 'None', color: 'green', help: 'No confusion signals.' },
      { score: 1, label: 'Isolated', color: 'amber', help: 'One student, resolved.' },
      { score: 2, label: 'Localized', color: 'amber', help: '2-3 students or recurred once.' },
      { score: 3, label: 'Widespread', color: 'red', help: 'Many students or unresolved across chapters.' },
    ],
  },
  accuracy: {
    key: 'accuracy', name: 'Conceptual Accuracy', per: 'chapter',
    what_it_measures: 'Did the expert state anything factually incorrect?',
    levels: [
      { score: 0, label: 'Accurate', color: 'green', help: 'No factual errors detected.' },
      { score: 1, label: 'Possibly Incorrect', color: 'amber', help: 'Ambiguous. Needs human review.' },
      { score: 2, label: 'Incorrect', color: 'red', help: 'Explicitly wrong statement.' },
    ],
  },
  resolution_accuracy: {
    key: 'resolution_accuracy', name: 'Resolution Accuracy', per: 'doubt',
    what_it_measures: 'Was the resolution to a doubt factually correct?',
    levels: [
      { score: 0, label: 'Correct', color: 'green', help: 'Resolution matches platform behavior.' },
      { score: 1, label: 'Needs Review', color: 'amber', help: 'Ambiguous or partially correct.' },
      { score: 2, label: 'Incorrect Resolution', color: 'red', help: 'Expert\'s answer is factually wrong.' },
    ],
  },
  context_setup: {
    key: 'context_setup', name: 'Context Setup', per: 'session',
    what_it_measures: 'How did the expert open the session?',
    levels: [
      { score: 0, label: 'No Context', color: 'red', help: 'Started directly with content.' },
      { score: 1, label: 'Partial Context', color: 'amber', help: 'Topic named but agenda missing.' },
      { score: 2, label: 'Full Context', color: 'green', help: 'Topic + why + agenda + curriculum link.' },
    ],
  },
  session_completeness: {
    key: 'session_completeness', name: 'Session Completeness', per: 'session',
    what_it_measures: 'Were planned topics covered?',
    levels: [
      { score: 0, label: 'Incomplete', color: 'red', help: 'More than 2 planned topics absent.' },
      { score: 1, label: 'Partial', color: 'amber', help: '1-2 topics skipped or rushed.' },
      { score: 2, label: 'Complete', color: 'green', help: 'All planned topics covered.' },
      { score: 3, label: 'Complete+Deep', color: 'darkgreen', help: 'All covered + examples + doubts resolved.' },
    ],
  },
  camera: {
    key: 'camera', name: 'Camera', per: 'session',
    what_it_measures: 'Was the camera on?',
    levels: [
      { score: 0, label: 'Off', color: 'red', help: 'Camera off entire session.' },
      { score: 1, label: 'Partial', color: 'amber', help: 'Off for >10 mins.' },
      { score: 2, label: 'On', color: 'green', help: 'On throughout (default).' },
    ],
  },
  punctuality: {
    key: 'punctuality', name: 'Punctuality', per: 'session',
    what_it_measures: 'Did the session start on time?',
    levels: [
      { score: 0, label: 'Delayed', color: 'red', help: '>5 mins after scheduled.' },
      { score: 1, label: 'On Time', color: 'green', help: 'Started within 5 mins.' },
    ],
  },
}

export function getRubric(key: string): Rubric { return RUBRICS[key] }
export function isValidLabel(rubricKey: string, label: string): boolean {
  const r = RUBRICS[rubricKey]; if (!r) return false
  return r.levels.some(l => l.label === label)
}
export function getLevel(rubricKey: string, label: string): RubricLevel | null {
  const r = RUBRICS[rubricKey]; if (!r) return null
  return r.levels.find(l => l.label === label) ?? null
}
