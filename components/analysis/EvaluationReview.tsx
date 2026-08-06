'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, CheckCircle, TrendingDown,
  TrendingUp, HelpCircle, BookOpen, FileText, Clock, User, Users,
  MessageSquare, ChevronRight, X, LayoutGrid, Eye, Check, AlertTriangle, Layers, List, EyeOff, AlertCircle, Info
} from 'lucide-react';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CriterionResult {
  criterion: string; // Official Sheet Question
  spokenQuestionInTranscript?: string; // Spoken Similar Question in Transcript
  followUpQuestions?: string; // Follow-up questions asked by expert
  expertScore: number;
  expertNotes?: string;
  expertFeedbackQuality?: 'ACCURATE' | 'FACTUALLY_INCORRECT' | 'VAGUE_IMPROPER';
  expertFeedbackAuditNote?: string;
  aiScore: number;
  maxScore: number;
  scoreMatches: boolean;
  aiVerdict: 'APPROPRIATE' | 'OVER_MARKED' | 'UNDER_MARKED' | 'INSUFFICIENT_EVIDENCE';
  reasoning: string;
  transcriptTimestamp: string;
  transcriptEvidence: string;
}

interface StudentEvaluation {
  studentName: string;
  studentFoundInSheet: boolean;
  matchedSheetName?: string;
  transcriptSegmentStart?: string;
  transcriptSegmentEnd?: string;
  criteriaResults: CriterionResult[];
  overallVerdict: 'APPROPRIATE' | 'OVER_MARKED' | 'UNDER_MARKED';
  overallReasoning: string;
}

interface EvaluationResultData {
  batchName?: string;
  totalStudentsEvaluated?: number;
  batchSummary?: string;
  students?: StudentEvaluation[];
  // Legacy fields fallback
  studentName?: string;
  criteriaResults?: CriterionResult[];
  overallVerdict?: any;
  overallReasoning?: string;
}

// ── Verdict config ─────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  APPROPRIATE: {
    label: 'Score Agreed',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle,
    iconClass: 'text-emerald-600',
  },
  OVER_MARKED: {
    label: 'Over-Marked',
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: TrendingUp,
    iconClass: 'text-amber-600',
  },
  UNDER_MARKED: {
    label: 'Under-Marked',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: TrendingDown,
    iconClass: 'text-blue-600',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Unasked Topic',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: HelpCircle,
    iconClass: 'text-slate-400',
  },
};

// ── Hoverable Video Timestamp Pill ──────────────────────────────────────────

function TimestampPill({
  timestamp,
  onClick,
}: {
  timestamp: string;
  onClick?: (t: string) => void;
}) {
  const { showPreview, hidePreview } = useVideoPreview();

  if (!timestamp || timestamp === 'N/A') return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(timestamp);
      }}
      onMouseEnter={(e) => showPreview(timestamp, e)}
      onMouseLeave={hidePreview}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-amber-300 hover:bg-brand-orange hover:text-white transition-all cursor-pointer shadow-sm border border-slate-700 shrink-0"
      title="Hover for video preview | Click to seek video"
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{timestamp}</span>
    </button>
  );
}

// ── Spotlight Question Card (Single Focused View) ────────────────────────────

function QuestionSpotlightCard({
  result,
  questionNumber,
  totalQuestions,
  onTimestampClick,
}: {
  result: CriterionResult;
  questionNumber: number;
  totalQuestions: number;
  onTimestampClick?: (ts: string) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const cfg = VERDICT_CONFIG[result.aiVerdict] ?? VERDICT_CONFIG.INSUFFICIENT_EVIDENCE;
  const isHumanObserved = (result.expertNotes || '').toLowerCase().includes('reading') || (result.reasoning || '').toLowerCase().includes('reading');

  const expertPct = result.maxScore > 0 ? (result.expertScore / result.maxScore) * 100 : 0;
  const aiPct = result.maxScore > 0 ? (result.aiScore / result.maxScore) * 100 : 0;

  const isFactuallyIncorrectFeedback = result.expertFeedbackQuality === 'FACTUALLY_INCORRECT';
  const isVagueFeedback = result.expertFeedbackQuality === 'VAGUE_IMPROPER';

  return (
    <div className={`rounded-3xl border ${cfg.border} bg-white shadow-md overflow-hidden space-y-0`}>
      {/* Top Header Ribbon */}
      <div className={`flex items-center justify-between gap-3 px-6 py-4 ${cfg.bg} border-b ${cfg.border}`}>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 font-black text-xs flex items-center justify-center shadow-xs">
            Q{questionNumber}
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Question Spotlight ({questionNumber} of {totalQuestions})
            </span>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {result.scoreMatches ? (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Score Agreed (Expert: {result.expertScore} | AI: {result.aiScore})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Score Difference (Expert: {result.expertScore} vs AI: {result.aiScore})
                </span>
              )}

              {isHumanObserved && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3 h-3 text-purple-600" /> Live Human Observation (Reading from Notes)
                </span>
              )}

              {isFactuallyIncorrectFeedback && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" /> Factually False Written Feedback
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {result.transcriptTimestamp && result.transcriptTimestamp !== 'N/A' && (
            <TimestampPill timestamp={result.transcriptTimestamp} onClick={onTimestampClick} />
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-5 bg-white">
        {/* Official Question Title */}
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
            Official Evaluation Sheet Question
          </span>
          <h3 className="text-base font-black text-slate-900 leading-snug">{result.criterion}</h3>
        </div>

        {/* Spoken Similar Question in Viva */}
        {result.spokenQuestionInTranscript && result.spokenQuestionInTranscript !== 'N/A' && (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 text-xs space-y-1 shadow-sm">
            <span className="font-bold text-amber-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
              🗣️ Spoken Similar Question in Viva Transcript:
            </span>
            <p className="font-medium italic leading-relaxed text-slate-200">
              "{result.spokenQuestionInTranscript}"
            </p>
          </div>
        )}

        {/* Follow-up Questions Asked */}
        {result.followUpQuestions && result.followUpQuestions !== 'None' && result.followUpQuestions !== 'N/A' && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <span className="font-bold text-amber-700 text-[10px] uppercase tracking-wider block">
              ❓ Expert Follow-up Question(s) Probed:
            </span>
            <p className="font-medium">"{result.followUpQuestions}"</p>
          </div>
        )}

        {/* Factually False / Improper Written Feedback Alert Banner */}
        {result.expertFeedbackAuditNote && (isFactuallyIncorrectFeedback || isVagueFeedback) && (
          <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
            isFactuallyIncorrectFeedback 
              ? 'bg-rose-50 border-rose-200 text-rose-950' 
              : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            <span className="font-black text-[10px] uppercase tracking-wider flex items-center gap-1 text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Expert Written Feedback Audit ({result.expertFeedbackQuality === 'FACTUALLY_INCORRECT' ? 'Factually False / Contradictory' : 'Generic / Improper'}):
            </span>
            <p className="font-medium leading-relaxed">
              {result.expertFeedbackAuditNote}
            </p>
          </div>
        )}

        {/* Side-by-Side 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Expert Column */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Expert Assigned Score</span>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                  {result.expertScore}
                </span>
                <span className="text-xs font-bold text-slate-400">/ {result.maxScore}</span>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-slate-800 rounded-full" style={{ width: `${expertPct}%` }} />
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expert Written Notes:</span>
              <p className="text-xs text-slate-800 italic leading-relaxed font-medium">
                "{result.expertNotes && result.expertNotes.trim() ? result.expertNotes : 'No notes provided in sheet.'}"
              </p>
            </div>
          </div>

          {/* AI Column */}
          <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-brand-orange uppercase tracking-wider">AI Benchmarked Score</span>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-8 rounded-xl bg-brand-orange text-white font-black text-xs flex items-center justify-center">
                  {result.aiScore}
                </span>
                <span className="text-xs font-bold text-amber-700">/ {result.maxScore}</span>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-amber-200/60 overflow-hidden">
              <div className="h-full bg-brand-orange rounded-full" style={{ width: `${aiPct}%` }} />
            </div>

            <div className="pt-2 border-t border-amber-200/80 space-y-1">
              <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">AI Evaluation (Main + Follow-up):</span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {result.reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Transcript Evidence */}
        {result.transcriptEvidence && result.transcriptEvidence !== 'N/A' && (
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-brand-orange" />
              <span>{showEvidence ? 'Hide Transcript Evidence ✕' : 'View Spoken Evidence Quote 📜'}</span>
            </button>

            <AnimatePresence>
              {showEvidence && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <blockquote className="border-l-2 border-brand-orange pl-4 py-2 text-xs text-slate-800 italic leading-relaxed bg-amber-50/50 rounded-r-2xl pr-4">
                    "{result.transcriptEvidence}"
                  </blockquote>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Oogway Go Style Component ─────────────────────────────────────────────

export function EvaluationReview({
  data,
  sessionId,
  onTimestampClick,
}: {
  data: any;
  sessionId: string;
  onTimestampClick?: (ts: string) => void;
}) {
  const evalData = data?.evaluationResult as EvaluationResultData | null;
  const evalConfig = data?.evaluationConfig;

  const [activeStudentIndex, setActiveStudentIndex] = useState<number>(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'spotlight' | 'all'>('spotlight');
  const [showRubricModal, setShowRubricModal] = useState<boolean>(false);

  if (!evalData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-brand-orange" />
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Automated Mark Audit Running</h3>
        <p className="text-sm text-[var(--muted)] max-w-xs">
          The AI is scanning the transcript to identify all students and audit scores against official sheet questions.
        </p>
      </div>
    );
  }

  // Extract student array
  const students: StudentEvaluation[] = evalData.students
    ? evalData.students
    : evalData.studentName
    ? [
        {
          studentName: evalData.studentName,
          studentFoundInSheet: true,
          criteriaResults: (evalData.criteriaResults || []).map((r: any) => ({
            ...r,
            aiScore: r.aiScore ?? r.expertScore,
            scoreMatches: r.scoreMatches ?? (r.aiVerdict === 'APPROPRIATE'),
          })),
          overallVerdict: evalData.overallVerdict || 'APPROPRIATE',
          overallReasoning: evalData.overallReasoning || '',
        },
      ]
    : [];

  const activeStudent = students[activeStudentIndex] || students[0];
  const rubric = (evalConfig?.rubric as any[]) ?? [];

  const totalQuestions = activeStudent?.criteriaResults?.length || 0;
  const matchedQuestions = activeStudent?.criteriaResults?.filter((r) => r.scoreMatches).length || 0;
  const scoreDiffs = totalQuestions - matchedQuestions;
  const agreementPct = totalQuestions > 0 ? Math.round((matchedQuestions / totalQuestions) * 100) : 100;

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* Top Header Bar */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
              {evalConfig?.evaluationType ?? 'EVALUATION'}
            </span>
            <h2 className="text-xl font-black text-[var(--foreground)]">
              {evalConfig?.name ?? 'Automated Multi-Student Mark Audit'}
            </h2>
          </div>
          <p className="text-xs text-[var(--muted)] font-medium">
            Side-by-side comparison of Official Sheet Questions & Expert Scores vs AI Benchmarked Scores
          </p>
        </div>

        <div className="flex items-center gap-3">
          {rubric.length > 0 && (
            <button
              onClick={() => setShowRubricModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>View Reference Rubric</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <Users className="w-4 h-4 text-brand-orange" />
            <span>{students.length} Evaluated</span>
          </div>
        </div>
      </div>

      {/* Batch Overview Synthesis */}
      {evalData.batchSummary && (
        <div className="glass-card p-5 border-l-4 border-brand-orange bg-amber-50/40 space-y-2 rounded-2xl">
          <p className="text-[10px] font-black text-brand-orange uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Batch Evaluation Synthesis ({evalData.totalStudentsEvaluated || students.length} Candidates Evaluated)
          </p>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {evalData.batchSummary}
          </p>
        </div>
      )}

      {/* Oogway Go Main Layout: Left Student Sidebar + Right Audit View */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Mobile Student Bar (< md screens) */}
        <div className="w-full md:hidden flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
          {students.map((st, idx) => {
            const isActive = idx === activeStudentIndex;
            const matches = st.criteriaResults.filter((r) => r.scoreMatches).length;
            const total = st.criteriaResults.length;

            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveStudentIndex(idx);
                  setActiveQuestionIndex(0);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-brand-orange text-white font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 font-bold hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{st.studentName}</span>
                {total > 0 && <span className="opacity-80">({matches}/{total})</span>}
              </button>
            );
          })}
        </div>

        {/* Desktop Student Left Sidebar (>= md screens) */}
        <div className="hidden md:block w-72 ks-card p-3 rounded-2xl border-slate-200 shrink-0 space-y-1 shadow-sm bg-white">
          <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>Evaluated Candidates</span>
            <span className="text-brand-orange font-bold">{students.length}</span>
          </div>

          <div className="space-y-1">
            {students.map((st, idx) => {
              const isActive = idx === activeStudentIndex;
              const matches = st.criteriaResults.filter((r) => r.scoreMatches).length;
              const diffs = st.criteriaResults.length - matches;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveStudentIndex(idx);
                    setActiveQuestionIndex(0);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all cursor-pointer text-left ${
                    isActive
                      ? 'border-l-4 border-brand-orange font-black text-brand-orange bg-amber-50/80 shadow-xs'
                      : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <User className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-orange' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <span className="truncate block font-bold text-slate-900">{st.studentName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-emerald-700 font-bold">✓ {matches}</span>
                        {diffs > 0 && <span className="text-[10px] text-amber-700 font-bold">⚠ {diffs}</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-orange' : 'opacity-30'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Audit Content View */}
        {activeStudent && (
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Candidate Executive Hero Banner */}
            <div className="ks-card p-6 rounded-3xl border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-300 font-black text-xl flex items-center justify-center shadow-md">
                    {activeStudent.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900">{activeStudent.studentName}</h3>
                      {activeStudent.studentFoundInSheet ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Roster Matched ({activeStudent.matchedSheetName || activeStudent.studentName})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          Transcript Only
                        </span>
                      )}
                    </div>

                    {activeStudent.transcriptSegmentStart && activeStudent.transcriptSegmentStart !== 'N/A' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">Viva Segment:</span>
                        <TimestampPill timestamp={activeStudent.transcriptSegmentStart} onClick={onTimestampClick} />
                        <span className="text-xs text-slate-400">–</span>
                        <TimestampPill timestamp={activeStudent.transcriptSegmentEnd || ''} onClick={onTimestampClick} />
                      </div>
                    )}
                  </div>
                </div>

                {/* View Mode Toggle Button (Spotlight vs List Mode) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setViewMode('spotlight')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'spotlight'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Question Spotlight</span>
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 text-slate-600" />
                    <span>View All Questions</span>
                  </button>
                </div>
              </div>

              {/* 3 Executive Micro-Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Total Audited</span>
                  <p className="text-base font-black text-slate-900">{totalQuestions} Questions</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Scores Agreed</span>
                    <span className="text-xs font-black text-emerald-700">{agreementPct}%</span>
                  </div>
                  <p className="text-base font-black text-emerald-950">{matchedQuestions} / {totalQuestions}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Score Differences</span>
                  <p className="text-base font-black text-amber-950">{scoreDiffs} Flagged</p>
                </div>
              </div>

              {/* Overall Reasoning Banner */}
              {activeStudent.overallReasoning && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium italic">
                  "{activeStudent.overallReasoning}"
                </div>
              )}
            </div>

            {/* Interactive Question Selector Bar (Q1, Q2, Q3...) */}
            {totalQuestions > 0 && viewMode === 'spotlight' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto no-scrollbar scroll-smooth">
                  {activeStudent.criteriaResults.map((r, i) => {
                    const isSelected = i === activeQuestionIndex;
                    const hasFeedbackAlert = r.expertFeedbackQuality === 'FACTUALLY_INCORRECT';

                    return (
                      <button
                        key={i}
                        onClick={() => setActiveQuestionIndex(i)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-slate-900 text-amber-300 shadow-xs font-black scale-102'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>Q{i + 1}</span>
                        {hasFeedbackAlert ? (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Factually False Written Feedback" />
                        ) : r.scoreMatches ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Spotlight Question Card */}
                {activeStudent.criteriaResults[activeQuestionIndex] && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeQuestionIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <QuestionSpotlightCard
                        result={activeStudent.criteriaResults[activeQuestionIndex]}
                        questionNumber={activeQuestionIndex + 1}
                        totalQuestions={totalQuestions}
                        onTimestampClick={onTimestampClick}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {/* View All Questions Mode (Stack of Spotlight Cards) */}
            {totalQuestions > 0 && viewMode === 'all' && (
              <div className="space-y-5">
                {activeStudent.criteriaResults.map((r, i) => (
                  <QuestionSpotlightCard
                    key={i}
                    result={r}
                    questionNumber={i + 1}
                    totalQuestions={totalQuestions}
                    onTimestampClick={onTimestampClick}
                  />
                ))}
              </div>
            )}

            {totalQuestions === 0 && (
              <div className="ks-card p-12 text-center text-sm text-slate-500 rounded-3xl bg-white">
                No official sheet questions could be audited for this candidate.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reference Rubric Modal Overlay */}
      <AnimatePresence>
        {showRubricModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-orange" />
                  <h3 className="text-base font-black text-slate-900">Reference Rubric Benchmarks</h3>
                </div>
                <button
                  onClick={() => setShowRubricModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                {rubric.map((c: any, i: number) => (
                  <div key={i} className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-black text-slate-900">{c.criterion}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {(c.scoreDescriptors ?? []).map((d: any) => (
                        <div key={d.score} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                              {d.score}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">{d.label}</span>
                          </div>
                          {d.goodLooksLike && <p className="text-[10px] text-emerald-700">✓ {d.goodLooksLike}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
