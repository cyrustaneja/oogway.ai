/**
 * Stage 4 handler — Flag Generator.
 *
 * Reads the synthesis from AnalysisV2.full_synthesis, generates operational
 * flags, and writes them to AnalysisV2.session_flags.
 * Transitions pipeline_stage from SYNTHESIZED → COMPLETE.
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { LIMITS } from '@/lib/config/limits'
import { callStage } from '@/lib/pipeline/utils/call-stage'
import { stage4ResponseSchema } from '@/lib/pipeline/schemas/stage4.schema'

function getPrompt() {
  return fs.readFileSync(
    path.join(process.cwd(), 'lib/pipeline/prompts/stage4-flag-generator.txt'),
    'utf-8'
  )
}

export async function handleStage4(sessionId: string): Promise<void> {
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
    include: { expert: { select: { name: true } }, batch: { select: { name: true } } },
  })
  if (!session) throw new Error(`[Stage4] Session ${sessionId} not found`)

  const v2 = await prisma.analysisV2.findUnique({ where: { sessionId } })
  if (!v2 || !v2.full_synthesis) {
    throw new Error(`[Stage4] No synthesis found for session ${sessionId}`)
  }

  const expertName = session.expert?.name ?? 'Unknown'
  const batchName = session.batch?.name ?? 'Unknown'

  const userPayload = JSON.stringify({
    expert_name: expertName,
    batch_name: batchName,
    session_title: session.name,
    session_id: sessionId,
    synthesis: v2.full_synthesis,
  })

  const stageName = `Stage4[${sessionId.slice(0, 8)}]`

  let flags: any[] = []
  try {
    const flagResult = await callStage<{ flags: any[] }>({
      model: LIMITS.stage4Model,
      system: getPrompt(),
      user: userPayload,
      responseSchema: stage4ResponseSchema,
      initialBudget: LIMITS.stage4TokenBudget,
      maxBudget: LIMITS.stage4TokenCap,
      stageName,
      timeoutMs: LIMITS.stage4TimeoutMs,
    })
    flags = flagResult.flags ?? []
  } catch (err: any) {
    // Flags are nice-to-have — don't let them kill the pipeline.
    // Write empty flags and complete normally.
    console.warn(
      `[Stage4] ${sessionId}: flag generation failed, completing with empty flags. ` +
      `Error: ${err?.message?.slice(0, 200)}`,
    )
  }
  const highCount = flags.filter((f: any) => f.severity === 'high').length
  const mediumCount = flags.filter((f: any) => f.severity === 'medium').length
  const lowCount = flags.filter((f: any) => f.severity === 'low').length

  console.log(
    `[Stage4] ${sessionId}: ${flags.length} flags generated ` +
    `(${highCount} high, ${mediumCount} medium, ${lowCount} low)`
  )

  await prisma.analysisV2.update({
    where: { sessionId },
    data: {
      status: 'complete',
      session_flags: {
        flags,
        total_flags: flags.length,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
      } as any,
    },
  })

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      pipeline_stage: 'COMPLETE',
      v3Status: 'COMPLETE',
      next_action_at: new Date(),
    } as any,
  })
}
