import { SchemaType } from '@google/generative-ai'

/**
 * Oogway Go response schema — structured output for Gemini.
 * Produces: scorecard, critical red flags, detailed findings, and feedback emails.
 */
export const oogwayGoResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scorecard: {
      type: SchemaType.ARRAY,
      description: "Exactly 6 items — one per scoring dimension in order: Content Accuracy & Depth, Pedagogical Approach, Live Platform Walkthrough, Pacing & Time Management, Student Emotional Support, Delivery Fluency.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dimension: {
            type: SchemaType.STRING,
            description: "Exact dimension name: 'Content Accuracy & Depth', 'Pedagogical Approach', 'Live Platform Walkthrough', 'Pacing & Time Management', 'Student Emotional Support', or 'Delivery Fluency'"
          },
          score: {
            type: SchemaType.NUMBER,
            description: "Score from 1-10 based on the rubric benchmarks"
          },
          weight: {
            type: SchemaType.NUMBER,
            description: "Weight as decimal: 0.25, 0.25, 0.15, 0.15, 0.10, or 0.10"
          },
          summary: {
            type: SchemaType.STRING,
            description: "1-2 sentence summary of performance in this dimension"
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
            description: "Highest severity finding in this dimension: 'NOTABLE', 'MODERATE', 'MINOR', or 'CLEAN'"
          }
        },
        required: ["dimension", "score", "weight", "summary", "top_strength", "top_weakness", "severity_tag"]
      }
    },
    overall_score: {
      type: SchemaType.NUMBER,
      description: "Weighted average of all 6 dimensions. HARD RULE: If any NOTABLE finding exists, this is capped at 7.0."
    },
    overall_verdict: {
      type: SchemaType.STRING,
      description: "One of: 'Excellent' (9-10), 'Good' (7-8), 'Needs Improvement' (5-6), 'Below Standard' (3-4), 'Critical' (1-2)"
    },
    overall_summary: {
      type: SchemaType.STRING,
      description: "2-3 sentence overall assessment of the session quality. Be direct and specific."
    },
    critical_red_flags: {
      type: SchemaType.ARRAY,
      description: "Top 2-3 critical issues explaining why the session struggled. MANDATORY if overall_score < 7.0. Empty array only if score >= 7.0 and no NOTABLE findings.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          flag: {
            type: SchemaType.STRING,
            description: "Clear, specific description of the critical issue (max 2 sentences)"
          },
          impact: {
            type: SchemaType.STRING,
            description: "How this directly impacted student learning outcomes"
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
      description: "All specific observations from the session, ordered by severity (NOTABLE first, then MODERATE, then MINOR). Aim for 8-15 findings total.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dimension: {
            type: SchemaType.STRING,
            description: "Which of the 6 dimensions this finding belongs to"
          },
          severity: {
            type: SchemaType.STRING,
            description: "'NOTABLE', 'MODERATE', or 'MINOR'"
          },
          what_happened: {
            type: SchemaType.STRING,
            description: "Specific, factual description of what occurred (max 2 sentences)"
          },
          why_it_matters: {
            type: SchemaType.STRING,
            description: "Why this impacts student learning (max 1-2 sentences)"
          },
          recommendation: {
            type: SchemaType.STRING,
            description: "Specific, actionable suggestion to address this (max 1-2 sentences)"
          },
          verbatim_quote: {
            type: SchemaType.STRING,
            description: "Direct quote from the transcript as evidence. MANDATORY."
          },
          timestamp: {
            type: SchemaType.STRING,
            description: "Timestamp where this occurred (MM:SS or HH:MM:SS)"
          },
          is_positive: {
            type: SchemaType.BOOLEAN,
            description: "True if this is a positive observation (strength), false if it's a weakness/issue"
          }
        },
        required: ["dimension", "severity", "what_happened", "why_it_matters", "recommendation", "verbatim_quote", "timestamp", "is_positive"]
      }
    },
    feedback_email_warm: {
      type: SchemaType.STRING,
      description: "Complete feedback email in warm/developmental tone. 200-300 words. Include specific examples and actionable next steps. Sign off as 'The Kraftshala Academic Team'."
    },
    feedback_email_direct: {
      type: SchemaType.STRING,
      description: "Complete feedback email in direct/accountability tone. 200-300 words. Include specific examples and required changes. Sign off as 'The Kraftshala Academic Team'."
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
    "feedback_email_direct"
  ]
}
