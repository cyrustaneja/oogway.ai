/**
 * POST /api/analysis/bulk-rerun
 * Bulk endpoint to re-run / re-analyse selected sessions.
 * Resets the session pipeline state and triggers re-analysis.
 * Upon successful completion, fresh AI results overwrite the existing evaluation.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { POST as triggerTick } from '@/app/api/pipeline/tick/route';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids
      : body.sessionId
      ? [body.sessionId]
      : [];

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'ids or sessionId is required' }, { status: 400 });
    }

    // Reset sessions in database so pipeline picks them up cleanly
    await prisma.analysisSession.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        v3Status: 'PENDING',
        pipeline_stage: 'UPLOADED',
        v3Error: null,
        next_action_at: new Date(),
        updatedAt: new Date(),
      } as any,
    });

    console.log(`[bulk-rerun] Triggered re-analysis for ${ids.length} session(s): ${ids.join(', ')}`);

    // Trigger pipeline tick non-blocking
    void triggerTick(
      new Request('https://master-oogway-ai.vercel.app/api/pipeline/tick', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.CRON_SECRET || ''}` },
      })
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Re-analysis triggered for ${ids.length} session(s)`,
      count: ids.length,
      ids,
    });
  } catch (err: any) {
    console.error('[bulk-rerun] Error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
