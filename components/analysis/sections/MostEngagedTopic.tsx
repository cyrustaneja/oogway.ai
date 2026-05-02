"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { EmptyState } from '../primitives/EmptyState';
import { Flame } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function MostEngagedTopic({ data }: Props) {
  const topic = data.expert_audit?.most_engaged_topic;
  const isEmpty = !topic || !topic.topic;

  return (
    <SectionCard
      eyebrow="Where the room came alive"
      title="Most Engaged Topic"
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-success/15 border border-brand-success/25 flex items-center justify-center text-brand-success">
          <Flame className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No standout topic identified"
          hint="Engagement looked even across chapters in this session — no single topic spiked enough to flag as the most engaged."
          icon={Flame}
          compact
        />
      ) : (
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-success/30 to-brand-success/10 border border-brand-success/30 flex items-center justify-center text-brand-success text-xl font-extrabold">
            #{topic!.chapter}
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-[var(--foreground)] tracking-tight">
              {topic!.topic}
            </p>
            <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
              {topic!.why}
            </p>
            <p className="text-[10px] font-bold text-brand-success mt-2 uppercase tracking-widest">
              Chapter {topic!.chapter}
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
