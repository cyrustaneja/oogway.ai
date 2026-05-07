/**
 * Stage 3 handler — Synthesizer.
 *
 * Reads all AnalysisChapterResult rows for the session, sends them with
 * session context to Gemini, and writes the synthesis to AnalysisV2.
 * Transitions pipeline_stage from EXTRACTED → SYNTHESIZED.
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/config/limits'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { getSessionNotes } from '@/lib/pipeline/utils/session-notes'
import { stage3ResponseSchema } from '@/lib/pipeline/schemas/stage3.schema'
import { SessionAnalysisSchema } from '@/lib/pipeline/schemas/contract.zod'

function getPrompt() {
  return fs.readFileSync(
    path.join(process.cwd(), 'lib/pipeline/prompts/stage3-synthesizer.txt'),
    'utf-8'
  )
}

export async function handleStage3(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { expert: { select: { name: true } }, batch: { select: { name: true } } },
  })
  if (!session) throw new Error(`[Stage3] Session ${sessionId} not found`)

  const chapterResults = await prisma.analysisChapterResult.findMany({
    where: { session_id: sessionId },
    orderBy: { chapter_index: 'asc' },
  })

  if (chapterResults.length === 0) {
    throw new Error(`[Stage3] No chapter results for session ${sessionId}`)
  }

  const notes = await getSessionNotes(sessionId)
  const expertName = session.expert?.name ?? 'Unknown'
  const batchName = notes.batch_name ?? session.batch?.name ?? 'Unknown'

  // Bottleneck #3 fix: build a synthesis-ready digest of each chapter instead
  // of dumping the full raw JSON. The full chapter data stays in the DB —
  // Stage 3 only needs the pedagogical signals for synthesis.
  function digestChapter(r: any): any {
    const res = r.result ?? r
    return {
      chapter_num: res.chapter_num,
      title: res.title,
      is_teaching: res.is_teaching,
      what_was_taught: res.what_was_taught,
      teaching_depth: res.teaching_depth ? { label: res.teaching_depth.label, score: res.teaching_depth.score, rationale: res.teaching_depth.rationale } : undefined,
      pacing: res.pacing ? { label: res.pacing.label, score: res.pacing.score, rationale: res.pacing.rationale } : undefined,
      engagement: res.engagement ? { label: res.engagement.label, score: res.engagement.score, rationale: res.engagement.rationale } : undefined,
      example_gap: res.example_gap ? { label: res.example_gap.label, score: res.example_gap.score, rationale: res.example_gap.rationale } : undefined,
      analogies: (res.analogies ?? []).map((a: any) => ({ concept_explained: a.concept_explained, quality: a.quality, verbatim_quote: a.verbatim_quote })),
      doubts: (res.doubts ?? []).map((d: any) => ({ student_name_raw: d.student_name_raw, doubt_verbatim: d.doubt_verbatim, timestamp: d.timestamp, resolution: d.resolution, resolved_flag: d.resolved_flag, resolution_accuracy: d.resolution_accuracy })),
      confusion_points: res.confusion_points ?? [],
      unresolved_doubt_flag: res.unresolved_doubt_flag,
      accuracy_check: res.accuracy_check,
    }
  }

  const chapterDigests = chapterResults.map(r => digestChapter(r))

  // ─── CROSS-CHAPTER DEDUPLICATION ───
  // If the same doubt/question appears in adjacent chapters with identical 
  // timestamps, only keep the first occurrence to avoid synthesis bloat.
  const seenDoubts = new Set<string>()
  for (const ch of chapterDigests) {
    if (ch.doubts) {
      ch.doubts = ch.doubts.filter((d: any) => {
        const key = `${d.timestamp}_${(d.student_name_raw || '').toLowerCase()}_${(d.doubt_verbatim || '').slice(0, 30).toLowerCase()}`
        if (seenDoubts.has(key)) return false
        seenDoubts.add(key)
        return true
      })
    }
  }

  // Safety cap: if the total JSON still exceeds a reasonable ceiling, truncate
  const totalJson = JSON.stringify(chapterDigests)
  const MAX_CHARS = LIMITS.stage3ChapterSummaryMaxChars * chapterResults.length
  const chapters =
    totalJson.length > MAX_CHARS
      ? chapterDigests.map(ch => ({ ...ch, what_was_taught: (ch.what_was_taught ?? '').slice(0, 600) }))
      : chapterDigests

  const userPayload = JSON.stringify({
    expert_name: expertName,
    batch_name: batchName,
    session_title: session.name,
    planned_topics: notes.planned_topics,
    chapters,
  })

  const stageName = `Stage3[${sessionId.slice(0, 8)}]`

  const rawSynthesis = await callStage<any>({
    model: LIMITS.stage3Model,
    system: getPrompt(),
    user: userPayload,
    responseSchema: stage3ResponseSchema,
    initialBudget: LIMITS.stage3TokenBudget,
    maxBudget: LIMITS.stage3TokenCap,
    stageName,
    timeoutMs: LIMITS.stage3TimeoutMs,
  })

  // RUNTIME CONTRACT GUARD — warn but accept. The UI has EmptyState
  // fallbacks for every section, so a partial synthesis is still usable.
  // Throwing here kills the whole pipeline for a schema mismatch that the
  // user would never notice.
  const validation = SessionAnalysisSchema.safeParse(rawSynthesis)
  let synthesis: any
  if (!validation.success) {
    console.warn(
      `[Stage3] Contract validation warning for session ${sessionId} — ` +
      `${validation.error.issues.length} issue(s). Accepting raw output. ` +
      `First issue: ${JSON.stringify(validation.error.issues[0])}`,
    )
    synthesis = rawSynthesis  // use raw — UI EmptyState handles missing fields
  } else {
    synthesis = validation.data
  }

  console.log(
    `[Stage3] ${sessionId}: synthesis complete — ` +
    `${synthesis.key_learning_points?.length ?? 0} learning points` +
    `${!validation.success ? ' (schema warnings present)' : ''}`,
  )

  // Upsert AnalysisV2 — null-safe access throughout. If schema validation was
  // soft-skipped, some nested objects may be missing or shaped differently.
  const dbData = {
    sessionId,
    status: 'synthesized',
    full_synthesis: synthesis as any,
    session_flags: synthesis.session_flags ?? null,
    accuracy_issues: synthesis.expert_audit?.accuracy_issues ?? null,
    teaching_depth_map: synthesis.expert_audit?.teaching_depth_map ?? null,
    pacing_map: synthesis.expert_audit?.pacing_map ?? null,
    engagement_by_chapter: synthesis.student_log?.engagement_by_chapter ?? null,
    confusion_summary: synthesis.student_log?.confusion_summary ?? null,
    unresolved_doubts: synthesis.student_log?.unresolved_doubts ?? null,
    topics_missed: synthesis.topics_missed_from_notes ?? null,
    context_setup: synthesis.context_setup ?? null,
    topics_covered: synthesis.topics_covered ?? null,
    schema_version: synthesis.schema_version || 'v1',
  }

  await prisma.analysisV2.upsert({
    where: { sessionId },
    create: dbData,
    update: dbData,
  })

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      pipeline_stage: 'SYNTHESIZED',
      v3Status: 'SYNTHESISING',
      next_action_at: new Date(),
    } as any,
  })
}
