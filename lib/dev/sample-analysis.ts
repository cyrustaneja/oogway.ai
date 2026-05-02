import { SessionAnalysis, ChapterResult } from '../types/analysis';

export const SAMPLE_ANALYSIS: SessionAnalysis = {
  session_id: "sample-123",
  schema_version: "v1.0",
  context_setup: {
    score: 5,
    label: "Strong",
    narrative: "Vikram started with a relatable luxury car example and clearly defined the three pillars of brand positioning right at the beginning.",
    evidence: [
      { timestamp: "00:00:12", verbatim_quote: "Aaj hum baat karenge ki ek brand apne customers ke mind mein kaise ek unique jagah banata hai." }
    ]
  },
  topics_covered: ["Frame of reference", "Point of difference", "Target audience", "Repositioning"],
  topics_missed_from_notes: ["Common mistakes"],
  key_learning_points: [
    "Positioning is the unique place a brand occupies in a customer's mind.",
    "The three pillars are: Target Audience, Frame of Reference, and Point of Difference.",
    "Repositioning requires a complete strategic shift, not just a cosmetic change.",
    "Focus is critical; positioning for everyone is positioning for no one."
  ],
  expert_audit: {
    pedagogical_health_summary: "The expert used excellent analogies (Maggi, Ola, Old Spice) to ground complex marketing concepts. The Hindi-to-English transitions were smooth and kept students engaged.",
    teaching_depth_map: [
      { chapter: 1, topic: "Pillars", depth_label: "Deep", depth_score: 5 }
    ],
    pacing_map: [
      { chapter: 1, topic: "Introduction", pacing_label: "Good", duration_mins: 5 }
    ],
    analogies_summary: [
      { 
        concept: "Emotional POD", 
        quality_label: "Strong", 
        verbatim_quote: "Surf Excel positions itself as 'daag acche hain.' That's emotional POD.", 
        chapter: 2, 
        rationale: "Clearly illustrates how a functional product connects emotionally.",
        flagged: false
      },
      { 
        concept: "Generic Positioning", 
        quality_label: "Weak", 
        verbatim_quote: "Agar aap sabke liye ho, toh kisike bhi liye nahi ho.", 
        chapter: 3, 
        rationale: "Good point but could have used a more specific 'weak brand' example.",
        flagged: true
      }
    ],
    example_gaps: [
      { chapter: 1, topic: "B2B Positioning", gap_label: "Definitional" }
    ],
    doubt_resolution_summary: [
      { 
        chapter: 2, 
        doubt: "Can we apply this to FMCG?", 
        student: "Priya", 
        resolution_label: "Explained", 
        resolved: true, 
        resolution_accuracy: "Correct", 
        rationale: "Directly addressed with the Surf Excel example."
      },
      {
        chapter: 3,
        doubt: "How long does repositioning take?",
        student: "Rohit",
        resolution_label: "Definitional",
        resolved: false,
        resolution_accuracy: "Possibly Incorrect",
        rationale: "Expert skipped the timeline aspect and moved to Old Spice directly."
      }
    ],
    accuracy_issues: [
      {
        chapter: 3,
        topic: "Old Spice Timeline",
        accuracy_label: "Possibly Incorrect",
        flagged_statement: "Old Spice took only 2 months to reposition.",
        verbatim_quote: "It was a massive success overnight.",
        concern: "Strategic repositioning usually takes 12-18 months for full market impact.",
        timestamp: "00:25:40"
      }
    ],
    most_engaged_student: {
      name: "Rohit",
      why: "Asked a critical question about repositioning strategy.",
      evidence_count: 3
    },
    most_engaged_topic: {
      topic: "Point of Difference",
      why: "Longest discussion thread with multiple student questions.",
      chapter: 2
    }
  },
  student_log: {
    engagement_by_chapter: [
      { chapter: 1, label: "High", score: 5 }
    ],
    confusion_summary: [
      { chapter: 1, topic: "Frame of Reference", severity_label: "Moderate", why: "Confusion between category and target segment." }
    ],
    unresolved_doubts: [
      { chapter: 3, student: "Rohit", doubt: "Timeline of repositioning", timestamp: "00:25:40" }
    ],
    student_questions: [
      { student: "Priya", question: "Kya hum yeh framework FMCG products pe bhi apply kar sakte hain?", timestamp: "00:06:10", chapter: 2, type: "asked" },
      { student: "Rohit", question: "Sir, what about repositioning?", timestamp: "00:25:00", chapter: 3, type: "asked" }
    ],
    verified_outcomes: ["Understands 3 pillars", "Recognizes importance of POD"]
  },
  session_completeness: { score: 4, label: "Complete", evidence: [] },
  hygiene: { 
    camera: { score: 5, label: "Always On" }, 
    punctuality: { score: 4, label: "2 min late" } 
  },
  session_flags: { 
    flags: [
      { category: "ACCURACY", severity: "MEDIUM", rationale: "Repositioning timeline estimate was overly optimistic." }
    ], 
    total_flags: 1, 
    high_count: 0, 
    medium_count: 1, 
    low_count: 0 
  }
};

export const SAMPLE_CHAPTERS: ChapterResult[] = [
  {
    chapter_num: 1,
    title: "Introduction to Positioning",
    what_was_taught: "Basics of how brands occupy space in minds.",
    is_teaching: true,
    teaching_depth: { score: 5, label: "Deep", rationale: "Extensive theory plus analogies.", evidence: [{ timestamp: "00:01:15", verbatim_quote: "Brand positioning has three core elements..." }] },
    pacing: { score: 4, label: "Good", rationale: "Consistent flow.", evidence: [] },
    engagement: { score: 5, label: "High", rationale: "Students were asking questions immediately.", evidence: [] },
    analogies: [],
    doubts: [],
    example_gap: null,
    unresolved_doubt_flag: { score: 0, label: "None" },
    confusion_points: [],
    accuracy_check: { score: 5, label: "Accurate", flagged_statement: null, timestamp: null, verbatim_quote: null, concern: null }
  },
  {
    chapter_num: 2,
    title: "The Three Pillars",
    what_was_taught: "Frame of Reference, POD, and Target Audience.",
    is_teaching: true,
    teaching_depth: { score: 5, label: "Deep", rationale: "Used Surf Excel and Maggi to explain.", evidence: [] },
    pacing: { score: 4, label: "Good", rationale: "Balanced time across all three pillars.", evidence: [] },
    engagement: { score: 4, label: "High", rationale: "Priya asked a good application question.", evidence: [] },
    analogies: [
      { 
        concept_explained: "Emotional POD", 
        quality: { score: 5, label: "Strong", rationale: "Excellent link to Surf Excel." }, 
        timestamp: "00:06:25", 
        verbatim_quote: "Surf Excel positions itself as 'daag acche hain.'", 
        what_it_explains: "How emotional connection works." 
      }
    ],
    doubts: [
      { 
        student_name_raw: "Priya", 
        doubt_verbatim: "Kya hum yeh framework FMCG products pe bhi apply kar sakte hain?", 
        timestamp: "00:06:10", 
        resolution: { score: 5, label: "Explained", rationale: "Gave Surf Excel example." }, 
        resolved_flag: true, 
        resolution_verbatim: "Bilkul! In fact, FMCG mein toh yeh aur zyada critical hai.", 
        resolution_accuracy: { score: 5, label: "Correct", concern: null } 
      }
    ],
    example_gap: null,
    unresolved_doubt_flag: { score: 0, label: "None" },
    confusion_points: [],
    accuracy_check: { score: 5, label: "Accurate", flagged_statement: null, timestamp: null, verbatim_quote: null, concern: null }
  },
  {
    chapter_num: 3,
    title: "Repositioning & Summary",
    what_was_taught: "Changing brand image and closing the session.",
    is_teaching: true,
    teaching_depth: { score: 3, label: "Surface", rationale: "Briefly mentioned Old Spice but didn't go deep into the strategy.", evidence: [] },
    pacing: { score: 3, label: "Fast", rationale: "Rushed through the homework part.", evidence: [] },
    engagement: { score: 4, label: "High", rationale: "Rohit was interested in the case study.", evidence: [] },
    analogies: [],
    doubts: [
      { 
        student_name_raw: "Rohit", 
        doubt_verbatim: "What about repositioning?", 
        timestamp: "00:25:00", 
        resolution: { score: 3, label: "Definitional", rationale: "Mentioned Old Spice but skipped process." }, 
        resolved_flag: false, 
        resolution_verbatim: "Repositioning is a complete strategic exercise.", 
        resolution_accuracy: { score: 3, label: "Possibly Incorrect", concern: "Skipped strategic steps." } 
      }
    ],
    example_gap: { score: 3, label: "Definitional", rationale: "Needs more B2B examples.", evidence: [] },
    unresolved_doubt_flag: { score: 4, label: "Stuck" },
    confusion_points: [],
    accuracy_check: { score: 3, label: "Possibly Incorrect", flagged_statement: "Massive success overnight", timestamp: "00:25:18", verbatim_quote: "Massive success.", concern: "Repositioning takes time." }
  }
];
