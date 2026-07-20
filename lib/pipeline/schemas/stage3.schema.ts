import { SchemaType } from '@google/generative-ai'

/**
 * Stage 3 response schema — session-level synthesis.
 * Mirrors the 'SessionAnalysis' type in lib/types/analysis.ts
 */

const scoreSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.INTEGER },
    label: { type: SchemaType.STRING },
    rationale: { type: SchemaType.STRING },
    evidence: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          timestamp: { type: SchemaType.STRING },
          verbatim_quote: { type: SchemaType.STRING },
        },
        required: ['timestamp', 'verbatim_quote'],
      }
    }
  },
  required: ['score', 'label', 'rationale', 'evidence'],
}

export const stage3ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    session_id: { type: SchemaType.STRING },
    schema_version: { type: SchemaType.STRING },
    context_setup: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
        narrative: { type: SchemaType.STRING },
        evidence: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              timestamp: { type: SchemaType.STRING },
              verbatim_quote: { type: SchemaType.STRING },
            },
            required: ['timestamp', 'verbatim_quote'],
          }
        }
      },
      required: ['score', 'label', 'narrative', 'evidence'],
    },
    topics_covered: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    topics_missed_from_notes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    key_learning_points: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    expert_audit: {
      type: SchemaType.OBJECT,
      properties: {
        pedagogical_health_summary: { type: SchemaType.STRING },
        teaching_depth_map: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              topic: { type: SchemaType.STRING },
              depth_label: { type: SchemaType.STRING },
              depth_score: { type: SchemaType.INTEGER },
            },
            required: ['chapter', 'topic', 'depth_label', 'depth_score'],
          }
        },
        pacing_map: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              topic: { type: SchemaType.STRING },
              pacing_label: { type: SchemaType.STRING },
              duration_mins: { type: SchemaType.NUMBER },
            },
            required: ['chapter', 'topic', 'pacing_label', 'duration_mins'],
          }
        },
        analogies_summary: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              concept: { type: SchemaType.STRING },
              quality_label: { type: SchemaType.STRING },
              verbatim_quote: { type: SchemaType.STRING },
              chapter: { type: SchemaType.INTEGER },
              rationale: { type: SchemaType.STRING },
              flagged: { type: SchemaType.BOOLEAN },
              timestamp: { type: SchemaType.STRING },
            },
            required: ['concept', 'quality_label', 'verbatim_quote', 'chapter', 'rationale', 'flagged', 'timestamp'],
          }
        },
        example_gaps: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              topic: { type: SchemaType.STRING },
              gap_label: { type: SchemaType.STRING },
            },
            required: ['chapter', 'topic', 'gap_label'],
          }
        },
        doubt_resolution_summary: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              doubt: { type: SchemaType.STRING },
              student: { type: SchemaType.STRING },
              resolution_label: { type: SchemaType.STRING },
              resolved: { type: SchemaType.BOOLEAN },
              resolution_accuracy: { type: SchemaType.STRING },
              rationale: { type: SchemaType.STRING },
            },
            required: ['chapter', 'doubt', 'student', 'resolution_label', 'resolved', 'resolution_accuracy', 'rationale'],
          }
        },
        accuracy_issues: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              topic: { type: SchemaType.STRING },
              accuracy_label: { type: SchemaType.STRING },
              flagged_statement: { type: SchemaType.STRING },
              verbatim_quote: { type: SchemaType.STRING },
              concern: { type: SchemaType.STRING },
              timestamp: { type: SchemaType.STRING },
            },
            required: ['chapter', 'topic', 'accuracy_label', 'flagged_statement', 'verbatim_quote', 'concern', 'timestamp'],
          }
        },
        most_engaged_students: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              why: { type: SchemaType.STRING },
              evidence_count: { type: SchemaType.INTEGER },
            },
            required: ['name', 'why', 'evidence_count'],
          },
        },
        most_engaged_topic: {
          type: SchemaType.OBJECT,
          nullable: true,
          properties: {
            topic: { type: SchemaType.STRING },
            why: { type: SchemaType.STRING },
            chapter: { type: SchemaType.INTEGER },
          },
          required: ['topic', 'why', 'chapter'],
        },
      },
      required: [
        'pedagogical_health_summary', 'teaching_depth_map', 'pacing_map',
        'analogies_summary', 'example_gaps', 'doubt_resolution_summary',
        'accuracy_issues',
      ],
    },
    student_log: {
      type: SchemaType.OBJECT,
      properties: {
        engagement_by_chapter: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              label: { type: SchemaType.STRING },
              score: { type: SchemaType.INTEGER },
            },
            required: ['chapter', 'label', 'score'],
          }
        },
        confusion_summary: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              topic: { type: SchemaType.STRING },
              severity_label: { type: SchemaType.STRING },
              why: { type: SchemaType.STRING },
            },
            required: ['chapter', 'topic', 'severity_label', 'why'],
          }
        },
        unresolved_doubts: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              chapter: { type: SchemaType.INTEGER },
              student: { type: SchemaType.STRING },
              doubt: { type: SchemaType.STRING },
              timestamp: { type: SchemaType.STRING },
            },
            required: ['chapter', 'student', 'doubt', 'timestamp'],
          }
        },
        student_questions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              student: { type: SchemaType.STRING },
              question: { type: SchemaType.STRING },
              timestamp: { type: SchemaType.STRING },
              chapter: { type: SchemaType.INTEGER },
              type: { type: SchemaType.STRING }, // 'asked' | 'answered' | 'other'
            },
            required: ['student', 'question', 'timestamp', 'chapter', 'type'],
          }
        },
        verified_outcomes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: [
        'engagement_by_chapter', 'confusion_summary', 'unresolved_doubts',
        'student_questions', 'verified_outcomes',
      ],
    },
    session_completeness: scoreSchema,
    hygiene: {
      type: SchemaType.OBJECT,
      properties: {
        camera: {
          type: SchemaType.OBJECT,
          properties: {
            score: { type: SchemaType.INTEGER },
            label: { type: SchemaType.STRING },
          },
          required: ['score', 'label'],
        },
        punctuality: {
          type: SchemaType.OBJECT,
          properties: {
            score: { type: SchemaType.INTEGER },
            label: { type: SchemaType.STRING },
          },
          required: ['score', 'label'],
        },
      },
      required: ['camera', 'punctuality'],
    },
    // session_flags removed — Stage 4 generates flags independently.
    // Having Stage 3 also generate them wasted ~500 tokens per session.
  },
  required: [
    'session_id', 'schema_version', 'context_setup', 'topics_covered',
    'topics_missed_from_notes', 'key_learning_points', 'expert_audit',
    'student_log', 'session_completeness', 'hygiene',
  ],
}
