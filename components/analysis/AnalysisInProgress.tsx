"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS } from '@/lib/ui/tokens';
import { RubricReference } from './RubricReference';
import {
  Loader2,
  Sparkles,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

const OOGWAY_QUOTES: { quote: string; tag: string }[] = [
  {
    quote:
      'Yesterday is history. Tomorrow is a mystery. But today is a gift — that is why it is called the present.',
    tag: 'On time',
  },
  { quote: 'There are no accidents.', tag: 'On meaning' },
  {
    quote: 'Your mind is like this water, my friend. When it is agitated, it becomes difficult to see. But if you allow it to settle, the answer becomes clear.',
    tag: 'On clarity',
  },
  { quote: 'One often meets his destiny on the road he takes to avoid it.', tag: 'On destiny' },
  { quote: 'You must believe.', tag: 'On faith' },
  {
    quote: 'The mark of a true champion is not whether they can triumph, but whether they can overcome obstacles.',
    tag: 'On grit',
  },
  {
    quote: 'Look at this tree, Shifu. I cannot make it blossom when it suits me, nor make it bear fruit before its time.',
    tag: 'On patience',
  },
  { quote: 'Quit. Don\'t quit. Noodles. Don\'t noodles.', tag: 'On choices' },
  {
    quote: 'There is just news. There is no good or bad.',
    tag: 'On perspective',
  },
  {
    quote: 'My old friend, the panda will never fulfill his destiny… nor you yours, until you let go of the illusion of control.',
    tag: 'On control',
  },
];

const STAGE_LABEL: Record<string, string> = {
  UPLOADED: 'Transcript received',
  PREPROCESSED: 'Cleaning transcript',
  CHAPTERS_DETECTED: 'Detecting chapters',
  EXTRACTING: 'Extracting chapter-by-chapter',
  EXTRACTED: 'Chapters extracted',
  SYNTHESIZED: 'Synthesising session-level audit',
  FLAGGED: 'Generating management flags',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
};

const STAGE_COPY: Record<string, string> = {
  UPLOADED:
    'Pipeline has picked up the transcript and queued the first stage.',
  PREPROCESSED:
    'Transcript is being cleaned and timestamp-normalised. Hindi/English/Hinglish mixing is being detected.',
  CHAPTERS_DETECTED:
    'Stage 1 just split the session into teaching chapters. Each one will now be audited independently.',
  EXTRACTING:
    'Stage 2 is running an expert audit on each chapter — depth, pacing, engagement, doubts, analogies, accuracy.',
  EXTRACTED:
    'All chapters audited. Now stitching them into a session-level synthesis.',
  SYNTHESIZED:
    'Stage 3 is building the session-level summary, doubt resolution log, and engagement view.',
  FLAGGED:
    'Generating flat management alerts (high / medium / low severity).',
};

type StatusPayload = {
  id: string;
  name: string;
  expertName: string;
  stage: string;
  v3Status: string;
  v3Error: string | null;
  chaptersDone: number;
  chaptersPlanned: number;
  progress: number;
  isComplete: boolean;
  isFailed: boolean;
  isReady: boolean;
};

type Props = {
  sessionId: string;
};

export function AnalysisInProgress({ sessionId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [pollError, setPollError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const lastReadyAt = useRef<number>(0);

  // Poll status every 4s
  useEffect(() => {
    let cancelled = false;
    let timer: any;
    let stopPolling = false;

    async function tick() {
      try {
        const res = await fetch(`/api/analysis/${sessionId}/status`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) {
          setPollError(`HTTP ${res.status}`);
          // Stop polling on auth/not-found errors — retrying won't help
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            stopPolling = true;
          }
          return;
        }
        const data = (await res.json()) as StatusPayload;
        if (cancelled) return;
        setStatus(data);
        setPollError(null);
        if (data.isReady && Date.now() - lastReadyAt.current > 1000) {
          lastReadyAt.current = Date.now();
          // Refresh the server-rendered shell so getSessionAnalysis runs again
          router.refresh();
        }
      } catch (e: any) {
        setPollError(e?.message ?? 'Network error');
      } finally {
        if (!cancelled && !stopPolling) timer = setTimeout(tick, 2000);
      }
    }
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId, router]);

  // Cycle quotes every 7s
  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % OOGWAY_QUOTES.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const stage = status?.stage ?? 'UPLOADED';
  const progress = status?.progress ?? 3;
  const stageLabel = STAGE_LABEL[stage] ?? stage;
  const stageCopy = STAGE_COPY[stage] ?? '';

  async function handleRetry() {
    setRetrying(true);
    try {
      await fetch(`/api/admin/pipeline/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch {}
    setRetrying(false);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className={TOKENS.sectionEyebrow}>Pipeline running</p>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight mt-2">
            Analysing {status?.expertName ? <span className="text-brand-orange">{status.expertName}</span> : 'this session'}…
          </h1>
          <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed max-w-xl">
            Master Oogway is reviewing every word of this transcript. This page
            updates every few seconds — feel free to leave it open.
          </p>
        </div>
        <RubricReference />
      </div>

      {/* Live card */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-60" />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Master Oogway portrait */}
          <div className="shrink-0">
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 1.5, 0, -1.5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-40 h-40 rounded-3xl bg-gradient-to-br from-brand-orange/30 via-brand-orange/10 to-transparent border border-brand-orange/30 flex items-center justify-center text-[80px] shadow-2xl shadow-brand-orange/20"
                aria-hidden
              >
                🐢
              </motion.div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center backdrop-blur-md">
                <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />
              </div>
            </div>
            <p className="text-center mt-3 text-[10px] font-bold uppercase tracking-widest text-brand-orange">
              Master Oogway
            </p>
          </div>

          {/* Status */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-end justify-between gap-3 mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Current stage
                </p>
                <p className="text-[18px] font-bold text-[var(--foreground)] tracking-tight mt-0.5">
                  {stageLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Progress
                </p>
                <p className="text-[28px] font-extrabold text-brand-orange leading-none mt-0.5 tabular-nums">
                  {progress}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-[var(--inner-bg)] border border-[var(--inner-border)] overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-orange via-brand-orange/80 to-brand-orange/60 shadow-[0_0_18px_rgba(243,112,33,0.45)]"
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 18 }}
              />
            </div>

            {stage === 'EXTRACTING' && status?.chaptersPlanned ? (
              <p className="text-[11.5px] text-[var(--muted)] mt-3">
                Chapter {status.chaptersDone} of {status.chaptersPlanned} extracted
              </p>
            ) : (
              <p className="text-[12px] text-[var(--muted)] mt-3 leading-relaxed">
                {stageCopy}
              </p>
            )}

            {/* Failure state */}
            {status?.isFailed && (
              <div className="mt-5 p-4 rounded-2xl bg-brand-danger/10 border border-brand-danger/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertOctagon className="w-4 h-4 text-brand-danger" />
                  <p className="text-[12px] font-bold uppercase tracking-widest text-brand-danger">
                    Pipeline failed
                  </p>
                </div>
                {status.v3Error && (
                  <p className="text-[12.5px] text-[var(--foreground)]/85 leading-relaxed mb-3">
                    {status.v3Error}
                  </p>
                )}
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange text-white text-[11px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Retrying…' : 'Retry pipeline'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="mt-6 glass-card p-7 relative overflow-hidden">
        <Sparkles className="absolute top-4 right-4 w-4 h-4 text-brand-orange/50" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">
          A thought from the master
        </p>
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={quoteIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="text-[18px] md:text-[20px] font-bold text-[var(--foreground)] leading-relaxed tracking-tight italic"
          >
            “{OOGWAY_QUOTES[quoteIdx].quote}”
            <footer className="not-italic mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-orange">
              {OOGWAY_QUOTES[quoteIdx].tag} · Master Oogway
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      {/* Footer copy */}
      <p className="text-[11.5px] text-[var(--muted-foreground)] text-center mt-8 leading-relaxed">
        {pollError
          ? `Reconnecting… (${pollError})`
          : 'Polling every 4 seconds. The page will load the analysis automatically when it\'s ready.'}
      </p>
    </main>
  );
}
