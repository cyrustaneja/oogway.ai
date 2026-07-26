'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Info, Target, ChevronDown, ChevronRight, MessageSquareQuote, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCoachingText } from '@/lib/utils/coaching-formatter';

export function ConsolidatedPointers({
  pointers,
  onTimestampClick,
  showPreview,
  hidePreview,
  mode = 'direct',
}: {
  pointers: any[];
  onTimestampClick?: (t: string) => void;
  showPreview: any;
  hidePreview: any;
  mode?: 'direct' | 'coaching';
}) {
  const [showProof, setShowProof] = useState(false);

  const allRight = Array.from(new Set(pointers.map((p) => p.right).filter((r) => r && r.trim() !== '')));
  const rawWrong = Array.from(new Set(pointers.map((p) => p.wrong).filter((w) => w && w.trim() !== '')));
  const allWrong = mode === 'coaching' ? rawWrong.map(w => formatCoachingText(w, 'wrong')) : rawWrong;
  
  const allReason = Array.from(new Set(pointers.map((p) => p.reason).filter((r) => r && r.trim() !== '')));
  
  const rawAction = Array.from(new Set(pointers.map((p) => p.action).filter((a) => a && a.trim() !== '')));
  const allAction = mode === 'coaching' ? rawAction.map(a => formatCoachingText(a, 'action')) : rawAction;

  const allTimes = Array.from(new Set(pointers.flatMap((p) => p.timestamps || []).filter((t) => t && t.trim() !== '')));
  const allProofs = pointers.map((p) => p.proof).filter((p) => p && p.trim() !== '');

  return (
    <div className="border border-[var(--border)] rounded-2xl p-4 bg-white space-y-4 shadow-sm">
      {/* Timestamps */}
      {allTimes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 shrink-0 pb-3 border-b border-[var(--border)]">
          <span className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest self-center mr-2">
            Timestamps:
          </span>
          {allTimes.map((t: string, i: number) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (onTimestampClick) onTimestampClick(t);
              }}
              onMouseEnter={(e) => showPreview(t, e)}
              onMouseLeave={hidePreview}
              className="px-2 py-0.5 bg-[var(--layer-2)] border border-[var(--border)] text-[var(--foreground)] text-[10px] rounded-md font-mono font-bold flex items-center gap-1 hover:bg-[#1D1D1F] hover:text-white transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Structured Details */}
      <div className="space-y-4">
        {allRight.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[var(--chip-green-bg)] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--chip-green-text)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--chip-green-text)] uppercase tracking-widest mb-1">
                {mode === 'coaching' ? 'Core Strengths Demonstrated' : 'What Was Done Right'}
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allRight.map((text: any, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allWrong.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">
                {mode === 'coaching' ? 'Growth Opportunities' : 'What Was Done Wrong'}
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allWrong.map((text: any, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allReason.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[var(--chip-blue-bg)] flex items-center justify-center">
              <Info className="w-3.5 h-3.5 text-[var(--chip-blue-text)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--chip-blue-text)] uppercase tracking-widest mb-1">
                Hypothesis / Context
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allReason.map((text: any, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allAction.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1">
                {mode === 'coaching' ? 'Coaching Recommendation' : 'What Can Be Done'}
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allAction.map((text: any, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Proofs Toggle */}
      {allProofs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed border-[var(--border)]">
          <button
            onClick={() => setShowProof(!showProof)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] hover:text-[var(--foreground)] uppercase tracking-wider transition-colors"
          >
            {showProof ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            View Verbatim Transcript Proof ({allProofs.length})
          </button>

          <AnimatePresence>
            {showProof && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 mt-3">
                  {allProofs.map((proof: any, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 items-start bg-[var(--layer-2)] p-3 rounded-lg border border-[var(--border)]"
                    >
                      <MessageSquareQuote className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
                      <p className="text-[12px] text-[var(--foreground)] leading-relaxed italic">"{proof}"</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
