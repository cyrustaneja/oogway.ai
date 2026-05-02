"use client";

import React from 'react';
import { SessionAnalysis, ChapterResult } from '@/lib/types/analysis';
import { TOKENS, chipKeyForLabel, chipKeyForScore } from '@/lib/ui/tokens';
import { RubricChip } from '../primitives/RubricChip';
import { RubricReference } from '../RubricReference';
import { Calendar, Clock, GraduationCap } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
  sessionInfo?: {
    name: string;
    expertName: string;
    batchName: string;
    date: string;
    duration: string;
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
    <div className={`flex flex-col items-start px-4 py-3 rounded-2xl border ${TOKENS.chip[tone]}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">{label}</span>
      <span className="text-base font-bold mt-0.5 leading-tight">{value}</span>
    </div>
  );
}

export function SessionSummary({ data, sessionInfo, chapters }: Props) {
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
    if (ch.example_gap?.label === 'Severe Gap') redCount++;
    return count + redCount;
  }, 0);

  // Add flag for Session Incompleteness
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

  return (
    <header className="mb-8">
      <div className="glass-card p-7 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-60" />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={TOKENS.sectionEyebrow}>Pedagogical Audit</p>
            <h1 className="mt-2 text-3xl lg:text-4xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
              {sessionInfo?.expertName || 'Expert'}
              <span className="text-brand-orange"> · </span>
              {sessionInfo?.batchName || 'Batch'}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-4 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {sessionInfo?.date || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {sessionInfo?.duration || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {sessionInfo?.name || `Schema ${data.schema_version ?? 'v1'}`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
            <RubricReference />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatPill
            label="Completeness"
            value={data.session_completeness?.label ? `Completeness: ${data.session_completeness.label}` : '—'}
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
