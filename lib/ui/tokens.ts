/**
 * Unified design tokens for the analysis page.
 *
 * Everything dark-mode-first using CSS variables defined in app/globals.css.
 * Tailwind classes are layered on top of those vars where useful.
 *
 * Color semantics (chip palette):
 *   - green     → strong / positive (Deep, Strong, Active, On, On Time, Resolved, ...)
 *   - darkgreen → premium positive  (Answered+Anchored, Reframed, Complete+Deep, ...)
 *   - amber     → mid / caution     (Explained, Balanced, Responsive, Partial, ...)
 *   - red       → weak / negative   (Definitional weakness, Silent, Major Gap, Incorrect, Left Hanging, Widespread, ...)
 *   - grey      → neutral / unset
 */

export const TOKENS = {
  chip: {
    red:       'bg-brand-danger/15  text-brand-danger  border-brand-danger/30',
    amber:     'bg-brand-warning/15 text-brand-warning border-brand-warning/30',
    green:     'bg-brand-success/15 text-brand-success border-brand-success/30',
    darkgreen: 'bg-brand-success/30 text-emerald-200   border-brand-success/40',
    blue:      'bg-brand-info/15    text-brand-info    border-brand-info/30',
    orange:    'bg-brand-orange/15  text-brand-orange  border-brand-orange/30',
    grey:      'bg-[var(--inner-bg)] text-[var(--muted)] border-[var(--inner-border)]',
  },

  /** Glass-style outer card (uses .glass-card from globals.css) */
  card: 'glass-card p-6',

  /** Inner subtle panel inside a glass card (for nested groupings) */
  innerPanel:
    'rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] p-4',

  /** Section title — small uppercase eyebrow above a section */
  sectionEyebrow:
    'text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]',

  /** Section heading (H2) — Outfit font kicks in via globals */
  sectionHeading:
    'text-xl font-bold text-[var(--foreground)] tracking-tight',

  /** Body text */
  body: 'text-sm text-[var(--foreground)] leading-relaxed',

  /** Muted body text */
  bodyMuted: 'text-sm text-[var(--muted)] leading-relaxed',

  /** Label-style metadata */
  meta: 'text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]',
}

/** Map any rubric label to a TOKENS.chip color key. */
export function chipKeyForLabel(label?: string | null): keyof typeof TOKENS.chip {
  if (!label) return 'grey'
  const v = label.trim()

  // Premium-positive
  if (
    v === 'Answered+Anchored' ||
    v === 'Reframed' ||
    v === 'Complete+Deep'
  ) return 'darkgreen'

  // Positive
  if (
    v === 'Deep' || v === 'Strong' || v === 'Active' ||
    v === 'On' || v === 'On Time' ||
    v === 'No Gap' || v === 'Resolved' ||
    v === 'Accurate' || v === 'Correct' ||
    v === 'Full Context' || v === 'Complete'
  ) return 'green'

  // Mid / caution
  if (
    v === 'Explained' || v === 'Balanced' ||
    v === 'Responsive' || v === 'Partial' ||
    v === 'Minor Gap' || v === 'Notable Gap' ||
    v === 'Answered' ||
    v === 'Possibly Incorrect' || v === 'Needs Review' ||
    v === 'Partial Context' ||
    v === 'Isolated' || v === 'Localized'
  ) return 'amber'

  // Negative
  if (
    v === 'Definitional' || v === 'Weak' ||
    v === 'Silent' || v === 'Off' || v === 'Delayed' ||
    v === 'Major Gap' || v === 'Ignored' ||
    v === 'Incorrect' || v === 'Incorrect Resolution' ||
    v === 'Left Hanging' || v === 'Widespread' ||
    v === 'No Context' || v === 'Incomplete' ||
    v === 'Rushed' || v === 'Overdwelled'
  ) return 'red'

  // None / unknown
  return 'grey'
}

/** Score → 0–100 color band */
export function chipKeyForScore(score?: number | null): keyof typeof TOKENS.chip {
  if (score == null) return 'grey'
  if (score >= 80) return 'green'
  if (score >= 60) return 'amber'
  return 'red'
}
