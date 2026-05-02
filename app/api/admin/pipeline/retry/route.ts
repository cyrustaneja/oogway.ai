/**
 * POST /api/admin/pipeline/retry
 *
 * Resets a FAILED session so it re-enters the pipeline at CHAPTERS_DETECTED
 * (cached chapter results are reused, saving AI cost).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      select: { pipeline_stage: true, chapters_json: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Determine restart point — if we have chapters, resume from CHAPTERS_DETECTED
    // Otherwise restart from UPLOADED
    const restartStage = session.chapters_json ? 'CHAPTERS_DETECTED' : 'UPLOADED'

    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        pipeline_stage: restartStage,
        v3Status: 'PENDING',
        v3Error: null,
        stage_attempts: {} as any,
        next_action_at: new Date(),
        updatedAt: new Date(),
      } as any,
    })

    console.log(`[retry] Session ${sessionId} reset to ${restartStage}`)

    return NextResponse.json({
      success: true,
      sessionId,
      restart_stage: restartStage,
      chapters_preserved: !!session.chapters_json,
    })
  } catch (err: any) {
    console.error('[retry] Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
