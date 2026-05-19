import React from 'react';
import { getSessionAnalysis } from '@/lib/server/analysis';
import {
  AnalysisHeader,
  FlagBanner,
  KeyLearningPoints,
  SessionFlow,
  ContextSettingCard,
  TopicCoverageCard,
  ExpertStudentToggle,
} from '@/components/analysis/sections';
import { AnalysisInProgress } from '@/components/analysis/AnalysisInProgress';
import { CoachingTipsPanel } from '@/components/analysis/CoachingTipsPanel';

// Force fresh DB read on every request — the page is also re-fetched after
// the in-progress widget triggers router.refresh() once the pipeline is done.
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSessionAnalysis(id);

  if (!result) {
    return <AnalysisInProgress sessionId={id} />;
  }

  const { data, chapters } = result;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-24 animate-in fade-in duration-500">
      <AnalysisHeader data={data} sessionId={id} sessionInfo={(data as any).session_info} chapters={chapters} />

      <div className="space-y-6">
        <FlagBanner data={data} chapters={chapters} />

        <KeyLearningPoints data={data} />

        <SessionFlow chapters={chapters} />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3 px-1">
            Detailed Breakdown
          </p>
          <div className="space-y-6">
            <ContextSettingCard data={data} />
            <TopicCoverageCard data={data} />
          </div>
        </div>

        <ExpertStudentToggle data={data} />

        {/* ── On-demand Coaching Tips — independent, not part of the pipeline ── */}
        <CoachingTipsPanel sessionId={id} />
      </div>
    </main>
  );
}
