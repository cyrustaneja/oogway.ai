/**
 * POST /api/analysis/[id]/coaching-tips
 *
 * On-demand coaching tips generator — completely independent of the Stage 1–4
 * pipeline. Reads the existing Stage 3 synthesis from the DB, calls Gemini
 * with the coaching prompt, and returns tips. Nothing is written to the DB.
 *
 * Auth: same getAuthToken() pattern as all other analysis routes.
 */

import fs from 'fs'
import path from 'path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth-token'
import { prisma } from '@/lib/db'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { coachingResponseSchema } from '@/lib/pipeline/schemas/coaching.schema'

export const dynamic = 'force-dynamic'

// Generous timeout — this is a user-initiated call, not a background job.
// The synthesis JSON is small so Gemini should be fast (~10–20s typical).
const COACHING_TIMEOUT_MS = 120_000
const COACHING_INITIAL_BUDGET = 4_000
const COACHING_MAX_BUDGET = 8_000
const COACHING_MODEL = 'gemini-2.5-flash'

function getPrompt(): string {
  return fs.readFileSync(
    path.join(process.cwd(), 'lib/pipeline/prompts/on-demand-coaching.txt'),
    'utf-8',
  )
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 1. Load the session to get expert / batch context
  const session = await prisma.analysisSession.findUnique({
    where: { id, deletedAt: null },
    include: {
      expert: { select: { name: true } },
      batch:  { select: { name: true } },
    },
  })

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // 2. Load the Stage 3 synthesis — coaching tips are derived from this only
  const v2 = await prisma.analysisV2.findUnique({ where: { sessionId: id } })

  if (!v2?.full_synthesis) {
    return NextResponse.json(
      { error: 'No synthesis available. Run the full analysis first.' },
      { status: 422 },
    )
  }

  const expertName = session.expert?.name ?? 'Unknown'
  const batchName  = session.batch?.name  ?? 'Unknown'

  const userPayload = JSON.stringify({
    expert_name:   expertName,
    batch_name:    batchName,
    session_title: session.name,
    synthesis:     v2.full_synthesis,
  })

  console.log(`[CoachingTips] ${id}: generating tips for ${expertName}`)

  try {
    const result = await callStage<{
      example_tips:    any[]
      topic_tips:      any[]
      engagement_tips: any[]
      doubt_tips:      any[]
    }>({
      model:          COACHING_MODEL,
      system:         getPrompt(),
      user:           userPayload,
      responseSchema: coachingResponseSchema,
      initialBudget:  COACHING_INITIAL_BUDGET,
      maxBudget:      COACHING_MAX_BUDGET,
      stageName:      `CoachingTips[${id.slice(0, 8)}]`,
      timeoutMs:      COACHING_TIMEOUT_MS,
    })

    const totalTips =
      (result.example_tips?.length    ?? 0) +
      (result.topic_tips?.length      ?? 0) +
      (result.engagement_tips?.length ?? 0) +
      (result.doubt_tips?.length      ?? 0)

    console.log(`[CoachingTips] ${id}: ${totalTips} tips generated`)

    return NextResponse.json({
      session_id:     id,
      expert_name:    expertName,
      session_title:  session.name,
      generated_at:   new Date().toISOString(),
      example_tips:    result.example_tips    ?? [],
      topic_tips:      result.topic_tips      ?? [],
      engagement_tips: result.engagement_tips ?? [],
      doubt_tips:      result.doubt_tips      ?? [],
      total_tips:      totalTips,
    })
  } catch (err: any) {
    console.error(`[CoachingTips] ${id}: generation failed:`, err?.message ?? err)
    return NextResponse.json(
      { error: 'Tip generation failed. Please try again.' },
      { status: 500 },
    )
  }
}
