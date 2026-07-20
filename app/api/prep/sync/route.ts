import { NextResponse } from 'next/server';
import { getLivePrepSessions } from '@/lib/server/expert-prep-sync';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    const sessions = await getLivePrepSessions(force);
    return NextResponse.json({
      success: true,
      count: sessions.length,
      syncedAt: new Date().toISOString(),
      sessions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync prep sessions' },
      { status: 500 }
    );
  }
}
