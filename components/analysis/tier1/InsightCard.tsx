'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';
import { ConsolidatedPointers } from './ConsolidatedPointers';

export function InsightCard({
  insight,
  index,
  onTimestampClick,
  mode = 'direct',
}: {
  insight: any;
  index: number;
  onTimestampClick?: (t: string) => void;
  mode?: 'direct' | 'coaching';
}) {
  const [open, setOpen] = useState(index === 0);
  const { showPreview, hidePreview } = useVideoPreview();

  const pointers = insight.pointers || [];
  const topTimes = Array.from(
    new Set(pointers.flatMap((p: any) => p.timestamps || []).filter((t: any) => t && String(t).trim() !== ''))
  ).slice(0, 2) as string[];

  const summaryLines: string[] = [];
  pointers.forEach((p: any) => {
    if (p.right && p.right.trim()) summaryLines.push(`🟢 Right: ${p.right.trim()}`);
    if (p.wrong && p.wrong.trim()) summaryLines.push(`🔴 Flaw: ${p.wrong.trim()}`);
    if (p.action && p.action.trim()) summaryLines.push(`🎯 Action: ${p.action.trim()}`);
    if (p.reason && p.reason.trim()) summaryLines.push(`💡 Reason: ${p.reason.trim()}`);
  });
  if (summaryLines.length === 0 && insight.summary) {
    summaryLines.push(insight.summary);
  }
  const displayTwoLines = summaryLines.slice(0, 2);

  return (
    <div className="ks-card overflow-hidden group">
      {/* Header Banner */}
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 cursor-pointer hover:bg-[var(--layer-2)] transition-all text-left space-y-2"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm bg-[var(--foreground)]" />
            <span className="font-semibold text-[15px] tracking-tight text-[var(--foreground)]">
              {insight.metric}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {topTimes.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {topTimes.map((t, i) => (
                  <span
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTimestampClick) onTimestampClick(t);
                    }}
                    onMouseEnter={(e) => showPreview(t, e as any)}
                    onMouseLeave={hidePreview}
                    className="px-2 py-0.5 rounded-md bg-[var(--layer-2)] border border-[var(--border)] text-[var(--foreground)] font-mono font-bold text-[10px] hover:bg-[#1D1D1F] hover:text-white transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--layer-2)] group-hover:bg-white border border-transparent group-hover:border-[var(--border)] transition-all">
              {open ? (
                <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
              )}
            </div>
          </div>
        </div>

        {!open && (
          <div className="pt-1.5 space-y-2">
            {insight.summary && (
              <p className="text-[13px] text-[var(--foreground)]/90 font-medium leading-relaxed">
                {insight.summary}
              </p>
            )}

            {displayTwoLines.length > 0 && displayTwoLines[0] !== insight.summary && (
              <div className="pt-2 border-t border-dashed border-[var(--border)]/60 space-y-1.5">
                {displayTwoLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-medium text-[var(--muted)] leading-relaxed">
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-5 pb-5 pt-2 bg-[var(--layer-1)] border-t border-[var(--border)]">
              <p className="text-[14px] text-[var(--foreground)] leading-relaxed mb-4 pb-4 border-b border-[var(--border)] font-medium">
                {insight.summary}
              </p>

              {pointers.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">
                    {mode === 'coaching' ? 'Coaching Observations' : 'Consolidated Observations'}
                  </p>
                  <ConsolidatedPointers
                    pointers={pointers}
                    onTimestampClick={onTimestampClick}
                    showPreview={showPreview}
                    hidePreview={hidePreview}
                    mode={mode}
                  />
                </div>
              ) : (
                <p className="text-[12px] text-[var(--muted)] italic">No specific pointers identified.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
