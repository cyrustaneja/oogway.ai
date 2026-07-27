import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export interface RawExpertRow {
  name: string;
  email: string;
  role?: 'ADMIN' | 'TEAM' | 'EXPERT';
  assignedModules?: string;
  tags?: string;
  bio?: string;
}

export interface ResolvedExpertRow extends RawExpertRow {
  parsedRole: 'ADMIN' | 'TEAM' | 'EXPERT';
  parsedModules: string[];
  isValid: boolean;
  validationError?: string;
}

export async function POST(req: Request) {
  const token = await getAuthToken();

  // ONLY ADMIN can manage user accounts & roles
  if (!token || (token as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only Admins can bulk import users or assign roles.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body.action || 'create';
    const rawRows: RawExpertRow[] = body.rows || [];

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json({ error: 'No expert rows provided.' }, { status: 400 });
    }

    // Fetch all valid module names from DB for validation/mapping
    const dbModules = await prisma.module.findMany({
      where: { deletedAt: null },
      select: { name: true },
    });

    // Resolve & Validate Experts
    const resolvedRows: ResolvedExpertRow[] = rawRows.map((row) => {
      const name = (row.name ?? '').trim();
      const email = (row.email ?? '').trim().toLowerCase();
      const rawRole = (row.role ?? '').trim().toUpperCase();
      const role: 'ADMIN' | 'TEAM' | 'EXPERT' = 
        rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'TEAM' ? 'TEAM' : 'EXPERT';

      let isValid = true;
      let validationError: string | undefined;

      if (!name) {
        isValid = false;
        validationError = 'Name is required.';
      } else if (!email || !email.includes('@')) {
        isValid = false;
        validationError = 'Valid email is required.';
      }

      const modulesInput = row.assignedModules ?? row.tags ?? '';
      const parsedModules = modulesInput
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);

      return {
        ...row,
        name,
        email,
        parsedRole: role,
        parsedModules,
        isValid,
        validationError,
      };
    });

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
      return NextResponse.json({ error: 'All expert rows failed validation.' }, { status: 400 });
    }

    const defaultPassword = 'expertpassword123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const createdExperts = [];
    const errors = [];

    for (const row of validRows) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Check if expert already exists by email
          let expert = await tx.expert.findFirst({ where: { email: row.email } });
          if (!expert) {
            expert = await tx.expert.create({
              data: {
                name: row.name,
                email: row.email,
                tags: row.parsedModules,
                bio: row.bio || '',
              },
            });
          } else {
            expert = await tx.expert.update({
              where: { id: expert.id },
              data: {
                name: row.name,
                tags: row.parsedModules.length > 0 ? row.parsedModules : expert.tags,
                bio: row.bio || expert.bio,
                deletedAt: null, // Clear deletedAt if account was previously archived
              },
            });
          }

          // Create/update User account with designated role (ADMIN, TEAM, or EXPERT)
          let user = await tx.user.findFirst({ where: { email: row.email } });
          if (!user) {
            await tx.user.create({
              data: {
                name: row.name,
                email: row.email,
                passwordHash,
                role: row.parsedRole,
                expertId: expert.id,
              },
            });
          } else {
            await tx.user.update({
              where: { id: user.id },
              data: {
                role: row.parsedRole,
                expertId: expert.id,
                deletedAt: null, // Clear deletedAt if account was previously archived
              },
            });
          }

          return expert;
        });

        createdExperts.push(result);
      } catch (err: any) {
        errors.push({ email: row.email, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      count: createdExperts.length,
      createdExperts,
      errors,
    });
  } catch (err: any) {
    console.error('[POST /api/experts/bulk]', err);
    return NextResponse.json({ error: err.message || 'Failed to bulk import experts.' }, { status: 500 });
  }
}
