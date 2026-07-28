import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { generateMacroPulseSummary } from '@/lib/server/macro-pulse-analyzer';

export async function POST(request: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId are required' }, { status: 400 });
    }

    if (!['course', 'module', 'batch', 'expert'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    const summary = await generateMacroPulseSummary(targetType, targetId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('[POST /api/macro-pulse] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Macro AI summary' },
      { status: 500 }
    );
  }
}
