'use client';

import React, { useState } from 'react';
import { HelpCircle, Clock } from 'lucide-react';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

export function StudentQuestionsSection({
  questions,
  onTimestampClick,
}: {
  questions: any[];
  onTimestampClick?: (t: string) => void;
}) {
  const { showPreview, hidePreview } = useVideoPreview();

  if (!questions || questions.length === 0) return null;

  return (
    <div className="glass-card p-6 mt-8 border border-[var(--border)] shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--chip-blue-bg)] border border-[var(--chip-blue-border)]">
            <HelpCircle className="w-5 h-5 text-[var(--chip-blue-text)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              Student Genuine Functional Questions &amp; Doubts
            </h3>
            <p className="text-[11px] text-[var(--muted)] font-medium">
              {questions.length} conceptual doubt{questions.length === 1 ? '' : 's'} raised by students
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q: any, i: number) => {
          const studentName = q.student_name || q.student || q.speaker || 'Student';
          const initials = studentName.slice(0, 2).toUpperCase();

          const status = q.resolution_status || q.status || 'Resolved';
          const isUnresolved = String(status).toLowerCase().includes('unresolved');
          const isPartial = String(status).toLowerCase().includes('partial');

          const statusBadge = isUnresolved
            ? 'bg-[var(--chip-red-bg)] text-[var(--chip-red-text)] border-[var(--chip-red-border)]'
            : isPartial
            ? 'bg-[var(--chip-amber-bg)] text-[var(--chip-amber-text)] border-[var(--chip-amber-border)]'
            : 'bg-[var(--chip-green-bg)] text-[var(--chip-green-text)] border-[var(--chip-green-border)]';

          return (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--border)] bg-white/90 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-[var(--muted-foreground)] transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[var(--layer-2)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--foreground)] shrink-0 mt-0.5 shadow-sm">
                  {initials}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--foreground)]">
                      {studentName}
                    </span>
                    {q.concept && (
                      <span className="px-2 py-0.5 rounded-md bg-[var(--chip-blue-bg)] text-[var(--chip-blue-text)] text-[10px] font-bold uppercase tracking-wider border border-[var(--chip-blue-border)]">
                        {q.concept}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] leading-relaxed italic">
                    “{q.question || q.doubt}”
                  </p>
                </div>
              </div>

              {q.timestamp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTimestampClick) onTimestampClick(q.timestamp);
                  }}
                  onMouseEnter={(e) => showPreview(q.timestamp, e as any)}
                  onMouseLeave={hidePreview}
                  className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider bg-[var(--layer-2)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[#1D1D1F] hover:text-white transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  {q.timestamp}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
