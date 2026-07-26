/**
 * sheets-course-sync.ts
 *
 * Syncs a Google Sheet into the Oogway curriculum structure:
 *   Course → Modules (by Module ID column) → SessionNotes (by Session ID column)
 *
 * Sheet columns (Sheet1 of the Marketing Launchpad sheet):
 *   A: Week          B: Session ID   C: Points To Note    D: Module (name)
 *   E: Module ID     F: Eval Req?    G: Session Name      R: Type
 *   S: Expert Type   T: Duration     Y: Link Content      Z: Link Charter
 *   AB: Link Model Solution          AC: Link Test        AE: Link Eval Params
 *   AJ: Notes <> What should be taught   AK: Brief to Experts
 */

import { prisma } from '@/lib/db';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetSyncResult {
  modulesCreated: number;
  modulesUpdated: number;
  sessionsAdded: number;
  sessionsUpdated: number;
  sessionsSkipped: number;
  errors: string[];
}

interface SheetRow {
  week: string;
  sessionId: string;
  pointsToNote: string;
  moduleName: string;
  moduleId: string;
  evaluationRequired: boolean;
  sessionName: string;
  sessionType: string;
  expertType: string;
  duration: number | null;
  linkContent: string;
  linkCharter: string;
  linkModelSolution: string;
  linkTest: string;
  linkEvalParams: string;
  whatToTeach: string;   // "Notes <> What should be taught"
  expertBrief: string;  // "Brief to Experts from Acad Team"
}

/** Extract a Google Sheet ID from a full URL */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/** Derive numeric week order from label like "Week 0", "Week 1" */
function weekOrder(weekLabel: string): number {
  const match = weekLabel.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

/** Fetch rows from Google Sheets API v4 */
async function fetchSheetRows(
  spreadsheetId: string,
  tabName: string,
  apiKey: string
): Promise<string[][]> {
  const range = encodeURIComponent(`${tabName}!A1:AO`);
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'OogwaySheetSync/1.0' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.values as string[][]) || [];
}

/** Parse raw sheet rows into typed SheetRow objects */
function parseRows(rawRows: string[][]): SheetRow[] {
  if (rawRows.length < 2) return [];

  const headers = rawRows[0].map((h) => h.toLowerCase().replace(/\s+/g, ' ').trim());

  const idx = (needle: string) => headers.findIndex((h) => h.includes(needle));

  // Column index map — order matches the sheet's actual column layout
  const weekIdx         = idx('week');
  const sessionIdIdx    = headers.findIndex((h) => h === 'session id' || h.startsWith('session id'));
  const notesIdx        = idx('points to note');
  const moduleNameIdx   = 3; // col D: "Module" (the first one — module display name)
  const moduleIdIdx     = 4; // col E: "Module ID" (e.g. MM109) — fixed position
  const evalReqIdx      = idx('evaluation required');
  const nameIdx         = idx('session name');
  const typeIdx         = headers.findIndex((h) => h === 'type');
  const expertTypeIdx   = idx('expert type');
  const durationIdx     = idx('duration');
  const linkContentIdx  = headers.findIndex((h) => h.includes('link') && h.includes('content'));
  const linkCharterIdx  = headers.findIndex((h) => h.includes('link') && h.includes('charter'));
  const linkSolutionIdx = headers.findIndex((h) => h.includes('link') && h.includes('model solution') && !h.includes('test'));
  const linkTestIdx     = headers.findIndex((h) => h.includes('link') && h.includes('test') && !h.includes('model'));
  const linkEvalIdx     = headers.findIndex((h) => h.includes('link') && h.includes('evaluation'));
  const whatToTeachIdx  = headers.findIndex((h) => h.includes('what should be taught') || h.includes('notes <>'));
  const expertBriefIdx  = headers.findIndex((h) => h.includes('brief to expert'));

  const rows: SheetRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    const get = (idx: number) => (idx >= 0 && idx < r.length ? (r[idx] || '').trim() : '');

    const sessionId   = get(sessionIdIdx);
    const sessionName = get(nameIdx);
    const moduleId    = get(moduleIdIdx);

    // Skip rows without a Session ID or Session Name
    if (!sessionId || !sessionName || sessionId.toLowerCase() === 'session id') continue;
    // Skip header-repeat rows
    if (sessionName.toLowerCase() === 'session name') continue;

    const durationRaw = get(durationIdx);
    const duration    = durationRaw ? parseInt(durationRaw, 10) : null;

    rows.push({
      week:              get(weekIdx) || 'Unscheduled',
      sessionId,
      pointsToNote:      get(notesIdx),
      moduleName:        get(moduleNameIdx),
      moduleId,
      evaluationRequired: get(evalReqIdx).toLowerCase() === 'yes',
      sessionName,
      sessionType:       get(typeIdx) || 'Live Session',
      expertType:        get(expertTypeIdx),
      duration:          isNaN(duration as number) ? null : duration,
      linkContent:       get(linkContentIdx),
      linkCharter:       get(linkCharterIdx),
      linkModelSolution: get(linkSolutionIdx),
      linkTest:          get(linkTestIdx),
      linkEvalParams:    get(linkEvalIdx),
      whatToTeach:       get(whatToTeachIdx),
      expertBrief:       get(expertBriefIdx),
    });
  }

  return rows;
}

/**
 * Main sync function.
 * Fetches the sheet for a course, groups rows by Module ID,
 * find-or-creates Modules, and upserts SessionNotes.
 */
export async function syncCourseSheet(courseId: string): Promise<SheetSyncResult> {
  const result: SheetSyncResult = {
    modulesCreated: 0,
    modulesUpdated: 0,
    sessionsAdded: 0,
    sessionsUpdated: 0,
    sessionsSkipped: 0,
    errors: [],
  };

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_SHEETS_API_KEY is not set');

  // Load course
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error(`Course ${courseId} not found`);
  if (!course.sheetUrl) throw new Error(`Course "${course.name}" has no Google Sheet URL attached`);

  const sheetId = extractSheetId(course.sheetUrl);
  if (!sheetId) throw new Error(`Cannot extract sheet ID from URL: ${course.sheetUrl}`);

  const tabName = course.sheetTabName || 'Sheet1';

  // Fetch & parse
  const rawRows = await fetchSheetRows(sheetId, tabName, apiKey);
  const rows    = parseRows(rawRows);

  if (rows.length === 0) {
    result.errors.push('No valid rows found in sheet');
    return result;
  }

  // Group rows by Module ID
  const byModuleId = new Map<string, SheetRow[]>();
  for (const row of rows) {
    const key = row.moduleId || '__unknown__';
    if (!byModuleId.has(key)) byModuleId.set(key, []);
    byModuleId.get(key)!.push(row);
  }

  // Load existing modules for this course
  const existingModules = await prisma.module.findMany({
    where: { courseId, deletedAt: null },
  });
  const moduleBySheetId = new Map(existingModules.map((m) => [m.sheetModuleId, m]));

  let moduleOrder = 0;

  for (const [sheetModuleId, moduleRows] of byModuleId) {
    if (sheetModuleId === '__unknown__') {
      result.errors.push(`${moduleRows.length} rows have no Module ID and were skipped`);
      continue;
    }

    // Use the module name from the first row of that group
    const moduleName = moduleRows[0].moduleName || sheetModuleId;

    let dbModule = moduleBySheetId.get(sheetModuleId);

    if (!dbModule) {
      // Create new module
      dbModule = await prisma.module.create({
        data: {
          name:          moduleName,
          courseId,
          sheetModuleId,
          order:         moduleOrder,
        },
      });
      result.modulesCreated++;
      moduleBySheetId.set(sheetModuleId, dbModule);
    } else if (dbModule.name !== moduleName) {
      // Update module name if changed in sheet
      dbModule = await prisma.module.update({
        where: { id: dbModule.id },
        data:  { name: moduleName, order: moduleOrder },
      });
      result.modulesUpdated++;
    }

    moduleOrder++;

    // Pre-fetch all existing sessionIds for this module in one query
    const existingSessions = await prisma.sessionNote.findMany({
      where: { moduleId: dbModule!.id, sessionId: { not: null } },
      select: { id: true, sessionId: true },
    });
    const existingSessionIds = new Set(existingSessions.map((s) => s.sessionId));

    // Upsert sessions using prisma upsert (single round-trip per row)
    for (const row of moduleRows) {
      try {
        const baseData = {
          name:              row.sessionName,
          content:           row.whatToTeach || null,
          phase:             row.week || null,
          prerequisites:     row.pointsToNote || null,
          sessionType:       row.sessionType || null,
          expertType:        row.expertType || null,
          duration:          row.duration,
          evaluationRequired: row.evaluationRequired,
          linkContent:       row.linkContent || null,
          linkCharter:       row.linkCharter || null,
          linkModelSolution: row.linkModelSolution || null,
          linkTest:          row.linkTest || null,
          linkEvalParams:    row.linkEvalParams || null,
          expertBrief:       row.expertBrief || null,
          weekOrder:         weekOrder(row.week),
          syncedAt:          new Date(),
          moduleId:          dbModule!.id,
        };

        await prisma.sessionNote.upsert({
          where:  { sessionId: row.sessionId },
          create: { ...baseData, sessionId: row.sessionId },
          update: baseData,
        });

        if (existingSessionIds.has(row.sessionId)) {
          result.sessionsUpdated++;
        } else {
          result.sessionsAdded++;
        }
      } catch (err: any) {
        result.errors.push(`Row ${row.sessionId} (${row.sessionName}): ${err.message}`);
        result.sessionsSkipped++;
      }
    }
  }

  // Update course lastSyncedAt
  await prisma.course.update({
    where: { id: courseId },
    data:  { lastSyncedAt: new Date() },
  });

  return result;
}
