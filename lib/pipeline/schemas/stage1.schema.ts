/**
 * Stage 1 response schema — Gemini structured-output mode (JSON Schema, not Zod).
 * Defines the expected segmentation output: an array of chapter objects.
 */

import { SchemaType } from '@google/generative-ai'

export const stage1ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    chapters: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          chapter_index: { type: SchemaType.INTEGER },
          title: { type: SchemaType.STRING },
          t_start: { type: SchemaType.INTEGER },
          t_end: { type: SchemaType.INTEGER },
          planned_topic_match: { type: SchemaType.STRING, nullable: true },
          type: { type: SchemaType.STRING },
          one_line_summary: { type: SchemaType.STRING },
          transcript_quality_local: { type: SchemaType.STRING },
        },
        required: [
          'chapter_index', 'title', 't_start', 't_end',
          'type', 'one_line_summary', 'transcript_quality_local',
        ],
      },
    },
  },
  required: ['chapters'],
}
