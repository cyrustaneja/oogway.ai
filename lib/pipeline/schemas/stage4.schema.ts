import { SchemaType } from '@google/generative-ai'

/**
 * Stage 4 response schema — operational flags.
 */

export const stage4ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    flags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING },
          rationale: { type: SchemaType.STRING },
          evidence_chapter_indices: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.INTEGER },
          },
          verbatim_quote: { type: SchemaType.STRING },
          timestamp: { type: SchemaType.STRING },
        },
        required: [
          'category', 'severity', 'rationale',
          'evidence_chapter_indices', 'verbatim_quote', 'timestamp',
        ],
      },
    },
  },
  required: ['flags'],
}
