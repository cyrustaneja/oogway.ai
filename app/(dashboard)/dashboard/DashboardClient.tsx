"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Search, X, CheckCircle2, Loader2, AlertOctagon, Zap, ListFilter,
  Target, Building2, User, ArrowUpDown, Filter, RotateCcw
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { SessionTable } from "./SessionTable";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any },
  },
};

type StatusFilter = 'all' | 'processing' | 'pulse' | 'complete' | 'failed';
type SortOption = 'newest' | 'oldest' | 'name';

const STATUS_FILTERS: { id: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all',        label: 'All',         icon: <ListFilter className="w-3 h-3" /> },
  { id: 'processing', label: 'Processing',  icon: <Loader2 className="w-3 h-3" /> },
  { id: 'pulse',      label: 'Pulse Done',  icon: <Zap className="w-3 h-3" /> },
  { id: 'complete',   label: 'Full Analysis',icon: <CheckCircle2 className="w-3 h-3" /> },
  { id: 'failed',     label: 'Failed',      icon: <AlertOctagon className="w-3 h-3" /> },
];

const PROCESSING_STATUSES = ["PREPROCESSING", "EXTRACTING", "AGGREGATING", "SYNTHESISING"];

export default function DashboardClient({
  analyses,
  totalExperts,
  role,
  complete,
  inProgress,
}: {
  analyses: any[];
  totalExperts: number;
  role: string;
  complete: number;
  inProgress: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filteredExpertId = searchParams.get("filteredExpertId");
  const filteredBatchId  = searchParams.get("filteredBatchId");
  const expertName       = searchParams.get("expertName");
  const batchName        = searchParams.get("batchName");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedExpert, setSelectedExpert] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Extract unique options dynamically for filter dropdowns
  const uniqueModules = useMemo(() => {
    const map = new Map<string, string>();
    analyses.forEach((a) => {
      const name = a.sessionNote?.module?.name;
      if (name) {
        map.set(name, name);
      }
    });
    return Array.from(map.values()).sort();
  }, [analyses]);

  const uniqueBatches = useMemo(() => {
    const map = new Map<string, string>();
    analyses.forEach((a) => {
      const name = a.batch?.name;
      if (name) {
        map.set(name, name);
      }
    });
    return Array.from(map.values()).sort();
  }, [analyses]);

  const uniqueExperts = useMemo(() => {
    const map = new Map<string, string>();
    analyses.forEach((a) => {
      const name = a.expert?.name;
      if (name) {
        map.set(name, name);
      }
    });
    return Array.from(map.values()).sort();
  }, [analyses]);

  const resetAllFilters = () => {
    setSearchQuery("");
    setStatusFilter('all');
    setSelectedModule('all');
    setSelectedBatch('all');
    setSelectedExpert('all');
    setSortBy('newest');
    if (filteredExpertId || filteredBatchId) {
      React.startTransition(() => router.push("/dashboard"));
    }
  };

  const activeFilterLabel = expertName
    ? `Expert: ${expertName}`
    : batchName
    ? `Batch: ${batchName}`
    : null;

  const hasActiveFilters = searchQuery !== "" || 
    statusFilter !== 'all' || 
    selectedModule !== 'all' || 
    selectedBatch !== 'all' || 
    selectedExpert !== 'all' ||
    Boolean(filteredExpertId) ||
    Boolean(filteredBatchId);

  const displayAnalyses = useMemo(() => {
    let result = analyses.filter((a) => {
      // URL-based filters (expert / batch)
      if (filteredExpertId && a.expertId !== filteredExpertId) return false;
      if (filteredBatchId && a.batchId !== filteredBatchId) return false;

      // Module Filter
      if (selectedModule !== 'all') {
        const modName = a.sessionNote?.module?.name;
        if (modName !== selectedModule) return false;
      }

      // Batch Filter
      if (selectedBatch !== 'all') {
        const bName = a.batch?.name;
        if (bName !== selectedBatch) return false;
      }

      // Expert Filter
      if (selectedExpert !== 'all') {
        const eName = a.expert?.name;
        if (eName !== selectedExpert) return false;
      }

      // Text search (Session ID, Module ID, Session Name, Module Name, Session Note, Expert, Batch)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = a.name?.toLowerCase().includes(q);
        const inExpert = a.expert?.name?.toLowerCase().includes(q);
        const inBatch = a.batch?.name?.toLowerCase().includes(q);
        const inId = a.id?.toLowerCase().includes(q);
        const inSessionNoteId = a.sessionNoteId?.toLowerCase().includes(q);
        const inSessionNoteName = (a.sessionNote as any)?.name?.toLowerCase().includes(q);
        const inSessionNoteSheetId = (a.sessionNote as any)?.sessionId?.toLowerCase().includes(q);
        const inModuleId = (a.sessionNote as any)?.module?.sheetModuleId?.toLowerCase().includes(q) || (a.sessionNote as any)?.moduleId?.toLowerCase().includes(q);
        const inModuleName = (a.sessionNote as any)?.module?.name?.toLowerCase().includes(q);

        if (!inName && !inExpert && !inBatch && !inId && !inSessionNoteId && !inSessionNoteName && !inSessionNoteSheetId && !inModuleId && !inModuleName) return false;
      }

      // Status filter
      const isPulseDone =
        Boolean(a.tier1Result) ||
        Boolean(a.tier1_result) ||
        Boolean(a.data?.tier1_result) ||
        Boolean(a.data?.expert_insights) ||
        Boolean(a.data?.overall_expert_summary) ||
        a.pipeline_stage === 'WAITING_FOR_DEEP_ANALYSIS' ||
        a.pipeline_stage === 'COMPLETE' ||
        (a.tier === 'TIER1' && a.v3Status === 'COMPLETE');

      if (statusFilter === 'processing') {
        return PROCESSING_STATUSES.includes(a.v3Status) && !isPulseDone;
      }
      if (statusFilter === 'pulse') {
        return isPulseDone;
      }
      if (statusFilter === 'complete') {
        return a.tier !== 'TIER1' && a.v3Status === 'COMPLETE';
      }
      if (statusFilter === 'failed') {
        return a.v3Status === 'FAILED' && !isPulseDone;
      }
      return true;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [analyses, filteredExpertId, filteredBatchId, searchQuery, statusFilter, selectedModule, selectedBatch, selectedExpert, sortBy]);

  const [workerRunning, setWorkerRunning] = useState(false);
  const [workerMsg, setWorkerMsg] = useState("");

  const handleRunWorker = async () => {
    setWorkerRunning(true);
    setWorkerMsg("");
    try {
      const res = await fetch("/api/pipeline/tick", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setWorkerMsg(`Processed ${data.claimed || 0} session(s)`);
        setTimeout(() => setWorkerMsg(""), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error("Worker run failed", err);
    } finally {
      setWorkerRunning(false);
    }
  };

  // Auto-trigger worker if there are pending queued sessions
  React.useEffect(() => {
    const hasPending = analyses.some((a) => a.v3Status === "PENDING" || a.pipeline_stage === "PULSE_PENDING" || a.pipeline_stage === "UPLOADED");
    if (hasPending) {
      handleRunWorker();
    }
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 max-w-6xl mx-auto px-4 lg:px-0 pt-10 sm:pt-16">

      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col items-center justify-center text-center relative w-full"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold tracking-widest uppercase mb-6 sm:mb-8 shadow-sm">
          <Zap className="w-3.5 h-3.5" />
          Pulse Dashboard
        </div>
        
        <h1 className="text-[32px] sm:text-[48px] md:text-[56px] font-black text-[var(--foreground)] mb-4 sm:mb-6 tracking-tighter leading-[1.1] uppercase max-w-4xl">
          THE EXPERT INTELLIGENCE ENGINE
        </h1>
        <p className="text-[16px] sm:text-[19px] text-[var(--muted)] mb-12 sm:mb-16 font-medium max-w-2xl leading-relaxed">
          Track session quality, expert performance, and student engagement across the entire curriculum.
        </p>

        {/* Modern Bento Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mb-12 sm:mb-16">
          {[
            { label: "Total Sessions", value: analyses.length + "+" },
            { label: "Validated",      value: complete },
            { label: "Processing",     value: inProgress },
            { label: "Expert Nodes",   value: totalExperts },
          ].map((s) => (
            <div key={s.label} className="glass-card p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden group border border-[var(--border)]">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="text-[40px] sm:text-[48px] font-black text-[var(--foreground)] tracking-tight leading-none mb-2 z-10 group-hover:text-brand-orange transition-colors duration-300">
                {s.value}
              </span>
              <p className="text-[11px] sm:text-[12px] font-bold text-[var(--muted)] uppercase tracking-widest z-10">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {role !== "EXPERT" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
            <Link href="/analysis/new" className="btn-primary px-8 sm:px-10 py-3.5 sm:py-4 shadow-xl shadow-brand-orange/20 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2 w-full sm:w-auto">
              <CheckCircle2 className="w-5 h-5" /> Run New Analysis
            </Link>

            <button
              onClick={handleRunWorker}
              disabled={workerRunning}
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer disabled:opacity-50"
            >
              {workerRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E8A020]" /> Processing Queue...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#E8A020] fill-current" /> Process Queued Sessions
                </>
              )}
            </button>
          </div>
        )}

        {workerMsg && (
          <p className="text-xs font-bold text-emerald-600 mt-3 animate-pulse">{workerMsg}</p>
        )}
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="ks-card mt-12 sm:mt-20 overflow-hidden shadow-xl border border-[var(--card-border)] rounded-2xl"
      >
        {/* Table Controls Panel */}
        <div className="px-5 sm:px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-5">
          {/* Top Row: Stream Title & Global Search */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shadow-sm">
                <Filter className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Recent Activity Stream</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Filter sessions by module, batch, expert, or search term</p>
              </div>
            </div>

            {/* Universal Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search module, session name, expert..."
                className="w-full pl-9 pr-8 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all font-bold placeholder:text-slate-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Middle Row: Searchable Filter Dropdowns & Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* Module Filter Dropdown */}
            <div className="relative">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                <Target className="w-3 h-3 text-amber-500" /> Module
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-extrabold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">All Modules ({uniqueModules.length})</option>
                {uniqueModules.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">{m}</option>
                ))}
              </select>
              <div className="absolute right-3 top-[28px] pointer-events-none text-slate-500 dark:text-slate-300 text-xs">▼</div>
            </div>

            {/* Batch Filter Dropdown */}
            <div className="relative">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-amber-500" /> Batch / Cohort
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-extrabold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">All Batches ({uniqueBatches.length})</option>
                {uniqueBatches.map((b) => (
                  <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">{b}</option>
                ))}
              </select>
              <div className="absolute right-3 top-[28px] pointer-events-none text-slate-500 dark:text-slate-300 text-xs">▼</div>
            </div>

            {/* Expert Partner Dropdown */}
            <div className="relative">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                <User className="w-3 h-3 text-amber-500" /> Expert Partner
              </label>
              <select
                value={selectedExpert}
                onChange={(e) => setSelectedExpert(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-extrabold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">All Experts ({uniqueExperts.length})</option>
                {uniqueExperts.map((ex) => (
                  <option key={ex} value={ex} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">{ex}</option>
                ))}
              </select>
              <div className="absolute right-3 top-[28px] pointer-events-none text-slate-500 dark:text-slate-300 text-xs">▼</div>
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-amber-500" /> Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-3 pr-8 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-extrabold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all appearance-none cursor-pointer shadow-sm"
              >
                <option value="newest" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">Newest Conducted First</option>
                <option value="oldest" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">Oldest First</option>
                <option value="name" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">Session Name (A-Z)</option>
              </select>
              <div className="absolute right-3 top-[28px] pointer-events-none text-slate-500 dark:text-slate-300 text-xs">▼</div>
            </div>
          </div>

          {/* Bottom Row: Status Pills & Active Filter Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/30 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-brand-orange hover:text-brand-orange dark:hover:text-amber-400'
                  }`}
                >
                  {f.icon}
                  {f.label}
                  {f.id === 'all' && (
                    <span className="ml-0.5 opacity-80">({analyses.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Filter Chips & Reset All */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Showing <span className="text-brand-orange font-black">{displayAnalyses.length}</span> of {analyses.length}
                </span>

                {selectedModule !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                    Module: {selectedModule}
                    <button onClick={() => setSelectedModule('all')} className="hover:text-amber-900 dark:hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}
                {selectedBatch !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-xs font-extrabold text-blue-700 dark:text-blue-300">
                    Batch: {selectedBatch}
                    <button onClick={() => setSelectedBatch('all')} className="hover:text-blue-900 dark:hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}
                {selectedExpert !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-xs font-extrabold text-purple-700 dark:text-purple-300">
                    Expert: {selectedExpert}
                    <button onClick={() => setSelectedExpert('all')} className="hover:text-purple-900 dark:hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}
                {activeFilterLabel && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                    {activeFilterLabel}
                    <button onClick={() => router.push("/dashboard")} className="hover:text-emerald-900 dark:hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </span>
                )}

                <button
                  onClick={resetAllFilters}
                  className="px-2.5 py-1 text-xs font-black text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column Headers — Desktop Grid Aligned (13 columns total) */}
        <div className="hidden lg:grid grid-cols-13 gap-4 px-8 py-3.5 bg-slate-200/80 dark:bg-slate-800 text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-300 dark:border-slate-700">
          <div className="col-span-4">Session & Module</div>
          <div className="col-span-2">Batch / Course</div>
          <div className="col-span-3">Expert Partner</div>
          <div className="col-span-2">Growth Status</div>
          <div className="col-span-1">Timeline</div>
          <div className="col-span-1 text-right pr-2">Actions</div>
        </div>

        <SessionTable initialSessions={displayAnalyses} onClearFilters={resetAllFilters} />
      </motion.div>
    </div>
  );
}


