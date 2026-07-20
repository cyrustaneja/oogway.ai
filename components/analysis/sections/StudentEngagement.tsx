"use client";

import React, { useState } from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { CollapsibleList } from '../primitives/CollapsibleList';
import { SectionCard } from '../primitives/SectionCard';
import { MessagesSquare } from 'lucide-react';

type TabKey = 'asked' | 'answered' | 'other';

type Props = {
  data: SessionAnalysis;
};

export function StudentEngagement({ data }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('asked');
  const questions = data.student_log?.student_questions || [];

  const counts = {
    asked: questions.filter((q: any) => q.type === 'asked').length,
    answered: questions.filter((q: any) => q.type === 'answered').length,
    other: questions.filter((q: any) => q.type === 'other').length,
  };

  const filtered = questions.filter((q: any) => q.type === activeTab);

  const renderTab = (type: TabKey, label: string) => (
    <button
      onClick={() => setActiveTab(type)}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
        activeTab === type
          ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/25'
          : 'border border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
      }`}
    >
      {label}
      <span
        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
          activeTab === type
            ? 'bg-brand-orange/20 text-brand-orange'
            : 'bg-[var(--inner-bg)] text-[var(--muted)]'
        }`}
      >
        {counts[type]}
      </span>
    </button>
  );

  return (
    <SectionCard
      eyebrow="Every student utterance, classified"
      title="Student Participation Log"
      description={`${questions.length} total interaction${
        questions.length === 1 ? '' : 's'
      } across the session`}
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-info/15 border border-brand-info/25 flex items-center justify-center text-brand-info">
          <MessagesSquare className="w-4 h-4" />
        </div>
      }
    >
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] mb-4">
        {renderTab('asked', 'Asked')}
        {renderTab('answered', 'Answered')}
        {renderTab('other', 'Other')}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[var(--muted)]">
          <p className="text-[12.5px] italic">
            No interactions recorded in this category.
          </p>
        </div>
      ) : (
        <CollapsibleList
          items={filtered}
          kind="interactions"
          initialCount={4}
          renderItem={(q: any, i: number) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)]"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-[11px] font-bold text-brand-orange uppercase">
                {q.student?.substring(0, 1) ?? '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[12.5px] font-bold text-[var(--foreground)]">
                    {q.student}
                  </span>
                  <span className="text-[10px] font-mono text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-full uppercase border border-brand-orange/20">
                    {q.timestamp}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Ch. {q.chapter}
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--foreground)]/90 leading-relaxed italic">
                  “{q.question}”
                </p>
              </div>
            </div>
          )}
        />
      )}
    </SectionCard>
  );
}
