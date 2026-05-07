"use client";

import React, { useState } from 'react';
import { ChapterResult } from '@/lib/types/analysis';
import { RubricChip } from '../primitives/RubricChip';
import { EvidenceQuote } from '../primitives/EvidenceQuote';
import { TOKENS, chipKeyForLabel } from '@/lib/ui/tokens';
import {
  ChevronDown,
  MessageCircleQuestion,
  Lightbulb,
  AlertOctagon,
  BookOpen,
  Users,
} from 'lucide-react';

type Props = {
  chapter: ChapterResult;
  totalDuration?: number;
};

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-2.5">
      {children}
    </p>
  );
}

export function ChapterCard({ chapter, totalDuration }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const totalDoubts = chapter.doubts?.length ?? 0;
  const totalAnalogies = chapter.analogies?.length ?? 0;
  const totalConfusion = chapter.confusion_points?.length ?? 0;

  const duration = ((chapter as any).t_end || 0) - ((chapter as any).t_start || 0);
  const percentage = totalDuration ? Math.round((duration / totalDuration) * 100) : 0;

  return (
    <div className="rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] overflow-hidden transition-all hover:border-brand-orange/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 text-left gap-4"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-[12px] font-bold text-brand-orange">
            {String(chapter.chapter_num).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-bold text-[var(--foreground)] tracking-tight leading-tight truncate">
              {chapter.title}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-24 h-1 rounded-full bg-[var(--inner-border)] overflow-hidden">
                <div 
                  className="h-full bg-brand-orange transition-all duration-500" 
                  style={{ width: `${Math.max(2, percentage)}%` }} 
                />
              </div>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                {formatTimestamp(chapter.t_start)} – {formatTimestamp(chapter.t_end)} • {percentage}% of session
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            {chapter.teaching_depth && (
              <RubricChip
                size="sm"
                rubricKey="teaching_depth"
                label={chapter.teaching_depth.label}
              />
            )}
            {chapter.accuracy_check && chapter.accuracy_check.label !== 'Accurate' && (
              <RubricChip
                size="sm"
                rubricKey="accuracy"
                label={chapter.accuracy_check.label}
              />
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--muted)] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-[var(--inner-border)] pt-5 space-y-6">
          {/* Summary line */}
          <p className="text-[13.5px] text-[var(--foreground)]/95 leading-relaxed">
            {chapter.what_was_taught}
          </p>

          {/* Two-column rubric block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <MiniLabel>
                  <BookOpen className="w-3 h-3" />
                  How it was taught
                </MiniLabel>
                <div className="flex flex-wrap gap-4 mb-3">
                  {chapter.teaching_depth && (
                    <div className="space-y-2">
                      <RubricChip
                        rubricKey="teaching_depth"
                        label={chapter.teaching_depth.label}
                        rationale={chapter.teaching_depth.rationale}
                      />
                      {chapter.teaching_depth.evidence?.[0] && (
                        <EvidenceQuote
                          quote={chapter.teaching_depth.evidence[0].verbatim_quote}
                          timestamp={chapter.teaching_depth.evidence[0].timestamp}
                        />
                      )}
                    </div>
                  )}
                  {chapter.pacing && (
                    <div className="space-y-2">
                      <RubricChip
                        rubricKey="pacing"
                        label={chapter.pacing.label}
                        rationale={chapter.pacing.rationale}
                      />
                      {chapter.pacing.evidence?.[0] && (
                        <EvidenceQuote
                          quote={chapter.pacing.evidence[0].verbatim_quote}
                          timestamp={chapter.pacing.evidence[0].timestamp}
                        />
                      )}
                    </div>
                  )}
                  {chapter.accuracy_check && (
                    <div className="space-y-2">
                      <RubricChip
                        rubricKey="accuracy"
                        label={chapter.accuracy_check.label}
                      />
                      {chapter.accuracy_check.verbatim_quote && (
                        <EvidenceQuote
                          quote={chapter.accuracy_check.verbatim_quote}
                          timestamp={chapter.accuracy_check.timestamp ?? ''}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {chapter.example_gap && (
                <div className="mb-6">
                  <MiniLabel>Example coverage</MiniLabel>
                  <RubricChip
                    rubricKey="example_gap"
                    label={chapter.example_gap.label}
                    rationale={chapter.example_gap.rationale}
                  />
                  {chapter.example_gap.evidence?.[0] && (
                    <div className="mt-2">
                      <EvidenceQuote
                        quote={chapter.example_gap.evidence[0].verbatim_quote}
                        timestamp={chapter.example_gap.evidence[0].timestamp}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  if (!seconds && seconds !== 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
