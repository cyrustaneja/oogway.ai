/**
 * PROMPT BOOK — MASTER CONFIGURATION
 * 
 * This file maps UI output fields to the exact AI instructions used to generate them.
 * Edit the 'instruction' or 'schema' fields here to change Oogway's analysis behavior.
 */

export const SHARED_RULES = `
ABSOLUTE EXTRACTION RULES:
1. You are an EXHAUSTIVE pedagogical fact extractor. Maintain a STRICTLY NEUTRAL point of view.
2. Only output strict JSON matching the schema. No markdown fences. No preambles.
3. Every quote, question, analogy, or reference MUST include an exact timestamp from the transcript (HH:MM:SS format) to act as absolute proof.
4. If something did not occur, use an empty array [] or null. Do not invent data.
`.trim();

export const PROMPT_BOOK = {
  chapter_insights: {
    stage: "Stage 3",
    description: "Extracts physical events from a 15-minute slice of teaching.",
    fields: {
      what_was_taught: "Brief 1-2 line summary of the core topic taught.",
      how_it_was_taught: "Brief logic of the pedagogical approach (e.g. theoretical definition followed by code example).",
      analogies_and_examples: "Specific analogies used with timestamps and impact assessment.",
      technical_questions: "Doubt resolution mapping with resolution status.",
      confusion_points: "Detailed tracking of student friction topics."
    },
    instruction: "You are extracting exactly what happened in a single teaching chapter. This will act as the 'Session Flow' source of truth. Extract up to exactly 15 prominent entries per array to avoid truncation.",
    schema: {
      chapter_index: "<number>",
      what_was_taught: "string",
      how_it_was_taught: "string",
      analogies_and_examples: [{ timestamp: "HH:MM:SS", topic: "string", analogy_used: "string", impact: "string" }],
      technical_questions: [{ timestamp: "HH:MM:SS", student_name: "string", question: "string", trainer_response: "string", resolution: "resolved|partially_resolved|unresolved" }],
      confusion_points: [{ timestamp: "HH:MM:SS", student_name: "string", topic: "string", confusion: "string", resolution: "string" }]
    }
  },
  overall_summary: {
    stage: "Stage 6A",
    description: "Compares teacher performance against the intended curriculum notes.",
    fields: {
      context_setting: "Did the teacher introduce the topic correctly?",
      topics_covered: "List of all main concepts mentioned.",
      topics_missed_from_notes: "Gap analysis against official curriculum notes.",
      agenda_fulfilled: "Binary check of curriculum completion."
    },
    instruction: "You are drafting the 'Overall Session Analysis' pillar using the aggregated chapter insights and the official session notes.",
    schema: {
      context_setting: { implemented: "boolean", how_it_was_done: "string", evaluation: "string" },
      topics_covered: ["string"],
      topics_missed_from_notes: ["string"],
      key_learnings_sequence: ["string"],
      agenda_fulfilled: "boolean",
      agenda_evaluation: "string"
    }
  },
  expert_analysis: {
    stage: "Stage 6B",
    description: "In-depth pedagogical audit of the trainer.",
    fields: {
      depth_analysis: "Was the teaching surface-level or reasoning-focused?",
      topics_lacking_examples: "Specific feedback on where the trainer failed to provide practical context (Pedagogical Gaps).",
      pacing_issues: "Fast vs Slow assessment per topic."
    },
    instruction: "You are drafting the 'Expert Analysis' pillar based strictly on the overarching chapter data.",
    schema: {
      general_check: { start_time: "HH:MM:SS", end_time: "HH:MM:SS", camera_on_percentage: "string", join_on_time: "string" },
      depth_analysis: { overall_depth: "reasoning_focused|surface_level|mixed", topics_lacking_examples: [{ topic: "string", feedback: "string" }] },
      analogies_used: [{ analogy: "string", topic_taught: "string", impact: "string", timestamp: "HH:MM:SS" }],
      doubt_resolution: [{ major_doubt: "string", how_it_was_resolved: "string", timestamp: "HH:MM:SS" }],
      pacing_issues: { overall: "fast|balanced|slow", rushed_topics: ["string"] }
    }
  },
  student_analysis: {
    stage: "Stage 6C",
    description: "Tracks student sentiment and engagement patterns.",
    fields: {
      major_technical_doubts: "Clustered technical questions.",
      engagement: "Highest and lowest engagement topics based on interaction.",
      student_callouts: "Individual student behavior highlights."
    },
    instruction: "You are drafting the 'Student Analysis' pillar based strictly on the overarching chapter data.",
    schema: {
      major_technical_doubts: [{ doubt: "string", resolved: "boolean", student_name: "string", timestamp: "HH:MM:SS" }],
      top_issue_topics: ["string"],
      engagement: { most_engaging_topic: "string", least_engaging_topic: "string" },
      student_callouts: [{ callout_summary: "string", timestamp: "HH:MM:SS", engagement_reference: "string" }]
    }
  }
};
