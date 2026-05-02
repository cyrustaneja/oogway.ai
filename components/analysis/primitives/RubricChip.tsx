"use client";

import React from 'react';
import { RUBRICS } from '@/lib/config/rubrics';
import { TOKENS, chipKeyForLabel } from '@/lib/ui/tokens';

type RubricChipProps = {
  rubricKey?: string;
  label: string;
  rationale?: string;
  verbatim?: string;
  timestamp?: string;
  size?: 'sm' | 'md';
};

export function RubricChip({
  rubricKey,
  label,
  rationale,
  verbatim,
  timestamp,
  size = 'md',
}: RubricChipProps) {
  const rubric = rubricKey ? RUBRICS[rubricKey as keyof typeof RUBRICS] : undefined;
  const levels = (rubric as any)?.levels || [];
  const level = levels.find((l: any) => l.label === label);

  const colorKey = (level?.color as keyof typeof TOKENS.chip | undefined) ?? chipKeyForLabel(label);
  const colorClass = TOKENS.chip[colorKey] ?? TOKENS.chip.grey;

  const sizing =
    size === 'sm'
      ? 'px-2 py-[2px] text-[10px]'
      : 'px-2.5 py-1 text-[11px]';

  const displayLabel = rubric ? `${rubric.name}: ${label}` : label;

  return (
    <div className="group relative inline-block">
      <span
        className={`inline-flex items-center ${sizing} rounded-full font-bold uppercase tracking-wider border ${colorClass} cursor-help transition-colors`}
      >
        {displayLabel}
      </span>
      {(rationale || verbatim || (rubric && level)) && (
        <div
          className="invisible group-hover:visible absolute z-50 w-72 p-4 mt-2 -ml-2 text-sm rounded-2xl shadow-2xl
                     bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--card-border)]
                     animate-in fade-in zoom-in duration-150"
        >
          {rationale && (
            <p className="mb-2 font-semibold text-[var(--foreground)] text-[12px] leading-snug">
              {rationale}
            </p>
          )}
          {verbatim && (
            <div className="pl-3 border-l-2 border-brand-orange/40 italic text-[var(--muted)] bg-[var(--inner-bg)] p-2.5 rounded-lg text-[11px] leading-relaxed mb-2">
              “{verbatim}”
              {timestamp && (
                <span className="block mt-1 font-mono text-[9px] text-[var(--muted-foreground)]">
                  T: {timestamp}
                </span>
              )}
            </div>
          )}
          {!rationale && level?.help && (
            <p className="text-[var(--muted)] italic text-[11px] mb-2">{level.help}</p>
          )}
          {rubric?.what_it_measures && (
            <div className="pt-2 mt-2 border-t border-[var(--inner-border)] text-[9px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">
              Measures: {rubric.what_it_measures}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
