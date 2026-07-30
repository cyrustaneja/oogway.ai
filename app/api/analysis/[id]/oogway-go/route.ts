import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleOogwayGo } from '@/lib/pipeline/handlers/oogway-go-handler';

/**
 * GET /api/analysis/[id]/oogway-go
 * Returns the saved Oogway Go result (if available) and current status.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.analysisSession.findUnique({
      where: { id },
      select: { oogwayGoResult: true, oogwayGoStatus: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: session.oogwayGoStatus || 'NOT_STARTED',
      result: session.oogwayGoResult || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/analysis/[id]/oogway-go
 * Triggers Oogway Go analysis for a session. Non-blocking — returns immediately.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const session = await prisma.analysisSession.findUnique({
      where: { id },
      select: { id: true, oogwayGoStatus: true, transcriptUrl: true, transcript_clean: true, transcriptRaw: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If already running, don't start again
    if (session.oogwayGoStatus === 'RUNNING') {
      return NextResponse.json({ status: 'RUNNING', message: 'Oogway Go analysis is already in progress' });
    }

    // Fire and forget — run in background
    handleOogwayGo(id).catch(err => {
      console.error(`[Oogway Go API] Background analysis failed for ${id}:`, err);
    });

    return NextResponse.json({
      status: 'RUNNING',
      message: 'Oogway Go analysis started. This typically takes 1-2 minutes.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
