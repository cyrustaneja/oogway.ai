"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { CollapsibleList } from '../primitives/CollapsibleList';
import { EmptyState } from '../primitives/EmptyState';
import { RubricChip } from '../primitives/RubricChip';
import { SectionCard } from '../primitives/SectionCard';
import { EvidenceQuote } from '../primitives/EvidenceQuote';
import { Lightbulb } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function AnalogiesUsed({ data }: Props) {
  const analogies = (data as any).analogies_summary || data.expert_audit?.analogies_summary || [];
  const isEmpty = analogies.length === 0;

  return (
    <SectionCard
      eyebrow="Comparisons & metaphors used to teach"
      title={isEmpty ? 'Analogies Used' : `Analogies Used (${analogies.length})`}
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange">
          <Lightbulb className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No analogies recorded"
          hint="The expert didn't use any analogies, comparisons, or metaphors that the analyser could pin to a verbatim quote in this session."
          icon={Lightbulb}
        />
      ) : (
      <CollapsibleList
        items={analogies}
        kind="analogies"
        initialCount={3}
        renderItem={(analogy: any, i: number) => (
          <div
            key={i}
            className={`rounded-2xl p-4 border bg-[var(--inner-bg)] ${
              analogy.quality_label === 'Weak'
                ? 'border-brand-warning/30'
                : 'border-[var(--inner-border)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Chapter {analogy.chapter}
                </p>
                <h4 className="text-[14px] font-bold text-[var(--foreground)] mt-0.5">
                  {analogy.concept}
                </h4>
              </div>
              <RubricChip
                rubricKey="analogy_quality"
                label={analogy.quality_label}
                rationale={analogy.rationale}
              />
            </div>
            <EvidenceQuote
              quote={analogy.verbatim_quote}
              timestamp={analogy.timestamp || '0:00'}
              chapterRef={analogy.chapter}
            />
            <p className="text-[12px] text-[var(--muted)] leading-relaxed">
              {analogy.rationale}
            </p>
          </div>
        )}
      />
      )}
    </SectionCard>
  );
}
