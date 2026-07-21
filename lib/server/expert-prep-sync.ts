/**
 * expert-prep-sync.ts
 * Live sync engine for Oogway Expert Prep Portal (v2)
 *
 * Fetches and parses the live Google Sheet containing curriculum prep notes,
 * presentation slides, charters, and model solutions across ALL modules.
 * Implements in-memory caching with 60-second revalidation for real-time sync.
 */

export interface PrepSession {
  id: string;
  week: string;
  pointsToNote: string;
  module: string;
  category: string; // Sub-module / topic categorization
  sessionName: string;
  type: string;
  expertType: string;
  duration: string;
  linkContent: string;
  linkCharter: string;
  linkModelSolution: string;
  linkTest: string;
  evaluationParameters: string;
}

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1eQk9SLQLheEP0bTGEnlK2-Wau-VMHAJl9eve_zpfWL4/export?format=csv&gid=0';

let cachedPrepData: PrepSession[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute auto-sync TTL

/**
 * Normalize and classify raw module strings to clean canonical Module names
 */
function normalizeModule(rawModule: string, sessionName: string): string {
  const text = `${rawModule} ${sessionName}`.toLowerCase();

  if (text.includes('seo')) return 'SEO';
  if (
    text.includes('google') ||
    text.includes('search') ||
    text.includes('youtube') ||
    text.includes('performance max') ||
    text.includes('uac') ||
    text.includes('shopping ads')
  ) {
    return 'Google Ads';
  }
  if (text.includes('meta') || text.includes('facebook') || text.includes('fb')) return 'Meta';
  if (text.includes('ecom') || text.includes('shopify') || text.includes('d2c')) return 'E-Commerce';
  if (text.includes('aptitude') || text.includes('quant') || text.includes('reasoning')) return 'Aptitude';
  if (text.includes('programmatic') || text.includes('dv360')) return 'Programmatic';
  if (text.includes('excel')) return 'Excel & Analytics';
  if (text.includes('content') || text.includes('copywriting')) return 'Content Strategy';
  if (text.includes('vibe') || text.includes('vibecoding') || text.includes('ai tool')) return 'AI & Vibecoding';
  if (text.includes('brand')) return 'Brand Strategy';
  if (text.includes('human') || text.includes('soft skills')) return 'Human Skills';
  if (text.includes('placement')) return 'Placements & Prep';

  const clean = rawModule.trim();
  if (clean && clean.length < 25 && !clean.includes('http') && !clean.includes('For SST')) {
    return clean;
  }

  return 'General Foundations';
}

/**
 * Categorize a session into a specific sub-module/category based on title & notes keywords.
 */
function deriveCategory(sessionName: string, pointsToNote: string, rawModule: string): string {
  const text = `${sessionName} ${pointsToNote}`.toLowerCase();

  if (text.includes('pixel') || text.includes('event manager') || text.includes('conversions api')) {
    return 'Pixels & Event Management';
  }
  if (text.includes('audience') || text.includes('lookalike') || text.includes('targeting')) {
    return 'Audience Targeting & Strategy';
  }
  if (text.includes('metric') || text.includes('reporting') || text.includes('attribution') || text.includes('funnel')) {
    return 'Metrics & Analytics';
  }
  if (text.includes('bidding') || text.includes('objective') || text.includes('auction') || text.includes('optimization')) {
    return 'Bidding & Campaign Strategy';
  }
  if (text.includes('ecom') || text.includes('shopify') || text.includes('product detail') || text.includes('conversion rate')) {
    return 'E-Commerce & CRO';
  }
  if (text.includes('case building') || text.includes('brand project') || text.includes('media plan') || text.includes('case study')) {
    return 'Brand Projects & Case Studies';
  }
  if (text.includes('kahoot') || text.includes('mcq') || text.includes('quiz') || text.includes('test')) {
    return 'Kahoot Quizzes & Assessments';
  }
  if (text.includes('design') || text.includes('creative') || text.includes('image') || text.includes('video')) {
    return 'Creative Strategy & Design';
  }

  return rawModule || 'General Foundations';
}

/**
 * Robust CSV parser that handles multi-line fields within quotes.
 */
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current.trim());
      if (row.some(cell => cell.length > 0)) {
        result.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some(cell => cell.length > 0)) {
      result.push(row);
    }
  }

  return result;
}

/**
 * Fetch and parse live prep sessions from the Google Sheet across ALL modules.
 */
export async function getLivePrepSessions(forceRefresh = false): Promise<PrepSession[]> {
  const now = Date.now();
  if (!forceRefresh && cachedPrepData && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedPrepData;
  }

  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL, {
      headers: { 'User-Agent': 'OogwayPrepSync/2.0' },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${res.statusText}`);
    }

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return cachedPrepData || [];
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/[\r\n]+/g, ' '));
    
    const weekIdx = headers.findIndex(h => h.includes('week'));
    const notesIdx = headers.findIndex(h => h.includes('points to note'));
    const moduleIdx = headers.findIndex(h => h.includes('module'));
    const nameIdx = headers.findIndex(h => h.includes('session name'));
    const typeIdx = headers.findIndex(h => h.includes('type') && !h.includes('expert') && !h.includes('submission') && !h.includes('test'));
    const expertTypeIdx = headers.findIndex(h => h.includes('expert type'));
    const durationIdx = headers.findIndex(h => h.includes('duration'));
    
    const linkContentIdx = headers.findIndex(h => h.includes('link content') || h.includes('link\ncontent'));
    const linkCharterIdx = headers.findIndex(h => h.includes('link charter') || h.includes('link\ncharter'));
    const linkSolutionIdx = headers.findIndex(h => h.includes('link model solution') || h.includes('link\nmodel solution'));
    const linkTestIdx = headers.findIndex(h => h.includes('link test') || h.includes('link\ntest'));
    const evalIdx = headers.findIndex(h => h.includes('evaluation parameters'));

    const sessions: PrepSession[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const sessionName = r[nameIdx >= 0 ? nameIdx : 4] || r[3] || r[2] || '';

      if (
        !sessionName ||
        sessionName.toLowerCase() === 'session name' ||
        sessionName.startsWith('http') ||
        sessionName.length < 3
      ) {
        continue;
      }

      const rawModule = r[moduleIdx >= 0 ? moduleIdx : 2] || '';
      const module = normalizeModule(rawModule, sessionName);
      const pointsToNote = r[notesIdx >= 0 ? notesIdx : 1] || '';
      const category = deriveCategory(sessionName, pointsToNote, module);

      const id = `prep-${i}-${sessionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;

      sessions.push({
        id,
        week: r[weekIdx >= 0 ? weekIdx : 0] || 'Unscheduled',
        pointsToNote,
        module,
        category,
        sessionName,
        type: r[typeIdx >= 0 ? typeIdx : 13] || 'Live Session',
        expertType: r[expertTypeIdx >= 0 ? expertTypeIdx : 14] || 'Copilot',
        duration: r[durationIdx >= 0 ? durationIdx : 15] || '90',
        linkContent: r[linkContentIdx >= 0 ? linkContentIdx : 20] || '',
        linkCharter: r[linkCharterIdx >= 0 ? linkCharterIdx : 21] || '',
        linkModelSolution: r[linkSolutionIdx >= 0 ? linkSolutionIdx : 22] || '',
        linkTest: r[linkTestIdx >= 0 ? linkTestIdx : 23] || '',
        evaluationParameters: r[evalIdx >= 0 ? evalIdx : 26] || '',
      });
    }

    cachedPrepData = sessions;
    lastFetchTime = now;
    return sessions;
  } catch (err) {
    console.error('[ExpertPrepSync] Error syncing Google Sheet:', err);
    return cachedPrepData || [];
  }
}
