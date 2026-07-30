import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleStudentGo } from '@/lib/pipeline/handlers/student-go-handler';

/**
 * GET /api/analysis/[id]/student-go
 * Returns saved Student Go audit result (if available) and status.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.analysisSession.findUnique({
      where: { id },
      select: { studentGoResult: true, studentGoStatus: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: session.studentGoStatus || 'NOT_STARTED',
      result: session.studentGoResult || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/analysis/[id]/student-go
 * Triggers Student Go analysis for a session. Non-blocking.
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
      select: { id: true, studentGoStatus: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Trigger background execution
    handleStudentGo(id).catch(err => {
      console.error(`[API student-go] Background task error for ${id}:`, err);
    });

    return NextResponse.json({
      status: 'RUNNING',
      message: 'Student Go analysis started'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
