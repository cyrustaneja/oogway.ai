"use client";

import React from 'react';
import { TOKENS } from '@/lib/ui/tokens';

type SectionCardProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  eyebrow,
  description,
  rightSlot,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section className={`${TOKENS.card} ${className}`}>
      {(title || eyebrow || rightSlot) && (
        <header className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            {eyebrow && <p className={TOKENS.sectionEyebrow}>{eyebrow}</p>}
            {title && (
              <h2 className={`${TOKENS.sectionHeading} ${eyebrow ? 'mt-1.5' : ''}`}>
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[12.5px] text-[var(--muted)] mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
