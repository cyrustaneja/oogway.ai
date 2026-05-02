"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { MostEngagedStudent } from './MostEngagedStudent';
import { MostEngagedTopic } from './MostEngagedTopic';
import { ConfusionPoints } from './ConfusionPoints';
import { StudentEngagement } from './StudentEngagement';
import { SectionCard } from '../primitives/SectionCard';
import { EmptyState } from '../primitives/EmptyState';
import { TOKENS, chipKeyForLabel } from '@/lib/ui/tokens';
import { CheckCircle, AlertCircle, Activity } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function StudentView({ data }: Props) {
  const log = data.student_log ?? ({} as any);
  const unresolved = log.unresolved_doubts ?? [];
  const engagementByChapter = log.engagement_by_chapter ?? [];

  return (
    <div className="space-y-6">
      <MostEngagedStudent data={data} />

      {/* Most engaged topic — moved here from ExpertView */}
      <MostEngagedTopic data={data} />

      {/* Engagement by chapter */}
      <SectionCard
        eyebrow="Per-chapter engagement"
        title="Engagement by Chapter"
        rightSlot={
          <div className="w-10 h-10 rounded-2xl bg-brand-info/15 border border-brand-info/25 flex items-center justify-center text-brand-info">
            <Activity className="w-4 h-4" />
          </div>
        }
      >
        {engagementByChapter.length === 0 ? (
          <EmptyState
            title="No per-chapter engagement recorded"
            hint="The synthesizer didn't produce engagement labels for individual chapters. This is most common when the transcript has no student utterances or chat activity."
            icon={Activity}
            compact
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {engagementByChapter.map((e: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)]"
              >
                <p className="text-[12.5px] text-[var(--foreground)] font-semibold truncate">
                  Chapter {e.chapter}
                </p>
                <span
                  className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    TOKENS.chip[chipKeyForLabel(e.label)]
                  }`}
                >
                  Engagement: {e.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <ConfusionPoints data={data} />
      <StudentEngagement data={data} />

      {/* Unresolved doubts */}
      <SectionCard
        eyebrow="Doubts that did not get resolution"
        title="Unresolved Doubts"
        rightSlot={
          <div className="w-10 h-10 rounded-2xl bg-brand-danger/15 border border-brand-danger/25 flex items-center justify-center text-brand-danger">
            <AlertCircle className="w-4 h-4" />
          </div>
        }
      >
        {unresolved.length === 0 ? (
          <EmptyState
            title="No unresolved doubts"
            hint="Every student doubt detected in this session was either answered or anchored back to the right concept. This is the desired outcome."
            icon={CheckCircle}
            compact
          />
        ) : (
          <div className="space-y-2.5">
            {unresolved.map((d: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-brand-danger/[0.06] border border-brand-danger/20"
              >
                <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-brand-danger" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-danger">
                    {d.student}
                  </p>
                  <p className="text-[13px] text-[var(--foreground)] mt-1 leading-snug italic">
                    &ldquo;{d.doubt}&rdquo;
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 font-mono">
                    Ch. {d.chapter} · T: {d.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
