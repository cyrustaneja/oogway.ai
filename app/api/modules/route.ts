export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const modules = await prisma.module.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, course: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });

    // Deduplicate unique module names
    const uniqueNames = Array.from(
      new Set(modules.map((m) => m.name?.trim()).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      modules,
      uniqueModuleNames: uniqueNames,
    });
  } catch (error: any) {
    console.error('[GET /api/modules]', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}
