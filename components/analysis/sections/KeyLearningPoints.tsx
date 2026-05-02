"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { EmptyState } from '../primitives/EmptyState';
import { Sparkles } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function KeyLearningPoints({ data }: Props) {
  const points = data.key_learning_points ?? [];
  const isEmpty = points.length === 0;

  return (
    <SectionCard
      eyebrow="What Students Should Walk Away With"
      title="Key Learning Points"
      description={
        isEmpty
          ? 'No concrete takeaways were surfaced from this session.'
          : `${points.length} concrete takeaways extracted from this session`
      }
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange">
          <Sparkles className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No takeaways extracted"
          hint="The synthesizer didn't identify any standalone learning points. This usually means the session was Q&A-heavy or admin-heavy with limited conceptual teaching."
          icon={Sparkles}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {points.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] hover:border-brand-orange/30 transition-colors"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-brand-orange/15 text-brand-orange text-[11px] font-bold border border-brand-orange/25">
                {i + 1}
              </span>
              <p className="text-[13.5px] text-[var(--foreground)]/95 leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
