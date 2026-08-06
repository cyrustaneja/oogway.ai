export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const rubricCriterionSchema = z.object({
  criterion: z.string().min(1),
  scoreDescriptors: z.array(z.object({
    score: z.number().int().min(0),
    label: z.string(),
    goodLooksLike: z.string().optional().default(''),
    badLooksLike: z.string().optional().default(''),
    exampleQuestion: z.string().optional().default(''),
  })),
});

const createSchema = z.object({
  evaluationType: z.enum(['VIVA', 'INTERVIEW']),
  name: z.string().min(1),
  description: z.string().optional(),
  sheetUrl: z.string().min(1, 'Google Sheet evaluation link is required.').url('Invalid Google Sheets URL'),
  scoreScale: z.number().int().min(2).max(10).default(4),
  rubric: z.array(rubricCriterionSchema).default([]),
});

// GET /api/modules/[id]/evaluation-configs
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: moduleId } = await params;

  const configs = await prisma.evaluationConfig.findMany({
    where: { moduleId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { analysisSessions: true } },
    },
  });

  return NextResponse.json(configs);
}

// POST /api/modules/[id]/evaluation-configs
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (token as any).role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage evaluation configs.' }, { status: 403 });
  }

  const { id: moduleId } = await params;

  // Verify module exists
  const module = await prisma.module.findUnique({ where: { id: moduleId, deletedAt: null } });
  if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.format() }, { status: 400 });
  }

  const { evaluationType, name, description, sheetUrl, scoreScale, rubric } = parsed.data;

  const config = await prisma.evaluationConfig.create({
    data: {
      moduleId,
      evaluationType,
      name,
      description: description ?? null,
      sheetUrl: sheetUrl || null,
      scoreScale,
      rubric: rubric as any,
    },
  });

  return NextResponse.json(config, { status: 201 });
}
