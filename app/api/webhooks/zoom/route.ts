/**
 * POST /api/webhooks/zoom — Dormant scaffold for Zoom recording webhooks.
 *
 * Not active in V1 — the integration is wired so it's ready to turn on later.
 *
 * Handles:
 *  - endpoint.url_validation: echoes back the plainToken hash
 *  - recording.completed: upserts AnalysisSession with zoom_recording_id
 *  - Everything else: returns 200 silently
 */

import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET ?? ''

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const event = body?.event

    // ── URL validation challenge ─────────────────────────────────────────
    if (event === 'endpoint.url_validation') {
      const plainToken = body?.payload?.plainToken
      if (!plainToken || !ZOOM_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing token or secret' }, { status: 400 })
      }
      const hash = createHmac('sha256', ZOOM_WEBHOOK_SECRET)
        .update(plainToken)
        .digest('hex')
      return NextResponse.json({
        plainToken,
        encryptedToken: hash,
      })
    }

    // ── Recording completed ─────────────────────────────────────────────
    if (event === 'recording.completed') {
      const recording = body?.payload?.object
      const recordingId = recording?.uuid
      const downloadUrl = recording?.recording_files?.[0]?.download_url

      if (!recordingId) {
        console.warn('[zoom-webhook] recording.completed without uuid')
        return NextResponse.json({ ok: true })
      }

      console.log(`[zoom-webhook] Recording completed: ${recordingId}`)

      // Upsert — zoom_recording_id has a unique index, so duplicates are deduped
      await prisma.analysisSession.upsert({
        where: {
          // Use a findFirst as workaround since zoom_recording_id isn't @id
          // The unique index on zoom_recording_id prevents duplicates at DB level
          id: `zoom_${recordingId}`, // placeholder — in production use actual lookup
        },
        create: {
          id: `zoom_${recordingId.slice(0, 20)}`,
          name: `Zoom Recording — ${recording?.topic ?? 'Untitled'}`,
          expertId: '', // Will need manual mapping
          zoom_recording_id: recordingId,
          zoom_download_url: downloadUrl ?? null,
          source: 'zoom',
          v3Status: 'PENDING',
          pipeline_stage: 'UPLOADED',
          next_action_at: new Date(),
          stage_attempts: {} as any,
        } as any,
        update: {
          zoom_download_url: downloadUrl ?? null,
        } as any,
      })

      return NextResponse.json({ ok: true, recording_id: recordingId })
    }

    // ── All other events ────────────────────────────────────────────────
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[zoom-webhook] Error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
