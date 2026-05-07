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
};

export function SessionFlow({ chapters }: Props) {
  const isEmpty = !chapters || chapters.length === 0;
  const totalDuration = chapters.length > 0 
    ? Math.max(...chapters.map(c => (c as any).t_end || 0)) || 1
    : 1;

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
        <CollapsibleList
          items={chapters}
          kind="chapters"
          initialCount={Math.min(3, chapters.length)}
          renderItem={(chapter, i) => (
            <ChapterCard 
              key={i} 
              chapter={chapter} 
              totalDuration={totalDuration} 
            />
          )}
        />
      )}
    </SectionCard>
  );
}
