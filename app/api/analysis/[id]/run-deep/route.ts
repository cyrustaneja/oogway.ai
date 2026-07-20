import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST as triggerTick } from '@/app/api/pipeline/tick/route';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify session exists and is in the paused state
    const session = await prisma.analysisSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.pipeline_stage !== 'WAITING_FOR_DEEP_ANALYSIS') {
      return NextResponse.json({ error: 'Session is not waiting for Deep Analysis' }, { status: 400 });
    }

    // Resume the pipeline from Stage 2
    await prisma.analysisSession.update({
      where: { id },
      data: {
        pipeline_stage: 'UPLOADED',
        v3Status: 'PREPROCESSING',
        next_action_at: new Date(),
      } as any,
    });

    setTimeout(() => {
      triggerTick(new Request("http://localhost/api/pipeline/tick", { 
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
      })).catch(console.error);
    }, 1000);

    return NextResponse.json({ success: true, message: 'Deep Analysis started' });
  } catch (error: any) {
    console.error('Error starting deep analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
