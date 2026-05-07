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
    // Confusion
    const widespreadConfusion = ch.confusion_points?.filter((p: any) => p.severity?.label === 'Widespread') || [];
    if (widespreadConfusion.length > 0) {
      autoFlags.push({
        category: 'ConfusionWidespread',
        severity: 'high',
        rationale: `Ch. ${ch.chapter_num}: Widespread student confusion detected regarding "${ch.title}"`
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

  // 3. Session Incompleteness & Context Flag
  const contextScore = data.context_setup?.score ?? 100;
  if (contextScore <= 60) {
    autoFlags.push({
      category: 'ContextMissing',
      severity: 'medium',
      rationale: `Context Setting: Session score is ${contextScore}/100. Missing agenda or learning objective framing.`
    });
  }

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
      <div className="flex items-center justify-between pr-2 md:pr-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between px-4 md:px-5 py-4 text-left focus:outline-none min-w-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)] ${iconColor}`}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] md:text-[13px] font-bold uppercase tracking-widest text-[var(--foreground)] truncate">
                {allFlags.length} operational flag
                {allFlags.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] md:text-[11px] text-[var(--muted)] font-medium mt-0.5 truncate">
                {highCount > 0 ? 'Critical review required' : 'Review session-wide notes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 ml-2 shrink-0">
            {highCount > 0 && (
              <span className="text-[8px] md:text-[9px] font-bold tracking-widest uppercase bg-brand-danger/20 text-brand-danger px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border border-brand-danger/30">
                {highCount}<span className="hidden sm:inline ml-1">High</span>
              </span>
            )}
            {medCount > 0 && (
              <span className="text-[8px] md:text-[9px] font-bold tracking-widest uppercase bg-brand-warning/20 text-brand-warning px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border border-brand-warning/30">
                {medCount}<span className="hidden sm:inline ml-1">Med</span>
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
          className="p-2 text-[var(--muted)] hover:text-brand-danger transition-colors shrink-0"
          title="Dismiss Banner"
        >
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 py-1 md:px-2 md:py-1 rounded-lg hover:bg-brand-danger/10">
            Hide
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
