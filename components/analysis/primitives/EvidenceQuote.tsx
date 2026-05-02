"use client";

import React from 'react';

type EvidenceQuoteProps = {
  quote: string;
  timestamp: string;
  chapterRef?: number;
};

export function EvidenceQuote({ quote, timestamp, chapterRef }: EvidenceQuoteProps) {
  const [isVisible, setIsVisible] = React.useState(false);

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
          <span className="font-mono text-[9px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand-orange/20">
            T: {timestamp}
          </span>
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
