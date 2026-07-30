"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AnalysisHeader,
} from '@/components/analysis/sections';
import { Tier1Review } from '@/components/analysis/Tier1Review';
import { AskOogwayChat } from '@/components/analysis/AskOogwayChat';
import { OogwayGoReview } from '@/components/analysis/OogwayGoReview';
import { SessionTimeline } from '@/components/analysis/tier1/SessionTimeline';
import { VideoPreviewProvider } from '@/components/analysis/VideoPreviewContext';
import { FileText, Zap, MessageCircle, Video, Clock, Target, X, Sparkles } from "lucide-react";

const TABS = [
  { id: 'timeline',       label: 'Timeline',     step: 'Step 1', icon: Clock },
  { id: 'first_analysis', label: 'Oogway Pulse', step: 'Step 2', icon: Zap },
  { id: 'oogway_go',      label: 'Oogway Go',    step: 'Step 3', icon: Target },
  { id: 'source_material', label: 'Source',       step: '',       icon: Video },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SessionTabs({ data, sessionId, chapters, sessionInfo }: any) {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

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

  // Extract session_flow for the Timeline tab
  const sessionFlow = data?.session_flow ?? data?.tier1_result?.session_flow ?? [];

  return (
    <VideoPreviewProvider videoUrl={data.videoUrl} onNavigate={handleTimestampClick}>
      <div className="w-full relative">
        <AnalysisHeader
          data={data}
          sessionId={sessionId}
          sessionInfo={sessionInfo}
          chapters={chapters}
          activeTab={activeTab}
          onOpenSource={() => setActiveTab('source_material')}
        />

        {/* ── Progressive 3-Step Tab Bar ── */}
        <div className="sticky top-[72px] sm:top-[80px] z-20 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] pt-3 pb-3">
          <div className="flex items-center justify-between gap-2 px-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--layer-2)] border border-[var(--border)] shadow-inner overflow-x-auto scrollbar-hide flex-shrink min-w-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                // Color coding per step: Step 1 Lightest, Step 2 Medium Yellow, Step 3 Deep Orange/Gold
                let styleClass = '';
                if (tab.id === 'timeline') {
                  styleClass = isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200';
                } else if (tab.id === 'first_analysis') {
                  styleClass = isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md border border-amber-500'
                    : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-amber-300/60 font-medium';
                } else if (tab.id === 'oogway_go') {
                  styleClass = isActive
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-black shadow-lg border border-orange-400 scale-[1.02]'
                    : 'bg-amber-200/90 text-amber-950 hover:bg-amber-300 border border-amber-400 font-bold';
                } else {
                  styleClass = isActive
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200';
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`relative px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all rounded-xl whitespace-nowrap flex items-center gap-2 active:scale-95 cursor-pointer ${styleClass}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.step && (
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold opacity-90 ${
                        isActive ? 'bg-black/20 text-white' : 'bg-black/10 text-current'
                      }`}>
                        {tab.step}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Chatbox Toggle Button in Header */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask Oogway</span>
            </button>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="px-3 sm:px-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto mt-4"
              >
                <div className="mb-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider mb-2">
                    Step 1 • Milestone Overview
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">Session Flow Timeline</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">Chronological chapters and key milestones across the entire session.</p>
                </div>
                {sessionFlow.length > 0 ? (
                  <SessionTimeline sessionFlow={sessionFlow} onTimestampClick={handleTimestampClick} />
                ) : (
                  <div className="ks-card p-8 flex flex-col items-center justify-center text-center">
                    <Clock className="w-10 h-10 text-[var(--muted)] mb-3 opacity-40" />
                    <h4 className="font-bold text-[var(--foreground)]">No Timeline Data</h4>
                    <p className="text-sm text-[var(--muted)] mt-1">Session flow timeline will appear after analysis completes.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'first_analysis' && (
              <motion.div
                key="first_analysis"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="max-w-3xl mx-auto mt-4 mb-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
                    Step 2 • Instant Session Analysis
                  </span>
                </div>
                <Tier1Review data={data} sessionId={sessionId} onTimestampClick={handleTimestampClick} />
              </motion.div>
            )}

            {activeTab === 'oogway_go' && (
              <motion.div
                key="oogway_go"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <OogwayGoReview sessionId={sessionId} onTimestampClick={handleTimestampClick} />
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

        {/* ── Fixed Floating Chatbox Widget (Ask Oogway) ── */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-[90vw] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-3 flex flex-col"
              >
                {/* Chatbox Header */}
                <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">Ask Master Oogway</h4>
                      <p className="text-[10px] text-purple-200">Session AI Assistant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white/80 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chatbox Body */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                  <AskOogwayChat sessionId={sessionId} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Launcher Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-xs shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-purple-400/40"
          >
            <MessageCircle className="w-4 h-4 text-amber-300" />
            <span>{isChatOpen ? 'Close Chat' : 'Ask Oogway'}</span>
            {!isChatOpen && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </motion.button>
        </div>
      </div>
    </VideoPreviewProvider>
  );
}
