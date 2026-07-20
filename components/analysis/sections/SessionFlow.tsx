"use client";

import React from 'react';
import { ChapterResult } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { CollapsibleList } from '../primitives/CollapsibleList';
import { EmptyState } from '../primitives/EmptyState';
import { ChapterCard } from './ChapterCard';
import { Map as MapIcon } from 'lucide-react';

type Props = {
  chapters: ChapterResult[];
  data?: any;
  sessionInfo?: any;
  onTimestampClick?: (t: string) => void;
};

const checkHasIssue = (chapter: ChapterResult) => {
  if (chapter.accuracy_check?.label === 'Incorrect' || chapter.accuracy_check?.label === 'Possibly Incorrect') return true;
  if (chapter.example_gap?.label === 'Severe Gap') return true;
  const widespreadConfusion = chapter.confusion_points?.filter((p: any) => p.severity?.label === 'Widespread') || [];
  if (widespreadConfusion.length > 0) return true;
  const ignoredDoubts = chapter.doubts?.filter((d: any) => d.resolution?.label === 'Ignored') || [];
  if (ignoredDoubts.length > 0) return true;
  return false;
};

export function SessionFlow({ chapters, data, sessionInfo, onTimestampClick }: Props) {
  const isEmpty = !chapters || chapters.length === 0;
  
  let parsedDuration = 0;
  if (data?.scheduledDuration) {
    parsedDuration = data.scheduledDuration * 60;
  } else if (sessionInfo?.duration) {
    const mins = parseInt(sessionInfo.duration);
    if (!isNaN(mins)) parsedDuration = mins * 60;
  }
  
  const totalDuration = parsedDuration > 0 
    ? parsedDuration
    : (chapters.length > 0 ? Math.max(...chapters.map(c => c.t_end || 0)) || 1 : 1);

  return (
    <SectionCard
      eyebrow="Chronological Walk-through"
      title="Session Flow"
      description={
        isEmpty
          ? 'No chapters were detected in this transcript.'
          : `${chapters.length} chapter${chapters.length === 1 ? '' : 's'} detected with granular rubric auditing.`
      }
      rightSlot={
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-brand-info/10 border border-brand-info/20 flex items-center justify-center text-brand-info">
          <MapIcon className="w-4 h-4" />
        </div>
      }
    >
      {isEmpty ? (
        <EmptyState
          title="No chapters detected"
          hint="Stage 1 didn't return any chapters for this session. Open the admin pipeline view to inspect or retry."
          icon={MapIcon}
        />
      ) : (
        <div className="relative pl-6 md:pl-8 border-l-2 border-[var(--inner-border)] ml-2 md:ml-4">
          <CollapsibleList
            items={chapters}
            kind="chapters"
            initialCount={Math.min(3, chapters.length)}
            renderItem={(chapter, i) => {
              const hasIssue = checkHasIssue(chapter);
              return (
                <div key={i} className="relative mb-6 last:mb-0">
                  <div 
                    className={`absolute -left-[31px] md:-left-[39px] top-5 w-3.5 h-3.5 rounded-full border-[3px] z-10 ${
                      hasIssue ? 'bg-[var(--background)] border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-[var(--background)] border-[var(--inner-border)]'
                    }`} 
                  />
                  <ChapterCard 
                    chapter={chapter} 
                    totalDuration={totalDuration} 
                    hasIssue={hasIssue}
                    onTimestampClick={onTimestampClick}
                  />
                </div>
              );
            }}
          />
        </div>
      )}
    </SectionCard>
  );
}
