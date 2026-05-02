"use client";

import React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

type Props = {
  /** Short label shown above the message, e.g. "No analogies recorded". */
  title: string;
  /** Longer explanation. Defaults to a generic line about the AI not finding anything. */
  hint?: string;
  /** Optional icon override — pass any lucide-react icon component. */
  icon?: LucideIcon;
  /** Compact = smaller padding, used inline inside SectionCard children. */
  compact?: boolean;
};

/**
 * EmptyState
 *
 * Renders a low-key placeholder block when a section has no data to show.
 *
 * The whole point: when Stage 2 or Stage 3 produces an empty array (e.g. "no
 * analogies were used in this session"), we still want the section visible
 * so the user can SEE that we looked and found nothing — vs the section
 * silently disappearing, which makes the page feel broken.
 *
 * Used by every section in components/analysis/sections/*.
 */
export function EmptyState({ title, hint, icon: Icon = Inbox, compact = false }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl bg-[var(--inner-bg)] border border-dashed border-[var(--inner-border)] ${
        compact ? 'py-6 px-4' : 'py-10 px-6'
      }`}
    >
      <div className="w-10 h-10 rounded-2xl bg-[var(--card-bg)] border border-[var(--inner-border)] flex items-center justify-center text-[var(--muted)] mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[12.5px] font-bold uppercase tracking-widest text-[var(--muted)]">
        {title}
      </p>
      {hint && (
        <p className="text-[12px] text-[var(--muted)] mt-1.5 leading-relaxed max-w-sm">
          {hint}
        </p>
      )}
    </div>
  );
}
