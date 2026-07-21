"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AnalysisHeader,
  FlagBanner,
  KeyLearningPoints,
  SessionFlow,
  ContextSettingCard,
  TopicCoverageCard,
  ExpertStudentToggle,
} from '@/components/analysis/sections';
import { CoachingTipsPanel } from '@/components/analysis/CoachingTipsPanel';
import { Tier1Review } from '@/components/analysis/Tier1Review';
import { AskOogwayChat } from '@/components/analysis/AskOogwayChat';
import { VideoPreviewProvider } from '@/components/analysis/VideoPreviewContext';
import {
  Zap, MessageCircle, Video, FileText, Play, Loader2,
  Lock, X, BarChart2,
} from 'lucide-react';

const TABS = [
  { id: 'first_analysis', label: 'Pulse', icon: Zap },
  { id: 'ask_oogway',    label: 'Ask Oogway', icon: MessageCircle },
  { id: 'source_material', label: 'Source', icon: Video },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SessionTabs({ data, sessionId, chapters, sessionInfo }: any) {
  const [activeTab, setActiveTab] = useState<TabId>('first_analysis');
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [showDeepModal, setShowDeepModal] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Deep Analysis state
  const isLocked = data?.pipeline_stage === 'WAITING_FOR_DEEP_ANALYSIS';
  const [deepAnalysisRunning, setDeepAnalysisRunning] = useState(false);
  const [deepAnalysisUnlocked, setDeepAnalysisUnlocked] = useState(!isLocked);

  React.useEffect(() => {
    if (activeTab === 'source_material' && seekTime !== null) {
      const timer = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          videoRef.current.currentTime = seekTime;
          videoRef.current.play().catch(() => {});
          setSeekTime(null);
          clearInterval(timer);
        }
      }, 100);
      const timeout = setTimeout(() => clearInterval(timer), 5000);
      return () => { clearInterval(timer); clearTimeout(timeout); };
    }
  }, [activeTab, seekTime]);

  const handleTimestampClick = (timeStr: string) => {
    const cleanTime = timeStr.trim();
    const parts = cleanTime.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    setSeekTime(seconds);
    setActiveTab('source_material');
  };

  const handleRunDeepAnalysis = async () => {
    setDeepAnalysisRunning(true);
    try {
      const res = await fetch(`/api/analysis/${sessionId}/run-deep`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger deep analysis');
      setTimeout(() => {
        setDeepAnalysisRunning(false);
        setDeepAnalysisUnlocked(true);
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error(err);
      setDeepAnalysisRunning(false);
    }
  };

  return (
    <VideoPreviewProvider videoUrl={data.videoUrl} onNavigate={handleTimestampClick}>
      <div className="w-full">
        <AnalysisHeader
          data={data}
          sessionId={sessionId}
          sessionInfo={sessionInfo}
          chapters={chapters}
          activeTab={activeTab}
        />

        {/* ── Tab bar ── sticky, horizontally scrollable on mobile */}
        <div className="sticky top-[72px] sm:top-[80px] z-20 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] pt-3 pb-3">
          <div className="flex items-center justify-between gap-2 px-4 max-w-5xl mx-auto">
            {/* Left: tabs */}
            <div className="flex items-center gap-1 bg-[var(--layer-2)] p-1 rounded-full border border-[var(--border)] shadow-inner overflow-x-auto scrollbar-hide flex-shrink min-w-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-full whitespace-nowrap flex items-center gap-1.5 ${
                      isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
                      />
                    )}
                    <Icon className="relative z-10 w-3.5 h-3.5" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Deep Analysis Action Button */}
            <button
              onClick={() => {
                if (!deepAnalysisUnlocked && !deepAnalysisRunning) {
                  handleRunDeepAnalysis();
                }
                setShowDeepModal(true);
              }}
              disabled={deepAnalysisRunning}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold border border-brand-orange/40 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 hover:from-orange-100 hover:to-amber-100 text-brand-orange transition-all shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
            >
              {deepAnalysisRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-orange" />
              ) : (
                <BarChart2 className="w-3.5 h-3.5 text-brand-orange" />
              )}
              <span className="hidden sm:inline">{deepAnalysisRunning ? "Running Deep Analysis..." : "Deep Analysis"}</span>
              <span className="sm:hidden">{deepAnalysisRunning ? "Running..." : "Deep Analysis"}</span>
            </button>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="px-3 sm:px-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'first_analysis' && (
              <motion.div
                key="first_analysis"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Tier1Review data={data} sessionId={sessionId} onTimestampClick={handleTimestampClick} />
              </motion.div>
            )}

            {activeTab === 'ask_oogway' && (
              <motion.div
                key="ask_oogway"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto mt-4"
              >
                <div className="mb-4 text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">Ask Master Oogway</h2>
                  <p className="text-sm text-[var(--muted)] mt-1">Have a specific question about this session? Ask away.</p>
                </div>
                <div className="ks-card overflow-hidden">
                  <AskOogwayChat sessionId={sessionId} />
                </div>
              </motion.div>
            )}

            {activeTab === 'source_material' && (
              <motion.div
                key="source_material"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 mt-6 max-w-4xl mx-auto"
              >
                {data.videoUrl ? (
                  <div className="ks-card overflow-hidden">
                    <div className="bg-[var(--layer-2)] border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-2">
                      <Video className="w-4 h-4 text-brand-orange" />
                      <h3 className="text-sm font-bold text-[var(--foreground)]">Session Recording</h3>
                    </div>
                    <div className="aspect-video w-full bg-black">
                      <video
                        src={data.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                        ref={videoRef}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="ks-card p-8 flex flex-col items-center justify-center text-center">
                    <Video className="w-10 h-10 text-[var(--muted)] mb-3 opacity-40" />
                    <h4 className="font-bold text-[var(--foreground)]">No Video Provided</h4>
                    <p className="text-sm text-[var(--muted)] mt-1">A video link was not attached to this session.</p>
                  </div>
                )}

                {data.transcriptUrl ? (
                  <div className="ks-card overflow-hidden">
                    <div className="bg-[var(--layer-2)] border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-orange" />
                        <h3 className="text-sm font-bold text-[var(--foreground)]">Transcript (VTT)</h3>
                      </div>
                      <a
                        href={data.transcriptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-orange hover:underline"
                      >
                        Open raw file ↗
                      </a>
                    </div>
                    <div className="p-5 bg-[var(--inner-bg)]">
                      <p className="text-sm text-[var(--muted)]">
                        The transcript is stored as a VTT file. Use the link above to view the raw file, or ask Oogway questions about its content.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="ks-card p-8 flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-[var(--muted)] mb-3 opacity-40" />
                    <h4 className="font-bold text-[var(--foreground)]">No Transcript Link</h4>
                    <p className="text-sm text-[var(--muted)] mt-1">No VTT transcript URL was attached to this session.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Deep Analysis Modal / Slide-over ── */}
      <AnimatePresence>
        {showDeepModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeepModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel — bottom sheet on mobile, centered modal on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-5xl max-h-[92dvh] overflow-y-auto bg-[var(--background)] sm:rounded-2xl rounded-t-2xl border border-[var(--border)] shadow-2xl"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-xl border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-orange/10 border border-brand-orange/20">
                    <BarChart2 className="w-4 h-4 text-brand-orange" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--foreground)]">Deep Analysis</h2>
                    <p className="text-[11px] text-[var(--muted)]">Chapter-by-chapter pedagogical breakdown</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeepModal(false)}
                  className="p-2 rounded-full hover:bg-[var(--layer-2)] text-[var(--muted)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-5 sm:p-8 space-y-8">
                {!deepAnalysisUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center border border-brand-orange/20 mb-5 relative shadow-sm">
                      <BarChart2 className="w-8 h-8 text-brand-orange" />
                      {deepAnalysisRunning && (
                        <div className="absolute inset-0 border-2 border-brand-orange rounded-2xl border-t-transparent animate-spin" />
                      )}
                    </div>
                    <h3 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight mb-2">
                      Deep Analysis Not Started
                    </h3>
                    <p className="text-[13px] text-[var(--muted)] text-center mb-8 font-medium leading-relaxed">
                      Oogway Pulse has evaluated this session. Click below to trigger deep chapter-by-chapter extraction, full pedagogical rubric scoring, and coaching tips.
                    </p>
                    <button
                      onClick={handleRunDeepAnalysis}
                      disabled={deepAnalysisRunning}
                      className="btn-primary flex items-center gap-2.5 px-8 py-3.5 text-sm font-extrabold tracking-wide shadow-xl shadow-brand-orange/20 disabled:opacity-50 hover:scale-105 transition-all"
                    >
                      {deepAnalysisRunning ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Starting Deep Analysis...</>
                      ) : (
                        <><Play className="w-4 h-4 fill-current" /> Run Deep Analysis Now</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <FlagBanner data={data} chapters={chapters} />
                    <SessionFlow chapters={chapters} data={data} sessionInfo={sessionInfo} onTimestampClick={handleTimestampClick} />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-4 px-1">
                        Detailed Breakdown
                      </p>
                      <div className="space-y-6">
                        <KeyLearningPoints data={data} />
                        <ContextSettingCard data={data} onTimestampClick={handleTimestampClick} />
                        <TopicCoverageCard data={data} />
                      </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-[var(--border)] flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[var(--foreground)]">Expert &amp; Student Deep Dive</h3>
                      <button
                        onClick={handleRunDeepAnalysis}
                        disabled={deepAnalysisRunning}
                        className="px-4 py-2 bg-[var(--layer-2)] border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--border)] transition-colors flex items-center gap-2"
                      >
                        {deepAnalysisRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Re-run
                      </button>
                    </div>
                    <div>
                      <ExpertStudentToggle data={data} onTimestampClick={handleTimestampClick} />
                    </div>

                    <div className="pt-8 mt-8 border-t border-[var(--border)]">
                      <h3 className="text-xl font-bold text-[var(--foreground)] mb-6">AI Recommendations</h3>
                      <CoachingTipsPanel sessionId={sessionId} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </VideoPreviewProvider>
  );
}
