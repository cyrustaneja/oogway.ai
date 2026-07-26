export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncCourseSheet } from '@/lib/server/sheets-course-sync';

/**
 * GET /api/cron/sync-sheets
 * Runs daily (6 AM IST) to sync all courses that have a Google Sheet URL attached.
 * Protected by CRON_SECRET header.
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/sync-sheets", "schedule": "30 0 * * *" }
 *   (0:30 UTC = 6:00 AM IST)
 */
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { sheetUrl: { not: null }, deletedAt: null },
    select: { id: true, name: true },
  });

  if (courses.length === 0) {
    return NextResponse.json({ message: 'No courses with sheet URLs found', synced: 0 });
  }

  const results: Array<{ courseId: string; name: string; result?: any; error?: string }> = [];

  for (const course of courses) {
    try {
      const result = await syncCourseSheet(course.id);
      results.push({ courseId: course.id, name: course.name, result });
    } catch (err: any) {
      results.push({ courseId: course.id, name: course.name, error: err.message });
    }
  }

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    coursesProcessed: courses.length,
    results,
  });
}
