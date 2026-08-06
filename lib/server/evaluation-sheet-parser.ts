/**
 * evaluation-sheet-parser.ts
 *
 * Fetches a Google Sheet published as CSV and parses it into structured student rows.
 * Extracts student names, batch names, official questions asked, expert notes, and expert scores.
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
 * Robust state-machine CSV parser that properly handles multiline cells.
 */
export function parseCSVText(text: string): ParsedStudentEvaluation[] {
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

  if (rows.length < 3) return [];

  const students: ParsedStudentEvaluation[] = [];

  // Data rows typically start at index 2 (line 3) after double header rows
  const startIndex = rows[0]?.[1]?.toLowerCase().includes('name') || rows[1]?.[1]?.toLowerCase().includes('name') ? 2 : 1;

  for (let r = startIndex; r < rows.length; r++) {
    const rowData = rows[r];
    if (!rowData || rowData.length < 3) continue;

    const timestamp = rowData[0] || '';
    const studentName = rowData[1] || '';
    const batchName = rowData[2] || '';
    const email = rowData[3] || '';

    // Ignore header lookalikes
    if (!studentName || studentName.toLowerCase() === 'student full name') continue;

    // Extract Question Groups (Question Choice, Notes, Score) starting from index 4
    const questions: SheetQuestionEntry[] = [];
    let qNum = 1;

    for (let c = 4; c < rowData.length; c += 3) {
      const qText = rowData[c] || '';
      const qNotes = rowData[c + 1] || '';
      const qScoreStr = rowData[c + 2] || '';

      // Skip summary / total columns that are not actual question entries
      if (qText.includes('%') || qText.toLowerCase() === 'pass' || qText.toLowerCase() === 'fail') continue;

      if (qText || qNotes || qScoreStr) {
        const scoreVal = parseInt(qScoreStr.replace(/[^0-9]/g, ''), 10);
        questions.push({
          qIndex: `Q${qNum}`,
          officialQuestion: qText,
          expertNotes: qNotes,
          expertScore: isNaN(scoreVal) ? 0 : scoreVal,
        });
        qNum++;
      }
    }

    students.push({
      studentName,
      batchName,
      studentEmail: email,
      timestamp,
      questions,
    });
  }

  return students;
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
