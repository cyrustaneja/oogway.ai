export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { syncCourseSheet } from '@/lib/server/sheets-course-sync';

/**
 * POST /api/courses/[id]/sync-sheet
 * Triggers an immediate Google Sheet sync for the specified course.
 * Returns a summary of what was added/updated/skipped.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (token as any).role;
  if (role !== 'ADMIN' && role !== 'TEAM') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await syncCourseSheet(id);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[sync-sheet] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
