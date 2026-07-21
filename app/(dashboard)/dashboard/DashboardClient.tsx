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

  return (
    <div className="space-y-16 sm:space-y-24 max-w-5xl mx-auto px-4 lg:px-0 pt-10 sm:pt-16">

      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex flex-col items-center justify-center text-center relative"
      >
        <h1 className="text-[32px] sm:text-[48px] md:text-[56px] font-black text-[#1D1D1F] mb-4 sm:mb-6 tracking-tighter leading-[1.1] uppercase max-w-4xl">
          THE EXPERT INTELLIGENCE ENGINE
        </h1>
        <p className="text-[16px] sm:text-[19px] text-[#86868B] mb-12 sm:mb-20 font-medium font-serif italic max-w-2xl leading-relaxed">
          Track session quality, expert performance, and student engagement.
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 w-full max-w-4xl mb-12 sm:mb-20">
          {[
            { label: "Total Sessions", value: analyses.length },
            { label: "Validated",      value: complete },
            { label: "Processing",     value: inProgress },
            { label: "Expert Nodes",   value: totalExperts },
          ].map((s, idx) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center ${idx !== 3 ? 'sm:border-r border-gray-200/60' : ''}`}
            >
              <div className="relative inline-block">
                <span className="font-handwritten text-[#E8A020] text-[64px] sm:text-[80px] md:text-[96px] leading-[0.8] tracking-wide">
                  {s.value}{s.label === "Total Sessions" ? "+" : ""}
                </span>
                <svg
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-2.5 text-[#E8A020]/20"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0,5 Q50,10 100,2" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[12px] sm:text-[14px] font-bold text-[#1D1D1F] mt-4 sm:mt-5">{s.label}</p>
            </div>
          ))}
        </div>

        {role !== "EXPERT" && (
          <Link href="/analysis/new" className="btn-primary px-8 sm:px-10 py-3 sm:py-3.5 shadow-lg">
            Run New Analysis
          </Link>
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
