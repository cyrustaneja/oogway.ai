import { z } from 'zod'

const ScoreSchema = z.object({
  score: z.number(),
  label: z.string(),
  rationale: z.string(),
  evidence: z.array(z.object({
    timestamp: z.string(),
    verbatim_quote: z.string(),
  }))
})

const AnalogySchema = z.object({
  concept_explained: z.string(),
  quality: z.object({
    score: z.number(),
    label: z.string(),
    rationale: z.string(),
  }),
  timestamp: z.string(),
  verbatim_quote: z.string(),
  what_it_explains: z.string(),
})

const DoubtSchema = z.object({
  student_name_raw: z.string(),
  doubt_verbatim: z.string(),
  timestamp: z.string(),
  resolution: z.object({
    score: z.number(),
    label: z.string(),
    rationale: z.string(),
  }),
  resolved_flag: z.boolean(),
  resolution_verbatim: z.string().nullable(),
  resolution_accuracy: z.object({
    score: z.number(),
    label: z.string(),
    concern: z.string().nullable(),
  }),
})

const ConfusionPointSchema = z.object({
  chapter: z.number(),
  topic: z.string(),
  severity_label: z.enum(['None', 'Isolated', 'Localized', 'Widespread']),
  why: z.string(),
})

export const SessionAnalysisSchema = z.object({
  session_id: z.string(),
  schema_version: z.string(),
  context_setup: ScoreSchema.extend({
    label: z.enum(['No Context', 'Partial Context', 'Full Context']),
    narrative: z.string(),
  }).omit({ rationale: true }),
  topics_covered: z.array(z.string()),
  topics_missed_from_notes: z.array(z.string()),
  key_learning_points: z.array(z.string()),
  expert_audit: z.object({
    pedagogical_health_summary: z.string(),
    teaching_depth_map: z.array(z.object({
      chapter: z.number(),
      topic: z.string(),
      depth_label: z.enum(['Definitional', 'Explained', 'Deep']),
      depth_score: z.number(),
    })),
    pacing_map: z.array(z.object({
      chapter: z.number(),
      topic: z.string(),
      pacing_label: z.enum(['Rushed', 'Balanced', 'Overdwelled']),
      duration_mins: z.number(),
    })),
    analogies_summary: z.array(z.object({
      concept: z.string(),
      quality_label: z.enum(['Weak', 'Partial', 'Strong']),
      verbatim_quote: z.string(),
      chapter: z.number(),
      rationale: z.string(),
      flagged: z.boolean(),
      timestamp: z.string().optional(),
    })),
    example_gaps: z.array(z.object({
      chapter: z.number(),
      topic: z.string(),
      gap_label: z.enum(['No Gap', 'Minor Gap', 'Notable Gap', 'Major Gap']),
    })),
    doubt_resolution_summary: z.array(z.object({
      chapter: z.number(),
      doubt: z.string(),
      student: z.string(),
      resolution_label: z.enum(['Ignored', 'Answered', 'Answered+Anchored', 'Reframed']),
      resolved: z.boolean(),
      resolution_accuracy: z.enum(['Correct', 'Needs Review', 'Incorrect Resolution']),
      rationale: z.string(),
    })),
    accuracy_issues: z.array(z.object({
      chapter: z.number(),
      topic: z.string(),
      accuracy_label: z.enum(['Accurate', 'Possibly Incorrect', 'Incorrect']),
      flagged_statement: z.string(),
      verbatim_quote: z.string(),
      concern: z.string(),
      timestamp: z.string(),
    })),
    most_engaged_students: z.array(z.object({
      name: z.string(),
      why: z.string(),
      evidence_count: z.number(),
    })).optional().default([]),
    most_engaged_student: z.object({
      name: z.string(),
      why: z.string(),
      evidence_count: z.number(),
    }).nullable().optional(),
    most_engaged_topic: z.object({
      topic: z.string(),
      why: z.string(),
      chapter: z.number(),
    }).nullable(),
  }),
  student_log: z.object({
    engagement_by_chapter: z.array(z.object({
      chapter: z.number(),
      label: z.enum(['Silent', 'Responsive', 'Active']),
      score: z.number(),
    })),
    confusion_summary: z.array(ConfusionPointSchema),
    unresolved_doubts: z.array(z.object({
      chapter: z.number(),
      student: z.string(),
      doubt: z.string(),
      timestamp: z.string(),
    })),
    student_questions: z.array(z.object({
      student: z.string(),
      question: z.string(),
      timestamp: z.string(),
      chapter: z.number(),
      type: z.enum(['asked', 'answered', 'other']),
    })),
    verified_outcomes: z.array(z.string()),
  }),
  session_completeness: ScoreSchema.extend({
    label: z.enum(['Incomplete', 'Partial', 'Complete', 'Complete+Deep'])
  }),
  hygiene: z.object({
    camera: z.object({ score: z.number(), label: z.enum(['Off', 'Partial', 'On']) }),
    punctuality: z.object({ score: z.number(), label: z.enum(['Delayed', 'On Time']) }),
  }),
  // session_flags is optional in full_synthesis — Stage 4 writes them to a
  // separate DB column (AnalysisV2.session_flags), not into full_synthesis.
  session_flags: z.object({
    flags: z.array(z.object({
      category: z.string(),
      severity: z.string(),
      rationale: z.string(),
    })),
    total_flags: z.number(),
    high_count: z.number(),
    medium_count: z.number(),
    low_count: z.number(),
  }).optional(),
})
