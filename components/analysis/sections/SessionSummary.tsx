"use client";

import React, { useState } from 'react';
import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';
import { TOKENS, chipKeyForLabel, chipKeyForScore } from '@/lib/ui/tokens';
import { RubricChip } from '../primitives/RubricChip';
import { RubricReference } from '../RubricReference';
import { Calendar, Clock, FileDown, Loader2, Coins } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
  sessionId: string;
  sessionInfo?: {
    name: string;
    expertName: string;
    batchName: string;
    date: string;
    duration: string;
    costEstimate?: number | null;
  };
  chapters: ChapterResult[];
};

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof TOKENS.chip;
}) {
  return (
    <div className={`flex flex-col items-start px-3 py-2.5 md:px-4 md:py-3 rounded-2xl border ${TOKENS.chip[tone]}`}>
      <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.18em] opacity-80 truncate w-full">{label}</span>
      <span className="text-sm md:text-base font-bold mt-0.5 leading-tight truncate w-full">{value}</span>
    </div>
  );
}

export function SessionSummary({ data, sessionId, sessionInfo, chapters }: Props) {
  const completenessTone = chipKeyForLabel(data.session_completeness?.label);
  
  // Robust flag detection (AI + Auto-detect from Red rubrics + Incompleteness)
  const aiFlags = data.session_flags?.flags ?? [];
  let autoFlagsCount = chapters.reduce((count, ch) => {
    let redCount = 0;
    if (ch.accuracy_check?.label === 'Incorrect' || ch.accuracy_check?.label === 'Possibly Incorrect') {
       const existsInAI = aiFlags.some((f: any) => f.category === 'AccuracyConcern' && f.rationale.includes(`Ch. ${ch.chapter_num}`));
       if (!existsInAI) redCount++;
    }
    const ignoredDoubts = ch.doubts?.filter((d: any) => d.resolution?.label === 'Ignored') || [];
    if (ignoredDoubts.length > 0) redCount++;
    // Confusion
    const widespreadConfusion = ch.confusion_points?.filter((p: any) => p.severity?.label === 'Widespread') || [];
    if (widespreadConfusion.length > 0) redCount++;
    
    if (ch.example_gap?.label === 'Severe Gap') redCount++;
    return count + redCount;
  }, 0);

  // Add flag for Session Incompleteness & Context
  const contextScore = data.context_setup?.score ?? 100;
  if (contextScore <= 60) autoFlagsCount++;

  if (data.session_completeness?.label === 'Incomplete' || (data.topics_missed_from_notes?.length ?? 0) > 0) {
    const existsInAI = aiFlags.some((f: any) => f.category === 'MissedTopics');
    if (!existsInAI) autoFlagsCount++;
  }

  const totalFlags = (data.session_flags?.total_flags ?? 0) + autoFlagsCount;
  const highCount = (data.session_flags?.high_count ?? 0) + autoFlagsCount;

  const flagTone =
    highCount > 0
      ? 'red'
      : (data.session_flags?.medium_count ?? 0) > 0
      ? 'amber'
      : 'green';

  const totalDoubts = (data.expert_audit?.doubt_resolution_summary?.length ?? 0);
  const unresolved = data.student_log?.unresolved_doubts?.length ?? 0;

  const [downloading, setDownloading] = useState(false);

  async function handleExportPDF() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/pdf`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF generation failed: ${text}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${(sessionInfo?.name || 'session-analysis').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[EXPORT_PDF_ERROR]', e);
      alert('Failed to generate PDF. Please try again or check the console.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <header className="mb-6 lg:mb-8">
      <div className="glass-card p-5 md:p-7 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-60" />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={TOKENS.sectionEyebrow}>
              {sessionInfo?.expertName || 'Expert'} · {sessionInfo?.batchName || 'Batch'}
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl lg:text-4xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight truncate">
              {sessionInfo?.name || 'Session Analysis'}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 md:gap-x-5 mt-4 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {sessionInfo?.date || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {sessionInfo?.duration || '—'}
              </span>
              {sessionInfo?.costEstimate != null && (
                <span className="flex items-center gap-1.5 opacity-90 text-brand-orange hover:underline cursor-default" title="Estimated AI cost based on input/output tokens">
                  <Coins className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Cost estimation for this analysis: ${sessionInfo.costEstimate < 0.01 ? sessionInfo.costEstimate.toFixed(3) : sessionInfo.costEstimate.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <RubricChip
              rubricKey="hygiene_camera"
              label={data.hygiene?.camera?.label ?? '—'}
              rationale="Expert camera usage visibility"
            />
            <RubricChip
              rubricKey="hygiene_punctuality"
              label={data.hygiene?.punctuality?.label ?? '—'}
              rationale="Expert punctuality at session start"
            />
            <div className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center gap-2">
              <RubricReference />
              <button
                id="export-pdf-btn"
                onClick={handleExportPDF}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest
                  bg-brand-orange/10 border border-brand-orange/30 text-brand-orange
                  hover:bg-brand-orange/20 hover:border-brand-orange/60
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 whitespace-nowrap"
              >
                {downloading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <FileDown className="w-3.5 h-3.5" />}
                {downloading ? 'Generating…' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatPill
            label="Completeness"
            value={data.session_completeness?.label || '—'}
            tone={completenessTone}
          />
          <StatPill
            label="Flags Raised"
            value={`${totalFlags}`}
            tone={flagTone}
          />
          <StatPill
            label="Student Doubts"
            value={`${totalDoubts}`}
            tone={chipKeyForScore(100 - unresolved * 12)}
          />
          <StatPill
            label="Unresolved"
            value={`${unresolved}`}
            tone={unresolved > 0 ? 'amber' : 'green'}
          />
        </div>
      </div>
    </header>
  );
}
