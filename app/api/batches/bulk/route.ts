import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-token';
import { prisma } from '@/lib/db';

export interface RawBatchRow {
  name: string;
  course?: string; // Course Name or Course ID
  description?: string;
}

export interface ResolvedBatchRow extends RawBatchRow {
  courseId: string | null;
  courseName: string | null;
  isValid: boolean;
  validationError?: string;
}

export async function POST(req: Request) {
  const token = await getAuthToken();

  if (!token || ((token as any).role !== 'ADMIN' && (token as any).role !== 'TEAM')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body.action || 'create';
    const rawRows: RawBatchRow[] = body.rows || [];

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json({ error: 'No batch rows provided.' }, { status: 400 });
    }

    // Fetch all active courses from DB for entity resolution
    const dbCourses = await prisma.course.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    // Resolve & Validate Batch Rows
    const resolvedRows: ResolvedBatchRow[] = rawRows.map((row) => {
      const name = (row.name ?? '').trim();
      const courseInput = (row.course ?? '').trim();
      const courseTerm = courseInput.toLowerCase();
      const errors: string[] = [];

      if (!name) {
        errors.push('Batch Name is required.');
      }

      let matchedCourse = courseTerm
        ? dbCourses.find(
            (c) =>
              c.id.toLowerCase() === courseTerm ||
              c.name.toLowerCase() === courseTerm ||
              c.name.toLowerCase().includes(courseTerm) ||
              courseTerm.includes(c.name.toLowerCase())
          )
        : null;

      if (courseInput && !matchedCourse) {
        errors.push(`Course "${courseInput}" not found in database. Please create it under Courses first.`);
      }

      const isValid = errors.length === 0;

      return {
        ...row,
        name,
        courseId: matchedCourse?.id ?? null,
        courseName: matchedCourse?.name ?? (courseInput || 'Unassigned'),
        isValid,
        validationError: errors.length > 0 ? errors.join(' | ') : undefined,
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
      return NextResponse.json({ error: 'All batch rows failed validation.' }, { status: 400 });
    }

    const createdBatches = [];
    const errors = [];

    for (const row of validRows) {
      try {
        let batch = await prisma.batch.findFirst({
          where: { name: row.name, deletedAt: null },
        });

        if (!batch) {
          batch = await prisma.batch.create({
            data: {
              name: row.name,
              description: row.description || '',
              courseId: row.courseId,
            },
          });
        } else {
          batch = await prisma.batch.update({
            where: { id: batch.id },
            data: {
              description: row.description || batch.description,
              courseId: row.courseId || batch.courseId,
            },
          });
        }

        createdBatches.push(batch);
      } catch (err: any) {
        errors.push({ batch: row.name, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      count: createdBatches.length,
      createdBatches,
      errors,
    });
  } catch (err: any) {
    console.error('[POST /api/batches/bulk]', err);
    return NextResponse.json({ error: err.message || 'Failed to bulk import batches.' }, { status: 500 });
  }
}
