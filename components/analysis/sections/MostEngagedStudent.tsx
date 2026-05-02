"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { EmptyState } from '../primitives/EmptyState';
import { Star } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function MostEngagedStudent({ data }: Props) {
  // Support both new array format and legacy single-student format
  const students: Array<{ name: string; why: string; evidence_count: number }> =
    (data.expert_audit as any)?.most_engaged_students ??
    ((data.expert_audit as any)?.most_engaged_student
      ? [(data.expert_audit as any).most_engaged_student]
      : []);

  const isEmpty = students.length === 0;
  const title = isEmpty
    ? 'Most Engaged Students'
    : `Most Engaged Students (${students.length})`;

  return (
    <SectionCard
      eyebrow="Students who showed up loudest"
      title={title}
      rightSlot={
        <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center text-brand-orange">
          <Star className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No standout students identified"
          hint="No students showed up significantly in this session — engagement was either evenly distributed or unattributed."
          icon={Star}
          compact
        />
      ) : (
        <div className="space-y-3">
          {students.map((student, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange/30 to-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-brand-orange text-lg font-extrabold shrink-0">
                {student.name?.substring(0, 1).toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-[var(--foreground)] tracking-tight">
                    {student.name}
                  </p>
                  {i === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-brand-orange/15 text-brand-orange border border-brand-orange/25">
                      Top
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--muted)] mt-0.5 leading-relaxed">
                  {student.why}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[16px] font-bold text-brand-orange">{student.evidence_count}</p>
                <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest">interactions</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
