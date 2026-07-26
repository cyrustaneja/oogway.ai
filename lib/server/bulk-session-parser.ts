import { prisma } from '@/lib/db';

export interface RawBulkRow {
  expert: string;
  batch?: string;
  session: string; // Session Name or Session ID (e.g. S101 or "Brand Objective")
  conductedDate?: string;
  videoUrl: string;
  transcriptUrl?: string;
  transcriptText?: string;
}

export interface ResolvedBulkRow extends RawBulkRow {
  expertId: string | null;
  expertName: string | null;
  batchId: string | null;
  batchName: string | null;
  sessionNoteId: string | null;
  sessionNoteName: string | null;
  moduleName: string | null;
  courseName: string | null;
  parsedConductedAt: Date;
  isValid: boolean;
  validationError?: string;
}

/**
 * Parses and resolves raw bulk CSV/Excel rows against database entities.
 * Automatically maps Session Name or ID to SessionNote, Module, and Course!
 */
export async function resolveBulkSessionRows(rows: RawBulkRow[]): Promise<ResolvedBulkRow[]> {
  const [experts, batches, sessionNotes] = await Promise.all([
    prisma.expert.findMany({ where: { deletedAt: null } }),
    prisma.batch.findMany({ where: { deletedAt: null }, include: { course: true } }),
    prisma.sessionNote.findMany({
      where: { deletedAt: null },
      include: { module: { include: { course: true } } },
    }),
  ]);

  return rows.map((row) => {
    const errors: string[] = [];

    // 1. Resolve Expert (by ID, Name, or Email)
    const expTerm = (row.expert ?? '').trim().toLowerCase();
    const matchedExpert = experts.find(
      (e) =>
        e.id.toLowerCase() === expTerm ||
        e.email.toLowerCase() === expTerm ||
        e.name.toLowerCase() === expTerm ||
        e.name.toLowerCase().includes(expTerm)
    );

    if (!matchedExpert) {
      errors.push(`Expert "${row.expert || 'Missing'}" not found in database.`);
    }

    // 2. Resolve Batch (by ID or Name)
    const batchTerm = (row.batch ?? '').trim().toLowerCase();
    let matchedBatch = batchTerm
      ? batches.find(
          (b) =>
            b.id.toLowerCase() === batchTerm ||
            b.name.toLowerCase() === batchTerm ||
            b.name.toLowerCase().includes(batchTerm)
        )
      : null;

    // 3. Resolve SessionNote (by ID, sessionId e.g. S101, or Name)
    const sessionTerm = (row.session ?? '').trim().toLowerCase();
    const matchedSession = sessionNotes.find((s) => {
      if (s.id.toLowerCase() === sessionTerm) return true;
      if (s.sessionId && s.sessionId.toLowerCase() === sessionTerm) return true;
      if (s.name.toLowerCase() === sessionTerm) return true;
      return s.name.toLowerCase().includes(sessionTerm);
    });

    if (!matchedSession) {
      errors.push(`Session "${row.session || 'Missing'}" not found in curriculum.`);
    }

    // 4. Validate Video URL
    if (!row.videoUrl || !row.videoUrl.trim().startsWith('http')) {
      errors.push('Valid Video URL (http/https link) is required.');
    }

    // 5. Parse Conducted Date
    let parsedConductedAt = new Date();
    if (row.conductedDate && row.conductedDate.trim()) {
      const parsed = new Date(row.conductedDate.trim());
      if (!isNaN(parsed.getTime())) {
        parsedConductedAt = parsed;
      }
    }

    const isValid = errors.length === 0;

    return {
      ...row,
      expertId: matchedExpert?.id ?? null,
      expertName: matchedExpert?.name ?? row.expert,
      batchId: matchedBatch?.id ?? null,
      batchName: matchedBatch?.name ?? row.batch ?? 'Unassigned',
      sessionNoteId: matchedSession?.id ?? null,
      sessionNoteName: matchedSession?.name ?? row.session,
      moduleName: matchedSession?.module?.name ?? 'Unmapped',
      courseName: matchedSession?.module?.course?.name ?? 'Unmapped',
      parsedConductedAt,
      isValid,
      validationError: errors.length > 0 ? errors.join(' | ') : undefined,
    };
  });
}
