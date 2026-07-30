"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tier1Review } from '@/components/analysis/Tier1Review';
import { AskOogwayChat } from '@/components/analysis/AskOogwayChat';
import { OogwayGoReview } from '@/components/analysis/OogwayGoReview';
import { SessionTimeline } from '@/components/analysis/tier1/SessionTimeline';
import { VideoPreviewProvider } from '@/components/analysis/VideoPreviewContext';
import { AnalysisHeader } from '@/components/analysis/sections';
import { FileText, Zap, Video, Clock, Target, Copy, Check, Download, X, MessageCircle, Sparkles } from "lucide-react";

const TABS = [
  { id: 'timeline',       label: 'Timeline',     subtitle: 'Milestones', icon: Clock },
  { id: 'first_analysis', label: 'Oogway Pulse', subtitle: 'Instant overview of entire session', icon: Zap },
  { id: 'oogway_go',      label: 'Oogway Go',    subtitle: 'Deep expert audit', icon: Target },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SessionTabs({ data, sessionId, chapters, sessionInfo }: any) {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [showSourceDrawer, setShowSourceDrawer] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (showSourceDrawer && seekTime !== null) {
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
  }, [showSourceDrawer, seekTime]);

  const handleTimestampClick = (timeStr: string) => {
    const cleanTime = timeStr.trim();
    const parts = cleanTime.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    setSeekTime(seconds);
    setShowSourceDrawer(true);
  };

  const handleCopyTranscript = async () => {
    const text = data.transcriptText || '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleDownloadTranscript = () => {
    const text = data.transcriptText || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(sessionInfo?.name || 'transcript').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Extract session_flow for the Timeline tab
  const sessionFlow = data?.session_flow ?? data?.tier1_result?.session_flow ?? [];
  const transcriptText = data?.transcriptText || data?.transcript_clean || data?.transcriptRaw || '';

  return (
    <VideoPreviewProvider videoUrl={data.videoUrl} onNavigate={handleTimestampClick}>
      <div className="w-full relative">
        <AnalysisHeader
          data={data}
          sessionId={sessionId}
          sessionInfo={sessionInfo}
          chapters={chapters}
          activeTab={activeTab}
        />

        {/* ── Sticky Tab Bar with Sticky View Source Button on Right ── */}
        <div className="sticky top-[72px] sm:top-[80px] z-20 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] pt-3 pb-3">
          <div className="flex items-center justify-between gap-2 px-4 max-w-5xl mx-auto">
            {/* Left: Progressive Tabs (Timeline -> Pulse -> Oogway Go) */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--layer-2)] border border-[var(--border)] shadow-inner overflow-x-auto scrollbar-hide flex-shrink min-w-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                // Color progression: Lightest Slate -> Medium Yellow -> Deep Gold/Orange
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
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`relative px-3.5 sm:px-5 py-1.5 transition-all rounded-xl whitespace-nowrap flex flex-col items-start justify-center active:scale-95 cursor-pointer ${styleClass}`}
                  >
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </div>
                    <span className="text-[9px] font-medium opacity-75 leading-none mt-0.5">{tab.subtitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Single Sticky "View Source" Button */}
            <button
              onClick={() => setShowSourceDrawer(!showSourceDrawer)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-700"
            >
              <Video className="w-4 h-4 text-orange-400" />
              <span>{showSourceDrawer ? 'Close Source' : 'View Source'}</span>
            </button>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="px-3 sm:px-4 pb-12">
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
                <OogwayGoReview sessionId={sessionId} sessionData={data} onTimestampClick={handleTimestampClick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Source Modal / Drawer (Triggered by sticky View Source button) ── */}
        <AnimatePresence>
          {showSourceDrawer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold">Session Source Material</h3>
                  </div>
                  <button
                    onClick={() => setShowSourceDrawer(false)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                  {data.videoUrl ? (
                    <div className="ks-card overflow-hidden">
                      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                        <Video className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-bold text-slate-800">Session Recording</h4>
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
                    <div className="ks-card p-6 text-center text-slate-500">
                      <p className="text-sm font-medium">No direct video URL attached to this session.</p>
                    </div>
                  )}

                  {data.transcriptUrl && (
                    <div className="ks-card overflow-hidden">
                      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <h4 className="text-sm font-bold text-slate-800">Transcript VTT File</h4>
                        </div>
                        <a
                          href={data.transcriptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-orange-600 hover:underline"
                        >
                          Open VTT File ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {transcriptText ? (
                    <div className="ks-card overflow-hidden">
                      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <h4 className="text-sm font-bold text-slate-800">Transcript Content</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyTranscript}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{copiedTranscript ? 'Copied!' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={handleDownloadTranscript}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 max-h-80 overflow-y-auto">
                        <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                          {transcriptText}
                        </pre>
                      </div>
                    </div>
                  ) : !data.transcriptUrl && (
                    <div className="ks-card p-6 text-center text-slate-500">
                      <p className="text-sm font-medium">No transcript content available for this session.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Floating Chatbot Widget (Bottom-Right Corner) ── */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-[90vw] sm:w-[400px] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-3 flex flex-col"
              >
                {/* Chatbot Header */}
                <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-amber-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">Ask Master Oogway</h4>
                      <p className="text-[10px] text-purple-200">Session AI Chatbot</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chatbot Window Body */}
                <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
                  <AskOogwayChat sessionId={sessionId} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chatbot Trigger Bubble Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-xs shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-purple-400/40"
          >
            <MessageCircle className="w-4 h-4 text-amber-300" />
            <span>{isChatOpen ? 'Close Chatbot' : 'Ask Oogway 💬'}</span>
            {!isChatOpen && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </motion.button>
        </div>
      </div>
    </VideoPreviewProvider>
  );
}
