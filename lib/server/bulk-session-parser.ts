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
 * Normalizes any URL string (e.g. prepends https:// if missing, strips quotes/brackets).
 */

export function normalizeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  let cleaned = raw.trim().replace(/^["'<(\[]+|["'>)\]]+$/g, '');
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return cleaned;
  }

  // If user pasted link without protocol e.g. "us06web.zoom.us/..." or "drive.google.com/..."
  if (
    lower.includes('zoom.us') ||
    lower.includes('google.com') ||
    lower.includes('youtube.com') ||
    lower.includes('vimeo.com') ||
    lower.includes('dropbox.com') ||
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\//.test(cleaned)
  ) {
    return `https://${cleaned}`;
  }

  return null;
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

    // 4. Robust Video URL Normalization & Auto-Detection across all fields
    let resolvedVideoUrl: string | null = normalizeUrl(row.videoUrl);

    if (!resolvedVideoUrl) {
      // Scan all fields in the row for a valid URL
      const candidateFields = [row.transcriptUrl, row.conductedDate, row.session, row.batch, row.expert];
      for (const candidate of candidateFields) {
        const url = normalizeUrl(candidate);
        if (url) {
          resolvedVideoUrl = url;
          break;
        }
      }
    }

    if (!resolvedVideoUrl) {
      errors.push('Valid Video URL (http/https or recording link) is required.');
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
      videoUrl: resolvedVideoUrl || row.videoUrl || '',
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
