/**
 * coaching-formatter.ts
 * Reframes direct, blunt feedback copy into encouraging, constructive coaching language.
 */

export interface InsightPointer {
  right?: string;
  wrong?: string;
  action?: string;
  timestamp?: string;
}

export interface SummaryCopy {
  right?: string;
  wrong?: string;
  action?: string;
}

/**
 * Transforms blunt direct feedback phrases into constructive coaching copy.
 */
export function formatCoachingText(text: string | null | undefined, type: 'right' | 'wrong' | 'action'): string {
  if (!text || !text.trim()) return '';

  let cleaned = text.trim();

  if (type === 'wrong') {
    // Reframe direct failures into growth opportunities
    cleaned = cleaned
      .replace(/^Failed to\s+/i, 'Opportunity to improve on ')
      .replace(/^Did not\s+/i, 'Could enhance engagement by ')
      .replace(/^Missed\s+/i, 'Consider incorporating ')
      .replace(/^Poor\s+/i, 'Refine ')
      .replace(/^Lack of\s+/i, 'Strengthen ')
      .replace(/^Inadequate\s+/i, 'Further develop ');

    if (!cleaned.toLowerCase().startsWith('opportunity') && !cleaned.toLowerCase().startsWith('consider') && !cleaned.toLowerCase().startsWith('could')) {
      cleaned = `Growth Opportunity: ${cleaned}`;
    }
  } else if (type === 'action') {
    // Reframe action items into supportive coaching recommendations
    cleaned = cleaned
      .replace(/^Stop\s+/i, 'Try shifting towards ')
      .replace(/^Must\s+/i, 'Recommended focus: ')
      .replace(/^Do not\s+/i, 'Aim to avoid ')
      .replace(/^Fix\s+/i, 'Polishing ');

    if (!cleaned.toLowerCase().startsWith('recommended') && !cleaned.toLowerCase().startsWith('try') && !cleaned.toLowerCase().startsWith('aim') && !cleaned.toLowerCase().startsWith('consider')) {
      cleaned = `Coaching Tip: ${cleaned}`;
    }
  }

  return cleaned;
}

/**
 * Returns coaching version of an executive summary object.
 */
export function getCoachingSummary(summary: SummaryCopy | null | undefined): SummaryCopy {
  if (!summary) return {};

  return {
    right: summary.right ? `Key Strength: ${summary.right}` : undefined,
    wrong: formatCoachingText(summary.wrong, 'wrong'),
    action: formatCoachingText(summary.action, 'action'),
  };
}

/**
 * Returns coaching version of pointer arrays.
 */
export function getCoachingPointers(pointers: InsightPointer[]): InsightPointer[] {
  if (!Array.isArray(pointers)) return [];

  return pointers.map((p) => ({
    ...p,
    right: p.right,
    wrong: formatCoachingText(p.wrong, 'wrong'),
    action: formatCoachingText(p.action, 'action'),
  }));
}
