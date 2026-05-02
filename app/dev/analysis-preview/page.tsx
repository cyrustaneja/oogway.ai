import React from 'react';
import { SAMPLE_ANALYSIS, SAMPLE_CHAPTERS } from '@/lib/dev/sample-analysis';
import { 
  AnalysisHeader, 
  FlagBanner, 
  KeyLearningPoints, 
  SessionFlow, 
  ContextSettingCard, 
  TopicCoverageCard, 
  ExpertStudentToggle 
} from '@/components/analysis/sections';

export default function DevPreviewPage() {
  // Enrichment usually done by the server fetcher
  const data = {
    ...SAMPLE_ANALYSIS,
    session_info: {
      expertName: "Vikram Sharma (Sample)",
      batchName: "MMP-Aug-2026-Test",
      date: "28 Apr",
      duration: "32 mins",
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 py-2 mb-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest">
            Dev Preview Mode
          </span>
          <span className="text-[10px] text-gray-400">
            lib/dev/sample-analysis.ts
          </span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4 pb-20">
        <AnalysisHeader data={data} sessionInfo={(data as any).session_info} />
        
        <div className="space-y-4">
          <FlagBanner data={data} />
          
          <div className="mb-8">
            <KeyLearningPoints data={data} />
          </div>

          <SessionFlow chapters={SAMPLE_CHAPTERS} />

          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Breakdown Analysis</h2>
            <div className="space-y-4">
              <ContextSettingCard data={data} />
              <TopicCoverageCard data={data} />
            </div>
          </div>

          <ExpertStudentToggle data={data} />
        </div>
      </main>
    </div>
  );
}
