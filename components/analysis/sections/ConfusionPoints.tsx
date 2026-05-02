"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { CollapsibleList } from '../primitives/CollapsibleList';
import { EmptyState } from '../primitives/EmptyState';
import { RubricChip } from '../primitives/RubricChip';
import { SectionCard } from '../primitives/SectionCard';
import { Brain } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function ConfusionPoints({ data }: Props) {
  const points = data.student_log?.confusion_summary || [];
  const isEmpty = points.length === 0;

  return (
    <SectionCard
      eyebrow="Topics that visibly confused students"
      title={isEmpty ? 'Student Confusion' : `Student Confusion (${points.length})`}
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-warning/15 border border-brand-warning/25 flex items-center justify-center text-brand-warning">
          <Brain className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No widespread confusion detected"
          hint="No topic in this session triggered visible student confusion in the transcript. Individual doubts (if any) appear in the Doubt Resolution section above."
          icon={Brain}
        />
      ) : (
      <CollapsibleList
        items={points}
        kind="confusion points"
        initialCount={3}
        renderItem={(point: any, i: number) => (
          <div
            key={i}
            className="rounded-2xl p-4 bg-[var(--inner-bg)] border border-[var(--inner-border)]"
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Ch. {point.chapter}
                </p>
                <h4 className="text-[14px] font-bold text-[var(--foreground)] truncate">
                  {point.topic}
                </h4>
              </div>
              <RubricChip
                rubricKey="confusion_severity"
                label={point.severity_label}
              />
            </div>
            <p className="pl-3 border-l-2 border-brand-warning/40 italic text-[12.5px] text-[var(--foreground)]/85 leading-relaxed">
              {point.why}
            </p>
          </div>
        )}
      />
      )}
    </SectionCard>
  );
}
