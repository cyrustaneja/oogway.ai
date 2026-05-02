"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type CollapsibleListProps<T> = {
  items: T[];
  renderItem: (item: T, i: number) => React.ReactNode;
  initialCount?: number;
  kind: string;
};

export function CollapsibleList<T>({
  items,
  renderItem,
  initialCount = 3,
  kind,
}: CollapsibleListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const visibleItems = isExpanded ? items : items.slice(0, initialCount);
  const hiddenCount = items.length - initialCount;

  return (
    <div className="space-y-3">
      {visibleItems.map((item, i) => renderItem(item, i))}

      {!isExpanded && hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-2.5 text-[11px] font-bold uppercase tracking-widest text-brand-orange hover:text-brand-orange/80 transition-colors rounded-xl border border-dashed border-[var(--inner-border)] hover:border-brand-orange/30 bg-[var(--inner-bg)] flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show all {items.length} {kind}
        </button>
      )}

      {isExpanded && items.length > initialCount && (
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full py-2.5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-2"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          Show less
        </button>
      )}
    </div>
  );
}
