'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Loader2, Rocket, HelpCircle,
  Brain, Users, Sparkles, Clock, AlertCircle,
  LayoutGrid, ChevronRight, CheckCircle2, XCircle,
  Lightbulb, MessagesSquare, Check
} from 'lucide-react';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

type ConfusionPoint = {
  topic: string;
  student_quote: string;
  timestamp: string;
  underlying_cause: string;
  resolution_status: string;
};

type QuestionBreakdown = {
  category: string;
  count: number;
  key_takeaway: string;
  example_questions: string[];
};

type StudentChecklistItem = {
  check: string;
  passed: boolean;
  note: string;
};

type StudentGoResult = {
  batch_mastery_level: {
    level: string;
    mastery_summary: string;
    key_strengths: string[];
    knowledge_gaps: string[];
  };
  overall_summary: string;
  confusion_points: ConfusionPoint[];
  question_breakdown: QuestionBreakdown[];
  class_engagement: {
    participation_rate: string;
    frustration_level: string;
    engagement_summary: string;
  };
  academic_recommendations: string[];
  student_checklist: StudentChecklistItem[];
};

function getMasteryBadgeStyle(level: string) {
  const l = level?.toLowerCase() || '';
  if (l.includes('advanced') || l.includes('expert')) {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  }
  if (l.includes('competent') || l.includes('good')) {
    return 'bg-blue-100 text-blue-900 border-blue-300';
  }
  if (l.includes('developing')) {
    return 'bg-amber-100 text-amber-900 border-amber-300';
  }
  return 'bg-red-100 text-red-900 border-red-300';
}

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

export function StudentGoReview({
  sessionId,
  sessionData,
  onTimestampClick,
}: {
  sessionId: string;
  sessionData?: any;
  onTimestampClick?: (t: string) => void;
}) {
  const [result, setResult] = useState<StudentGoResult | null>(null);
  const [status, setStatus] = useState<string>('NOT_STARTED');
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [activeSideNav, setActiveSideNav] = useState<string>('overview');
  const [progress, setProgress] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/${sessionId}/student-go`);
      const data = await res.json();
      const currentStatus = data.status || 'NOT_STARTED';
      setStatus(currentStatus);
      if (data.result) {
        setResult(data.result);
        setProgress(100);
      }
    } catch (err) {
      console.error('[StudentGoReview] Failed to fetch status', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status !== 'RUNNING') {
      if (status === 'COMPLETE' || result) setProgress(100);
      return;
    }
    
    const pollInterval = setInterval(fetchStatus, 3000);
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 92 ? 92 : prev + Math.floor(Math.random() * 3) + 1));
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
      const res = await fetch(`/api/analysis/${sessionId}/student-go`, { method: 'POST' });
      const data = await res.json();
      setStatus(data.status || 'RUNNING');
    } catch (err) {
      console.error('[StudentGoReview] Failed to trigger', err);
      setStatus('FAILED');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleTimestamp = (ts: string) => {
    if (onTimestampClick) onTimestampClick(ts);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading Student Go Audit…</p>
      </div>
    );
  }

  if (!result && (status === 'NOT_STARTED' || status === 'FAILED')) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="ks-card overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-blue-200/50">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Student Go Audit</h3>
            <p className="text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed mb-1">
              Deep cohort audit analyzing student comprehension, confusion points, question patterns, and batch mastery level.
            </p>

            {status === 'FAILED' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-bold text-red-700">Previous analysis failed. Click below to re-run.</p>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100">
            <button
              onClick={handleTrigger}
              disabled={triggerLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-md shadow-blue-200/50 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {triggerLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting Student Audit...</>
              ) : (
                <><Rocket className="w-4 h-4" /> Run Student Go Audit</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === 'RUNNING' && !result) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="ks-card overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-blue-200/50 animate-pulse">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Student Go is Analyzing...</h3>
            <p className="text-xs text-slate-500 font-medium">Auditing student questions, confusion points & mastery level.</p>

            <div className="my-6 space-y-2 max-w-sm mx-auto text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Audit Progress</span>
                <span className="text-blue-600 font-mono text-sm">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300/40">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 h-full rounded-full shadow-sm"
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 max-w-xs mx-auto text-left">
              {[
                { label: 'Scanning transcript for student doubts', target: 25 },
                { label: 'Mapping timestamped confusion points', target: 55 },
                { label: 'Categorizing question types', target: 80 },
                { label: 'Evaluating batch mastery level', target: 95 },
              ].map((step) => {
                const isDone = progress >= step.target;
                return (
                  <div key={step.label} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    {isDone ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
                    )}
                    <span className={isDone ? 'text-slate-900 font-bold' : ''}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!result) return null;

  const NAV_ITEMS = [
    { id: 'overview', label: 'Student Overview', icon: LayoutGrid },
    { id: 'confusion', label: 'Confusion Points', icon: HelpCircle, count: result.confusion_points?.length || 0 },
    { id: 'questions', label: 'Question Analysis', icon: MessagesSquare },
    { id: 'mastery', label: 'Batch Mastery Level', icon: Brain },
    { id: 'engagement', label: 'Class Engagement', icon: Users },
    { id: 'recommendations', label: 'Academic Next Steps', icon: Lightbulb },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[1280px] mx-auto space-y-5 mt-2 pb-24">
      {/* Top Header Bar */}
      <div className="ks-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-slate-200 shadow-sm rounded-2xl">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Student Go Audit</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getMasteryBadgeStyle(result.batch_mastery_level?.level)}`}>
                Batch Level: {result.batch_mastery_level?.level || 'Competent'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Batch comprehension, confusion friction points & doubt analysis</p>
          </div>
        </div>

        <button
          onClick={handleTrigger}
          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
        >
          Re-run Audit
        </button>
      </div>

      {/* Main Layout: Left Sidebar + Right Panel */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full md:w-72 ks-card p-3 rounded-2xl border-slate-200 shrink-0 space-y-1 shadow-sm">
          <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Student Audit Navigation
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSideNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSideNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  isActive
                    ? 'border-l-4 border-blue-600 font-black text-blue-700 bg-blue-50/70 shadow-xs'
                    : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* VIEW 1: Overview */}
          {activeSideNav === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="ks-card p-6 rounded-2xl border-slate-200 space-y-3 bg-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Student Cohort Executive Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.overall_summary}</p>
              </div>

              {/* Checklist */}
              {result.student_checklist && result.student_checklist.length > 0 && (
                <div className="ks-card p-6 rounded-2xl border-slate-200 space-y-4 bg-white">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Student Engagement Checklist</h3>
                  <div className="space-y-3">
                    {result.student_checklist.map((item, i) => (
                      <div key={i} className={`flex items-start justify-between gap-3 p-4 rounded-2xl border ${item.passed ? 'bg-emerald-50/40 border-emerald-200/70' : 'bg-red-50/40 border-red-200/70'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm mt-0.5 ${item.passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {item.passed ? '✓' : '✕'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 leading-tight block">{item.check}</span>
                            {item.note && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.note}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 2: Confusion Points */}
          {activeSideNav === 'confusion' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Timestamped Student Confusion & Friction Points</h4>
                <span className="text-xs font-bold text-slate-500">{result.confusion_points?.length || 0} Points Identified</span>
              </div>

              {result.confusion_points?.map((item, idx) => (
                <div key={idx} className="ks-card p-6 rounded-2xl border-slate-200 bg-white space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <h4 className="text-sm font-extrabold text-slate-900">{item.topic}</h4>
                    </div>
                    {item.timestamp && <TimestampPill timestamp={item.timestamp} onClick={handleTimestamp} />}
                  </div>

                  {item.student_quote && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Student Doubt Quote</span>
                      <p className="italic font-serif text-amber-950 leading-relaxed">"{item.student_quote}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-1">Underlying Cause</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{item.underlying_cause}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block mb-1">Resolution Status</span>
                      <p className="text-blue-900 font-medium bg-blue-50 p-2.5 rounded-xl border border-blue-100 leading-relaxed">{item.resolution_status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* VIEW 3: Question Analysis */}
          {activeSideNav === 'questions' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">Student Question Categorization</h4>
              
              <div className="grid grid-cols-1 gap-4">
                {result.question_breakdown?.map((q, i) => (
                  <div key={i} className="ks-card p-6 rounded-2xl border-slate-200 bg-white space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-sm font-black text-slate-900">{q.category} Questions</span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-900">{q.count} Questions</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{q.key_takeaway}</p>

                    {q.example_questions?.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Example Questions Asked:</span>
                        <ul className="space-y-1.5 text-xs text-slate-800 font-medium">
                          {q.example_questions.map((ex, idx) => (
                            <li key={idx} className="pl-3 border-l-2 border-blue-400">"{ex}"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW 4: Batch Mastery Level */}
          {activeSideNav === 'mastery' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="ks-card p-6 rounded-2xl border-slate-200 bg-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Batch Competency Assessment</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getMasteryBadgeStyle(result.batch_mastery_level?.level)}`}>
                    {result.batch_mastery_level?.level}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.batch_mastery_level?.mastery_summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ks-card p-5 rounded-2xl border-emerald-200 bg-emerald-50/40 space-y-2">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">Batch Concept Mastery</span>
                  <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                    {result.batch_mastery_level?.key_strengths?.map((s, i) => (
                      <li key={i} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="ks-card p-5 rounded-2xl border-red-200 bg-red-50/40 space-y-2">
                  <span className="text-xs font-black text-red-800 uppercase tracking-wider block">Knowledge Gaps to Reinforce</span>
                  <ul className="space-y-1.5 text-xs text-red-950 font-medium">
                    {result.batch_mastery_level?.knowledge_gaps?.map((g, i) => (
                      <li key={i} className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" /> {g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 5: Class Engagement */}
          {activeSideNav === 'engagement' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="ks-card p-6 rounded-2xl border-slate-200 bg-white space-y-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Class Participation & Sentiment Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Participation Rate</span>
                    <span className="text-base font-black text-slate-900">{result.class_engagement?.participation_rate}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Frustration Level</span>
                    <span className="text-base font-black text-slate-900">{result.class_engagement?.frustration_level}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">{result.class_engagement?.engagement_summary}</p>
              </div>
            </motion.div>
          )}

          {/* VIEW 6: Recommendations */}
          {activeSideNav === 'recommendations' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">Academic Mentorship Action Items</h3>
              <div className="space-y-3">
                {result.academic_recommendations?.map((rec, i) => (
                  <div key={i} className="ks-card p-4.5 rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-900 flex items-start gap-3 shadow-sm">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="leading-relaxed pt-0.5">{rec}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
