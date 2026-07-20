import React from 'react';
import { getSessionAnalysis } from '@/lib/server/analysis';
import { AnalysisInProgress } from '@/components/analysis/AnalysisInProgress';
import { Tier1Review } from '@/components/analysis/Tier1Review';
import { SessionTabs } from '@/components/analysis/SessionTabs';

// Force fresh DB read on every request — the page is also re-fetched after
// the in-progress widget triggers router.refresh() once the pipeline is done.
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSessionAnalysis(id);

  if (!result) {
    return <AnalysisInProgress sessionId={id} />;
  }

  const { data, chapters, tier } = result;

  const safeChapters = chapters ?? [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-24 animate-in fade-in duration-500">
      <SessionTabs data={data} sessionId={id} sessionInfo={(data as any).session_info} chapters={safeChapters} />
    </main>
  );
}
