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
} from "lucide-react";
import { PrepSession } from "@/lib/server/expert-prep-sync";

export default function ExpertPrepPage() {
  const [sessions, setSessions] = useState<PrepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const fetchSessions = async (force = false) => {
    if (force) setSyncing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/prep/sync${force ? "?force=true" : ""}`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        setLastSynced(
          new Date(data.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
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

  // Unique Sub-Module Categories
  const categories = useMemo(() => {
    const set = new Set(sessions.map((s) => s.category).filter(Boolean));
    return Array.from(set).sort();
  }, [sessions]);

  // Unique Weeks
  const weeks = useMemo(() => {
    const set = new Set(sessions.map((s) => s.week).filter(Boolean));
    return Array.from(set).sort();
  }, [sessions]);

  // Unique Types
  const types = useMemo(() => {
    const set = new Set(sessions.map((s) => s.type).filter(Boolean));
    return Array.from(set);
  }, [sessions]);

  // Filtered Dataset
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Sub-module Category filter
      if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
      
      // Week filter
      if (selectedWeek !== "all" && s.week !== selectedWeek) return false;
      
      // Session Type filter
      if (selectedType !== "all" && s.type !== selectedType) return false;

      // Module Search filter
      if (moduleSearch.trim()) {
        const mQ = moduleSearch.toLowerCase();
        const matchesMod = s.module.toLowerCase().includes(mQ);
        const matchesCat = s.category.toLowerCase().includes(mQ);
        if (!matchesMod && !matchesCat) return false;
      }

      // General Text Search
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
  }, [sessions, searchQuery, moduleSearch, selectedCategory, selectedWeek, selectedType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* ── Header Banner ── */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-ks-navy via-slate-900 to-ks-navy text-white rounded-3xl shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oogway Expert Prep Portal (v2)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-outfit leading-tight">
              Curriculum &amp; Session Prep Hub
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Search by Module, Sub-topic, or Session. Access Kahoot credentials, prep guidelines, slide decks, and model solutions live from the master schedule.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchSessions(true)}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-brand-orange" : ""}`} />
              <span>{syncing ? "Syncing Sheet..." : "Sync Sheet"}</span>
            </button>
            {lastSynced && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Synced {lastSynced}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Search & Multi-Module Filter Panel ── */}
      <div className="glass-card p-6 space-y-6 rounded-2xl border border-[var(--border)] shadow-sm">
        
        {/* Dual Search Bars: General & Module Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* General Session Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search session title, Kahoot login, slides..."
              className="w-full pl-11 pr-4 py-3 bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-xl text-xs sm:text-sm font-medium text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-brand-orange/50 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Module / Topic Search */}
          <div className="relative">
            <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange" />
            <input
              type="text"
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              placeholder="Filter by Module (Meta, Google, SEO, Ecom, Pixels...)"
              className="w-full pl-11 pr-4 py-3 bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-xl text-xs sm:text-sm font-medium text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-brand-orange/50 transition-colors shadow-inner"
            />
            {moduleSearch && (
              <button
                onClick={() => setModuleSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sub-Module / Topic Category Pills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 text-brand-orange" />
            <span>Sub-Module / Topic Focus:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === "all"
                  ? "bg-brand-orange text-white shadow-sm"
                  : "bg-[var(--layer-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              All Topics ({sessions.length})
            </button>
            {categories.map((cat) => {
              const count = sessions.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-brand-orange text-white shadow-sm"
                      : "bg-[var(--layer-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Week & Type Filter Row */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--border)]">
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

          {(selectedCategory !== "all" || selectedWeek !== "all" || selectedType !== "all" || searchQuery || moduleSearch) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedWeek("all");
                setSelectedType("all");
                setSearchQuery("");
                setModuleSearch("");
              }}
              className="text-xs font-bold text-brand-orange hover:underline ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Sessions List Grid ── */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-brand-orange animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-[var(--muted)]">Syncing curriculum sessions from live Google Sheet...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 glass-card p-8 rounded-2xl border border-[var(--border)]">
          <BookOpen className="w-12 h-12 text-[var(--muted)] opacity-30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--foreground)]">No prep sessions match your query</h3>
          <p className="text-xs text-[var(--muted)] mt-1">Try searching for a different module or resetting filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold uppercase tracking-wider px-1">
            <span>Showing {filteredSessions.length} Session Prep Guides</span>
            <span>Live Sheet Auto-Synced</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredSessions.map((session) => {
              const hasNotes = Boolean(session.pointsToNote && session.pointsToNote.trim());
              const isKahoot = session.pointsToNote.toLowerCase().includes("kahoot");

              return (
                <div
                  key={session.id}
                  className="glass-card p-6 rounded-2xl border border-[var(--border)] hover:border-brand-orange/40 hover:shadow-lg transition-all space-y-4 group"
                >
                  {/* Top Line Badges */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-extrabold uppercase tracking-wider">
                          {session.week}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-ks-navy/10 border border-ks-navy/20 text-ks-navy text-[10px] font-extrabold uppercase tracking-wider">
                          {session.module}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wider">
                          {session.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                          {session.type}
                        </span>
                      </div>

                      <h2 className="text-lg font-extrabold text-[var(--foreground)] tracking-tight group-hover:text-brand-orange transition-colors">
                        {session.sessionName}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--layer-2)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--muted)]">
                        <Clock className="w-3.5 h-3.5 text-brand-orange" />
                        <span>{session.duration}m</span>
                      </div>

                      {session.expertType && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{session.expertType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Points To Note Box ── */}
                  {hasNotes && (
                    <div
                      className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                        isKahoot
                          ? "bg-purple-500/5 border-purple-500/20 text-purple-900"
                          : "bg-amber-500/5 border-amber-500/20 text-amber-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                        {isKahoot ? (
                          <>
                            <Key className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-purple-700">Kahoot Login &amp; Quiz Instructions</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-700">Important Expert Prep Notes</span>
                          </>
                        )}
                      </div>
                      <p className="whitespace-pre-line font-medium text-[12px]">
                        {session.pointsToNote}
                      </p>
                    </div>
                  )}

                  {/* ── Asset Link Buttons ── */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[var(--border)]">
                    {session.linkContent && (
                      <a
                        href={session.linkContent}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition-all shadow-sm"
                      >
                        <Presentation className="w-3.5 h-3.5 text-orange-600" />
                        <span>Slides / Content ↗</span>
                      </a>
                    )}

                    {session.linkCharter && (
                      <a
                        href={session.linkCharter}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-sm"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In-Session Charter ↗</span>
                      </a>
                    )}

                    {session.linkModelSolution && (
                      <a
                        href={session.linkModelSolution}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Model Solution ↗</span>
                      </a>
                    )}

                    {session.linkTest && (
                      <a
                        href={session.linkTest}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all shadow-sm"
                      >
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        <span>MCQ / Test ↗</span>
                      </a>
                    )}

                    {!session.linkContent && !session.linkCharter && !session.linkModelSolution && (
                      <span className="text-[11px] text-[var(--muted)] italic">
                        No direct links attached for this session.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
