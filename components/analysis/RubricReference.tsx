"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenCheck, X } from 'lucide-react';
import { RUBRICS } from '@/lib/config/rubrics';
import { TOKENS } from '@/lib/ui/tokens';

const COLOR_TO_KEY: Record<string, keyof typeof TOKENS.chip> = {
  red: 'red',
  amber: 'amber',
  green: 'green',
  darkgreen: 'darkgreen',
  grey: 'grey',
};

export function RubricReference() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] text-[var(--foreground)] text-[11px] font-bold uppercase tracking-widest hover:border-brand-orange/40 hover:text-brand-orange transition-colors"
        aria-label="Open rubric reference"
      >
        <BookOpenCheck className="w-3.5 h-3.5" />
        View Rubrics
      </button>

      <AnimatePresence>
        {open && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="glass-card w-full max-w-3xl max-h-[85vh] overflow-hidden relative shadow-2xl flex flex-col z-10"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-60" />

              <div className="flex items-start justify-between gap-4 p-7 border-b border-[var(--inner-border)]">
                <div>
                  <p className={TOKENS.sectionEyebrow}>How sessions are scored</p>
                  <h2 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight mt-1.5">
                    Oogway Rubric Reference
                  </h2>
                  <p className="text-[12.5px] text-[var(--muted)] mt-2 leading-relaxed">
                    Every label in this analysis comes from one of these rubrics.
                    Each rubric has a fixed set of levels — labels are never
                    free-form, so cross-session comparison stays consistent.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 w-9 h-9 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-5">
                {Object.values(RUBRICS).map((r) => (
                  <section
                    key={r.key}
                    className="rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-[15px] font-bold text-[var(--foreground)] tracking-tight">
                        {r.name}
                      </h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] bg-[var(--inner-bg)] border border-[var(--inner-border)] px-2 py-0.5 rounded-full">
                        per {r.per}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mb-3">
                      {r.what_it_measures}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.levels.map((level) => {
                        const colorClass = TOKENS.chip[COLOR_TO_KEY[level.color]] ?? TOKENS.chip.grey;
                        return (
                          <div
                            key={level.label}
                            className="rounded-xl bg-[var(--card-bg)] border border-[var(--inner-border)] p-3"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colorClass}`}
                              >
                                {level.label}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--muted)]">
                                score {level.score}
                              </span>
                            </div>
                            <p className="text-[12px] text-[var(--foreground)]/85 leading-relaxed">
                              {level.help}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
}
