/**
 * evaluation-sheet-parser.ts
 *
 * Fetches a Google Sheet published as CSV and parses it into structured student rows.
 * Uses dynamic header recognition to support sheets with ANY column layout or header structure.
 * Extracts student names, batch names, emails, official questions asked, expert notes, and expert scores.
 */

export interface SheetQuestionEntry {
  qIndex: string; // e.g. "Q1", "Q2", "Q3"
  officialQuestion: string; // Official question text from sheet
  expertNotes: string; // Written feedback/notes by expert in sheet
  expertScore: number; // Expert assigned score (0-4)
}

export interface ParsedStudentEvaluation {
  studentName: string;
  batchName: string;
  studentEmail?: string;
  timestamp?: string;
  questions: SheetQuestionEntry[];
}

export type SheetRow = Record<string, string>;

/**
 * Fetch and parse a Google Sheets CSV export into structured student evaluation objects.
 */
export async function fetchAndParseSheet(sheetUrl: string): Promise<ParsedStudentEvaluation[]> {
  const res = await fetch(sheetUrl, {
    headers: { 'User-Agent': 'Oogway-Evaluation-Pipeline/1.0' },
  });

  if (!res.ok) {
    throw new Error(`[SheetParser] Failed to fetch sheet: HTTP ${res.status} from ${sheetUrl}`);
  }

  const text = await res.text();
  return parseCSVText(text);
}

/**
 * State-machine CSV parser that handles multiline cells and dynamic headers.
 */
export function parseCSVText(text: string): ParsedStudentEvaluation[] {
  const rawRows = parseRawCSVRows(text);
  if (rawRows.length < 2) return [];

  // Find main header row dynamically
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(4, rawRows.length); r++) {
    const rStr = rawRows[r].join(' ').toLowerCase();
    if (
      (rStr.includes('name') || rStr.includes('student')) &&
      (rStr.includes('q1') || rStr.includes('question') || rStr.includes('email'))
    ) {
      headerRowIdx = r;
      break;
    }
  }

  const h0 = rawRows[headerRowIdx] || [];
  const h1 = rawRows[headerRowIdx + 1] || [];

  const maxCols = Math.max(...rawRows.map((r) => r.length));
  const combinedHeaders: string[] = [];
  for (let c = 0; c < maxCols; c++) {
    const text0 = h0[c] || '';
    const text1 =
      headerRowIdx + 1 < rawRows.length &&
      (rawRows[headerRowIdx + 1][0]?.toLowerCase().includes('timestamp') ||
        rawRows[headerRowIdx + 1][1]?.toLowerCase().includes('name'))
        ? ''
        : h1[c] || '';
    combinedHeaders.push(`${text0} ${text1}`.trim());
  }

  // 1. Identify Name, Email, Batch columns
  let nameCol = -1;
  let emailCol = -1;
  let batchCol = -1;
  let timestampCol = -1;

  combinedHeaders.forEach((h, idx) => {
    const l = h.toLowerCase();
    if (
      nameCol === -1 &&
      (l === 'name' ||
        l === 'student full name' ||
        l === 'student name' ||
        l === 'candidate' ||
        (l.includes('name') && !l.includes('expert')))
    ) {
      nameCol = idx;
    } else if (emailCol === -1 && l.includes('email')) {
      emailCol = idx;
    } else if (
      batchCol === -1 &&
      (l.includes('batch') || l.includes('cohort') || l === 'column d')
    ) {
      batchCol = idx;
    } else if (timestampCol === -1 && l.includes('timestamp')) {
      timestampCol = idx;
    }
  });

  if (nameCol === -1) nameCol = 0;

  // 2. Identify Question Triplets (Question Text, Notes, Score) dynamically
  interface Triplet {
    qIndex: string;
    qCol: number;
    notesCol: number;
    scoreCol: number;
  }

  const questionTriplets: Triplet[] = [];

  for (let c = 0; c < maxCols; c++) {
    const h = combinedHeaders[c];
    const l = h.toLowerCase();

    // Check if column starts a question group
    const isQHeader = /^q\d+/i.test(h) || l.includes('question') || l.includes('choose the');
    const isNoteOrScore =
      l.includes('note') ||
      l.includes('score') ||
      l.includes('mark') ||
      /^n\d+/i.test(h) ||
      /^s\d+/i.test(h);

    if (isQHeader && !isNoteOrScore) {
      let notesCol = -1;
      let scoreCol = -1;

      // Look ahead up to 3 columns for notes and score
      for (let look = c + 1; look < Math.min(c + 4, maxCols); look++) {
        const lh = combinedHeaders[look].toLowerCase();
        if (
          notesCol === -1 &&
          (lh.includes('note') || lh.includes('feedback') || /^n\d+/i.test(combinedHeaders[look]))
        ) {
          notesCol = look;
        } else if (
          scoreCol === -1 &&
          (lh.includes('score') || lh.includes('mark') || /^s\d+/i.test(combinedHeaders[look]))
        ) {
          scoreCol = look;
        }
      }

      if (notesCol === -1 && c + 1 < maxCols) notesCol = c + 1;
      if (scoreCol === -1 && c + 2 < maxCols) scoreCol = c + 2;

      questionTriplets.push({
        qIndex: `Q${questionTriplets.length + 1}`,
        qCol: c,
        notesCol,
        scoreCol,
      });

      c = Math.max(c, notesCol, scoreCol);
    }
  }

  // 3. Extract Student Rows
  const dataStartIdx =
    headerRowIdx + 1 < rawRows.length &&
    (rawRows[headerRowIdx + 1][0]?.toLowerCase().includes('timestamp') ||
      rawRows[headerRowIdx + 1][1]?.toLowerCase().includes('name'))
      ? headerRowIdx + 2
      : headerRowIdx + 1;

  const students: ParsedStudentEvaluation[] = [];
  for (let r = dataStartIdx; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const studentName = row[nameCol]?.trim() || '';
    if (
      !studentName ||
      studentName.toLowerCase() === 'name' ||
      studentName.toLowerCase() === 'student full name'
    )
      continue;

    const studentEmail = emailCol >= 0 ? row[emailCol]?.trim() : '';
    let batchName = batchCol >= 0 ? row[batchCol]?.trim() : '';
    if (!batchName || batchName.toLowerCase() === 'column d') {
      const bFound = row.find((v) => /mlp\s?\d+/i.test(v));
      if (bFound) batchName = bFound;
    }

    const timestamp = timestampCol >= 0 ? row[timestampCol]?.trim() : '';

    const questions: SheetQuestionEntry[] = [];
    questionTriplets.forEach((tr, i) => {
      const qText = row[tr.qCol]?.trim() || '';
      const qNotes = row[tr.notesCol]?.trim() || '';
      const qScoreStr = row[tr.scoreCol]?.trim() || '';

      // Filter out total/pass-fail summary cells
      if (qText.toLowerCase() === 'total' || qText.toLowerCase() === 'final') return;

      if (qText || qNotes || qScoreStr) {
        const scoreVal = parseInt(qScoreStr.replace(/[^0-9]/g, ''), 10);
        questions.push({
          qIndex: `Q${i + 1}`,
          officialQuestion: qText,
          expertNotes: qNotes,
          expertScore: isNaN(scoreVal) ? 0 : scoreVal,
        });
      }
    });

    students.push({
      studentName,
      batchName: batchName || 'MLP 46 FT',
      studentEmail,
      timestamp,
      questions,
    });
  }

  return students;
}

function parseRawCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }
  return rows;
}

/**
 * Fuzzy match a student row from the parsed sheet by student name and batch name.
 */
export function findStudentRow(
  students: ParsedStudentEvaluation[],
  studentName: string,
  batchName?: string
): ParsedStudentEvaluation | null {
  if (students.length === 0) return null;

  const normTarget = normalize(studentName);
  const targetParts = normTarget.split(' ');

  type Scored = { item: ParsedStudentEvaluation; score: number };

  const scored: Scored[] = students
    .map((item) => {
      const cellName = normalize(item.studentName);
      if (!cellName) return { item, score: 0 };

      let score = 0;
      if (cellName === normTarget) score += 100;

      const matchingParts = targetParts.filter((p) => cellName.includes(p) && p.length > 1);
      score += matchingParts.length * 20;

      if (batchName) {
        const cellBatch = normalize(item.batchName);
        const normBatch = normalize(batchName);
        if (cellBatch === normBatch) score += 50;
        else if (cellBatch.includes(normBatch) || normBatch.includes(cellBatch)) score += 25;
      }

      return { item, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].item : null;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}
