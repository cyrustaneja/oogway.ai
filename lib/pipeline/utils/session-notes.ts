/**
 * session-notes.ts — Retrieves planned topics and learning objectives
 * from the SessionNote linked to an AnalysisSession.
 *
 * The current schema stores planned topics in SessionNote.keyTopics (String[]).
 * This is the "planned_topics" used by Stage 3 to check topic coverage.
 *
 * NOTE: The Phase 1 schema uses SessionNote (not CourseSession). This file
 * uses the actual Prisma model names as they exist post-baseline.
 */

import { prisma } from '@/lib/prisma'

export type SessionContextNotes = {
  planned_topics: string[]
  scheduled_duration_mins: number | null
  expert_name: string | null
  batch_name: string | null
  session_note_content: string | null
  expert_gaps: string | null
}

export async function getSessionNotes(sessionId: string): Promise<SessionContextNotes> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: {
      expert: { select: { name: true } },
      sessionNote: {
        select: {
          keyTopics: true,
          content: true,
          expertGaps: true,
          module: {
            select: {
              course: { select: { name: true } },
            },
          },
        },
      },
      batch: { select: { name: true } },
    },
  })

  const keyTopics = session?.sessionNote?.keyTopics ?? []
  let planned_topics = keyTopics

  // Fallback: if keyTopics is empty, try to parse from content (one topic per line)
  if (planned_topics.length === 0 && session?.sessionNote?.content) {
    planned_topics = session.sessionNote.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 100)
  }

  return {
    planned_topics,
    scheduled_duration_mins: session?.scheduledDuration ?? null,
    expert_name: session?.expert?.name ?? null,
    batch_name: session?.batch?.name ?? null,
    session_note_content: session?.sessionNote?.content ?? null,
    expert_gaps: session?.sessionNote?.expertGaps ?? null,
  }
}
