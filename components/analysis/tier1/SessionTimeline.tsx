'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

export function SessionTimeline({
  sessionFlow,
  onTimestampClick,
}: {
  sessionFlow: any[];
  onTimestampClick?: (t: string) => void;
}) {
  const { showPreview, hidePreview } = useVideoPreview();

  if (!sessionFlow || sessionFlow.length === 0) return null;

  return (
    <div className="mt-12 pt-10 border-t border-[var(--border)] relative max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--foreground)]" />
          <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Session Flow Timeline
          </h3>
        </div>
        <span className="text-xs font-medium text-[var(--muted)]">
          {Math.min(sessionFlow.length, 12)} Major Milestones
        </span>
      </div>

      <div className="relative pl-6 space-y-4 border-l-2 border-[var(--border)]">
        {sessionFlow.slice(0, 12).map((flow: any, i: number) => {
          const isIssue = Boolean(flow.issue && flow.issue.trim() !== '');
          return (
            <div key={i} className="relative group">
              <div
                className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                  isIssue ? 'bg-[var(--chip-red-text)] shadow-sm' : 'bg-[var(--foreground)] shadow-sm'
                }`}
              />

              <div className="p-4 rounded-xl border border-[var(--border)] bg-white/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[var(--foreground)]">{flow.chapter}</span>
                    {isIssue && (
                      <span className="px-2 py-0.5 rounded-md bg-[var(--chip-red-bg)] border border-[var(--chip-red-border)] text-[var(--chip-red-text)] text-[10px] font-bold uppercase tracking-wider">
                        Issue Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed font-medium">
                    {flow.summary}
                  </p>
                  {isIssue && (
                    <p className="text-xs text-[var(--chip-red-text)] font-medium bg-[var(--chip-red-bg)] p-2 rounded-md border border-[var(--chip-red-border)] mt-1">
                      ⚠️ {flow.issue}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTimestampClick) onTimestampClick(flow.start_timestamp);
                  }}
                  onMouseEnter={(e) => showPreview(flow.start_timestamp, e as any)}
                  onMouseLeave={hidePreview}
                  className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider bg-[var(--layer-2)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[#1D1D1F] hover:text-white transition-colors cursor-pointer self-start sm:self-center"
                >
                  {flow.start_timestamp} {flow.end_timestamp ? `→ ${flow.end_timestamp}` : ''}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
