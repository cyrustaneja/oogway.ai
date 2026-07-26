import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query active courses from DB
    const courses = await prisma.course.findMany({
      where: { deletedAt: null },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const courseNames = courses.map((c) => c.name).filter(Boolean);
    const courseListComment = `# LIVE COURSES IN SYSTEM (Synced from Curriculum):\n# ${courseNames.join(' | ')}\n`;
    const templateHeader = "Batch Name,Course Name,Description\n";
    const sampleRow1 = "MLP 46 FT,Marketing Launchpad Program,Full Time Cohort 46\n";
    const sampleRow2 = "MMP Oct 2026,Marketing Strategy,Part Time Cohort Oct 2026\n";

    const csvContent = courseListComment + templateHeader + sampleRow1 + sampleRow2;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Oogway_Batches_Bulk_Template.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[GET /api/batches/template]', error);
    return NextResponse.json({ error: 'Failed to generate batch CSV template.' }, { status: 500 });
  }
}
