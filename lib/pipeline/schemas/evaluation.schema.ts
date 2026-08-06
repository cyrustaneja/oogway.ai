import { SchemaType } from '@google/generative-ai';

export const evaluationResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    batchName: {
      type: SchemaType.STRING,
      description: 'The batch name associated with the evaluation session',
    },
    totalStudentsEvaluated: {
      type: SchemaType.NUMBER,
      description: 'Total number of distinct students identified and evaluated in the transcript',
    },
    batchSummary: {
      type: SchemaType.STRING,
      description: 'High-level synthesis of marking accuracy across all students evaluated in this session (2-4 sentences)',
    },
    students: {
      type: SchemaType.ARRAY,
      description: 'List of individual student evaluation audits extracted from the transcript',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          studentName: {
            type: SchemaType.STRING,
            description: 'Name of the student as identified in the transcript (e.g., Rahul, Sarthak, Deboshri)',
          },
          studentFoundInSheet: {
            type: SchemaType.BOOLEAN,
            description: 'Whether this student was matched in the Google Sheet evaluation roster',
          },
          matchedSheetName: {
            type: SchemaType.STRING,
            description: 'The matched name from the sheet roster',
          },
          transcriptSegmentStart: {
            type: SchemaType.STRING,
            description: 'Timestamp where this student\'s evaluation begins (HH:MM:SS or MM:SS)',
          },
          transcriptSegmentEnd: {
            type: SchemaType.STRING,
            description: 'Timestamp where this student\'s evaluation ends (HH:MM:SS or MM:SS)',
          },
          criteriaResults: {
            type: SchemaType.ARRAY,
            description: 'Per-question audit results comparing Expert Score & Notes vs AI Score & Reasoning for official sheet questions',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                criterion: {
                  type: SchemaType.STRING,
                  description: 'The Official Question Text originally recorded in the sheet (e.g. What is the difference between a DSP and an SSP?)',
                },
                spokenQuestionInTranscript: {
                  type: SchemaType.STRING,
                  description: 'The actual similar question or prompt spoken by the expert in the transcript (e.g., What is DSP and SSP?)',
                },
                followUpQuestions: {
                  type: SchemaType.STRING,
                  description: 'Any follow-up questions or clarifying probes asked by the expert after the main question before moving to the next topic',
                },
                expertScore: {
                  type: SchemaType.NUMBER,
                  description: 'The score given by the expert in the sheet for this question',
                },
                expertNotes: {
                  type: SchemaType.STRING,
                  description: 'Running feedback notes written by the expert in the sheet for this question',
                },
                expertFeedbackQuality: {
                  type: SchemaType.STRING,
                  description: 'ACCURATE | FACTUALLY_INCORRECT | VAGUE_IMPROPER — Audit of the expert\'s written feedback quality',
                },
                expertFeedbackAuditNote: {
                  type: SchemaType.STRING,
                  description: 'AI audit note evaluating if expert\'s written feedback was proper/accurate vs false/contradictory (e.g. Factually False: Expert claimed student missed X, but transcript shows student spoke X at 01:05:32)',
                },
                aiScore: {
                  type: SchemaType.NUMBER,
                  description: 'The independent score computed by AI based on reference rubric & candidate\'s answer to main + follow-up questions',
                },
                maxScore: {
                  type: SchemaType.NUMBER,
                  description: 'Maximum possible score for this question (default 4)',
                },
                scoreMatches: {
                  type: SchemaType.BOOLEAN,
                  description: 'Whether the Expert Score and AI Score are identical',
                },
                aiVerdict: {
                  type: SchemaType.STRING,
                  description: 'APPROPRIATE | OVER_MARKED | UNDER_MARKED | INSUFFICIENT_EVIDENCE',
                },
                reasoning: {
                  type: SchemaType.STRING,
                  description: 'If scores match, justify why both Expert and AI chose this score based on evidence. If scores differ, explain clearly why AI selected a different score.',
                },
                transcriptTimestamp: {
                  type: SchemaType.STRING,
                  description: 'Timestamp in transcript where this question was asked/answered',
                },
                transcriptEvidence: {
                  type: SchemaType.STRING,
                  description: 'Verbatim quote from transcript supporting the verdict (max 100 words)',
                },
              },
              required: [
                'criterion',
                'spokenQuestionInTranscript',
                'followUpQuestions',
                'expertScore',
                'expertNotes',
                'expertFeedbackQuality',
                'expertFeedbackAuditNote',
                'aiScore',
                'maxScore',
                'scoreMatches',
                'aiVerdict',
                'reasoning',
                'transcriptTimestamp',
                'transcriptEvidence',
              ],
            },
          },
          overallVerdict: {
            type: SchemaType.STRING,
            description: 'APPROPRIATE | OVER_MARKED | UNDER_MARKED — overall mark quality for this student',
          },
          overallReasoning: {
            type: SchemaType.STRING,
            description: 'Summary of mark quality across all questions for this student (2-3 sentences)',
          },
        },
        required: [
          'studentName',
          'studentFoundInSheet',
          'matchedSheetName',
          'transcriptSegmentStart',
          'transcriptSegmentEnd',
          'criteriaResults',
          'overallVerdict',
          'overallReasoning',
        ],
      },
    },
  },
  required: [
    'batchName',
    'totalStudentsEvaluated',
    'batchSummary',
    'students',
  ],
};
