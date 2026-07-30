'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, AlertTriangle, ChevronDown, ChevronUp, Copy, Check,
  Loader2, Rocket, Mail, Shield, Flame, Sparkles,
  BookOpen, Presentation, Clock, Heart, Mic,
  ArrowRight, ExternalLink, TriangleAlert, CircleCheck, CircleMinus
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────
type ScorecardItem = {
  dimension: string;
  score: number;
  weight: number;
  summary: string;
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
  dimension: string;
  severity: string;
  what_happened: string;
  why_it_matters: string;
  recommendation: string;
  verbatim_quote: string;
  timestamp: string;
  is_positive: boolean;
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
};

// ── Dimension Icons ──────────────────────────────────────────────────────
const DIMENSION_ICONS: Record<string, any> = {
  'Content Accuracy & Depth': BookOpen,
  'Pedagogical Approach': Sparkles,
  'Live Platform Walkthrough': Presentation,
  'Pacing & Time Management': Clock,
  'Student Emotional Support': Heart,
  'Delivery Fluency': Mic,
};

// ── Score color helpers ──────────────────────────────────────────────────
function getScoreColor(score: number) {
  if (score >= 8) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-300', fill: 'bg-emerald-500' };
  if (score >= 6) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-300', fill: 'bg-amber-500' };
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'ring-red-300', fill: 'bg-red-500' };
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'NOTABLE': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' };
    case 'MODERATE': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' };
    case 'MINOR': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' };
    case 'CLEAN': return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', dot: 'bg-slate-500' };
  }
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case 'Excellent': return 'from-emerald-500 to-green-600';
    case 'Good': return 'from-emerald-400 to-teal-500';
    case 'Needs Improvement': return 'from-amber-500 to-orange-500';
    case 'Below Standard': return 'from-red-400 to-red-600';
    case 'Critical': return 'from-red-600 to-red-800';
    default: return 'from-slate-500 to-slate-600';
  }
}

// ── Score Ring ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercent = (score / 10) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth="4"
          fill="none" className="text-slate-200" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth="4"
          fill="none" strokeLinecap="round"
          className={color.text}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - fillPercent }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <span className={`absolute text-lg font-black ${color.text}`}>{score.toFixed(1)}</span>
    </div>
  );
}

// ── Copy Button ──────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 cursor-pointer">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
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
  const [activeEmailTab, setActiveEmailTab] = useState<'warm' | 'direct'>('warm');
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());
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

  const toggleFinding = (idx: number) => {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleTimestamp = (ts: string) => {
    if (onTimestampClick) onTimestampClick(ts);
  };

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading Oogway Go…</p>
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
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

            <div className="mt-4 space-y-2 max-w-xs mx-auto">
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

  const filteredFindings = filterSeverity === 'ALL'
    ? result.detailed_findings
    : result.detailed_findings.filter(f => f.severity === filterSeverity);

  const notableCount = result.detailed_findings.filter(f => f.severity === 'NOTABLE').length;
  const moderateCount = result.detailed_findings.filter(f => f.severity === 'MODERATE').length;
  const minorCount = result.detailed_findings.filter(f => f.severity === 'MINOR').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1200px] mx-auto space-y-6 mt-4 pb-24"
    >
      {/* ── Overall Score Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ks-card overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${getVerdictStyle(result.overall_verdict)} p-6 sm:p-8 text-white`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                <span className="text-4xl font-black">{result.overall_score.toFixed(1)}</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/25 backdrop-blur-sm px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
                {result.overall_verdict}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Target className="w-5 h-5" />
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Oogway Go Audit</h2>
              </div>
              <p className="text-sm text-white/90 font-medium leading-relaxed max-w-lg">{result.overall_summary}</p>
            </div>
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="flex items-center justify-around px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {notableCount} Notable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> {moderateCount} Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> {minorCount} Minor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> {result.detailed_findings.length} Total
          </span>
        </div>
      </motion.div>

      {/* ── Critical Red Flags ── */}
      {result.critical_red_flags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ks-card overflow-hidden border-red-200"
        >
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2">
            <Flame className="w-4.5 h-4.5 text-red-600" />
            <h3 className="text-sm font-black text-red-800">Critical Red Flags</h3>
          </div>
          <div className="p-4 space-y-3">
            {result.critical_red_flags.map((flag, i) => (
              <div key={i} className="flex gap-3 p-3 bg-red-50/60 rounded-xl border border-red-100">
                <TriangleAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-900 leading-snug">{flag.flag}</p>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">{flag.impact}</p>
                  <button onClick={() => handleTimestamp(flag.timestamp)}
                    className="mt-1.5 text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md hover:bg-red-200 transition-colors cursor-pointer">
                    ⏱ {flag.timestamp}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Scorecard Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 px-1">Dimension Scorecard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.scorecard.map((dim, i) => {
            const Icon = DIMENSION_ICONS[dim.dimension] || BookOpen;
            const scoreColor = getScoreColor(dim.score);
            const sevStyle = getSeverityStyle(dim.severity_tag);

            return (
              <motion.div
                key={dim.dimension}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="ks-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${scoreColor.bg} ${scoreColor.border} border flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${scoreColor.text}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{dim.dimension}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{(dim.weight * 100).toFixed(0)}% weight</span>
                      </div>
                    </div>
                    <ScoreRing score={dim.score} size={48} />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5">{dim.summary}</p>

                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border} border`}>
                      {dim.severity_tag}
                    </span>
                  </div>

                  {dim.top_strength && (
                    <div className="flex gap-1.5 items-start text-[11px] text-emerald-700 bg-emerald-50 rounded-lg p-2 mb-1.5 border border-emerald-100">
                      <CircleCheck className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="font-medium leading-snug">{dim.top_strength}</span>
                    </div>
                  )}

                  {dim.top_weakness && (
                    <div className="flex gap-1.5 items-start text-[11px] text-red-700 bg-red-50 rounded-lg p-2 border border-red-100">
                      <CircleMinus className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="font-medium leading-snug">{dim.top_weakness}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Detailed Findings ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Detailed Findings</h3>
          <div className="flex items-center gap-1">
            {['ALL', 'NOTABLE', 'MODERATE', 'MINOR'].map(sev => {
              const active = filterSeverity === sev;
              const sevStyle = sev === 'ALL' ? { bg: 'bg-slate-100', text: 'text-slate-700' } : getSeverityStyle(sev);
              return (
                <button key={sev} onClick={() => setFilterSeverity(sev)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    active ? `${sevStyle.bg} ${sevStyle.text} ring-1 ring-current/30` : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  {sev === 'ALL' ? `All (${result.detailed_findings.length})` : sev}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {filteredFindings.map((finding, i) => {
            const isExpanded = expandedFindings.has(i);
            const sevStyle = getSeverityStyle(finding.severity);

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`ks-card overflow-hidden transition-shadow hover:shadow-sm ${finding.is_positive ? 'border-emerald-200' : ''}`}
              >
                <button onClick={() => toggleFinding(i)}
                  className="w-full p-3.5 flex items-start gap-3 text-left cursor-pointer group">
                  <div className={`w-2 h-2 rounded-full ${sevStyle.dot} shrink-0 mt-1.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${sevStyle.bg} ${sevStyle.text}`}>
                        {finding.severity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{finding.dimension}</span>
                      {finding.is_positive && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ STRENGTH</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 font-semibold leading-snug">{finding.what_happened}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleTimestamp(finding.timestamp); }}
                      className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md hover:bg-orange-100 transition-colors cursor-pointer">
                      ⏱ {finding.timestamp}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-2.5 border-t border-slate-100">
                        <div className="pt-2.5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Why It Matters</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{finding.why_it_matters}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recommendation</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{finding.recommendation}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Verbatim Evidence</p>
                          <p className="text-xs text-slate-700 italic leading-relaxed">"{finding.verbatim_quote}"</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Feedback Emails ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="ks-card overflow-hidden"
      >
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4.5 h-4.5 text-slate-600" />
            <h3 className="text-sm font-black text-slate-800">Feedback Email Drafts</h3>
          </div>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
            <button onClick={() => setActiveEmailTab('warm')}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeEmailTab === 'warm' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              🤝 Warm
            </button>
            <button onClick={() => setActiveEmailTab('direct')}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeEmailTab === 'direct' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              🎯 Direct
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex justify-end mb-3">
            <CopyButton text={activeEmailTab === 'warm' ? result.feedback_email_warm : result.feedback_email_direct} />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-inner">
            <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
              {activeEmailTab === 'warm' ? result.feedback_email_warm : result.feedback_email_direct}
            </pre>
          </div>
        </div>
      </motion.div>

      {/* ── Re-run button ── */}
      <div className="text-center pt-4">
        <button onClick={handleTrigger} disabled={triggerLoading || status === 'RUNNING'}
          className="text-xs font-bold text-slate-400 hover:text-orange-600 transition-colors cursor-pointer flex items-center gap-1.5 mx-auto">
          <Rocket className="w-3.5 h-3.5" />
          {triggerLoading ? 'Starting...' : 'Re-run Oogway Go (replaces current analysis)'}
        </button>
      </div>
    </motion.div>
  );
}
