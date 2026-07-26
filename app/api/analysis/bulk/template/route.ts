import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query live module names from DB (synced from Google Sheets)
    const modules = await prisma.module.findMany({
      where: { deletedAt: null },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const uniqueModules = Array.from(
      new Set(modules.map((m) => m.name?.trim()).filter(Boolean))
    ).sort();

    const BLACKLIST = new Set(['na', 'buffer', 'off', 'holiday', 'break', 'test', 'assessment', 'internal', 'junk', 'temp']);
    const cleanModules = uniqueModules.filter((m) => !BLACKLIST.has(m.toLowerCase()));

    const moduleListComment = `# LIVE CURRICULUM MODULES IN SYSTEM (Synced from Google Sheet):\n# ${cleanModules.join(' | ')}\n# Note: Provide Session Name or Session ID — module is automatically linked!\n`;
    const templateHeader = "Expert,Batch,Session,Conducted Date,Video URL,Transcript URL\n";
    const sampleRow1 = 'Vikram Sharma,MLP 43 FT,Audience and Targeting Options,2026-07-25 14:00,https://zoom.us/rec/play/123,https://drive.google.com/file/d/abc\n';
    const sampleRow2 = 'AgamPreet Kaur,MLP 45PT,Ecom Subjective Test Discussion,2026-07-25 16:30,https://zoom.us/rec/play/456,\n';

    const csvContent = moduleListComment + templateHeader + sampleRow1 + sampleRow2;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Oogway_Bulk_Sessions_Template.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[GET /api/analysis/bulk/template]', error);
    return NextResponse.json({ error: 'Failed to generate session template.' }, { status: 500 });
  }
}
