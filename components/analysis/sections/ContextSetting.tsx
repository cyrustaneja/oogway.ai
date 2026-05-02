"use client";

import React from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { SectionCard } from '../primitives/SectionCard';
import { EvidenceQuote } from '../primitives/EvidenceQuote';
import { EmptyState } from '../primitives/EmptyState';
import { RubricChip } from '../primitives/RubricChip';
import { Compass } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function ContextSetting({ data }: Props) {
  const cs = data.context_setup ?? { score: 0, label: '—', narrative: '', evidence: [] };
  const { label, narrative, evidence } = cs;
  const hasContent = !!narrative || (evidence && evidence.length > 0);

  return (
    <SectionCard
      eyebrow="How the session opened"
      title="Context Setting"
      rightSlot={
        <div className="flex items-center gap-2">
          <RubricChip
            rubricKey="context_setup"
            label={label}
            rationale={narrative || undefined}
          />
          <div className="w-10 h-10 rounded-2xl bg-brand-info/15 border border-brand-info/25 flex items-center justify-center text-brand-info">
            <Compass className="w-4 h-4" />
          </div>
        </div>
      }
    >
      {!hasContent ? (
        <EmptyState
          title="No context-setting captured"
          hint="The synthesizer didn't produce a narrative or evidence for the opening of this session. The label chip on the right reflects whatever score Stage 3 assigned."
          icon={Compass}
          compact
        />
      ) : (
        <>
          {narrative && (
            <p className="text-[13.5px] text-[var(--foreground)]/90 leading-relaxed mb-4">
              {narrative}
            </p>
          )}
          {evidence && evidence.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-2.5">
                Evidence from transcript
              </p>
              <div className="space-y-2">
                {evidence.map((ev: any, i: number) => (
                  <EvidenceQuote
                    key={i}
                    quote={ev.verbatim_quote}
                    timestamp={ev.timestamp}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
