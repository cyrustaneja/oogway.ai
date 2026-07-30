"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tier1Review } from '@/components/analysis/Tier1Review';
import { AskOogwayChat } from '@/components/analysis/AskOogwayChat';
import { OogwayGoReview } from '@/components/analysis/OogwayGoReview';
import { StudentGoReview } from '@/components/analysis/StudentGoReview';
import { SessionTimeline } from '@/components/analysis/tier1/SessionTimeline';
import { VideoPreviewProvider } from '@/components/analysis/VideoPreviewContext';
import { AnalysisHeader } from '@/components/analysis/sections';
import { FileText, Zap, Video, Clock, Target, Copy, Check, Download, X, MessageCircle, Sparkles, GraduationCap } from "lucide-react";

const TABS = [
  { id: 'timeline',       label: 'Timeline',     subtitle: 'Milestones', icon: Clock },
  { id: 'first_analysis', label: 'Oogway Pulse', subtitle: 'Session overview', icon: Zap },
  { id: 'expert_go',      label: 'Expert Go',    subtitle: 'Deep expert audit', icon: Target },
  { id: 'student_go',     label: 'Student Go',   subtitle: 'Batch & doubts audit', icon: GraduationCap },
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
            {/* Left: Progressive Tabs (Timeline -> Pulse -> Expert Go -> Student Go) */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--layer-2)] border border-[var(--border)] shadow-inner overflow-x-auto scrollbar-hide flex-shrink min-w-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                // Distinct theme progression:
                // Timeline -> Dark Slate
                // Oogway Pulse -> Amber Yellow
                // Expert Go -> Deep Gold / Orange
                // Student Go -> Electric Blue / Indigo
                let styleClass = '';
                if (tab.id === 'timeline') {
                  styleClass = isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200';
                } else if (tab.id === 'first_analysis') {
                  styleClass = isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md border border-amber-500'
                    : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-amber-300/60 font-medium';
                } else if (tab.id === 'expert_go') {
                  styleClass = isActive
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-black shadow-lg border border-orange-400 scale-[1.02]'
                    : 'bg-amber-200/90 text-amber-950 hover:bg-amber-300 border border-amber-400 font-bold';
                } else if (tab.id === 'student_go') {
                  styleClass = isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-black shadow-lg border border-blue-400 scale-[1.02]'
                    : 'bg-blue-100/90 text-blue-950 hover:bg-blue-200 border border-blue-300 font-bold';
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

            {/* Persistent DOM Mounting for Expert Go & Student Go so progress & background tasks persist across tab switches */}
            <div className={activeTab === 'expert_go' ? 'block' : 'hidden'}>
              <OogwayGoReview sessionId={sessionId} sessionData={data} onTimestampClick={handleTimestampClick} />
            </div>

            <div className={activeTab === 'student_go' ? 'block' : 'hidden'}>
              <StudentGoReview sessionId={sessionId} sessionData={data} onTimestampClick={handleTimestampClick} />
            </div>
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
                      <div className="aspect-video bg-black relative">
                        <video
                          ref={videoRef}
                          src={data.videoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-sm font-medium">
                      No video URL provided for this session. Reviewing raw transcript text below.
                    </div>
                  )}

                  {/* Transcript Viewer */}
                  <div className="ks-card p-5 space-y-3 border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4.5 h-4.5 text-amber-500" />
                        <h4 className="text-sm font-bold text-slate-900">Session Transcript (.vtt)</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyTranscript}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={handleDownloadTranscript}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-orange-400" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {transcriptText || 'No transcript text available.'}
                    </pre>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── FLOATING CHATBOT WIDGET (Ask Master Oogway) ── */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="mb-4 w-[380px] sm:w-[420px] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 text-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                      🐢
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-wide">Ask Master Oogway</h4>
                      <p className="text-[10px] text-amber-300 font-medium">Session Intelligence Assistant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-hidden p-3 bg-slate-50">
                  <AskOogwayChat sessionId={sessionId} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white font-extrabold text-xs shadow-2xl hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-500/40"
          >
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">
              🐢
            </div>
            <span>{isChatOpen ? 'Close Oogway' : 'Ask Master Oogway 💬'}</span>
          </button>
        </div>
      </div>
    </VideoPreviewProvider>
  );
}
