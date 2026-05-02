"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { RubricChip } from '../primitives/RubricChip';
import { TOKENS } from '@/lib/ui/tokens';
import { CheckCircle2, MinusCircle, Target } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function TopicCoverage({ data }: Props) {
  const { label } = data.session_completeness ?? { label: '—' };
  const covered = data.topics_covered || [];
  const missed = data.topics_missed_from_notes || [];
  const total = covered.length + missed.length;
  const pct = total ? Math.round((covered.length / total) * 100) : 0;

  return (
    <SectionCard
      eyebrow="Planned agenda vs. what was actually taught"
      title="Topic Coverage"
      rightSlot={
        <div className="flex items-center gap-2">
          <RubricChip rubricKey="session_completeness" label={label} />
          <div className="w-10 h-10 rounded-2xl bg-brand-success/15 border border-brand-success/25 flex items-center justify-center text-brand-success">
            <Target className="w-4 h-4" />
          </div>
        </div>
      }
    >
      {total > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Agenda completion
            </p>
            <p className="text-[12px] font-bold text-[var(--foreground)]">
              {covered.length} of {total} topics ({pct}%)
            </p>
          </div>
          <div className="h-2 rounded-full bg-[var(--inner-bg)] border border-[var(--inner-border)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-success to-brand-success/70"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-5">
        {covered.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-success mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Covered ({covered.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {covered.map((topic, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border ${TOKENS.chip.green}`}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {missed.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-danger mb-3">
              <MinusCircle className="w-3.5 h-3.5" />
              Missed from notes ({missed.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {missed.map((topic, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border ${TOKENS.chip.red}`}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {covered.length === 0 && missed.length === 0 && (
          <p className="text-[12.5px] text-[var(--muted)] italic">
            No agenda topics were linked to this session.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
