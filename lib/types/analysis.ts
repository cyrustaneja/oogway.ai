export type Score = { 
  score: number; 
  label: string; 
  rationale: string; 
  evidence: { timestamp: string; verbatim_quote: string }[] 
}

export type Analogy = { 
  concept_explained: string; 
  quality: { score: number; label: string; rationale: string }; 
  timestamp: string; 
  verbatim_quote: string; 
  what_it_explains: string 
}

export type Doubt = { 
  student_name_raw: string; 
  doubt_verbatim: string; 
  timestamp: string; 
  resolution: { score: number; label: string; rationale: string }; 
  resolved_flag: boolean; 
  resolution_verbatim: string | null; 
  resolution_accuracy: { score: number; label: string; concern: string | null } 
}

export type ConfusionPoint = { 
  topic: string; 
  severity: { score: number; label: string }; 
  why_verbatim: string; 
  timestamp: string 
}

export type ChapterResult = { 
  chapter_num: number; 
  title: string; 
  what_was_taught: string; 
  t_start?: number;
  t_end?: number;
  is_teaching: boolean; 
  teaching_depth: Score | null; 
  pacing: Score | null; 
  engagement: Score | null; 
  analogies: Analogy[]; 
  doubts: Doubt[]; 
  example_gap: Score | null; 
  unresolved_doubt_flag: { score: number; label: string }; 
  confusion_points: ConfusionPoint[]; 
  accuracy_check: { 
    score: number; 
    label: string; 
    flagged_statement: string | null; 
    timestamp: string | null; 
    verbatim_quote: string | null; 
    concern: string | null 
  } 
}

export type SessionAnalysis = {
  session_id: string; 
  schema_version: string;
  context_setup: { score: number; label: string; narrative: string; evidence: { timestamp: string; verbatim_quote: string }[] };
  topics_covered: string[]; 
  topics_missed_from_notes: string[];
  key_learning_points: string[];
  expert_audit: {
    pedagogical_health_summary: string;
    teaching_depth_map: { chapter: number; topic: string; depth_label: string; depth_score: number }[];
    pacing_map: { chapter: number; topic: string; pacing_label: string; duration_mins: number }[];
    analogies_summary: { concept: string; quality_label: string; verbatim_quote: string; chapter: number; rationale: string; flagged: boolean; timestamp?: string }[];
    example_gaps: { chapter: number; topic: string; gap_label: string }[];
    doubt_resolution_summary: { chapter: number; doubt: string; student: string; resolution_label: string; resolved: boolean; resolution_accuracy: string; rationale: string }[];
    accuracy_issues: { chapter: number; topic: string; accuracy_label: string; flagged_statement: string; verbatim_quote: string; concern: string; timestamp: string }[];
    most_engaged_student: { name: string; why: string; evidence_count: number } | null;
    most_engaged_topic: { topic: string; why: string; chapter: number } | null;
  };
  student_log: {
    engagement_by_chapter: { chapter: number; label: string; score: number }[];
    confusion_summary: { chapter: number; topic: string; severity_label: string; why: string }[];
    unresolved_doubts: { chapter: number; student: string; doubt: string; timestamp: string }[];
    student_questions: { student: string; question: string; timestamp: string; chapter: number; type: 'asked' | 'answered' | 'other' }[];
    verified_outcomes: string[];
  };
  session_completeness: { score: number; label: string; evidence: { timestamp: string; verbatim_quote: string }[] };
  hygiene: { camera: { score: number; label: string }; punctuality: { score: number; label: string } };
  session_flags: { flags: { category: string; severity: string; rationale: string }[]; total_flags: number; high_count: number; medium_count: number; low_count: number };
}
