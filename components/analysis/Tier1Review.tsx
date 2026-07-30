'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Zap, GraduationCap, Users, ShieldCheck, UserCheck, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalogiesUsed } from '@/components/analysis/sections/AnalogiesUsed';
import { ExecutiveSummaryCard } from './tier1/ExecutiveSummaryCard';
import { InsightCard } from './tier1/InsightCard';
import { StudentQuestionsSection } from './tier1/StudentQuestionsSection';
import { SessionTimeline } from './tier1/SessionTimeline';

export function OogwayPulse({
  data,
  sessionId,
  onTimestampClick,
}: {
  data: any;
  sessionId: string;
  onTimestampClick?: (t: string) => void;
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'ADMIN';
  const isExpertUser = role === 'EXPERT';

  const [activeView, setActiveView] = useState<'expert' | 'student'>('expert');
  const [toneMode, setToneMode] = useState<'direct' | 'coaching'>(isExpertUser ? 'coaching' : 'direct');

  const activeTone = isExpertUser ? 'coaching' : toneMode;

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
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-4 pb-24 animate-in fade-in duration-500">
      {/* Pulse Header Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--layer-1)] border border-[var(--border)] rounded-2xl px-4 py-3 mb-5 mx-1 sm:mx-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--foreground)]" />
          <span className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Oogway</span>
          <span className="text-xs text-[var(--muted)] ml-1 hidden sm:inline font-medium">
            — Balanced session execution review.
          </span>
        </div>

        {/* ADMIN / TEAM EXPERT PREVIEW TOGGLE (Only shown for Admin & Team) */}
        {!isExpertUser && (
          <div className="flex items-center gap-1.5 bg-[var(--layer-2)] p-1 rounded-xl border border-[var(--border)] self-stretch sm:self-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] px-2 hidden md:inline">
              Tone Mode:
            </span>
            <button
              onClick={() => setToneMode('direct')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                toneMode === 'direct'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Neutral Direct (Internal)
            </button>
            <button
              onClick={() => setToneMode('coaching')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                toneMode === 'coaching'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Expert Coaching Preview
            </button>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-[var(--layer-2)] border border-[var(--border)] p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveView('expert')}
            className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeView === 'expert'
                ? 'bg-white text-[var(--foreground)] shadow-sm border border-[var(--border)] scale-100'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] scale-95'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Expert Execution</span>
          </button>
          <button
            onClick={() => setActiveView('student')}
            className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeView === 'student'
                ? 'bg-white text-[var(--foreground)] shadow-sm border border-[var(--border)] scale-100'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] scale-95'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Behavior</span>
          </button>
        </div>
      </div>

      {/* Insight Section */}
      <div className="w-full mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'expert' ? (
            <motion.div
              key="expert"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ExecutiveSummaryCard
                title={activeTone === 'coaching' ? 'Expert Growth & Coaching Summary' : 'Expert Session Summary'}
                right={derivedExpertRight}
                wrong={derivedExpertWrong}
                action={derivedExpertAction}
                icon={GraduationCap}
                badgeColor="bg-[var(--layer-2)]"
                mode={activeTone}
              />

              {expertInsights.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No expert insights detected yet.</p>
                  <p className="text-xs mt-1 opacity-70">The Pulse may still be processing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expertInsights.map((insight: any, i: number) => (
                    <InsightCard
                      key={i}
                      insight={insight}
                      index={i}
                      onTimestampClick={onTimestampClick}
                      mode={activeTone}
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
              <ExecutiveSummaryCard
                title="Student Behavior Summary"
                right={derivedStudentRight}
                wrong={derivedStudentWrong}
                action={derivedStudentAction}
                icon={Users}
                badgeColor="bg-[var(--layer-2)]"
              />

              {studentInsights.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No student behavior signals detected.</p>
                  <p className="text-xs mt-1 opacity-70">Data may still be processing.</p>
                </div>
              ) : (
                <div className="space-y-4">
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

              <StudentQuestionsSection
                questions={studentQuestions}
                onTimestampClick={onTimestampClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { OogwayPulse as Tier1Review };
