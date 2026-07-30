import { SchemaType } from '@google/generative-ai'

/**
 * Oogway Go response schema — structured output for Gemini.
 * Matches SST skill file exactly:
 * - Tab 1: Scorecard Summary (6 dimensions + overall weighted average)
 * - Tab 2: Detailed Findings (timestamped, severity-tagged, 10-15 findings)
 * - Tab 3: Feedback Email (Warm + Direct variants, signed by Prerna)
 */
export const oogwayGoResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scorecard: {
      type: SchemaType.ARRAY,
      description: "Exactly 6 items — one per scoring dimension in order: Content Accuracy, Pedagogical Approach, Live Platform Walkthrough, Pacing and Time Management, Student Emotional Support, Delivery Fluency.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dimension: {
            type: SchemaType.STRING,
            description: "Exact dimension name: 'Content Accuracy', 'Pedagogical Approach', 'Live Platform Walkthrough', 'Pacing and Time Management', 'Student Emotional Support', or 'Delivery Fluency'"
          },
          score: {
            type: SchemaType.NUMBER,
            description: "Score from 1-10 based on the rubric benchmarks. HARD RULES: Never ≥8 if live platform walkthrough was missing. Never ≥8 if factual errors were left uncorrected."
          },
          one_line_summary: {
            type: SchemaType.STRING,
            description: "Single sentence summary of performance in this dimension"
          },
          top_strength: {
            type: SchemaType.STRING,
            description: "The single most impactful positive observation for this dimension. Empty string if none."
          },
          top_weakness: {
            type: SchemaType.STRING,
            description: "The single most impactful weakness for this dimension. Empty string if none."
          },
          severity_tag: {
            type: SchemaType.STRING,
            description: "Highest severity finding in this dimension: 'Notable', 'Moderate', 'Minor', or 'Clean'"
          }
        },
        required: ["dimension", "score", "one_line_summary", "top_strength", "top_weakness", "severity_tag"]
      }
    },
    overall_score: {
      type: SchemaType.NUMBER,
      description: "Overall weighted average score across all 6 dimensions. HARD RULE: If any Notable finding exists, this is capped at 7.0 regardless of arithmetic."
    },
    overall_verdict: {
      type: SchemaType.STRING,
      description: "One of: 'Excellent' (9-10), 'Good' (7-8), 'Needs Improvement' (5-6), 'Below Standard' (3-4), 'Critical' (1-2)"
    },
    overall_summary: {
      type: SchemaType.STRING,
      description: "2-3 sentence overall assessment of the session quality. Be direct and specific — name what went wrong and why it matters for student job-readiness."
    },
    critical_red_flags: {
      type: SchemaType.ARRAY,
      description: "Top 2-3 critical issues explaining why the session struggled. MANDATORY if overall_score < 7.0. Empty array only if score >= 7.0 and no Notable findings.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          flag: {
            type: SchemaType.STRING,
            description: "Clear, specific description of the critical issue (max 2 sentences). Never vague."
          },
          impact: {
            type: SchemaType.STRING,
            description: "How this directly impacted student job-readiness or learning outcomes"
          },
          timestamp: {
            type: SchemaType.STRING,
            description: "Primary timestamp where this was most evident (MM:SS or HH:MM:SS)"
          }
        },
        required: ["flag", "impact", "timestamp"]
      }
    },
    detailed_findings: {
      type: SchemaType.ARRAY,
      description: "All specific observations from the session. Minimum 5 findings; aim for 10-15 for a full session. Ordered by severity (Notable first, then Moderate, then Minor).",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          finding_number: {
            type: SchemaType.NUMBER,
            description: "Sequential finding number starting from 1"
          },
          timestamp: {
            type: SchemaType.STRING,
            description: "Timestamp where this occurred (MM:SS or HH:MM:SS). MANDATORY for every finding."
          },
          dimension: {
            type: SchemaType.STRING,
            description: "Which of the 6 dimensions this finding belongs to"
          },
          severity: {
            type: SchemaType.STRING,
            description: "'Notable' (directly affects student job-readiness), 'Moderate' (reduces quality but doesn't block learning), or 'Minor' (polish/consistency issue)"
          },
          what_happened: {
            type: SchemaType.STRING,
            description: "Specific, factual description of what occurred. Never vague."
          },
          why_it_matters: {
            type: SchemaType.STRING,
            description: "Why this impacts student learning or job-readiness"
          },
          recommendation: {
            type: SchemaType.STRING,
            description: "Specific, actionable suggestion to address this"
          },
          verbatim_quote: {
            type: SchemaType.STRING,
            description: "Direct quote from the transcript as evidence. MANDATORY for every finding."
          },
          is_positive: {
            type: SchemaType.BOOLEAN,
            description: "True if this is a positive observation (strength), false if it's a weakness/issue"
          }
        },
        required: ["finding_number", "timestamp", "dimension", "severity", "what_happened", "why_it_matters", "recommendation", "verbatim_quote", "is_positive"]
      }
    },
    feedback_email_warm: {
      type: SchemaType.STRING,
      description: "Variant A — Warm / Developmental tone. Collegial, appreciative of what went well, coaching-forward. Structure: what worked → specific gap(s) → why it matters for students → clear ask for next session. 200-300 words. Must reference session name and batch. Must name specific gaps (never vague). Must include clear actionable ask. NEVER mention numerical scores. Signed: Prerna"
    },
    feedback_email_direct: {
      type: SchemaType.STRING,
      description: "Variant B — Direct / Accountability-focused tone. Professional, no softening, clear expectation-setting. Structure: observation → impact → expectation → next step. 200-300 words. Must reference session name and batch. Must name specific gaps (never vague). Must include clear actionable ask. Must still mention what expert did well. NEVER mention numerical scores. Signed: Prerna"
    },
    pre_scoring_checklist: {
      type: SchemaType.ARRAY,
      description: "8-item pre-scoring checklist results. Each item verified against the transcript before scoring.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          check: {
            type: SchemaType.STRING,
            description: "The checklist item being verified"
          },
          passed: {
            type: SchemaType.BOOLEAN,
            description: "True if the check passed, false if it failed"
          },
          note: {
            type: SchemaType.STRING,
            description: "Brief note explaining the result. Empty string if passed with no concerns."
          }
        },
        required: ["check", "passed", "note"]
      }
    }
  },
  required: [
    "scorecard",
    "overall_score",
    "overall_verdict",
    "overall_summary",
    "critical_red_flags",
    "detailed_findings",
    "feedback_email_warm",
    "feedback_email_direct",
    "pre_scoring_checklist"
  ]
}
