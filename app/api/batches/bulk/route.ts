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
  willAutoCreateCourse?: boolean;
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

      // If course name is specified but not in DB, mark it to be automatically created
      const willAutoCreateCourse = Boolean(courseInput && !matchedCourse);

      const isValid = errors.length === 0;

      return {
        ...row,
        name,
        courseId: matchedCourse?.id ?? null,
        courseName: matchedCourse?.name ?? (courseInput || 'Unassigned'),
        isValid,
        willAutoCreateCourse,
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

    // Course cache for on-the-fly created courses
    const createdCoursesMap: Record<string, string> = {};

    for (const row of validRows) {
      try {
        let courseId = row.courseId;

        // Auto-create course if missing from DB
        if (!courseId && row.courseName && row.courseName !== 'Unassigned') {
          const cName = row.courseName.trim();
          if (createdCoursesMap[cName.toLowerCase()]) {
            courseId = createdCoursesMap[cName.toLowerCase()];
          } else {
            let existingCourse = await prisma.course.findFirst({
              where: { name: { equals: cName, mode: 'insensitive' }, deletedAt: null },
            });
            if (!existingCourse) {
              existingCourse = await prisma.course.create({
                data: {
                  name: cName,
                  description: `Auto-created course for ${row.name}`,
                },
              });
            }
            courseId = existingCourse.id;
            createdCoursesMap[cName.toLowerCase()] = courseId;
          }
        }

        let batch = await prisma.batch.findFirst({
          where: { name: row.name, deletedAt: null },
        });

        if (!batch) {
          batch = await prisma.batch.create({
            data: {
              name: row.name,
              description: row.description || '',
              courseId: courseId,
            },
          });
        } else {
          batch = await prisma.batch.update({
            where: { id: batch.id },
            data: {
              description: row.description || batch.description,
              courseId: courseId || batch.courseId,
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
