"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  RefreshCw,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Key,
  Award,
  Filter,
  Tag,
  FolderOpen,
  ArrowRight,
  Layers,
  Check,
  Maximize2,
  Eye,
  X,
} from "lucide-react";
import { PrepSession } from "@/lib/server/expert-prep-sync";

export default function ExpertPrepPage() {
  const [sessions, setSessions] = useState<PrepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // ── Step-by-Step Selection Wizard State ──
  const [wizardModule, setWizardModule] = useState<string>("");
  const [wizardSessionId, setWizardSessionId] = useState<string>("");
  const [activePrepPackage, setActivePrepPackage] = useState<PrepSession | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [embedTitle, setEmbedTitle] = useState<string>("");

  // ── Search & Filter State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const fetchSessions = async (force = false) => {
    if (force) setSyncing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/prep/sync${force ? "?force=true" : ""}`);
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        setLastSynced(
          new Date(data.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );

        // Auto-select first module & session as initial wizard state
        if (!wizardModule) {
          const firstMod = data.sessions[0].module;
          setWizardModule(firstMod);
          const firstSess = data.sessions.find((s: PrepSession) => s.module === firstMod);
          if (firstSess) {
            setWizardSessionId(firstSess.id);
            setActivePrepPackage(firstSess);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch prep sessions:", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Modules List
  const modules = useMemo(() => {
    const set = new Set(sessions.map((s) => s.module).filter(Boolean));
    return Array.from(set).sort();
  }, [sessions]);

  // Sub-Module Categories
  const categories = useMemo(() => {
    const set = new Set(sessions.map((s) => s.category).filter(Boolean));
    return Array.from(set).sort();
  }, [sessions]);

  // Sessions filtered for Wizard Step 2
  const wizardAvailableSessions = useMemo(() => {
    if (!wizardModule || wizardModule === "ALL") return sessions;
    return sessions.filter(
      (s) => s.module === wizardModule || s.category === wizardModule
    );
  }, [sessions, wizardModule]);

  // When wizard module changes, reset selected session to first available
  const handleWizardModuleChange = (mod: string) => {
    setWizardModule(mod);
    const available = mod === "ALL" ? sessions : sessions.filter((s) => s.module === mod || s.category === mod);
    if (available.length > 0) {
      setWizardSessionId(available[0].id);
    } else {
      setWizardSessionId("");
    }
  };

  // Click "Load Session Prep Data" button
  const handleLoadPrepData = () => {
    const found = sessions.find((s) => s.id === wizardSessionId);
    if (found) {
      setActivePrepPackage(found);
      setEmbedUrl(null);
    }
  };

  // Weeks List
  const weeks = useMemo(() => {
    const set = new Set(sessions.map((s) => s.week).filter(Boolean));
    return Array.from(set).sort();
  }, [sessions]);

  // Types List
  const types = useMemo(() => {
    const set = new Set(sessions.map((s) => s.type).filter(Boolean));
    return Array.from(set);
  }, [sessions]);

  // Filtered List for Browse View
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
      if (selectedWeek !== "all" && s.week !== selectedWeek) return false;
      if (selectedType !== "all" && s.type !== selectedType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = s.sessionName.toLowerCase().includes(q);
        const inNotes = s.pointsToNote.toLowerCase().includes(q);
        const inModule = s.module.toLowerCase().includes(q);
        const inCategory = s.category.toLowerCase().includes(q);
        const inWeek = s.week.toLowerCase().includes(q);
        const inType = s.type.toLowerCase().includes(q);
        if (!inName && !inNotes && !inModule && !inCategory && !inWeek && !inType) return false;
      }
      return true;
    });
  }, [sessions, searchQuery, selectedCategory, selectedWeek, selectedType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* ── Page Header Banner ── */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-ks-navy via-slate-900 to-ks-navy text-white rounded-3xl shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oogway Expert Prep Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-outfit leading-tight">
              Session Knowledge &amp; Prep Selector
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Select your Module and Session to instantly load Kahoot logins, slide decks, in-session charters, and model solutions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchSessions(true)}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-brand-orange" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Sheet"}</span>
            </button>
            {lastSynced && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Synced {lastSynced}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── STEP-BY-STEP PREP SELECTION WIZARD ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-brand-orange/30 bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <div className="p-2.5 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[var(--foreground)] tracking-tight">
              Select Module &amp; Session to Prep
            </h2>
            <p className="text-xs text-[var(--muted)] font-medium">
              Step 1: Choose Module ➔ Step 2: Choose Session ➔ Click button to load data
            </p>
          </div>
        </div>

        {/* Selection Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          
          {/* STEP 1: Select Module */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-extrabold flex items-center justify-center">1</span>
              <span>Select Module / Topic:</span>
            </label>
            <select
              value={wizardModule}
              onChange={(e) => handleWizardModuleChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-brand-orange/20 rounded-xl text-sm font-bold text-[var(--foreground)] focus:outline-none focus:border-brand-orange shadow-sm"
            >
              <option value="ALL">All Modules &amp; Topics</option>
              <optgroup label="Main Modules">
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m} Module
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sub-Topic Modules">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* STEP 2: Select Session */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-extrabold flex items-center justify-center">2</span>
              <span>Select Session ({wizardAvailableSessions.length} available):</span>
            </label>
            <select
              value={wizardSessionId}
              onChange={(e) => setWizardSessionId(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-brand-orange/20 rounded-xl text-sm font-bold text-[var(--foreground)] focus:outline-none focus:border-brand-orange shadow-sm truncate"
            >
              {wizardAvailableSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.week}] {s.sessionName} ({s.duration}m - {s.expertType || 'Live'})
                </option>
              ))}
            </select>
          </div>

          {/* STEP 3: Action Button */}
          <div className="md:col-span-2">
            <button
              onClick={handleLoadPrepData}
              disabled={!wizardSessionId}
              className="w-full py-3 px-4 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <span>Load Prep Data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── AUTOMATICALLY LOADED SESSION PREP DATA DISPLAY ── */}
        {activePrepPackage && (
          <div className="mt-8 pt-6 border-t-2 border-brand-orange/20 space-y-6 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-extrabold uppercase tracking-wider">
                    {activePrepPackage.week}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-ks-navy/10 border border-ks-navy/20 text-ks-navy text-[10px] font-extrabold uppercase tracking-wider">
                    {activePrepPackage.module}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wider">
                    {activePrepPackage.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                    {activePrepPackage.type}
                  </span>
                </div>

                <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">
                  {activePrepPackage.sessionName}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--layer-2)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--foreground)]">
                  <Clock className="w-4 h-4 text-brand-orange" />
                  <span>{activePrepPackage.duration} mins</span>
                </div>

                {activePrepPackage.expertType && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
                    <UserCheck className="w-4 h-4" />
                    <span>Role: {activePrepPackage.expertType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expert Prep Notes & Kahoot Box */}
            {activePrepPackage.pointsToNote && activePrepPackage.pointsToNote.trim() !== "" ? (
              <div
                className={`p-5 rounded-2xl border leading-relaxed space-y-2 ${
                  activePrepPackage.pointsToNote.toLowerCase().includes("kahoot")
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-950"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950"
                }`}
              >
                <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs">
                  {activePrepPackage.pointsToNote.toLowerCase().includes("kahoot") ? (
                    <>
                      <Key className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-800">Kahoot Login &amp; Quiz Instructions</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-800">Important Expert Prep Notes &amp; Guidelines</span>
                    </>
                  )}
                </div>
                <p className="whitespace-pre-line font-medium text-xs sm:text-sm">
                  {activePrepPackage.pointsToNote}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-[var(--muted)] italic">
                No special administrative points to note for this session. Review materials below.
              </div>
            )}

            {/* Resource Buttons & In-Platform Embedded Preview */}
            <div className="bg-white p-5 rounded-2xl border border-[var(--border)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  Session Resources &amp; Materials
                </span>
                {embedUrl && (
                  <button
                    onClick={() => setEmbedUrl(null)}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Close Embedded View
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activePrepPackage.linkContent && (
                  <div className="flex items-center gap-2">
                    <a
                      href={activePrepPackage.linkContent}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-extrabold transition-all hover:bg-orange-600 shadow-sm"
                    >
                      <Presentation className="w-4 h-4" />
                      <span>Open Slide Deck ↗</span>
                    </a>
                  </div>
                )}

                {activePrepPackage.linkCharter && (
                  <a
                    href={activePrepPackage.linkCharter}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold transition-all hover:bg-emerald-700 shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>In-Session Charter ↗</span>
                  </a>
                )}

                {activePrepPackage.linkModelSolution && (
                  <a
                    href={activePrepPackage.linkModelSolution}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold transition-all hover:bg-blue-700 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Model Solution ↗</span>
                  </a>
                )}

                {activePrepPackage.linkTest && (
                  <a
                    href={activePrepPackage.linkTest}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold transition-all hover:bg-purple-700 shadow-sm"
                  >
                    <Award className="w-4 h-4" />
                    <span>MCQ Test ↗</span>
                  </a>
                )}

                {!activePrepPackage.linkContent && !activePrepPackage.linkCharter && !activePrepPackage.linkModelSolution && (
                  <span className="text-xs text-[var(--muted)] italic">
                    No direct links attached for this session.
                  </span>
                )}
              </div>

              {/* Embedded Document Frame if activated */}
              {embedUrl && (
                <div className="pt-4 border-t border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground)]">
                    <span>In-Platform View: {embedTitle}</span>
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-orange hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" /> Open full page
                    </a>
                  </div>
                  <div className="w-full h-[600px] rounded-xl border border-[var(--border)] overflow-hidden bg-slate-100 shadow-inner">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full border-0"
                      title={embedTitle}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BROWSE ALL SESSIONS & FILTERS ── */}
      <div className="glass-card p-6 space-y-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h3 className="text-base font-extrabold text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-orange" />
            <span>Browse All {sessions.length} Sessions Schedule</span>
          </h3>
          <span className="text-xs text-[var(--muted)] font-medium">
            Search or filter across all modules
          </span>
        </div>

        {/* General Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all session titles, Kahoot credentials, slides, or modules..."
            className="w-full pl-11 pr-4 py-3 bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-xl text-xs sm:text-sm font-medium text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-brand-orange/50 transition-colors shadow-inner"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Week:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--layer-2)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] focus:outline-none"
            >
              <option value="all">All Weeks</option>
              {weeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--layer-2)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] focus:outline-none"
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {(selectedWeek !== "all" || selectedType !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedWeek("all");
                setSelectedType("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-brand-orange hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Schedule List */}
        <div className="space-y-3 pt-2">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                setWizardModule(session.module);
                setWizardSessionId(session.id);
                setActivePrepPackage(session);
                window.scrollTo({ top: 180, behavior: 'smooth' });
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                activePrepPackage?.id === session.id
                  ? 'bg-orange-50/60 border-brand-orange/40 shadow-sm'
                  : 'bg-white border-[var(--border)] hover:border-brand-orange/30 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-extrabold uppercase">
                    {session.week}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-ks-navy/10 border border-ks-navy/20 text-ks-navy text-[10px] font-extrabold uppercase">
                    {session.module}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold uppercase">
                    {session.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[var(--foreground)] truncate">
                  {session.sessionName}
                </h4>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-[var(--muted)] font-bold">
                  {session.duration}m
                </span>
                <button className="px-3 py-1 rounded-lg bg-brand-orange/10 text-brand-orange text-xs font-bold border border-brand-orange/20">
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
