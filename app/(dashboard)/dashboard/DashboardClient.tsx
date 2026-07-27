"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, X, CheckCircle2, Loader2, AlertOctagon, Zap, ListFilter } from "lucide-react";
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

  const clearFilters = () => {
    React.startTransition(() => router.push("/dashboard"));
  };

  const activeFilterLabel = expertName
    ? `Expert: ${expertName}`
    : batchName
    ? `Batch: ${batchName}`
    : null;

  const displayAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      // URL-based filters (expert / batch)
      if (filteredExpertId && a.expertId !== filteredExpertId) return false;
      if (filteredBatchId && a.batchId !== filteredBatchId) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = a.name?.toLowerCase().includes(q);
        const inExpert = a.expert?.name?.toLowerCase().includes(q);
        const inBatch = a.batch?.name?.toLowerCase().includes(q);
        if (!inName && !inExpert && !inBatch) return false;
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
  }, [analyses, filteredExpertId, filteredBatchId, searchQuery, statusFilter]);

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
    <div className="space-y-16 sm:space-y-24 max-w-5xl mx-auto px-4 lg:px-0 pt-10 sm:pt-16">

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
        className="ks-card mt-12 sm:mt-20"
      >
        {/* Table header with search + filters */}
        <div className="px-4 sm:px-8 py-5 border-b border-[var(--card-border)] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-xl bg-gray-50 border border-[var(--card-border)]">
                <Search className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A2B47] hidden sm:block">Recent Activity Stream</p>
                {activeFilterLabel && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="px-2 py-0.5 rounded-md bg-[#E8A020]/10 border border-[#E8A020]/20 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#E8A020]">{activeFilterLabel}</span>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="p-0.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Clear Filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--inner-bg)] border border-[var(--inner-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  statusFilter === f.id
                    ? 'bg-brand-orange text-white border-brand-orange shadow-sm shadow-brand-orange/20'
                    : 'bg-white text-[var(--muted)] border-[var(--card-border)] hover:border-brand-orange/40 hover:text-brand-orange'
                }`}
              >
                {f.icon}
                {f.label}
                {f.id === 'all' && (
                  <span className="ml-1 opacity-60">({analyses.length})</span>
                )}
              </button>
            ))}
            {(searchQuery || statusFilter !== 'all') && (
              <span className="text-[11px] text-[var(--muted)] ml-1">
                {displayAnalyses.length} result{displayAnalyses.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Column headers — desktop only */}
        <div className="hidden lg:grid grid-cols-13 gap-4 px-8 py-4 bg-gray-50/50 text-[11px] font-semibold text-gray-500 tracking-widest border-b border-[var(--card-border)] uppercase">
          <div className="col-span-4">Session Identity</div>
          <div className="col-span-2">Batch / Course</div>
          <div className="col-span-2">Expert Partner</div>
          <div className="col-span-2">Growth Status</div>
          <div className="col-span-2 text-right pr-4">Timeline</div>
          <div className="col-span-1"></div>
        </div>

        <SessionTable initialSessions={displayAnalyses} />
      </motion.div>
    </div>
  );
}
