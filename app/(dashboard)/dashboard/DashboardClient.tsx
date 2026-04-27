"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, Sparkles, Search, Plus, Filter, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { SessionTable } from "./SessionTable";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }
  }
};

export default function DashboardClient({ 
  analyses, 
  totalExperts, 
  role, 
  complete, 
  inProgress 
}: { 
  analyses: any[], 
  totalExperts: number, 
  role: string, 
  complete: number, 
  inProgress: number 
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filteredExpertId = searchParams.get("filteredExpertId");
  const filteredBatchId  = searchParams.get("filteredBatchId");
  const expertName       = searchParams.get("expertName");
  const batchName        = searchParams.get("batchName");

  const displayAnalyses = analyses.filter(a => {
    if (filteredExpertId && a.expertId !== filteredExpertId) return false;
    if (filteredBatchId && a.batchId !== filteredBatchId) return false;
    return true;
  });

  const clearFilters = () => {
    router.push("/dashboard");
  };

  const activeFilterLabel = expertName ? `Expert: ${expertName}` : batchName ? `Batch: ${batchName}` : null;
  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 lg:px-0">
      {/* Hero */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="glass-card p-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-2xl"
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: `radial-gradient(circle at 80% 0%, rgba(243,112,33,0.15), transparent 50%), radial-gradient(circle at 20% 100%, rgba(59,130,246,0.1), transparent 50%)`
          }}
        />
        
        <div className="relative z-10 max-w-2xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
            <div className="px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center gap-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <span className="text-[11px] font-bold tracking-widest text-brand-orange">Intelligence Hub</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4 tracking-tight leading-tight">
            Session Intelligence
          </h1>
          <p className="text-sm md:text-base text-[var(--muted-foreground)] mb-10 leading-relaxed font-medium">
            High-fidelity pedagogical diagnostics. Track session quality, expert performance, and student engagement — all in one fluid stream.
          </p>
          {role !== "EXPERT" && (
            <Link
              href="/analysis/new"
              className="btn-primary inline-flex items-center gap-3 px-8 py-4 shadow-2xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all text-xs font-bold tracking-wider"
            >
              <Plus className="w-5 h-5" />
              New Analysis
            </Link>
          )}
        </div>
        
        <div className="relative z-10 hidden lg:block">
          <div className="w-56 h-56 bg-white/5 dark:bg-black/20 rounded-3xl border border-[var(--card-border)] flex items-center justify-center backdrop-blur-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Activity className="w-24 h-24 text-brand-orange/20" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: "Total Stream", value: analyses.length, color: "text-brand-orange" },
          { label: "Validated",    value: complete, color: "text-brand-success" },
          { label: "Processing",   value: inProgress, color: "text-brand-warning" },
          { label: "Expert Nodes", value: totalExperts, color: "text-brand-info" },
        ].map((s) => (
          <motion.div 
            key={s.label} 
            variants={fadeInUp}
            className="glass-card p-8 group hover:scale-[1.02] transition-all shadow-xl"
          >
            <p className="text-[11px] font-bold text-[var(--muted)] tracking-widest mb-3">{s.label}</p>
            <p className={`text-4xl font-bold tracking-tight outfit ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Table Section */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="glass-card shadow-2xl"
      >
        <div className="px-8 py-6 border-b border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--card-border)]">
              <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">Recent Activity Stream</p>
              {activeFilterLabel && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2 py-0.5 rounded-md bg-brand-orange/10 border border-brand-orange/20 flex items-center gap-1.5">
                    <Filter className="w-2.5 h-2.5 text-brand-orange" />
                    <span className="text-[10px] font-bold text-brand-orange">{activeFilterLabel}</span>
                  </div>
                  <button 
                    onClick={clearFilters}
                    className="p-0.5 rounded-md hover:bg-[var(--inner-bg)] text-[var(--muted)] transition-colors"
                    title="Clear Filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest border-b border-[var(--card-border)]">
          <div className="col-span-4">Session Identity</div>
          <div className="col-span-2">Batch / Course</div>
          <div className="col-span-2">Expert Partner</div>
          <div className="col-span-2">Growth Status</div>
          <div className="col-span-2 text-right pr-4">Timeline</div>
        </div>

        <SessionTable initialSessions={displayAnalyses} />
      </motion.div>
    </div>
  );
}
