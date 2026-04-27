export type Timestamp = `${number}${number}:${number}${number}:${number}${number}`;

export interface Evidence {
  timestamp: string;        // HH:MM:SS
  verbatim_quote: string;
  note?: string;
}

export interface RubricScore<L extends string = string> {
  score: number;
  label: L;
  evidence: Evidence[];
}

export type ContextSetupLabel = "Not set" | "Named only" | "Named + why" | "Structured" | "Structured + linked";
export type AnalogyTieLabel = "Not an analogy" | "Loosely tied" | "Partially tied" | "Directly tied" | "Precisely tied";
export type QuestionQualityLabel = "Clarification" | "Definitional" | "Applied" | "Probing" | "Synthetic";
export type DoubtMethodLabel = "Ignored" | "Direct answer" | "Answer + example" | "Socratic" | "Socratic + reframe";
export type ExampleGapLabel = "No gap" | "Minor gap" | "Notable gap" | "Major gap";
export type PacingLabel = "Rushed" | "Slightly fast" | "Balanced" | "Slightly slow" | "Dragged";
export type EngagementLabel = "Silent" | "Low" | "Moderate" | "Active" | "Highly active";
export type ConfusionSeverityLabel = "Isolated" | "Localized" | "Broad" | "Unresolved";
export type LearningHealthLabel = "Unclear" | "Weak" | "Mixed" | "Healthy" | "Strong";

export interface EpochSummary {
  epoch_index: number;
  chapters_covered: number[];
  start_timestamp: string;
  end_timestamp: string;
  topics_taught: string[];
  expert_highlights: string[];
  student_friction_points: string[];
  pedagogical_gaps: string[];
  notable_analogies: Array<{ topic: string; summary: string; score: number }>;
  overall_vibe: string;
}

// ─── STAGE 3: CHAPTER INSIGHTS ───────────────────────────────────────────────

export type ChapterType = "teaching" | "qna" | "admin" | "break" | "tech_issue";

export interface ChapterInsight {
  chapter_index: number;
  chapter_type: ChapterType;
  start_timestamp: string;
  end_timestamp: string;
  duration_minutes?: number;
  percentage_of_session?: string;
  what_was_taught: string;
  how_it_was_taught: string;
  analogies_and_examples: Array<{
    timestamp: string;
    topic: string;
    verbatim_quote: string;
    analogy_summary: string;
    tie_strength: RubricScore<AnalogyTieLabel>;
  }>;
  technical_questions: Array<{
    timestamp: string;
    student_name_raw: string;
    topic: string;
    verbatim_quote: string;
    question_summary: string;
    quality: RubricScore<QuestionQualityLabel>;
  }>;
  non_technical_questions: Array<{
    timestamp: string;
    student_name_raw: string;
    verbatim_quote: string;
    category: "logistics" | "admin" | "tech_issue" | "off_topic";
  }>;
  doubts_and_resolutions: Array<{
    timestamp: string;
    student_name_raw: string;
    topic: string;
    doubt_verbatim: string;
    expert_response_verbatim: string;
    method: RubricScore<DoubtMethodLabel>;
    resolved: "yes" | "partial" | "no";
  }>;
  confusion_points: Array<{
    timestamp: string;
    topic: string;
    students_involved_raw: string[];
    what_caused_it_verbatim: string;
    severity: RubricScore<ConfusionSeverityLabel>;
  }>;
  pacing_observations: Array<{
    topic: string;
    start_timestamp: string;
    end_timestamp: string;
    pacing: RubricScore<PacingLabel>;
  }>;
  engagement_observations: Array<{
    topic: string;
    start_timestamp: string;
    end_timestamp: string;
    engagement: RubricScore<EngagementLabel>;
  }>;
  names_called_out: Array<{
    timestamp: string;
    student_name_raw: string;
    context_verbatim: string;
    reason: "answered_question" | "asked_question" | "cold_call" | "greeted" | "other";
  }>;
  truncated: boolean;
  overflow_note?: string;
}

// ─── STAGE 6: PILLARS ────────────────────────────────────────────────────────

export interface Pillar6A {
  context_setup: {
    narrative_sentence: string;
    how_it_was_done_verbatim: string;
    score: number;
    label: ContextSetupLabel;
    evidence: Evidence[];
  };
  topics_covered: string[];
  topics_partially_covered: Array<{ topic: string; reason_verbatim: string; timestamp: string }>;
  topics_missed_from_notes: Array<{ topic: string; expected_chapter?: string; likely_reason: "time_pressure" | "derailment" | "skipped" | "unknown" }>;
  key_learnings_sequence_taught: string[];
  agenda_fulfilled: "yes" | "partial" | "no";
  agenda_evaluation_sentence: string;
  session_learning_health: RubricScore<LearningHealthLabel>;
}

export interface Pillar6B {
  analogies: Array<{
    timestamp: string;
    topic_taught: string;
    verbatim_quote: string;
    analogy_summary: string;
    tie_strength: RubricScore<AnalogyTieLabel>;
  }>;
  student_questions: {
    technical: Array<{
      timestamp: string;
      student_name_raw: string;
      topic: string;
      verbatim_quote: string;
      quality: RubricScore<QuestionQualityLabel>;
    }>;
    extra: Array<{
      timestamp: string;
      student_name_raw: string;
      verbatim_quote: string;
      category: string;
    }>;
  };
  answers_given: Array<{
    timestamp: string;
    doubt_verbatim: string;
    expert_response_verbatim: string;
    method: RubricScore<DoubtMethodLabel>;
    resolved: string;
  }>;
  topics_needing_examples: Array<{
    topic: string;
    timestamp_range: { start: string; end: string };
    what_was_missing_verbatim: string;
    gap_severity: RubricScore<ExampleGapLabel>;
  }>;
  pacing_by_topic: Array<{
    topic: string;
    start_timestamp: string;
    end_timestamp: string;
    pacing: RubricScore<PacingLabel>;
  }>;
}

export interface Pillar6C {
  name_callouts: Array<{
    student_name_raw: string;
    occurrence_count: number;
    occurrences: Array<{ timestamp: string; context_verbatim: string; reason: string }>;
  }>;
  questions_by_student: Array<{
    timestamp: string;
    student_name_raw: string;
    topic: string;
    verbatim_quote: string;
    quality: RubricScore<QuestionQualityLabel>;
  }>;
  engagement_points: {
    per_topic: Array<{
      topic: string;
      start_timestamp: string;
      end_timestamp: string;
      engagement: RubricScore<EngagementLabel>;
    }>;
    highest_engagement_topics: string[];
    lowest_engagement_topics: string[];
  };
  confusion_points: Array<{
    timestamp: string;
    topic: string;
    students_involved_raw: string[];
    why_verbatim: string;
    severity: RubricScore<ConfusionSeverityLabel>;
  }>;
}

export interface FlatScore {
  rubric: string;
  score: number;
  label: string;
  scope: "session" | "chapter" | "topic" | "question" | "doubt";
  chapter_index?: number;
  topic?: string;
  student_name_raw?: string;
  timestamp?: string;
  pillar: "6A" | "6B" | "6C";
}
