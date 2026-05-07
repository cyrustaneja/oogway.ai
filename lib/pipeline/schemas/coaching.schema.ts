import { SchemaType } from '@google/generative-ai'

/**
 * On-demand coaching tips response schema.
 * Completely independent of the Stage 1–4 pipeline schemas.
 * Used only by the /api/analysis/[id]/coaching-tips route.
 */

const tipSchema = {
  type: SchemaType.OBJECT,
  properties: {
    chapter:        { type: SchemaType.INTEGER },
    topic:          { type: SchemaType.STRING },
    timestamp:      { type: SchemaType.STRING },
    observation:    { type: SchemaType.STRING },
    tip:            { type: SchemaType.STRING },
    bad_example:    { type: SchemaType.STRING },
    good_example:   { type: SchemaType.STRING },
    evidence_quote: { type: SchemaType.STRING },
  },
  required: [
    'chapter', 'topic', 'timestamp',
    'observation', 'tip',
    'bad_example', 'good_example', 'evidence_quote',
  ],
}

export const coachingResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    example_tips:    { type: SchemaType.ARRAY, items: tipSchema },
    topic_tips:      { type: SchemaType.ARRAY, items: tipSchema },
    engagement_tips: { type: SchemaType.ARRAY, items: tipSchema },
    doubt_tips:      { type: SchemaType.ARRAY, items: tipSchema },
  },
  required: ['example_tips', 'topic_tips', 'engagement_tips', 'doubt_tips'],
}
