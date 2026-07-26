import { NextResponse } from 'next/server';
import {
  getProactiveSessionIntelligence,
  getProactiveBatchIntelligence,
} from '@/lib/server/expert-prep-intelligence';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionNoteId = searchParams.get('sessionNoteId');
  const batchId = searchParams.get('batchId');

  try {
    // Run Session Intel & Batch Intel IN PARALLEL for sub-3-second responses
    const [sessionIntel, batchIntel] = await Promise.all([
      sessionNoteId ? getProactiveSessionIntelligence(sessionNoteId) : Promise.resolve(null),
      batchId ? getProactiveBatchIntelligence(batchId, sessionNoteId ?? undefined) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
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
