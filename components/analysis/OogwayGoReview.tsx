'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, AlertTriangle, Copy, Check,
  Loader2, Rocket, Mail, Flame, Sparkles,
  BookOpen, Presentation, Clock, Heart, Mic,
  TriangleAlert, CircleCheck, CircleMinus, FileSpreadsheet, LayoutGrid, Filter, CheckCircle2, XCircle
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────
type ScorecardItem = {
  dimension: string;
  score: number;
  weight?: number;
  one_line_summary?: string;
  summary?: string;
  top_strength: string;
  top_weakness: string;
  severity_tag: string;
};

type RedFlag = {
  flag: string;
  impact: string;
  timestamp: string;
};

type Finding = {
  finding_number?: number;
  dimension: string;
  severity: string;
  what_happened: string;
  why_it_matters: string;
  recommendation: string;
  verbatim_quote: string;
  timestamp: string;
  is_positive: boolean;
};

type ChecklistItem = {
  check: string;
  passed: boolean;
  note: string;
};

type OogwayGoResult = {
  scorecard: ScorecardItem[];
  overall_score: number;
  overall_verdict: string;
  overall_summary: string;
  critical_red_flags: RedFlag[];
  detailed_findings: Finding[];
  feedback_email_warm: string;
  feedback_email_direct: string;
  pre_scoring_checklist?: ChecklistItem[];
};

// ── Dimension Icons ──────────────────────────────────────────────────────
const DIMENSION_ICONS: Record<string, any> = {
  'Content Accuracy': BookOpen,
  'Content Accuracy & Depth': BookOpen,
  'Pedagogical Approach': Sparkles,
  'Live Platform Walkthrough': Presentation,
  'Pacing and Time Management': Clock,
  'Pacing & Time Management': Clock,
  'Student Emotional Support': Heart,
  'Delivery Fluency': Mic,
};

// ── Score Color Helpers ──────────────────────────────────────────────────
function getScoreBadge(score: number) {
  if (score >= 7) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Good (≥7)' };
  if (score >= 5) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Moderate (5-6)' };
  return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Needs Improvement (≤4)' };
}

function getSeverityBadge(severity: string) {
  const s = severity?.toUpperCase() || 'MINOR';
  switch (s) {
    case 'NOTABLE': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
    case 'MODERATE': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 'MINOR': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
  }
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case 'Excellent': return 'from-emerald-600 via-teal-600 to-green-700';
    case 'Good': return 'from-emerald-500 via-teal-600 to-cyan-700';
    case 'Needs Improvement': return 'from-amber-500 via-orange-600 to-amber-700';
    case 'Below Standard': return 'from-red-500 via-rose-600 to-red-700';
    case 'Critical': return 'from-red-700 via-rose-800 to-red-900';
    default: return 'from-slate-700 via-slate-800 to-slate-900';
  }
}

// ── Copy Button ──────────────────────────────────────────────────────────
function CopyButton({ text, label = 'Copy Email' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
      <span>{copied ? 'Copied to Clipboard!' : label}</span>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export function OogwayGoReview({
  sessionId,
  onTimestampClick,
}: {
  sessionId: string;
  onTimestampClick?: (t: string) => void;
}) {
  const [result, setResult] = useState<OogwayGoResult | null>(null);
  const [status, setStatus] = useState<string>('NOT_STARTED');
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'scorecard' | 'findings' | 'emails'>('scorecard');
  const [activeEmailVariant, setActiveEmailVariant] = useState<'warm' | 'direct'>('warm');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [progress, setProgress] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/${sessionId}/oogway-go`);
      const data = await res.json();
      const currentStatus = data.status || 'NOT_STARTED';
      setStatus(currentStatus);
      if (data.result) {
        setResult(data.result);
        setProgress(100);
      }
    } catch (err) {
      console.error('[OogwayGoReview] Failed to fetch status', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll faster (every 3s) & smoothly increment progress percentage while RUNNING
  useEffect(() => {
    if (status !== 'RUNNING') {
      if (status === 'COMPLETE' || result) setProgress(100);
      return;
    }
    
    const pollInterval = setInterval(fetchStatus, 3000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 3) + 1;
      });
    }, 700);

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, [status, result, fetchStatus]);

  const handleTrigger = async () => {
    setTriggerLoading(true);
    setProgress(5);
    setStatus('RUNNING');
    try {
      const res = await fetch(`/api/analysis/${sessionId}/oogway-go`, { method: 'POST' });
      const data = await res.json();
      setStatus(data.status || 'RUNNING');
    } catch (err) {
      console.error('[OogwayGoReview] Failed to trigger', err);
      setStatus('FAILED');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleTimestamp = (ts: string) => {
    if (onTimestampClick) onTimestampClick(ts);
  };

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading Oogway Go Audit…</p>
      </div>
    );
  }

  // ── Trigger state (NOT_STARTED or FAILED) ────────────────────────
  if (!result && (status === 'NOT_STARTED' || status === 'FAILED')) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ks-card overflow-hidden"
        >
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-orange-200/50">
              <Target className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Oogway Go</h3>
            <p className="text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed mb-1">
              Deep 6-dimension expert audit with strict scoring criteria, timestamped findings, and ready-to-send feedback emails.
            </p>

            {status === 'FAILED' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-bold text-red-700">Previous analysis failed or timed out. Click below to re-run.</p>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100">
            <button
              onClick={handleTrigger}
              disabled={triggerLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm tracking-wide shadow-md shadow-orange-200/50 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {triggerLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting Audit...</>
              ) : (
                <><Rocket className="w-4 h-4" /> Run Oogway Go Audit</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Running state ────────────────────────────────────────────────
  if (status === 'RUNNING' && !result) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ks-card overflow-hidden"
        >
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-orange-200/50 animate-pulse">
              <Target className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Oogway Go is Analyzing...</h3>
            <p className="text-xs text-slate-500 font-medium">Deep 6-dimension session audit in progress.</p>

            {/* Percentage Bar */}
            <div className="my-6 space-y-2 max-w-sm mx-auto text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Audit Progress</span>
                <span className="text-orange-600 font-mono text-sm">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300/40">
                <motion.div
                  className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 h-full rounded-full shadow-sm"
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 max-w-xs mx-auto text-left">
              {[
                { label: 'Reading transcript', target: 25 },
                { label: 'Scoring 6 quality dimensions', target: 55 },
                { label: 'Finding timestamped evidence', target: 80 },
                { label: 'Drafting feedback emails', target: 95 },
              ].map((step) => {
                const isDone = progress >= step.target;
                return (
                  <div key={step.label} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    {isDone ? (
                      <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400 shrink-0" />
                    )}
                    <span className={isDone ? 'text-slate-900 font-bold' : ''}>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {progress >= 90 && (
              <div className="mt-6 pt-4 border-t border-amber-200/60">
                <p className="text-xs text-slate-500 mb-2 font-medium">Taking longer than expected?</p>
                <button
                  onClick={handleTrigger}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
                >
                  Force Re-Run Audit
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Results view ─────────────────────────────────────────────────
  if (!result) return null;

  const notableFindings = result.detailed_findings.filter(f => f.severity?.toUpperCase() === 'NOTABLE');
  const moderateFindings = result.detailed_findings.filter(f => f.severity?.toUpperCase() === 'MODERATE');
  const minorFindings = result.detailed_findings.filter(f => f.severity?.toUpperCase() === 'MINOR');

  const filteredFindings = filterSeverity === 'ALL'
    ? result.detailed_findings
    : result.detailed_findings.filter(f => f.severity?.toUpperCase() === filterSeverity);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1200px] mx-auto space-y-6 mt-4 pb-24"
    >
      {/* ── Executive Overall Score Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ks-card overflow-hidden border-none shadow-xl"
      >
        <div className={`bg-gradient-to-r ${getVerdictStyle(result.overall_verdict)} p-6 sm:p-8 text-white relative overflow-hidden`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex flex-col items-center justify-center border border-white/30 shadow-inner">
                  <span className="text-3xl font-black">{result.overall_score.toFixed(1)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">/ 10</span>
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
                    {result.overall_verdict}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Oogway Go Audit Workbook</h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-xl">{result.overall_summary}</p>
              </div>
            </div>

            <button
              onClick={handleTrigger}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/30 transition-all cursor-pointer shrink-0"
            >
              Re-run Audit
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Workbook 3 Sub-Tabs Navigation (Scorecard, Findings, Feedback Emails) ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--layer-2)] border border-[var(--border)] shadow-inner overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveSubTab('scorecard')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'scorecard'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-amber-400" />
          <span>Scorecard Summary</span>
        </button>

        <button
          onClick={() => setActiveSubTab('findings')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'findings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-orange-400" />
          <span>Detailed Findings ({result.detailed_findings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('emails')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'emails'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          <span>Feedback Emails (2 Tones)</span>
        </button>
      </div>

      {/* ── Sub-Tab 1: Scorecard Summary ── */}
      {activeSubTab === 'scorecard' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Critical Red Flags Box */}
          {result.critical_red_flags && result.critical_red_flags.length > 0 && (
            <div className="ks-card border-red-200 overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black text-red-900">Critical Red Flags ({result.critical_red_flags.length})</h3>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700">Mandatory Review</span>
              </div>
              <div className="p-4 space-y-3">
                {result.critical_red_flags.map((flag, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-50/70 rounded-xl border border-red-100">
                    <TriangleAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-red-950 leading-snug">{flag.flag}</p>
                      <p className="text-xs text-red-800 mt-1 leading-relaxed">{flag.impact}</p>
                      <button
                        onClick={() => handleTimestamp(flag.timestamp)}
                        className="mt-2 text-[10px] font-mono font-black text-red-700 bg-red-100 px-2.5 py-1 rounded-md hover:bg-red-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        ⏱ {flag.timestamp} — Jump to Evidence
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-Scoring Checklist Verification */}
          {result.pre_scoring_checklist && result.pre_scoring_checklist.length > 0 && (
            <div className="ks-card p-5">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Pre-Scoring Checklist Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.pre_scoring_checklist.map((item, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex items-start gap-2.5 ${item.passed ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900' : 'bg-red-50/60 border-red-100 text-red-900'}`}>
                    {item.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight">{item.check}</p>
                      {item.note && <p className="text-[10px] opacity-80 mt-1 leading-tight">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6-Dimension Scorecard Grid */}
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 px-1">Dimension Quality Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.scorecard.map((dim, i) => {
                const Icon = DIMENSION_ICONS[dim.dimension] || BookOpen;
                const scoreBadge = getScoreBadge(dim.score);
                const sevBadge = getSeverityBadge(dim.severity_tag);

                return (
                  <div key={dim.dimension} className="ks-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <Icon className="w-4.5 h-4.5 text-slate-700" />
                          </div>
                          <h4 className="text-xs font-black text-slate-900 leading-tight">{dim.dimension}</h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-sm font-black border ${scoreBadge.bg} ${scoreBadge.text} ${scoreBadge.border}`}>
                          {dim.score.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{dim.one_line_summary || dim.summary}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {dim.top_strength && (
                        <div className="flex items-start gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                          <CircleCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium leading-snug">{dim.top_strength}</span>
                        </div>
                      )}
                      {dim.top_weakness && (
                        <div className="flex items-start gap-1.5 text-[11px] text-red-800 bg-red-50 p-2 rounded-lg border border-red-100">
                          <CircleMinus className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          <span className="font-medium leading-snug">{dim.top_weakness}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Sub-Tab 2: Detailed Findings ── */}
      {activeSubTab === 'findings' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-500 ml-1" />
              <span className="text-xs font-bold text-slate-700">Filter Severity:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: `All (${result.detailed_findings.length})` },
                { id: 'NOTABLE', label: `Notable (${notableFindings.length})` },
                { id: 'MODERATE', label: `Moderate (${moderateFindings.length})` },
                { id: 'MINOR', label: `Minor (${minorFindings.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterSeverity(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterSeverity === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Structured Findings List */}
          <div className="space-y-4">
            {filteredFindings.map((finding, idx) => {
              const sev = getSeverityBadge(finding.severity);
              return (
                <div key={idx} className="ks-card p-5 space-y-3 hover:shadow-md transition-shadow border-slate-200">
                  <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                        {finding.finding_number || idx + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${sev.bg} ${sev.text} ${sev.border}`}>
                        {finding.severity}
                      </span>
                      <span className="text-xs font-black text-slate-800">{finding.dimension}</span>
                    </div>

                    {finding.timestamp && (
                      <button
                        onClick={() => handleTimestamp(finding.timestamp)}
                        className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer border border-slate-200"
                      >
                        ⏱ {finding.timestamp}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-1">What Happened</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{finding.what_happened}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-1">Why It Matters</span>
                      <p className="text-slate-700 leading-relaxed">{finding.why_it_matters}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-1">Action Recommendation</span>
                      <p className="text-emerald-800 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100 leading-relaxed">{finding.recommendation}</p>
                    </div>
                  </div>

                  {finding.verbatim_quote && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Transcript Evidence</span>
                      <p className="italic text-amber-950 font-serif leading-relaxed">"{finding.verbatim_quote}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Sub-Tab 3: Feedback Emails ── */}
      {activeSubTab === 'emails' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-5">
          {/* Tone Toggle & Copy Action */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveEmailVariant('warm')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeEmailVariant === 'warm'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                Variant A — Warm / Developmental
              </button>
              <button
                onClick={() => setActiveEmailVariant('direct')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeEmailVariant === 'direct'
                    ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                Variant B — Direct / Accountability
              </button>
            </div>

            <CopyButton
              text={activeEmailVariant === 'warm' ? result.feedback_email_warm : result.feedback_email_direct}
              label={activeEmailVariant === 'warm' ? 'Copy Warm Email' : 'Copy Direct Email'}
            />
          </div>

          {/* Formatted Email Container */}
          <div className="ks-card overflow-hidden shadow-lg border-slate-300">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4.5 h-4.5 text-amber-300" />
                <span className="text-xs font-bold">
                  {activeEmailVariant === 'warm' ? 'Variant A: Warm / Developmental Feedback' : 'Variant B: Direct / Accountability Feedback'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Signed: Prerna (Academic Team)</span>
            </div>

            <div className="p-6 bg-slate-50">
              <pre className="text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                {activeEmailVariant === 'warm' ? result.feedback_email_warm : result.feedback_email_direct}
              </pre>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
