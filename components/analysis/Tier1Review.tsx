'use client';

import React, { useState } from 'react';
import { AnalysisHeader } from '@/components/analysis/sections';
import { MessageSquareQuote, CheckCircle2, XCircle, Info, Target, ChevronDown, ChevronRight, Zap, Clock, Users, GraduationCap } from 'lucide-react';
import { AnalogiesUsed } from '@/components/analysis/sections/AnalogiesUsed';
import { StudentEngagement } from '@/components/analysis/sections/StudentEngagement';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPreview } from '@/components/analysis/VideoPreviewContext';

// ── Components ────────────────────────────────────────────────────────────────

function ConsolidatedPointers({ pointers, onTimestampClick, showPreview, hidePreview }: { pointers: any[], onTimestampClick?: (t: string) => void, showPreview: any, hidePreview: any }) {
  const [showProof, setShowProof] = useState(false);

  // Consolidate and deduplicate data
  const allRight = Array.from(new Set(pointers.map(p => p.right).filter(r => r && r.trim() !== '')));
  const allWrong = Array.from(new Set(pointers.map(p => p.wrong).filter(w => w && w.trim() !== '')));
  const allReason = Array.from(new Set(pointers.map(p => p.reason).filter(r => r && r.trim() !== '')));
  const allAction = Array.from(new Set(pointers.map(p => p.action).filter(a => a && a.trim() !== '')));
  
  const allTimes = Array.from(new Set(pointers.flatMap(p => p.timestamps || []).filter(t => t && t.trim() !== '')));
  const allProofs = pointers.map(p => p.proof).filter(p => p && p.trim() !== '');

  return (
    <div className="border border-[var(--border)] rounded-xl p-4 bg-white/60">
      
      {/* Timestamps */}
      {allTimes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 shrink-0 mb-4 pb-3 border-b border-[var(--border)]">
          <span className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest self-center mr-2">Timestamps:</span>
          {allTimes.map((t: string, i: number) => (
            <button 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                if (onTimestampClick) onTimestampClick(t);
              }}
              onMouseEnter={(e) => showPreview(t, e)}
              onMouseLeave={hidePreview}
              className="px-2 py-0.5 bg-brand-orange/5 border border-brand-orange/20 text-brand-orange text-[10px] rounded-md font-mono font-bold flex items-center gap-1 hover:bg-brand-orange hover:text-white transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />{t}
            </button>
          ))}
        </div>
      )}

      {/* Structured Data */}
      <div className="space-y-5">
        {allRight.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5">What was done right</p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1">
                {allRight.map((text, i) => <li key={i}>{text}</li>)}
              </ul>
            </div>
          </div>
        )}

        {allWrong.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-3 h-3 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1.5">What was done wrong</p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1">
                {allWrong.map((text, i) => <li key={i}>{text}</li>)}
              </ul>
            </div>
          </div>
        )}

        {allReason.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1.5">Hypothesis / Reason</p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1">
                {allReason.map((text, i) => <li key={i}>{text}</li>)}
              </ul>
            </div>
          </div>
        )}

        {allAction.length > 0 && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
              <Target className="w-3 h-3 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5">What can be done</p>
              <ul className="list-disc pl-4 text-[13px] text-[var(--foreground)] leading-relaxed space-y-1">
                {allAction.map((text, i) => <li key={i}>{text}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Proof Toggle */}
      {allProofs.length > 0 && (
        <div className="mt-5 pt-4 border-t border-dashed border-[var(--border)]">
          <button 
            onClick={() => setShowProof(!showProof)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] hover:text-brand-orange uppercase tracking-wider transition-colors"
          >
            {showProof ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            View Transcript Proof
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
                    <div key={i} className="flex gap-2 items-start bg-[var(--layer-2)] p-3 rounded-lg border border-[var(--border)]">
                      <MessageSquareQuote className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
                      <p className="text-[12px] text-[var(--muted)] leading-relaxed italic">
                        "{proof}"
                      </p>
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

function InsightCard({ insight, onTimestampClick }: { insight: any; onTimestampClick?: (t: string) => void }) {
  const [open, setOpen] = useState(true);
  const { showPreview, hidePreview } = useVideoPreview();

  return (
    <div className="ks-card overflow-hidden group">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--layer-2)]/50 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full shrink-0 shadow-sm bg-brand-orange" />
          <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">{insight.metric}</span>
        </div>
        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--layer-2)] group-hover:bg-white border border-transparent group-hover:border-[var(--border)] transition-all">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-5 pb-5 pt-2 bg-[var(--layer-1)]">
              {/* Summary Analysis */}
              <p className="text-[14px] text-[var(--foreground)] leading-relaxed mb-5 pb-5 border-b border-[var(--border)]">
                {insight.summary}
              </p>

              {/* Pointers */}
              {insight.pointers?.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Consolidated Observations</p>
                  <ConsolidatedPointers 
                    pointers={insight.pointers} 
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

// ── Main Component ────────────────────────────────────────────────────────────

export function OogwayPulse({ data, sessionId, onTimestampClick }: { data: any; sessionId: string, onTimestampClick?: (t: string) => void }) {
  const { showPreview, hidePreview } = useVideoPreview();
  const [activeView, setActiveView] = useState<'expert' | 'student'>('expert');

  // Resolve session_flow from multiple possible paths
  const sessionFlow = data.session_flow ?? data.tier1_result?.session_flow ?? [];
  const expertInsights = data.expert_insights ?? data.tier1_result?.expert_insights ?? [];
  const studentInsights = data.student_insights ?? data.tier1_result?.student_insights ?? [];

  return (
    <div className="w-full max-w-4xl mx-auto px-0 sm:px-4 py-4 pb-24 animate-in fade-in duration-500">

      {/* Pulse Badge */}
      <div className="flex items-center justify-between gap-4 bg-[var(--layer-1)] border border-[var(--border)] rounded-xl px-4 py-3 mb-5 mx-1 sm:mx-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Oogway Pulse</span>
          <span className="text-xs text-[var(--muted)] ml-1 hidden sm:inline">— Rigorous session review.</span>
        </div>
      </div>

      {/* View Toggle — compact on mobile */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-[var(--layer-2)] border border-[var(--border)] p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveView('expert')}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeView === 'expert'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Expert</span>
          </button>
          <button
            onClick={() => setActiveView('student')}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeView === 'student'
                ? 'bg-white text-purple-600 shadow-sm border border-purple-100'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students</span>
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
              {expertInsights.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No expert insights detected yet.</p>
                  <p className="text-xs mt-1 opacity-70">The Pulse may still be processing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expertInsights.map((insight: any, i: number) => (
                    <InsightCard key={i} insight={insight} onTimestampClick={onTimestampClick} />
                  ))}
                </div>
              )}
              {((data.analogies_summary && data.analogies_summary.length > 0) || (data.expert_audit?.analogies_summary && data.expert_audit.analogies_summary.length > 0)) && (
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
              {studentInsights.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No student behavior signals detected.</p>
                  <p className="text-xs mt-1 opacity-70">Data may still be processing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentInsights.map((insight: any, i: number) => (
                    <InsightCard key={i} insight={insight} onTimestampClick={onTimestampClick} />
                  ))}
                </div>
              )}
              {data.student_log?.student_questions && data.student_log.student_questions.length > 0 && (
                <div className="mt-8">
                  <StudentEngagement data={data} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Session Flow Timeline */}
      {sessionFlow && sessionFlow.length > 0 && (
        <div className="mt-12 pt-10 border-t border-[var(--border)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <div className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-brand-orange" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)]" style={{ fontFamily: "var(--font-outfit)" }}>Session Flow</h3>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            {/* Main timeline line */}
            <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-brand-orange/40 via-[var(--border)] to-transparent" />
            
            <div className="space-y-8 pl-10 sm:pl-14">
              {sessionFlow.map((flow: any, i: number) => {
                const isIssue = Boolean(flow.issue && flow.issue.trim() !== '');
                return (
                  <div key={i} className="relative group">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[43px] top-4 w-[14px] h-[14px] rounded-full shadow-sm border-2 border-white z-10 transition-transform duration-300 group-hover:scale-125
                      ${isIssue ? 'bg-red-500 shadow-red-500/40' : 'bg-brand-orange shadow-brand-orange/40'}`}
                    />
                    {/* Pulse ring on hover */}
                    <div className={`absolute -left-[43px] top-4 w-[14px] h-[14px] rounded-full z-0 animate-ping opacity-0 group-hover:opacity-100 transition-opacity
                      ${isIssue ? 'bg-red-500' : 'bg-brand-orange'}`}
                    />
                    
                    {/* Content card */}
                    <div className={`p-6 rounded-2xl transition-all duration-500 ks-card hover:-translate-y-1
                      ${isIssue 
                        ? 'bg-gradient-to-br from-red-50/50 to-white border-red-100/50 hover:shadow-red-500/10 hover:border-red-200' 
                        : 'hover:border-brand-orange/20 hover:shadow-brand-orange/5'}`}
                    >
                      <div className="flex items-center justify-between mb-4 gap-4">
                        <h4 className={`text-[16px] font-bold tracking-tight ${isIssue ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                          {flow.chapter}
                        </h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onTimestampClick) onTimestampClick(flow.start_timestamp);
                          }}
                          onMouseEnter={(e) => showPreview(flow.start_timestamp, e as any)}
                          onMouseLeave={hidePreview}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase shadow-sm cursor-pointer hover:scale-105 transition-transform
                          ${isIssue ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white text-[var(--muted)] border border-[var(--border)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]'}`}
                        >
                          {flow.start_timestamp} {flow.end_timestamp ? `→ ${flow.end_timestamp}` : ''}
                        </button>
                      </div>
                      <p className="text-[14px] text-[var(--muted)] leading-relaxed">{flow.summary}</p>
                      {isIssue && (
                        <div className="mt-4 flex gap-2 items-start bg-red-50 p-3.5 rounded-lg border border-red-100">
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Issue Identified</p>
                            <p className="text-[13px] text-red-800 leading-relaxed">{flow.issue}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { OogwayPulse as Tier1Review };
