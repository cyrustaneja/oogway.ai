"use client";

import React, { useState } from 'react';
import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';
import { AlertTriangle, ChevronDown } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
  chapters: ChapterResult[];
};

function severityKey(s: string) {
  return (s || '').toLowerCase();
}

export function FlagBanner({ data, chapters }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 1. Get AI-generated flags
  const aiFlags = data.session_flags?.flags ?? [];
  
  // 2. Auto-generate flags from "Red" rubrics (Robustness fallback)
  const autoFlags: any[] = [];
  
  chapters.forEach((ch: any) => {
    // Accuracy
    if (ch.accuracy_check?.label === 'Incorrect' || ch.accuracy_check?.label === 'Possibly Incorrect') {
      const exists = aiFlags.some((f: any) => f.category === 'AccuracyConcern' && f.rationale.includes(`Ch. ${ch.chapter_num}`));
      if (!exists) {
        autoFlags.push({
          category: 'AccuracyConcern',
          severity: 'high',
          rationale: `Ch. ${ch.chapter_num}: ${ch.accuracy_check.label} statement flagged in "${ch.title}"`
        });
      }
    }
    // Doubts
    const ignoredDoubts = ch.doubts?.filter((d: any) => d.resolution?.label === 'Ignored') || [];
    if (ignoredDoubts.length > 0) {
      autoFlags.push({
        category: 'UnresolvedDoubts',
        severity: 'high',
        rationale: `Ch. ${ch.chapter_num}: ${ignoredDoubts.length} student doubt(s) left unresolved`
      });
    }
    // Examples
    if (ch.example_gap?.label === 'Severe Gap') {
      autoFlags.push({
        category: 'MissingExamples',
        severity: 'high',
        rationale: `Ch. ${ch.chapter_num}: Severe lack of examples flagged`
      });
    }
  });

  // 3. Session Incompleteness Flag
  if (data.session_completeness?.label === 'Incomplete' || (data.topics_missed_from_notes?.length ?? 0) > 0) {
    const exists = aiFlags.some((f: any) => f.category === 'MissedTopics');
    if (!exists) {
      const missed = data.topics_missed_from_notes || [];
      autoFlags.push({
        category: 'MissedTopics',
        severity: 'high',
        rationale: missed.length > 0 
          ? `Session Incomplete: ${missed.length} planned topics were skipped (${missed.slice(0,2).join(', ')}...)`
          : 'Session marked as Incomplete based on planned agenda coverage.'
      });
    }
  }

  const allFlags = [...aiFlags, ...autoFlags];
  const highCount = allFlags.filter(f => severityKey(f.severity) === 'high').length;
  const medCount = allFlags.filter(f => severityKey(f.severity) === 'medium').length;
  const lowCount = allFlags.filter(f => severityKey(f.severity) === 'low').length;

  if (isDismissed || allFlags.length === 0) return null;

  const tone = highCount > 0 ? 'danger' : medCount > 0 ? 'warning' : 'info';
  const toneClasses =
    tone === 'danger'
      ? 'border-brand-danger/30 bg-brand-danger/[0.07]'
      : tone === 'warning'
      ? 'border-brand-warning/30 bg-brand-warning/[0.07]'
      : 'border-brand-info/30 bg-brand-info/[0.07]';
  const iconColor =
    tone === 'danger'
      ? 'text-brand-danger'
      : tone === 'warning'
      ? 'text-brand-warning'
      : 'text-brand-info';

  return (
    <div className={`mb-6 rounded-2xl border ${toneClasses} backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center justify-between pr-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between px-5 py-4 text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)] ${iconColor}`}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-[var(--foreground)]">
                {allFlags.length} operational flag
                {allFlags.length !== 1 ? 's' : ''} detected
              </p>
              <p className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
                {highCount > 0 ? 'Critical issues require review' : 'Review session-wide observations'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <span className="text-[9px] font-bold tracking-widest uppercase bg-brand-danger/20 text-brand-danger px-2 py-1 rounded-full border border-brand-danger/30">
                {highCount} High
              </span>
            )}
            {medCount > 0 && (
              <span className="text-[9px] font-bold tracking-widest uppercase bg-brand-warning/20 text-brand-warning px-2 py-1 rounded-full border border-brand-warning/30">
                {medCount} Med
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-2 text-[var(--muted)] hover:text-brand-danger transition-colors"
          title="Dismiss Banner"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-brand-danger/10">
            Dismiss
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="px-5 pb-5 space-y-2 border-t border-[var(--inner-border)] pt-4 max-h-[400px] overflow-y-auto">
          {allFlags.map((flag: any, i: number) => {
            const sev = severityKey(flag.severity);
            const dot =
              sev === 'high'
                ? 'bg-brand-danger'
                : sev === 'medium'
                ? 'bg-brand-warning'
                : 'bg-[var(--muted)]';
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)]"
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <p className="text-[13px] text-[var(--foreground)] leading-relaxed">
                  <span className="font-bold mr-2 text-brand-orange tracking-wide uppercase text-[10px]">
                    [{flag.category}]
                  </span>
                  {flag.rationale}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
