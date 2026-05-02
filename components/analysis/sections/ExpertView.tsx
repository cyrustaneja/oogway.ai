"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { EmptyState } from '../primitives/EmptyState';
import { CollapsibleList } from '../primitives/CollapsibleList';
import { RubricChip } from '../primitives/RubricChip';
import { EvidenceQuote } from '../primitives/EvidenceQuote';
import { QuestionsAnswered } from './QuestionsAnswered';
import { TOKENS, chipKeyForLabel } from '@/lib/ui/tokens';
import { Heart, Lightbulb, Gauge, AlertTriangle } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function ExpertView({ data }: Props) {
  const audit = data.expert_audit ?? ({} as any);
  const analogies = audit.analogies_summary ?? [];
  const exampleGaps = audit.example_gaps ?? [];

  // Combine analogies + example gaps into one view
  // Analogies show quality; example gaps show where examples were thin
  const hasAnalogies = analogies.length > 0;
  const hasGaps = exampleGaps.length > 0;

  return (
    <div className="space-y-6">
      {/* Pedagogical Health Summary */}
      <SectionCard
        eyebrow="Verdict"
        title="Pedagogical Health Summary"
        rightSlot={
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange">
            <Heart className="w-4 h-4" />
          </div>
        }
      >
        <p className="text-[14px] text-[var(--foreground)]/95 leading-relaxed">
          {audit.pedagogical_health_summary || 'No summary produced.'}
        </p>
      </SectionCard>

      {/* Analogies & Examples — combined section */}
      <SectionCard
        eyebrow="Teaching aids used"
        title="Analogies & Examples"
        rightSlot={
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange">
            <Lightbulb className="w-4 h-4" />
          </div>
        }
      >
        {!hasAnalogies && !hasGaps ? (
          <EmptyState
            title="No analogies or example gaps recorded"
            hint="The expert didn't use analogies the analyser could pin to a verbatim quote, and every chapter had at least one concrete example."
            icon={Lightbulb}
          />
        ) : (
          <div className="space-y-4">
            {/* Analogies */}
            {hasAnalogies && (
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

            {/* Example Gaps — flagged inline */}
            {hasGaps && (
              <div className="space-y-2 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-warning px-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Example gaps flagged
                </p>
                {exampleGaps.map((g: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-brand-warning/[0.06] border border-brand-warning/20"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                        Ch. {g.chapter}
                      </p>
                      <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">
                        {g.topic}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        TOKENS.chip[chipKeyForLabel(g.gap_label)]
                      }`}
                    >
                      Example Gap: {g.gap_label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Doubt Resolution Summary */}
      <QuestionsAnswered data={data} />
    </div>
  );
}
