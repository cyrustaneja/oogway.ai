import { SchemaType } from '@google/generative-ai'

/**
 * scoredRubric matches the 'Score' type in lib/types/analysis.ts
 */
const scoredRubric = {
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

const analogyItem = {
  type: SchemaType.OBJECT,
  properties: {
    concept_explained: { type: SchemaType.STRING },
    quality: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
        rationale: { type: SchemaType.STRING },
      },
      required: ['score', 'label', 'rationale'],
    },
    timestamp: { type: SchemaType.STRING },
    verbatim_quote: { type: SchemaType.STRING },
    what_it_explains: { type: SchemaType.STRING },
  },
  required: ['concept_explained', 'quality', 'timestamp', 'verbatim_quote', 'what_it_explains'],
}

const doubtItem = {
  type: SchemaType.OBJECT,
  properties: {
    student_name_raw: { type: SchemaType.STRING },
    doubt_verbatim: { type: SchemaType.STRING },
    timestamp: { type: SchemaType.STRING },
    resolved_flag: { type: SchemaType.BOOLEAN },
    resolution: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
        rationale: { type: SchemaType.STRING },
      },
      required: ['score', 'label', 'rationale'],
    },
    resolution_verbatim: { type: SchemaType.STRING, nullable: true },
    resolution_accuracy: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
        concern: { type: SchemaType.STRING, nullable: true },
      },
      required: ['score', 'label'],
    },
  },
  required: ['student_name_raw', 'doubt_verbatim', 'timestamp', 'resolved_flag', 'resolution', 'resolution_accuracy'],
}

const confusionItem = {
  type: SchemaType.OBJECT,
  properties: {
    topic: { type: SchemaType.STRING },
    severity: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
      },
      required: ['score', 'label'],
    },
    why_verbatim: { type: SchemaType.STRING },
    timestamp: { type: SchemaType.STRING },
  },
  required: ['topic', 'severity', 'why_verbatim', 'timestamp'],
}

export const stage2ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    chapter_num: { type: SchemaType.INTEGER },
    title: { type: SchemaType.STRING },
    what_was_taught: { type: SchemaType.STRING },
    is_teaching: { type: SchemaType.BOOLEAN },
    teaching_depth: { ...scoredRubric, nullable: true },
    pacing: { ...scoredRubric, nullable: true },
    engagement: { ...scoredRubric, nullable: true },
    analogies: { type: SchemaType.ARRAY, items: analogyItem },
    doubts: { type: SchemaType.ARRAY, items: doubtItem },
    example_gap: { ...scoredRubric, nullable: true },
    confusion_points: { type: SchemaType.ARRAY, items: confusionItem },
    accuracy_check: {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.INTEGER },
        label: { type: SchemaType.STRING },
        flagged_statement: { type: SchemaType.STRING, nullable: true },
        timestamp: { type: SchemaType.STRING, nullable: true },
        verbatim_quote: { type: SchemaType.STRING, nullable: true },
        concern: { type: SchemaType.STRING, nullable: true },
      },
      required: ['score', 'label'],
    },
  },
  required: [
    'chapter_num', 'title', 'what_was_taught', 'is_teaching',
    'analogies', 'doubts', 'confusion_points', 'accuracy_check'
  ],
}
