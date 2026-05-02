"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { EvidenceQuote } from '../primitives/EvidenceQuote';
import { EmptyState } from '../primitives/EmptyState';
import { TOKENS, chipKeyForLabel } from '@/lib/ui/tokens';
import { AlertOctagon, ShieldCheck } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function AccuracyIssues({ data }: Props) {
  const issues = data.expert_audit?.accuracy_issues || [];
  const isEmpty = issues.length === 0;

  return (
    <SectionCard
      eyebrow="Statements that need a second look"
      title={isEmpty ? 'Technical Accuracy Issues' : `Technical Accuracy Issues (${issues.length})`}
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-danger/15 border border-brand-danger/25 flex items-center justify-center text-brand-danger">
          <AlertOctagon className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No accuracy issues flagged"
          hint="Stage 2 didn't surface any statements where the expert's claim appeared incorrect or misleading. This is the expected outcome for a clean session."
          icon={ShieldCheck}
        />
      ) : (
      <div className="space-y-3">
        {issues.map((issue: any, i: number) => (
          <div
            key={i}
            className={`rounded-2xl p-4 border ${
              issue.accuracy_label === 'Incorrect'
                ? 'border-brand-danger/30 bg-brand-danger/[0.07]'
                : 'border-brand-warning/30 bg-brand-warning/[0.05]'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`shrink-0 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border ${
                    TOKENS.chip[chipKeyForLabel(issue.accuracy_label)]
                  }`}
                >
                  Accuracy: {issue.accuracy_label}
                </span>
                <p className="text-[12.5px] font-bold text-[var(--foreground)] truncate">
                  Ch. {issue.chapter} · {issue.topic}
                </p>
              </div>
              {issue.timestamp && (
                <span className="shrink-0 text-[9px] font-mono text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full uppercase border border-brand-orange/20">
                  T: {issue.timestamp}
                </span>
              )}
            </div>

            {issue.concern && (
              <p className="text-[13px] text-[var(--foreground)]/95 leading-relaxed mb-3">
                {issue.concern}
              </p>
            )}

            {issue.flagged_statement && (
              <div className="mb-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-danger mb-1.5">
                  Flagged statement
                </p>
                <EvidenceQuote
                  quote={issue.flagged_statement}
                  timestamp={issue.timestamp ?? ''}
                />
              </div>
            )}

            {issue.verbatim_quote && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                  Verbatim from transcript
                </p>
                <EvidenceQuote
                  quote={issue.verbatim_quote}
                  timestamp={issue.timestamp ?? ''}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </SectionCard>
  );
}
