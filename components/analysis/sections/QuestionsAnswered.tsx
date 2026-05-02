"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { CollapsibleList } from '../primitives/CollapsibleList';
import { EmptyState } from '../primitives/EmptyState';
import { RubricChip } from '../primitives/RubricChip';
import { SectionCard } from '../primitives/SectionCard';
import { MessageCircleQuestion } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function QuestionsAnswered({ data }: Props) {
  const questions = data.expert_audit?.doubt_resolution_summary || [];
  const isEmpty = questions.length === 0;
  const unresolved = questions.filter((q: any) => q.resolution_label === 'Ignored').length;

  return (
    <SectionCard
      eyebrow="How student doubts were handled"
      title={isEmpty ? 'Doubt Resolution' : `Doubt Resolution (${questions.length})`}
      description={
        isEmpty
          ? 'No student doubts were detected in this session.'
          : unresolved > 0
            ? `${unresolved} doubt${unresolved === 1 ? '' : 's'} left unresolved`
            : 'All student doubts were addressed'
      }
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-info/15 border border-brand-info/25 flex items-center justify-center text-brand-info">
          <MessageCircleQuestion className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No student doubts surfaced"
          hint="No questions or doubts were extracted from this session — either the students didn't ask any, or the chat/voice channel didn't capture them."
          icon={MessageCircleQuestion}
        />
      ) : (
      <CollapsibleList
        items={questions}
        kind="doubts"
        initialCount={4}
        renderItem={(q: any, i: number) => (
          <div
            key={i}
            className={`rounded-2xl p-4 border ${
              q.resolution_label === 'Ignored'
                ? 'border-brand-danger/25 bg-brand-danger/[0.05]'
                : 'border-[var(--inner-border)] bg-[var(--inner-bg)]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full border border-brand-orange/20">
                  {q.student}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Ch. {q.chapter}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <RubricChip
                  size="sm"
                  rubricKey="doubt_resolution"
                  label={q.resolution_label}
                  rationale={q.rationale}
                />
                <span
                  className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border ${
                    q.resolution_label !== 'Ignored'
                      ? 'bg-brand-success/15 text-brand-success border-brand-success/25'
                      : 'bg-brand-danger/15 text-brand-danger border-brand-danger/25'
                  }`}
                >
                  {q.resolution_label !== 'Ignored' ? 'Resolved' : 'Left Hanging'}
                </span>
              </div>
            </div>

            <p className="text-[13.5px] text-[var(--foreground)] leading-relaxed mb-2.5 italic">
              “{q.doubt}”
            </p>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                Resolution accuracy
              </p>
              <RubricChip
                size="sm"
                rubricKey="resolution_accuracy"
                label={q.resolution_accuracy}
              />
            </div>

            {q.rationale && (
              <p className="text-[12px] text-[var(--muted)] mt-2 leading-relaxed">
                {q.rationale}
              </p>
            )}
          </div>
        )}
      />
      )}
    </SectionCard>
  );
}
