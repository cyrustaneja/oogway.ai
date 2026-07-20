import { SchemaType } from '@google/generative-ai'

export const pulseResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    session_flow: {
      type: SchemaType.ARRAY,
      description: "Chronological sequence of key chapters/sections covered in this session.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          chapter: { type: SchemaType.STRING, description: "Short title of the chapter / section" },
          start_timestamp: { type: SchemaType.STRING, description: "Start timestamp in MM:SS or HH:MM:SS format" },
          end_timestamp: { type: SchemaType.STRING, description: "End timestamp in MM:SS or HH:MM:SS format" },
          summary: { type: SchemaType.STRING, description: "Brief summary of the chapter (max 15 words)" },
          issue: { type: SchemaType.STRING, description: "Significant issue in this section, if any. Empty string if none." }
        },
        required: ["chapter", "start_timestamp", "end_timestamp", "summary", "issue"]
      }
    },
    expert_insights: {
      type: SchemaType.ARRAY,
      description: "Exactly 6 items, one for each of the Expert Metrics from the Rubric.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          metric: { type: SchemaType.STRING, description: "Exact metric name: 'Context Setting', 'Pacing', 'Analogies', 'Accuracy', 'Question Resolution Way', or 'Teaching Depth'" },
          summary: { type: SchemaType.STRING, description: "1-sentence overarching summary for this metric" },
          pointers: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                right: { type: SchemaType.STRING, description: "What was done right. Empty string if none." },
                wrong: { type: SchemaType.STRING, description: "What was done wrong. Empty string if no flaw." },
                reason: { type: SchemaType.STRING, description: "Hypothesis/Reason for the flaw. Empty string if no flaw." },
                action: { type: SchemaType.STRING, description: "What can be done to improve. Empty string if not applicable." },
                timestamps: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING, description: "Timestamps in MM:SS or HH:MM:SS format" }
                },
                proof: { type: SchemaType.STRING, description: "Verbatim quote or evidence from the transcript" }
              },
              required: ["right", "wrong", "reason", "action", "timestamps", "proof"]
            }
          }
        },
        required: ["metric", "summary", "pointers"]
      }
    },
    student_insights: {
      type: SchemaType.ARRAY,
      description: "Exactly 3 items, one for each of the Student Metrics from the Rubric.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          metric: { type: SchemaType.STRING, description: "Exact metric name: 'Engagement', 'Doubts Quality', or 'Confusion Signals'" },
          summary: { type: SchemaType.STRING, description: "1-sentence overarching summary for this metric" },
          pointers: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                right: { type: SchemaType.STRING, description: "What was done right. Empty string if none." },
                wrong: { type: SchemaType.STRING, description: "What was done wrong. Empty string if no flaw." },
                reason: { type: SchemaType.STRING, description: "Hypothesis/Reason for the flaw. Empty string if no flaw." },
                action: { type: SchemaType.STRING, description: "What can be done to improve. Empty string if not applicable." },
                timestamps: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING, description: "Timestamps in MM:SS or HH:MM:SS format" }
                },
                proof: { type: SchemaType.STRING, description: "Verbatim quote or evidence from the transcript" }
              },
              required: ["right", "wrong", "reason", "action", "timestamps", "proof"]
            }
          }
        },
        required: ["metric", "summary", "pointers"]
      }
    },
    analogies_summary: {
      type: SchemaType.ARRAY,
      description: "List of key analogies used in the session.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING, description: "The concept explained" },
          verbatim_quote: { type: SchemaType.STRING, description: "Verbatim quote of the analogy from the transcript" },
          quality_label: { type: SchemaType.STRING, description: "Strong or Weak" },
          rationale: { type: SchemaType.STRING, description: "Why it was strong or weak" },
          chapter: { type: SchemaType.STRING, description: "Chapter title where it occurred" },
          timestamp: { type: SchemaType.STRING, description: "Timestamp in MM:SS or HH:MM:SS format" }
        },
        required: ["concept", "verbatim_quote", "quality_label", "rationale", "chapter", "timestamp"]
      }
    }
  },
  required: ["session_flow", "expert_insights", "student_insights", "analogies_summary"]
}
