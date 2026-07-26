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

    const moduleListComment = `# LIVE CURRICULUM MODULES IN SYSTEM (Synced from Google Sheet):\n# ${cleanModules.join(' | ')}\n# Note: Separate multiple modules with a semicolon (e.g. "Brand; Search; Programmatic")\n`;
    const templateHeader = "Name,Email,Role,Assigned Modules,Bio\n";
    const sampleRow1 = 'Vikram Sharma,vikram@kraftshala.com,ADMIN,Brand; Search; Programmatic,Head of Marketing Academics\n';
    const sampleRow2 = 'AgamPreet Kaur,agam@kraftshala.com,EXPERT,Ecommerce; Content; Meta,Senior Lead Trainer\n';

    const csvContent = moduleListComment + templateHeader + sampleRow1 + sampleRow2;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Oogway_Experts_Bulk_Template.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[GET /api/experts/template]', error);
    return NextResponse.json({ error: 'Failed to generate expert template.' }, { status: 500 });
  }
}
