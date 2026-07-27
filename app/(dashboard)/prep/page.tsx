"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Award,
  RefreshCw,
  Brain,
  Lightbulb,
  Users,
  HelpCircle,
  TrendingUp,
  Zap,
  UserCheck,
  CheckCircle,
  BookOpen,
  FileText,
  History,
  Loader2,
} from "lucide-react";
import {
  ProactiveSessionIntelligence,
  ProactiveBatchIntelligence,
} from "@/lib/server/expert-prep-intelligence";

interface CourseOption { id: string; name: string }
interface BatchOption { id: string; name: string; courseId: string | null }
interface ModuleOption { id: string; name: string; courseId: string }
interface SessionOption {
  id: string;
  name: string;
  moduleId: string;
  weekOrder: number | null;
  phase: string | null;
  sessionType: string | null;
  expertType: string | null;
  duration: number | null;
  linkContent: string | null;
  linkCharter: string | null;
  linkModelSolution: string | null;
  linkTest: string | null;
  linkEvalParams: string | null;
  expertBrief: string | null;
  prerequisites: string | null;
  module: { id: string; name: string; courseId: string; course: { id: string; name: string } };
}

export default function ExpertPrepPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [allSessions, setAllSessions] = useState<SessionOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(false);

  // ── Cascading Selection State ──
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  // ── Loaded Intelligence Payload ──
  const [sessionIntel, setSessionIntel] = useState<ProactiveSessionIntelligence | null>(null);
  const [batchIntel, setBatchIntel] = useState<ProactiveBatchIntelligence | null>(null);

  // Load initial dropdown options
  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/session-notes").then((r) => r.json()),
    ])
      .then(([cData, bData, sData]) => {
        const validCourses = Array.isArray(cData) ? cData : [];
        const validBatches = Array.isArray(bData) ? bData : [];
        const validSessions = Array.isArray(sData) ? sData : [];

        setCourses(validCourses);
        setBatches(validBatches);
        setAllSessions(validSessions);

        if (validCourses.length > 0) {
          const firstCourse = validCourses[0];
          setSelectedCourseId(firstCourse.id);
          const courseBatches = validBatches.filter((b) => b.courseId === firstCourse.id);
          if (courseBatches.length > 0) setSelectedBatchId(courseBatches[0].id);

          const courseSessions = validSessions.filter((s) => s.module?.courseId === firstCourse.id);
          if (courseSessions.length > 0) {
            setSelectedModuleId(courseSessions[0].moduleId);
            setSelectedSessionId(courseSessions[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to load options:", err))
      .finally(() => setLoading(false));
  }, []);

  // Cascading Filter: Modules based on Selected Course
  const availableModules = useMemo(() => {
    const modulesMap = new Map<string, ModuleOption>();
    allSessions.forEach((s) => {
      if (s.module && (!selectedCourseId || s.module.courseId === selectedCourseId)) {
        modulesMap.set(s.module.id, {
          id: s.module.id,
          name: s.module.name,
          courseId: s.module.courseId,
        });
      }
    });
    return Array.from(modulesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSessions, selectedCourseId]);

  // Cascading Filter: Sessions based on Selected Module
  const availableSessions = useMemo(() => {
    return allSessions.filter((s) => {
      if (selectedModuleId && s.moduleId !== selectedModuleId) return false;
      if (selectedCourseId && s.module?.courseId !== selectedCourseId) return false;
      return true;
    });
  }, [allSessions, selectedCourseId, selectedModuleId]);

  // Cascading Filter: Batches based on Selected Course
  const availableBatches = useMemo(() => {
    if (!selectedCourseId) return batches;
    return batches.filter((b) => !b.courseId || b.courseId === selectedCourseId);
  }, [batches, selectedCourseId]);

  // AUTO-FETCH FAST AI INSIGHTS (< 2-3 seconds)
  const handleLoadIntelligence = async (sessId: string, bId: string) => {
    if (!sessId && !bId) return;
    setIntelLoading(true);

    try {
      const params = new URLSearchParams();
      if (sessId) params.set("sessionNoteId", sessId);
      if (bId) params.set("batchId", bId);

      const res = await fetch(`/api/prep/proactive?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSessionIntel(data.sessionIntel);
        setBatchIntel(data.batchIntel);
      }
    } catch (err) {
      console.error("Failed to fetch proactive intelligence:", err);
    } finally {
      setIntelLoading(false);
    }
  };

  // Trigger intelligence on initial load or explicit button press
  useEffect(() => {
    if ((selectedSessionId || selectedBatchId) && !sessionIntel && !batchIntel) {
      handleLoadIntelligence(selectedSessionId, selectedBatchId);
    }
  }, []);

  const activeSession = allSessions.find((s) => s.id === selectedSessionId);
  const activeBatch = batches.find((b) => b.id === selectedBatchId);

  const deliveryCount = sessionIntel?.historicalSessionCount ?? 1;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-4 space-y-4 animate-in fade-in duration-300">
      
      {/* ── HEADER TITLE BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#E8A020] shadow-2xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight leading-none">
              Proactive Expert Prep Cockpit
            </h1>
            <p className="text-xs text-[var(--muted)] font-medium mt-1">
              Sequence-based Cohort Progress &amp; Fast Proactive AI Intelligence
            </p>
          </div>
        </div>

        {activeSession && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-[#E8A020]" />
            <span className="truncate max-w-xs">{activeSession.module?.course?.name || "Curriculum"}</span>
          </div>
        )}
      </div>

      {/* ── SELECTION CONTROL CARD WITH START ANALYSIS BUTTON ── */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--border)] bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#E8A020]" /> Select Session &amp; Cohort Parameters
          </span>
          {intelLoading && (
            <span className="text-xs font-bold text-[#E8A020] flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating AI Prep Intelligence...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* 1. Course */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              1. Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedCourseId(cId);
                setSelectedModuleId("");
                setSelectedSessionId("");
              }}
              className="w-full liquid-input py-2.5 px-3 text-xs font-bold shadow-2xs"
            >
              <option value="">Select Course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Module */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              2. Module
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => {
                const mId = e.target.value;
                setSelectedModuleId(mId);
                const modSessions = allSessions.filter((s) => s.moduleId === mId);
                if (modSessions.length > 0) setSelectedSessionId(modSessions[0].id);
              }}
              className="w-full liquid-input py-2.5 px-3 text-xs font-bold shadow-2xs"
            >
              <option value="">Select Module...</option>
              {availableModules.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Session */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              3. Session Template
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full liquid-input py-2.5 px-3 text-xs font-bold shadow-2xs truncate"
            >
              <option value="">Select Session...</option>
              {availableSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.phase ? `[${s.phase}] ` : ""}{s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Batch */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              4. Batch / Cohort
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full liquid-input py-2.5 px-3 text-xs font-bold shadow-2xs"
            >
              <option value="">Select Batch...</option>
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* 5. START ANALYSIS ACTION BUTTON */}
          <div>
            <button
              onClick={() => handleLoadIntelligence(selectedSessionId, selectedBatchId)}
              disabled={intelLoading || (!selectedSessionId && !selectedBatchId)}
              className="w-full btn-primary py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#E8A020]/20 disabled:opacity-50 cursor-pointer transition-all hover:scale-[1.02]"
            >
              {intelLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-slate-900" /> Start AI Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN SIDE-BY-SIDE SINGLE-SCREEN COCKPIT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        
        {/* ── LEFT COLUMN: SECTION 1 — ABOUT THE SESSION ── */}
        <div className="space-y-4">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between bg-white border border-[var(--border)] px-4 py-2.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#E8A020]" />
              <span className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider">
                Section 1: About the Session
              </span>
            </div>
            {activeSession?.duration && (
              <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--layer-2)] px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#E8A020]" /> {activeSession.duration}m
              </span>
            )}
          </div>

          {/* Session Overview & Sheet Resource Links */}
          <div className="glass-card p-4 rounded-2xl border border-[var(--border)] space-y-3 bg-white shadow-sm">
            <h3 className="text-base font-black text-[var(--foreground)] tracking-tight leading-snug">
              {activeSession?.name || "Select a session from the top bar"}
            </h3>

            {/* Quick Resource Link Chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border)]">
              {activeSession?.linkContent && (
                <a
                  href={activeSession.linkContent}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-extrabold hover:bg-amber-600 shadow-sm"
                >
                  <Presentation className="w-3.5 h-3.5" /> Slides ↗
                </a>
              )}
              {activeSession?.linkCharter && (
                <a
                  href={activeSession.linkCharter}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold hover:bg-emerald-700 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Charter ↗
                </a>
              )}
              {activeSession?.linkModelSolution && (
                <a
                  href={activeSession.linkModelSolution}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-extrabold hover:bg-blue-700 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Solution ↗
                </a>
              )}
              {activeSession?.linkTest && (
                <a
                  href={activeSession.linkTest}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-extrabold hover:bg-purple-700 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5" /> MCQ Test ↗
                </a>
              )}
            </div>

            {/* Acad Expert Brief (FULL WIDTH, CLEAN SCROLLABLE) */}
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5 w-full">
                <span className="font-extrabold text-amber-950 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-700" /> Acad Expert Brief
                </span>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1 text-amber-950 font-medium text-[11px] leading-relaxed">
                  {activeSession?.expertBrief ? (
                    activeSession.expertBrief.split('\n').map((line, idx) => (
                      <p key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{line}</span>
                      </p>
                    ))
                  ) : (
                    <p className="text-amber-800 italic">No special expert brief recorded for this session.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC CARD: How this session went in the past (Analyzed from N past deliveries) */}
          <div className="glass-card p-4 rounded-2xl border border-[var(--border)] bg-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#E8A020]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
                  How this session went in the past
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8A020]/15 text-[#E8A020] text-[10px] font-extrabold border border-[#E8A020]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Analyzed from {deliveryCount} past {deliveryCount === 1 ? 'delivery' : 'deliveries'}
              </span>
            </div>

            {intelLoading ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#E8A020] mx-auto" />
                <p className="text-xs font-bold text-[var(--muted)]">Synthesizing past session analysis (&lt;3s)...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {/* 1. Student Difficulty Topics */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Major Student Difficulty Topics
                  </span>
                  {sessionIntel?.majorStudentDifficultyTopics?.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-rose-950 text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {item.topic}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[8px] font-black uppercase tracking-wider">
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--foreground)] font-medium leading-relaxed pl-3">
                        👉 {item.historical_context}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 2. Best Proven Analogies */}
                <div className="space-y-2 pt-2.5 border-t border-[var(--border)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Best Proven Analogies To Use Live
                  </span>
                  {sessionIntel?.bestAnalogiesToUse?.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5">
                      <span className="font-extrabold text-emerald-950 text-[11px] uppercase block">
                        🎯 Target Concept: {item.concept}
                      </span>
                      <p className="font-bold text-[var(--foreground)] text-[11px] italic bg-white p-2.5 rounded-lg border border-emerald-200 leading-relaxed shadow-2xs">
                        "{item.analogy}"
                      </p>
                      <p className="text-[10px] font-medium text-emerald-800 pl-1">
                        💡 <strong className="font-bold">Why it works:</strong> {item.why_it_works}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: SECTION 2 — ABOUT THE BATCH / COHORT ── */}
        <div className="space-y-4">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between bg-white border border-[var(--border)] px-4 py-2.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E8A020]" />
              <span className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider">
                Section 2: About the Batch / Cohort
              </span>
            </div>
            <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--layer-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
              {activeBatch?.name || "Selected Batch"}
            </span>
          </div>

          {/* DETERMINISTIC COHORT STANDING (CLEAN COMPACT POINTER FORMAT - NO WALL OF TEXT) */}
          <div className="glass-card p-4 rounded-2xl border border-[var(--border)] bg-white space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#E8A020]" /> Cohort Curriculum Sequence Standing
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                0ms Instant Sequence
              </span>
            </div>

            {/* POINTER 1: Currently Learning Module */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-[#E8A020]/15 border border-[#E8A020]/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#E8A020]" /> Currently Learning Module
                </span>
                {batchIntel?.totalSessionsInCurrentModule && batchIntel.totalSessionsInCurrentModule > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8A020] text-white text-[10px] font-black shadow-2xs">
                    {batchIntel.completedSessionsCount} / {batchIntel.totalSessionsInCurrentModule} Sessions Completed
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-black text-amber-950">
                {batchIntel?.currentModuleName || "Active Curriculum Module"}
              </p>
            </div>

            {/* POINTER 2: Most Recent Completed Session */}
            {batchIntel?.mostRecentSession && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                    Most Recent Session Completed
                  </span>
                  <p className="text-xs font-black text-emerald-950 truncate">
                    "{batchIntel.mostRecentSession}"
                  </p>
                </div>
              </div>
            )}

            {/* POINTER 3: Completed Modules Roadmap Badges (DEDUPLICATED & STRICTLY PRIOR) */}
            <div className="space-y-2 pt-1 border-t border-[var(--border)]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--muted)] block">
                Completed Modules Roadmap Prior to Current Topic
              </span>
              {batchIntel?.completedModulesList && batchIntel.completedModulesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {batchIntel.completedModulesList.map((modName, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> {modName}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--muted)] italic">First module in curriculum schedule.</p>
              )}
            </div>
          </div>

          {/* AI Cohort Engagement Dynamics */}
          <div className="glass-card p-4 rounded-2xl border border-[var(--border)] bg-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#E8A020]" /> Cohort Engagement Dynamics
              </span>
              <span className="text-[10px] font-bold text-[var(--muted)] font-mono">
                {intelLoading ? "Analyzing..." : `${batchIntel?.historicalSessionCount ?? 1} Cohort Logs`}
              </span>
            </div>

            {intelLoading ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#E8A020] mx-auto" />
                <p className="text-xs font-bold text-[var(--muted)]">Analyzing Cohort Dynamics (&lt;2s)...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {/* Engagement Bottlenecks */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Engagement Bottlenecks
                  </span>
                  {batchIntel?.engagementBottlenecks?.map((b, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                      <p className="font-bold text-rose-950 text-[11px]">⚠️ {b.issue}</p>
                      <p className="text-[10px] text-[var(--foreground)] font-medium mt-0.5 pl-3">{b.impact}</p>
                    </div>
                  ))}
                </div>

                {/* Engagement Drivers */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Proven Engagement Drivers
                  </span>
                  {batchIntel?.engagementDrivers?.map((d, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <p className="font-bold text-emerald-950 text-[11px]">⚡ {d.driver}</p>
                      <p className="text-[10px] text-emerald-900 font-medium mt-0.5 pl-3">👉 {d.recommendation}</p>
                    </div>
                  ))}
                </div>

                {/* Top Engaged Students */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Top Engaged Student Catalysts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {batchIntel?.topEngagedStudents?.map((name, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 text-[10px] font-bold shadow-2xs">
                        ⭐ {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
