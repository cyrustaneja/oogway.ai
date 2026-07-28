import { NextResponse } from 'next/server';
import {
  getInstantCurriculumProgress,
  getProactiveSessionIntelligence,
  getProactiveBatchIntelligence,
} from '@/lib/server/expert-prep-intelligence';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionNoteId = searchParams.get('sessionNoteId');
  const batchId = searchParams.get('batchId');

  try {
    // 1. Instant 0ms Curriculum Progress (No AI)
    const instantProgress = batchId
      ? await getInstantCurriculumProgress(batchId, sessionNoteId ?? undefined)
      : null;

    // 2. Parallel Session & Batch AI Prep Intelligence
    const [sessionIntel, batchIntel] = await Promise.all([
      sessionNoteId ? getProactiveSessionIntelligence(sessionNoteId) : Promise.resolve(null),
      batchId ? getProactiveBatchIntelligence(batchId, sessionNoteId ?? undefined) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      instantProgress,
      sessionIntel,
      batchIntel,
    });
  } catch (error: any) {
    console.error('[API/prep/proactive] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch proactive intelligence' },
      { status: 500 }
    );
  }
}
