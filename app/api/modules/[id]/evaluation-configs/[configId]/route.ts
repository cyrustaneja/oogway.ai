export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sheetUrl: z.string().min(1, 'Google Sheet evaluation link cannot be empty').url('Invalid Google Sheets URL').optional(),
  scoreScale: z.number().int().min(2).max(10).optional(),
  rubric: z.array(z.any()).optional(),
}).partial();

// GET /api/modules/[id]/evaluation-configs/[configId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; configId: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { configId } = await params;
  const config = await prisma.evaluationConfig.findUnique({
    where: { id: configId, deletedAt: null },
  });
  if (!config) return NextResponse.json({ error: 'Config not found' }, { status: 404 });

  return NextResponse.json(config);
}

// PATCH /api/modules/[id]/evaluation-configs/[configId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; configId: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (token as any).role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can update evaluation configs.' }, { status: 403 });
  }

  const { configId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.format() }, { status: 400 });
  }

  const { rubric, sheetUrl, ...rest } = parsed.data;

  const updated = await prisma.evaluationConfig.update({
    where: { id: configId, deletedAt: null },
    data: {
      ...rest,
      ...(sheetUrl !== undefined ? { sheetUrl: sheetUrl || null } : {}),
      ...(rubric !== undefined ? { rubric: rubric as any } : {}),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/modules/[id]/evaluation-configs/[configId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; configId: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (token as any).role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete evaluation configs.' }, { status: 403 });
  }

  const { configId } = await params;

  await prisma.evaluationConfig.update({
    where: { id: configId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
