import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { prisma } from '@/lib/db';
import { resolveBulkSessionRows, RawBulkRow } from '@/lib/server/bulk-session-parser';
import { POST as triggerTick } from '@/app/api/pipeline/tick/route';

export async function POST(req: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (token as any).role;
  if (role === 'EXPERT') {
    return NextResponse.json({ error: 'Experts cannot create bulk analysis sessions.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body.action || 'create';
    const rawRows: RawBulkRow[] = body.rows || [];

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for bulk processing.' }, { status: 400 });
    }

    // Resolve entities against database
    const resolvedRows = await resolveBulkSessionRows(rawRows);

    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        preview: resolvedRows,
        validCount: resolvedRows.filter((r) => r.isValid).length,
        invalidCount: resolvedRows.filter((r) => !r.isValid).length,
      });
    }

    // Filter valid rows for creation
    const validRows = resolvedRows.filter((r) => r.isValid);

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'All rows failed validation. Please fix errors and retry.' }, { status: 400 });
    }

    // Create sessions sequentially in DB with staged timestamps for exact sequential execution
    const createdSessions = [];
    const now = Date.now();

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      // Add a 100ms offset to createdAt so sequence order is strictly preserved
      const seqTimestamp = new Date(now + i * 100);

      const created = await prisma.analysisSession.create({
        data: {
          name: `Analysis - ${row.expertName} - ${row.sessionNoteName}`,
          expertId: row.expertId!,
          batchId: row.batchId,
          sessionNoteId: row.sessionNoteId,
          conductedAt: row.parsedConductedAt,
          createdAt: seqTimestamp,
          videoUrl: row.videoUrl.trim(),
          transcriptUrl: row.transcriptUrl ? row.transcriptUrl.trim() : null,
          transcriptRaw: row.transcriptText ? row.transcriptText.trim() : null,
          v3Status: 'PENDING',
          tier: 'TIER1',
          pipeline_stage: 'PULSE_PENDING',
        },
      });

      createdSessions.push(created);
    }

    // Trigger pipeline worker immediately
    setTimeout(() => {
      triggerTick(
        new Request('http://localhost/api/pipeline/tick', {
          method: 'POST',
          headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        })
      ).catch(console.error);
    }, 1000);

    return NextResponse.json({
      success: true,
      count: createdSessions.length,
      createdSessions,
    });
  } catch (err: any) {
    console.error('[POST /api/analysis/bulk]', err);
    return NextResponse.json({ error: err.message || 'Failed to create bulk analysis sessions.' }, { status: 500 });
  }
}
