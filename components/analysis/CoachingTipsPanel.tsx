"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Zap,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Layers,
  X,
  Loader2,
} from 'lucide-react';
import { TOKENS } from '@/lib/ui/tokens';

// ── Types ──────────────────────────────────────────────────────────────────

type CoachingTip = {
  chapter:        number;
  topic:          string;
  timestamp:      string;
  observation:    string;
  tip:            string;
  bad_example:    string;
  good_example:   string;
  evidence_quote: string;
};

type CoachingResult = {
  session_id:     string;
  expert_name:    string;
  session_title:  string;
  generated_at:   string;
  example_tips:    CoachingTip[];
  topic_tips:      CoachingTip[];
  engagement_tips: CoachingTip[];
  doubt_tips:      CoachingTip[];
  total_tips:      number;
};

type Props = {
  sessionId: string;
};

// ── Category config ────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    key:         'example_tips'    as const,
    label:       'Example Improvements',
    description: 'Where concrete examples or analogies can make abstract concepts stick',
    icon:        Lightbulb,
    accentColor: 'brand-warning',
    bgClass:     'bg-brand-warning/[0.07] border-brand-warning/25',
    iconBgClass: 'bg-brand-warning/15 border-brand-warning/25 text-brand-warning',
    badgeClass:  'bg-brand-warning/15 text-brand-warning border-brand-warning/30',
  },
  {
    key:         'topic_tips'      as const,
    label:       'Deeper Topic Delivery',
    description: 'Where topics were taught definitionally and would benefit from live demos or case studies',
    icon:        BookOpen,
    accentColor: 'brand-info',
    bgClass:     'bg-brand-info/[0.07] border-brand-info/25',
    iconBgClass: 'bg-brand-info/15 border-brand-info/25 text-brand-info',
    badgeClass:  'bg-brand-info/15 text-brand-info border-brand-info/30',
  },
  {
    key:         'engagement_tips' as const,
    label:       'Engagement Techniques',
    description: 'Where student engagement was low and specific techniques would have helped',
    icon:        Zap,
    accentColor: 'brand-success',
    bgClass:     'bg-brand-success/[0.07] border-brand-success/25',
    iconBgClass: 'bg-brand-success/15 border-brand-success/25 text-brand-success',
    badgeClass:  'bg-brand-success/15 text-brand-success border-brand-success/30',
  },
  {
    key:         'doubt_tips'      as const,
    label:       'Doubt Resolution',
    description: 'Where student questions were left hanging or answered inaccurately',
    icon:        MessageSquare,
    accentColor: 'brand-orange',
    bgClass:     'bg-brand-orange/[0.07] border-brand-orange/25',
    iconBgClass: 'bg-brand-orange/15 border-brand-orange/25 text-brand-orange',
    badgeClass:  'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  },
] as const;

// ── Single tip card ────────────────────────────────────────────────────────

function TipCard({
  tip,
  accentColor,
  badgeClass,
}: {
  tip:          CoachingTip;
  accentColor:  string;
  badgeClass:   string;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--inner-border)] bg-[var(--inner-bg)] overflow-hidden">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${badgeClass}`}>
              <Layers className="w-2.5 h-2.5" />
              Ch. {tip.chapter}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-[var(--muted)]" />
            <span className="font-mono text-[10px] text-[var(--muted)] font-semibold">
              {tip.timestamp}
            </span>
          </div>
        </div>
      </div>

      {/* Topic + observation */}
      <div className="px-4 pb-3">
        <h4 className="text-[13px] font-bold text-[var(--foreground)] leading-snug">
          {tip.topic}
        </h4>
        <p className="text-[12px] text-[var(--muted)] mt-1 leading-relaxed">
          {tip.observation}
        </p>
      </div>

      {/* The tip itself */}
      <div className={`mx-4 mb-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--inner-border)]`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-1.5">
          💡 Coaching Tip
        </p>
        <p className="text-[13px] text-[var(--foreground)] leading-relaxed">
          {tip.tip}
        </p>
      </div>

      {/* Expand: examples + evidence */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowExamples(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-[var(--inner-border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--inner-bg)] transition-colors"
        >
          {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showExamples ? 'Hide' : 'Show'} Examples
        </button>

        <button
          onClick={() => setShowEvidence(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-brand-orange/20 text-brand-orange/70 hover:bg-brand-orange/5 transition-colors"
        >
          {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showEvidence ? 'Hide' : 'View'} Evidence
        </button>
      </div>

      {/* Examples panel */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bad example */}
              <div className="rounded-xl border border-brand-danger/20 bg-brand-danger/[0.06] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsDown className="w-3 h-3 text-brand-danger" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-danger">
                    What happened
                  </p>
                </div>
                <p className="text-[12px] text-[var(--foreground)]/85 leading-relaxed italic">
                  "{tip.bad_example}"
                </p>
              </div>

              {/* Good example */}
              <div className="rounded-xl border border-brand-success/20 bg-brand-success/[0.06] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsUp className="w-3 h-3 text-brand-success" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-success">
                    Try this instead
                  </p>
                </div>
                <p className="text-[12px] text-[var(--foreground)]/85 leading-relaxed italic">
                  "{tip.good_example}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence panel */}
      <AnimatePresence>
        {showEvidence && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="relative pl-4 pr-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--inner-border)]">
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-orange/50" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand-orange/20">
                    T: {tip.timestamp}
                  </span>
                  <span className="text-[9px] text-[var(--muted)] uppercase tracking-widest font-bold">
                    Ch. {tip.chapter}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--foreground)]/90 italic">
                  "{tip.evidence_quote}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Category section ───────────────────────────────────────────────────────

function CategorySection({
  category,
  tips,
}: {
  category: (typeof CATEGORIES)[number];
  tips:     CoachingTip[];
}) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = category.icon;

  if (tips.length === 0) {
    return (
      <div className={`rounded-2xl border ${category.bgClass} p-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${category.iconBgClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-[var(--foreground)]">{category.label}</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">No issues detected — this area looked good.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${category.bgClass} overflow-hidden`}>
      {/* Section header */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${category.iconBgClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[var(--foreground)]">{category.label}</p>
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed line-clamp-1">
              {category.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${category.badgeClass}`}>
            {tips.length} tip{tips.length !== 1 ? 's' : ''}
          </span>
          {isOpen
            ? <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
            : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
          }
        </div>
      </button>

      {/* Tips list */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--inner-border)]">
              <div className="pt-3" />
              {tips.map((tip, i) => (
                <TipCard
                  key={i}
                  tip={tip}
                  accentColor={category.accentColor}
                  badgeClass={category.badgeClass}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

export function CoachingTipsPanel({ sessionId }: Props) {
  const [state, setState] = useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle');
  const [result,    setResult]    = useState<CoachingResult | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function generate() {
    setState('loading');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/analysis/${sessionId}/coaching-tips`, {
        method:      'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data: CoachingResult = await res.json();
      setResult(data);
      setState('done');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Something went wrong');
      setState('error');
    }
  }

  // ── Idle: show the trigger button ───────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange/30 to-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-brand-orange shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className={TOKENS.sectionEyebrow}>On-demand · Master Teacher</p>
            <h2 className="text-[15px] font-bold text-[var(--foreground)] tracking-tight mt-1">
              Get Coaching Tips
            </h2>
            <p className="text-[12px] text-[var(--muted)] mt-1 leading-relaxed max-w-sm">
              Instant, prescriptive advice on examples, topic delivery, engagement
              techniques, and doubt handling — generated fresh from this session's audit.
            </p>
          </div>
        </div>

        <button
          id="generate-coaching-tips-btn"
          onClick={generate}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-orange text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-brand-orange/25 hover:scale-105 active:scale-95 transition-transform"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate Tips
        </button>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-brand-orange/30 border-t-brand-orange"
        />
        <div>
          <p className="text-[13px] font-bold text-[var(--foreground)]">
            Master Teacher is reviewing the session…
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Reading the synthesis and generating targeted coaching tips
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="glass-card p-6 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-brand-danger/15 border border-brand-danger/25 flex items-center justify-center text-brand-danger shrink-0">
          <Loader2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--foreground)]">Tip generation failed</p>
          <p className="text-[12px] text-[var(--muted)] mt-1">{errorMsg}</p>
        </div>
        <button
          onClick={generate}
          className="shrink-0 px-4 py-2 rounded-full border border-[var(--inner-border)] text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-brand-orange hover:border-brand-orange/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Done: full tips panel ────────────────────────────────────────────────
  if (!result || dismissed) return null;

  const totalTips = result.total_tips;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Panel header */}
      <div className="glass-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-orange/30 to-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-brand-orange shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className={TOKENS.sectionEyebrow}>Master Teacher · Coaching Lab</p>
            <h2 className="text-[15px] font-bold text-[var(--foreground)] tracking-tight mt-0.5">
              {totalTips} coaching tip{totalTips !== 1 ? 's' : ''} for{' '}
              <span className="text-brand-orange">{result.expert_name}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={generate}
            title="Regenerate tips"
            className="p-2 rounded-lg border border-[var(--inner-border)] text-[var(--muted)] hover:text-brand-orange hover:border-brand-orange/30 transition-colors"
          >
            <Loader2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            title="Dismiss"
            className="p-2 rounded-lg border border-[var(--inner-border)] text-[var(--muted)] hover:text-brand-danger hover:border-brand-danger/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category sections */}
      {CATEGORIES.map(cat => (
        <CategorySection
          key={cat.key}
          category={cat}
          tips={result[cat.key]}
        />
      ))}

      {/* Footer */}
      <p className="text-center text-[10px] text-[var(--muted)] font-medium tracking-wider uppercase">
        Generated {new Date(result.generated_at).toLocaleTimeString()} · Based on Stage 3 synthesis · Not stored
      </p>
    </motion.div>
  );
}
