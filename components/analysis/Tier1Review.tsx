'use client';

import React, { useState } from 'react';
import { AnalysisHeader } from '@/components/analysis/sections';
import {
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Info,
  Target,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  Users,
  GraduationCap,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AnalogiesUsed } from '@/components/analysis/sections/AnalogiesUsed';
import { StudentEngagement } from '@/components/analysis/sections/StudentEngagement';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

// ── Overall Executive Summary Card Component ─────────────────────────────────

function ExecutiveSummaryCard({
  title,
  right,
  wrong,
  action,
  icon: Icon,
  badgeColor,
}: {
  title: string;
  right?: string;
  wrong?: string;
  action?: string;
  icon: any;
  badgeColor: string;
}) {
  if (!right && !wrong && !action) return null;

  return (
    <div className="glass-card p-6 mb-8 border border-[var(--border)] relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 shadow-lg">
      <div className="flex items-center gap-3 mb-5 border-b border-[var(--border)] pb-4">
        <div className={`p-2.5 rounded-xl ${badgeColor} border border-brand-orange/20`}>
          <Icon className="w-5 h-5 text-brand-orange" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[var(--foreground)] tracking-tight">{title}</h3>
          <p className="text-[11px] text-[var(--muted)] font-medium">Executive overall session evaluation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Right */}
        {right && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">What Went Right</span>
            </div>
            <p className="text-xs font-semibold text-[var(--foreground)] leading-relaxed">{right}</p>
          </div>
        )}

        {/* Wrong */}
        {wrong && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-600">
              <XCircle className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Key Flaw / Gap</span>
            </div>
            <p className="text-xs font-semibold text-[var(--foreground)] leading-relaxed">{wrong}</p>
          </div>
        )}

        {/* Action */}
        {action && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 md:col-span-1">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Target className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Top Action Item</span>
            </div>
            <p className="text-xs font-semibold text-[var(--foreground)] leading-relaxed">{action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Student Genuine Questions Component ──────────────────────────────────────

function StudentQuestionsSection({
  questions,
  onTimestampClick,
}: {
  questions: any[];
  onTimestampClick?: (t: string) => void;
}) {
  const { showPreview, hidePreview } = useVideoPreview();
  const [showAll, setShowAll] = useState(false);

  if (!questions || questions.length === 0) return null;

  return (
    <div className="glass-card p-6 mt-8 border border-[var(--border)] shadow-md">
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
            <HelpCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--foreground)] tracking-tight">
              Student Genuine Functional Questions &amp; Doubts
            </h3>
            <p className="text-[11px] text-[var(--muted)] font-medium">
              {questions.length} conceptual doubt{questions.length === 1 ? '' : 's'} raised by students
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q: any, i: number) => {
          const studentName = q.student_name || q.student || q.speaker || 'Student';
          const initials = studentName.slice(0, 2).toUpperCase();

          const status = q.resolution_status || q.status || 'Resolved';
          const isUnresolved = String(status).toLowerCase().includes('unresolved');
          const isPartial = String(status).toLowerCase().includes('partial');

          const statusBadge = isUnresolved
            ? 'bg-rose-50 text-rose-600 border-rose-100'
            : isPartial
            ? 'bg-amber-50 text-amber-600 border-amber-100'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100';

          return (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--border)] bg-white/90 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-purple-200 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xs font-extrabold text-purple-700 shrink-0 mt-0.5 shadow-sm">
                  {initials}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-[var(--foreground)]">
                      {studentName}
                    </span>
                    {q.concept && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                        {q.concept}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--foreground)] leading-relaxed italic">
                    “{q.question || q.doubt}”
                  </p>
                </div>
              </div>

              {q.timestamp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTimestampClick) onTimestampClick(q.timestamp);
                  }}
                  onMouseEnter={(e) => showPreview(q.timestamp, e as any)}
                  onMouseLeave={hidePreview}
                  className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  {q.timestamp}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Consolidated Pointers Component ──────────────────────────────────────────

function ConsolidatedPointers({
  pointers,
  onTimestampClick,
  showPreview,
  hidePreview,
}: {
  pointers: any[];
  onTimestampClick?: (t: string) => void;
  showPreview: any;
  hidePreview: any;
}) {
  const [showProof, setShowProof] = useState(false);

  const allRight = Array.from(new Set(pointers.map((p) => p.right).filter((r) => r && r.trim() !== '')));
  const allWrong = Array.from(new Set(pointers.map((p) => p.wrong).filter((w) => w && w.trim() !== '')));
  const allReason = Array.from(new Set(pointers.map((p) => p.reason).filter((r) => r && r.trim() !== '')));
  const allAction = Array.from(new Set(pointers.map((p) => p.action).filter((a) => a && a.trim() !== '')));
  const allTimes = Array.from(new Set(pointers.flatMap((p) => p.timestamps || []).filter((t) => t && t.trim() !== '')));
  const allProofs = pointers.map((p) => p.proof).filter((p) => p && p.trim() !== '');

  return (
    <div className="border border-[var(--border)] rounded-xl p-4 bg-white/80 space-y-4">
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
              className="px-2 py-0.5 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] rounded-md font-mono font-bold flex items-center gap-1 hover:bg-brand-orange hover:text-white transition-colors cursor-pointer"
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
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-1">
                What Was Done Right
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allRight.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allWrong.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest mb-1">
                What Was Done Wrong
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allWrong.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allReason.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest mb-1">
                Hypothesis / Reason
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allReason.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allAction.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mb-1">
                What Can Be Done
              </p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1 font-medium">
                {allAction.map((text, i) => (
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
            className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] hover:text-brand-orange uppercase tracking-wider transition-colors"
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
                  {allProofs.map((proof, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 items-start bg-[var(--layer-2)] p-3 rounded-lg border border-[var(--border)]"
                    >
                      <MessageSquareQuote className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
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

// ── Insight Card Component (First open by default, main proof in header) ──────

function InsightCard({
  insight,
  index,
  onTimestampClick,
}: {
  insight: any;
  index: number;
  onTimestampClick?: (t: string) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const { showPreview, hidePreview } = useVideoPreview();

  const pointers = insight.pointers || [];
  const topTimes = Array.from(
    new Set(pointers.flatMap((p: any) => p.timestamps || []).filter((t: any) => t && String(t).trim() !== ''))
  ).slice(0, 2) as string[];

  const summaryLines: string[] = [];
  pointers.forEach((p: any) => {
    if (p.right && p.right.trim()) summaryLines.push(`🟢 Right: ${p.right.trim()}`);
    if (p.wrong && p.wrong.trim()) summaryLines.push(`🔴 Flaw: ${p.wrong.trim()}`);
    if (p.action && p.action.trim()) summaryLines.push(`🎯 Action: ${p.action.trim()}`);
    if (p.reason && p.reason.trim()) summaryLines.push(`💡 Reason: ${p.reason.trim()}`);
  });
  if (summaryLines.length === 0 && insight.summary) {
    summaryLines.push(insight.summary);
  }
  const displayTwoLines = summaryLines.slice(0, 2);

  return (
    <div className="ks-card overflow-hidden group border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      {/* Header Banner */}
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 cursor-pointer hover:bg-[var(--layer-2)]/50 transition-all text-left space-y-2"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm bg-brand-orange" />
            <span className="font-extrabold text-[15px] tracking-tight text-[var(--foreground)]">
              {insight.metric}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {topTimes.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {topTimes.map((t, i) => (
                  <span
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTimestampClick) onTimestampClick(t);
                    }}
                    onMouseEnter={(e) => showPreview(t, e as any)}
                    onMouseLeave={hidePreview}
                    className="px-2 py-0.5 rounded-md bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-mono font-bold text-[10px] hover:bg-brand-orange hover:text-white transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--layer-2)] group-hover:bg-white border border-transparent group-hover:border-[var(--border)] transition-all">
              {open ? (
                <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
              )}
            </div>
          </div>
        </div>

        {!open && (
          <div className="pt-1.5 space-y-2">
            {insight.summary && (
              <p className="text-[13px] text-[var(--foreground)]/90 font-medium leading-relaxed">
                {insight.summary}
              </p>
            )}

            {displayTwoLines.length > 0 && displayTwoLines[0] !== insight.summary && (
              <div className="pt-2 border-t border-dashed border-[var(--border)]/60 space-y-1.5">
                {displayTwoLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-semibold text-[var(--foreground)]/90 leading-relaxed">
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-5 pb-5 pt-2 bg-[var(--layer-1)] border-t border-[var(--border)]">
              <p className="text-[14px] text-[var(--foreground)] leading-relaxed mb-4 pb-4 border-b border-[var(--border)] font-medium">
                {insight.summary}
              </p>

              {pointers.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">
                    Consolidated Observations
                  </p>
                  <ConsolidatedPointers
                    pointers={pointers}
                    onTimestampClick={onTimestampClick}
                    showPreview={showPreview}
                    hidePreview={hidePreview}
                  />
                </div>
              ) : (
                <p className="text-[12px] text-[var(--muted)] italic">No specific pointers identified.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main OogwayPulse Component ────────────────────────────────────────────────

export function OogwayPulse({
  data,
  sessionId,
  onTimestampClick,
}: {
  data: any;
  sessionId: string;
  onTimestampClick?: (t: string) => void;
}) {
  const { showPreview, hidePreview } = useVideoPreview();
  const [activeView, setActiveView] = useState<'expert' | 'student'>('expert');

  const sessionFlow = data.session_flow ?? data.tier1_result?.session_flow ?? [];
  const expertInsights = data.expert_insights ?? data.tier1_result?.expert_insights ?? [];
  const studentInsights = data.student_insights ?? data.tier1_result?.student_insights ?? [];

  // Executive summaries
  const overallExpert = data.overall_expert_summary ?? data.tier1_result?.overall_expert_summary;
  const overallStudent = data.overall_student_summary ?? data.tier1_result?.overall_student_summary;

  // Student questions list
  const studentQuestions =
    data.student_questions ??
    data.tier1_result?.student_questions ??
    data.student_log?.student_questions ??
    data.student_log?.unresolved_doubts ??
    [];

  // Fallback overall summary derivation if model did not output overall object
  const derivedExpertRight = overallExpert?.right || expertInsights.flatMap((i: any) => (i.pointers || []).map((p: any) => p.right)).filter(Boolean)[0];
  const derivedExpertWrong = overallExpert?.wrong || expertInsights.flatMap((i: any) => (i.pointers || []).map((p: any) => p.wrong)).filter(Boolean)[0];
  const derivedExpertAction = overallExpert?.action || expertInsights.flatMap((i: any) => (i.pointers || []).map((p: any) => p.action)).filter(Boolean)[0];

  const derivedStudentRight = overallStudent?.right || studentInsights.flatMap((i: any) => (i.pointers || []).map((p: any) => p.right)).filter(Boolean)[0];
  const derivedStudentWrong = overallStudent?.wrong || studentInsights.flatMap((i: any) => (i.pointers || []).map((p: any) => p.wrong)).filter(Boolean)[0];
  const derivedStudentAction = overallStudent?.action || studentInsights.flatMap((i: any) => (i.pointers || []).map((p: any) => p.action)).filter(Boolean)[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-0 sm:px-4 py-4 pb-24 animate-in fade-in duration-500">
      {/* Pulse Header Badge */}
      <div className="flex items-center justify-between gap-4 bg-[var(--layer-1)] border border-[var(--border)] rounded-xl px-4 py-3 mb-5 mx-1 sm:mx-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-extrabold text-[var(--foreground)]">Oogway Pulse</span>
          <span className="text-xs text-[var(--muted)] ml-1 hidden sm:inline">
            — Balanced session execution review.
          </span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-[var(--layer-2)] border border-[var(--border)] p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveView('expert')}
            className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
              activeView === 'expert'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Expert Execution</span>
          </button>
          <button
            onClick={() => setActiveView('student')}
            className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
              activeView === 'student'
                ? 'bg-white text-purple-600 shadow-sm border border-purple-100'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Behavior</span>
          </button>
        </div>
      </div>

      {/* Insight Section */}
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'expert' ? (
            <motion.div
              key="expert"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Executive Overall Summary Card for Expert */}
              <ExecutiveSummaryCard
                title="Expert Session Summary"
                right={derivedExpertRight}
                wrong={derivedExpertWrong}
                action={derivedExpertAction}
                icon={GraduationCap}
                badgeColor="bg-blue-50"
              />

              {/* Expert Insight Metric Cards */}
              {expertInsights.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No expert insights detected yet.</p>
                  <p className="text-xs mt-1 opacity-70">The Pulse may still be processing.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expertInsights.map((insight: any, i: number) => (
                    <InsightCard
                      key={i}
                      insight={insight}
                      index={i}
                      onTimestampClick={onTimestampClick}
                    />
                  ))}
                </div>
              )}

              {((data.analogies_summary && data.analogies_summary.length > 0) ||
                (data.expert_audit?.analogies_summary && data.expert_audit.analogies_summary.length > 0)) && (
                <div className="mt-8">
                  <AnalogiesUsed data={data} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Executive Overall Summary Card for Student */}
              <ExecutiveSummaryCard
                title="Student Behavior Summary"
                right={derivedStudentRight}
                wrong={derivedStudentWrong}
                action={derivedStudentAction}
                icon={Users}
                badgeColor="bg-purple-50"
              />

              {/* Student Insight Metric Cards */}
              {studentInsights.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No student behavior signals detected.</p>
                  <p className="text-xs mt-1 opacity-70">Data may still be processing.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentInsights.map((insight: any, i: number) => (
                    <InsightCard
                      key={i}
                      insight={insight}
                      index={i}
                      onTimestampClick={onTimestampClick}
                    />
                  ))}
                </div>
              )}

              {/* Student Genuine Functional Questions & Doubts Section */}
              <StudentQuestionsSection
                questions={studentQuestions}
                onTimestampClick={onTimestampClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Major Session Flow Milestones (max 10-12 chapters) */}
      {sessionFlow && sessionFlow.length > 0 && (
        <div className="mt-12 pt-10 border-t border-[var(--border)] relative max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-orange" />
              <h3 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
                Session Flow Timeline
              </h3>
            </div>
            <span className="text-xs font-semibold text-[var(--muted)]">
              {Math.min(sessionFlow.length, 12)} Major Milestones
            </span>
          </div>

          <div className="relative pl-6 space-y-4 border-l-2 border-brand-orange/30">
            {sessionFlow.slice(0, 12).map((flow: any, i: number) => {
              const isIssue = Boolean(flow.issue && flow.issue.trim() !== '');
              return (
                <div key={i} className="relative group">
                  <div
                    className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                      isIssue ? 'bg-rose-500 shadow-rose-500/40' : 'bg-brand-orange shadow-brand-orange/40'
                    }`}
                  />

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-white/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[var(--foreground)]">{flow.chapter}</span>
                        {isIssue && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
                            Issue Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] leading-relaxed font-medium">
                        {flow.summary}
                      </p>
                      {isIssue && (
                        <p className="text-xs text-rose-700 font-medium bg-rose-50/60 p-2 rounded-md border border-rose-100 mt-1">
                          ⚠️ {flow.issue}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTimestampClick) onTimestampClick(flow.start_timestamp);
                      }}
                      onMouseEnter={(e) => showPreview(flow.start_timestamp, e as any)}
                      onMouseLeave={hidePreview}
                      className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-colors cursor-pointer self-start sm:self-center"
                    >
                      {flow.start_timestamp} {flow.end_timestamp ? `→ ${flow.end_timestamp}` : ''}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { OogwayPulse as Tier1Review };
