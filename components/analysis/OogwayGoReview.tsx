'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Copy, Check,
  Loader2, Rocket, Mail, Flame, Sparkles,
  BookOpen, Presentation, Clock, Heart, Mic,
  TriangleAlert, CircleCheck, CircleMinus, FileSpreadsheet, LayoutGrid, Filter,
  CheckCircle2, XCircle, Send, X, ChevronRight, Layers, FileText
} from 'lucide-react';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

// ── Types ────────────────────────────────────────────────────────────────
type ScorecardItem = {
  dimension: string;
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

// ── Status Helpers (No Numerical Marks) ─────────────────────────────────
function getSeverityBadge(severity: string) {
  const s = severity?.toUpperCase() || 'MINOR';
  switch (s) {
    case 'NOTABLE':
    case 'HIGH':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Needs Improvement' };
    case 'MODERATE':
    case 'MEDIUM':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Moderate Gap' };
    case 'MINOR':
    case 'LOW':
    case 'CLEAN':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Good Standard' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: s };
  }
}

function getVerdictBadgeStyle(verdict: string) {
  const v = verdict?.toLowerCase() || '';
  if (v.includes('excellent') || v.includes('good')) {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  }
  if (v.includes('improvement') || v.includes('moderate')) {
    return 'bg-amber-100 text-amber-900 border-amber-300';
  }
  return 'bg-red-100 text-red-900 border-red-300';
}

// ── Hoverable Timestamp Pill ──────────────────────────────────────────────
function TimestampPill({
  timestamp,
  onClick,
}: {
  timestamp: string;
  onClick?: (t: string) => void;
}) {
  const { showPreview, hidePreview } = useVideoPreview();

  if (!timestamp) return null;

  return (
    <button
      onClick={() => onClick?.(timestamp)}
      onMouseEnter={(e) => showPreview(timestamp, e)}
      onMouseLeave={hidePreview}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-amber-300 hover:bg-orange-600 hover:text-white transition-all cursor-pointer shadow-sm border border-slate-700 shrink-0"
      title="Hover for video preview | Click to seek"
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{timestamp}</span>
    </button>
  );
}

// ── Main Component (Kraftshala Sidebar Layout) ───────────────────────────
export function OogwayGoReview({
  sessionId,
  sessionData,
  onTimestampClick,
}: {
  sessionId: string;
  sessionData?: any;
  onTimestampClick?: (t: string) => void;
}) {
  const { data: authSession } = useSession();
  const userName = authSession?.user?.name || 'Academic Team Lead';

  const [result, setResult] = useState<OogwayGoResult | null>(null);
  const [status, setStatus] = useState<string>('NOT_STARTED');
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  
  // Kraftshala Sidebar Active Item: 'overview' | 'findings' | dimension_name
  const [activeSideNav, setActiveSideNav] = useState<string>('overview');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [progress, setProgress] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeEmailVariant, setActiveEmailVariant] = useState<'warm' | 'direct'>('warm');
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  // ── Email Metadata Helpers ──
  const expertName = sessionData?.expert?.name || 'Expert';
  const expertEmail = sessionData?.expert?.email || '';
  const sessionTitle = sessionData?.name || 'Kraftshala Session';
  const batchName = sessionData?.batch?.name || '';
  const sessionDateStr = sessionData?.conductedAt
    ? new Date(sessionData.conductedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const emailSubject = `Session Feedback: ${sessionTitle} (${expertName}${batchName ? ` - ${batchName}` : ''}${sessionDateStr ? ` on ${sessionDateStr}` : ''})`;

  const rawEmailBody = activeEmailVariant === 'warm'
    ? result?.feedback_email_warm || ''
    : result?.feedback_email_direct || '';

  const formattedEmailBody = rawEmailBody
    ? rawEmailBody.replace(/Prerna/g, userName)
    : '';

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(expertEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formattedEmailBody)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(formattedEmailBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
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
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Oogway Go Audit</h3>
            <p className="text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed mb-1">
              Deep 6-dimension session quality audit powered by Kraftshala evaluation standards.
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
                { label: 'Auditing 6 quality dimensions', target: 55 },
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

  // ── Results view (KRAFTSHALA SIDEBAR LAYOUT) ─────────────────────
  if (!result) return null;

  const notableFindings = result.detailed_findings.filter(f => f.severity?.toUpperCase() === 'NOTABLE');
  const moderateFindings = result.detailed_findings.filter(f => f.severity?.toUpperCase() === 'MODERATE');
  const minorFindings = result.detailed_findings.filter(f => f.severity?.toUpperCase() === 'MINOR');

  const filteredFindings = filterSeverity === 'ALL'
    ? result.detailed_findings
    : result.detailed_findings.filter(f => f.severity?.toUpperCase() === filterSeverity);

  // Selected dimension if navigating a dimension side tab
  const selectedDimensionItem = result.scorecard.find(s => s.dimension === activeSideNav);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1280px] mx-auto space-y-5 mt-2 pb-24"
    >
      {/* ── Top Header Bar (Kraftshala Style) ── */}
      <div className="ks-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-slate-200 shadow-sm rounded-2xl">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Oogway Go Audit</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getVerdictBadgeStyle(result.overall_verdict)}`}>
                {result.overall_verdict}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Deep session audit across 6 quality dimensions</p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 border border-purple-400/30"
          >
            <Mail className="w-4 h-4 text-amber-300" />
            <span>Send Feedback Email ✉️</span>
          </button>

          <button
            onClick={handleTrigger}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
          >
            Re-run
          </button>
        </div>
      </div>

      {/* ── Main Layout: Kraftshala Left Sidebar + Right Panel ── */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ── LEFT SIDEBAR (Kraftshala Navigation Style) ── */}
        <div className="w-full md:w-72 ks-card p-3 rounded-2xl border-slate-200 shrink-0 space-y-1 shadow-sm">
          <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Audit Views
          </div>

          <button
            onClick={() => setActiveSideNav('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
              activeSideNav === 'overview'
                ? 'border-l-4 border-amber-500 font-black text-amber-600 bg-amber-50/70 shadow-xs'
                : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 text-amber-500" />
              <span>Audit Overview</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <button
            onClick={() => setActiveSideNav('findings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
              activeSideNav === 'findings'
                ? 'border-l-4 border-amber-500 font-black text-amber-600 bg-amber-50/70 shadow-xs'
                : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-orange-500" />
              <span>Detailed Findings</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
              {result.detailed_findings.length}
            </span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-2">
            Quality Dimensions
          </div>

          {result.scorecard.map((dim) => {
            const Icon = DIMENSION_ICONS[dim.dimension] || BookOpen;
            const isActive = activeSideNav === dim.dimension;
            const sev = getSeverityBadge(dim.severity_tag);

            return (
              <button
                key={dim.dimension}
                onClick={() => setActiveSideNav(dim.dimension)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  isActive
                    ? 'border-l-4 border-amber-500 font-black text-amber-600 bg-amber-50/70 shadow-xs'
                    : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{dim.dimension}</span>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${sev.bg.replace('bg-', 'bg-').replace('-100', '-500')}`} />
              </button>
            );
          })}
        </div>

        {/* ── RIGHT CONTENT PANEL (Kraftshala Content Style) ── */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* VIEW 1: Audit Overview */}
          {activeSideNav === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Executive Summary */}
              <div className="ks-card p-6 rounded-2xl border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Executive Session Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.overall_summary}</p>
              </div>

              {/* Critical Red Flags */}
              {result.critical_red_flags && result.critical_red_flags.length > 0 && (
                <div className="ks-card border-red-200 overflow-hidden rounded-2xl">
                  <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-red-600" />
                      <h3 className="text-sm font-black text-red-900">Critical Quality Alerts ({result.critical_red_flags.length})</h3>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">Action Required</span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {result.critical_red_flags.map((flag, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-red-50/70 rounded-2xl border border-red-100">
                        <div className="flex items-start gap-3 min-w-0">
                          <TriangleAlert className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-red-950 leading-snug">{flag.flag}</p>
                            <p className="text-xs text-red-800 mt-0.5 leading-relaxed">{flag.impact}</p>
                          </div>
                        </div>
                        {flag.timestamp && (
                          <TimestampPill timestamp={flag.timestamp} onClick={handleTimestamp} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Audit Checklist (Kraftshala Clean List Style) */}
              {result.pre_scoring_checklist && result.pre_scoring_checklist.length > 0 && (
                <div className="ks-card p-6 rounded-2xl border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4.5 h-4.5 text-amber-500" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Kraftshala Session Quality Checklist</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500">8 Verification Standards</span>
                  </div>

                  <div className="space-y-2.5">
                    {result.pre_scoring_checklist.map((item, i) => (
                      <div
                        key={i}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                          item.passed
                            ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                            : 'bg-red-50/40 border-red-100 text-red-950'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {item.passed ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="text-xs font-bold leading-tight block text-slate-900">{item.check}</span>
                            {item.note && (
                              <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{item.note}</p>
                            )}
                          </div>
                        </div>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          item.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.passed ? 'Verified' : 'Flagged'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 2: Detailed Findings */}
          {activeSideNav === 'findings' && (
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
                    <div key={idx} className="ks-card p-5 space-y-3 hover:shadow-md transition-shadow border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                            {finding.finding_number || idx + 1}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${sev.bg} ${sev.text} ${sev.border}`}>
                            {sev.label}
                          </span>
                          <span className="text-xs font-black text-slate-800">{finding.dimension}</span>
                        </div>

                        {finding.timestamp && (
                          <TimestampPill timestamp={finding.timestamp} onClick={handleTimestamp} />
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
                          <p className="text-emerald-800 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">{finding.recommendation}</p>
                        </div>
                      </div>

                      {finding.verbatim_quote && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Transcript Evidence</span>
                            <p className="italic text-amber-950 font-serif leading-relaxed">"{finding.verbatim_quote}"</p>
                          </div>
                          {finding.timestamp && (
                            <TimestampPill timestamp={finding.timestamp} onClick={handleTimestamp} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* VIEW 3: Specific Dimension View */}
          {selectedDimensionItem && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Dimension Header Banner */}
              <div className="ks-card p-6 rounded-2xl border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                      {React.createElement(DIMENSION_ICONS[selectedDimensionItem.dimension] || BookOpen, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{selectedDimensionItem.dimension}</h3>
                      <p className="text-xs text-slate-500">Kraftshala Audit Dimension Evaluation</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getSeverityBadge(selectedDimensionItem.severity_tag).bg} ${getSeverityBadge(selectedDimensionItem.severity_tag).text} ${getSeverityBadge(selectedDimensionItem.severity_tag).border}`}>
                    {getSeverityBadge(selectedDimensionItem.severity_tag).label}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pt-2 border-t border-slate-100">
                  {selectedDimensionItem.one_line_summary || selectedDimensionItem.summary}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDimensionItem.top_strength && (
                  <div className="ks-card p-4 rounded-2xl border-emerald-200 bg-emerald-50/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                      <CircleCheck className="w-4 h-4 text-emerald-600" />
                      <span>Key Strength</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">{selectedDimensionItem.top_strength}</p>
                  </div>
                )}

                {selectedDimensionItem.top_weakness && (
                  <div className="ks-card p-4 rounded-2xl border-red-200 bg-red-50/40 space-y-2">
                    <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                      <CircleMinus className="w-4 h-4 text-red-600" />
                      <span>Development Area</span>
                    </div>
                    <p className="text-xs text-red-950 font-medium leading-relaxed">{selectedDimensionItem.top_weakness}</p>
                  </div>
                )}
              </div>

              {/* Specific Dimension Findings */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Dimension Findings</h4>
                {result.detailed_findings
                  .filter(f => f.dimension.toLowerCase().includes(selectedDimensionItem.dimension.toLowerCase()) || selectedDimensionItem.dimension.toLowerCase().includes(f.dimension.toLowerCase()))
                  .map((finding, idx) => {
                    const sev = getSeverityBadge(finding.severity);
                    return (
                      <div key={idx} className="ks-card p-4 rounded-2xl border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${sev.bg} ${sev.text} ${sev.border}`}>
                            {sev.label}
                          </span>
                          {finding.timestamp && (
                            <TimestampPill timestamp={finding.timestamp} onClick={handleTimestamp} />
                          )}
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed"><strong className="text-slate-900">Observed:</strong> {finding.what_happened}</p>
                        <p className="text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-100 leading-relaxed"><strong className="text-emerald-900">Recommendation:</strong> {finding.recommendation}</p>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── FEEDBACK EMAIL MODAL OVERLAY ── */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-300" />
                  <h3 className="text-base font-extrabold">Send Feedback Email</h3>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 overflow-y-auto bg-slate-50">
                {/* Tone Toggle & Actions */}
                <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveEmailVariant('warm')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeEmailVariant === 'warm'
                          ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Variant A — Warm
                    </button>
                    <button
                      onClick={() => setActiveEmailVariant('direct')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeEmailVariant === 'direct'
                          ? 'bg-slate-900 text-white shadow-xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Variant B — Direct
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenGmail}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-red-600 text-white hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer"
                      title="Opens Gmail compose with Recipient, Subject, and Body pre-filled"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send via Gmail ✉️</span>
                    </button>

                    <button
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                      <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Pre-filled Email Box */}
                <div className="ks-card overflow-hidden shadow-md border-slate-300 rounded-2xl bg-white">
                  <div className="bg-slate-900 text-white p-4 space-y-1.5 text-xs font-mono">
                    <p><span className="text-slate-500 font-bold">To:</span> {expertEmail ? `${expertName} <${expertEmail}>` : `${expertName}`}</p>
                    <p><span className="text-slate-500 font-bold">Subject:</span> {emailSubject}</p>
                    <p><span className="text-slate-500 font-bold">Signed by:</span> {userName}</p>
                  </div>

                  <div className="p-6">
                    <pre className="text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                      {formattedEmailBody}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
