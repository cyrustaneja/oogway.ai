# Oogway Analysis Pipeline Architecture

This document tracks the multi-stage asynchronous processing pipeline for session transcripts.

## Overview
The pipeline consumes a raw transcript (.vtt or plain text) and converts it into structured pedagogical insights across 6 distinct stages.

---

## Stage 0: Preprocessing
- **Goal:** Clean raw WebVTT noise.
- **Action:** Strips timestamps and speaker tags into a clean chronological text block.
- **Logic:** `lib/pipeline/stage0-preprocess.ts`

## Stage 1: Structure Detection (Batched)
- **Goal:** Split the transcript into logical 10–15 minute chapters.
- **Logic:** `lib/pipeline/stage1-structure.ts`
- **AI Prompt:**
```text
You are a transcript structure analyser for teaching sessions.
Your task: identify logical topic chapters in the transcript chunk you receive.
You MUST return a JSON array...
Rules:
- Aim for 1 chapter per 10–15 minutes.
- Do not invent timestamps.
```

## Stage 2: Slicing
- **Goal:** Prepare granular context.
- **Action:** Slices the full transcript into physical chunks based on timestamps from Stage 1.

## Stage 3: Feature Extraction (The "Session Flow" Truth)
- **Goal:** Deep analysis of exactly what happened in each chapter.
- **AI Prompt (`PROMPT_CHAPTER_INSIGHTS`):**
```text
ABSOLUTE EXTRACTION RULES:
1. You are an EXHAUSTIVE pedagogical fact extractor. Maintain a STRICTLY NEUTRAL point of view.
2. Only output strict JSON matching the schema. No markdown fences. No preambles.
3. Every quote, question, analogy, or reference MUST include an exact timestamp from the transcript (HH:MM:SS format) to act as absolute proof.
4. If something did not occur, use an empty array [] or null. Do not invent data.

You are extracting exactly what happened in a single teaching chapter. This will act as the "Session Flow" source of truth.
Extract up to exactly 15 prominent entries per array to avoid truncation.

OUTPUT TARGET SCHEMA (Strict JSON):
{
  "chapter_index": <number>,
  "what_was_taught": "Brief 1-2 line summary of the core topic taught.",
  "how_it_was_taught": "Brief logic of the pedagogical approach (e.g. theoretical definition followed by code example).",
  "analogies_and_examples": [
    { "timestamp": "HH:MM:SS", "topic": "Concept being explained", "analogy_used": "Exact words or summary of analogy", "impact": "Did students understand? If decent (85% understood), state 'decent'. If poor, suggest how to improve." }
  ],
  "technical_questions": [
    { "timestamp": "HH:MM:SS", "student_name": "Name or 'unidentified'", "question": "Verbatim question", "trainer_response": "Brief summary", "resolution": "resolved | partially_resolved | unresolved" }
  ],
  "confusion_points": [
    { "timestamp": "HH:MM:SS", "student_name": "Name", "topic": "Concept", "confusion": "What were they confused about?", "resolution": "How did the expert resolve it?" }
  ]
}
```

## Stage 4: Logical Mapping (Documentation Stage)
- **Goal:** Maps extracted raw insights to curriculum nodes.
- *Note: This stage is currently logically handled within Stage 5 & 6.*

## Stage 5: Aggregation
- **Goal:** Build a chronological "Session Flow" array.
- **Action:** Combines all Stage 3 outputs into a single JSON timeline.

## Stage 6: Grand Synthesis (Triple Pillar)
- **Goal:** Generate the final PDF-ready analysis.
- **Action:** Runs three parallel tasks using the Session Flow and Session Notes.

### 6A: Overall Summary Prompt
```text
ABSOLUTE EXTRACTION RULES:
(See rules in Stage 3)

You are drafting the "Overall Session Analysis" pillar using the aggregated chapter insights and the official session notes.

OUTPUT TARGET SCHEMA (Strict JSON):
{
  "context_setting": {
    "implemented": true/false,
    "how_it_was_done": "Brief explanation",
    "evaluation": "Was it straightforward or could it be better? (Neutral POV)"
  },
  "topics_covered": ["Topic 1", "Topic 2"],
  "topics_missed_from_notes": ["Topic missing", "Topic missing"],
  "key_learnings_sequence": ["Learning 1", "Learning 2"],
  "agenda_fulfilled": true/false,
  "agenda_evaluation": "Was it completed as per session notes? If notes are empty, just infer the learnings."
}
```

### 6B: Expert Analysis Prompt
```text
ABSOLUTE EXTRACTION RULES:
(See rules in Stage 3)

You are drafting the "Expert Analysis" pillar based strictly on the overarching chapter data.

OUTPUT TARGET SCHEMA (Strict JSON):
{
  "general_check": {
    "start_time": "HH:MM:SS",
    "end_time": "HH:MM:SS",
    "camera_on_percentage": "Upcoming Feature", 
    "join_on_time": "Upcoming Feature"
  },
  "depth_analysis": {
    "overall_depth": "reasoning_focused | surface_level | mixed",
    "topics_lacking_examples": [
      { "topic": "Name", "feedback": "Why it lacked examples and what specific example could be used instead. If it didn't need an example, state 'Topic was straightforward, no examples required.'" }
    ]
  },
  "analogies_used": [
    { "analogy": "Analogy summary", "topic_taught": "Topic", "impact": "Neutral assessment. If good/decent, state so. If bad, suggest improvement.", "timestamp": "HH:MM:SS" }
  ],
  "doubt_resolution": [
    { "major_doubt": "Summary of doubt", "how_it_was_resolved": "Direct answer | Explanatory analogy | Follow-up questioning", "timestamp": "HH:MM:SS" }
  ],
  "pacing_issues": {
    "overall": "fast | balanced | slow",
    "rushed_topics": ["Topic 1"]
  }
}
```

### 6C: Student Analysis Prompt
```text
ABSOLUTE EXTRACTION RULES:
(See rules in Stage 3)

You are drafting the "Student Analysis" pillar based strictly on the overarching chapter data.

OUTPUT TARGET SCHEMA (Strict JSON):
{
  "major_technical_doubts": [
    { "doubt": "Summary", "resolved": true/false, "student_name": "Name", "timestamp": "HH:MM:SS" }
  ],
  "top_issue_topics": ["Topic A", "Topic B"],
  "engagement": {
    "most_engaging_topic": "Topic Name",
    "least_engaging_topic": "Topic Name"
  },
  "student_callouts": [
    { "callout_summary": "Summary", "timestamp": "HH:MM:SS", "engagement_reference": "Did this boost engagement or fall flat?" }
  ]
}
```

---

## Core Extraction Rules (Shared across all prompts)
1. **Neutral POV:** Exhaustive fact extraction, no fluff.
2. **Timestamp Proof:** Every claim MUST include a HH:MM:SS timestamp from the transcript.
3. **Strict JSON:** No markdown, no preambles, only pure JSON objects.
