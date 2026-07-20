"use client";

import React from 'react';
import { Clock } from 'lucide-react';

type EvidenceQuoteProps = {
  quote: string;
  timestamp: string;
  chapterRef?: number;
  onTimestampClick?: (t: string) => void;
};

import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

export function EvidenceQuote({ quote, timestamp, chapterRef, onTimestampClick }: EvidenceQuoteProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const { showPreview, hidePreview } = useVideoPreview();

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-orange/5 border border-brand-orange/15 hover:bg-brand-orange/10 transition-colors group"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange group-hover:underline">
          View Evidence
        </span>
        <span className="font-mono text-[9px] font-bold text-brand-orange/60">
          [{timestamp}]
        </span>
      </button>
    );
  }

  return (
    <div className="relative pl-4 pr-3 py-2.5 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)] animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-orange/50" />
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <div className="flex items-center gap-2">
          {timestamp && (
            <button 
              onClick={(e) => {
                if (onTimestampClick) onTimestampClick(timestamp);
              }}
              onMouseEnter={(e) => showPreview(timestamp, e)}
              onMouseLeave={hidePreview}
              className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange/80 hover:text-white hover:bg-brand-orange font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              title="Click to jump to this timestamp in the video"
            >
              <Clock className="w-2.5 h-2.5 opacity-70" />
              T: {timestamp}
            </button>
          )}
          {chapterRef !== undefined && (
            <span className="text-[9px] font-bold tracking-widest uppercase text-[var(--muted)]">
              Ch. {chapterRef}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-brand-orange"
        >
          Hide
        </button>
      </div>
      <p className="text-[12.5px] leading-relaxed text-[var(--foreground)]/90 italic">
        “{quote}”
      </p>
    </div>
  );
}
