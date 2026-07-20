"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, Calendar, Activity, ChevronLeft, Building2, Zap, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import Link from "next/link";
import { SessionTable } from "../../dashboard/SessionTable";
import { Loader2 } from "lucide-react";

const fadeInUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function BatchDetailPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/batches/${id}`)
      .then(r => r.json())
      .then(data => {
        setBatch(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const [batchPulse, setBatchPulse] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/batches/${id}/pulse-summary`)
      .then(r => r.json())
      .then(setBatchPulse)
      .catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
    </div>
  );

  if (!batch) return (
    <div className="text-center py-40 text-[var(--muted)]">Batch not found.</div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumb */}
      <Link 
        href="/batches" 
        className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)] hover:text-brand-orange transition-colors tracking-widest uppercase"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Registry
      </Link>

      {/* Cohort Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="glass-card p-10 relative overflow-hidden shadow-2xl"
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 100%, rgba(59,130,246,0.1), transparent 50%)`
          }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-[var(--card-border)] flex items-center justify-center text-brand-orange shrink-0 shadow-2xl">
            <Layers className="w-10 h-10" />
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">{batch.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {batch.course && (
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Building2 className="w-4 h-4 text-brand-orange" />
                    <span className="text-sm font-bold text-brand-orange">{batch.course.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 opacity-60">
                  <Calendar className="w-4 h-4 text-brand-orange" />
                  <span className="text-sm font-medium text-[var(--muted)]">Initialized {new Date(batch.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {batch.description && (
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-2xl font-medium italic">
                "{batch.description}"
              </p>
            )}
          </div>

          <div className="glass-card p-6 bg-white/5 border-white/5 shadow-inner hidden lg:block">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-brand-orange">{batch.sessions?.length || 0}</span>
              <span className="text-[10px] font-bold text-[var(--muted)] tracking-[0.2em] uppercase mt-1">Total Analyses</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Batch Pulse Health */}
      {batchPulse && batchPulse.sessions > 0 && (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="glass-card shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20">
                <Zap className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Batch Pulse Health</h2>
                <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest mt-0.5">{batchPulse.sessions} SESSIONS ANALYSED</p>
              </div>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${
                batchPulse.healthScore >= 70 ? 'text-green-500' :
                batchPulse.healthScore >= 40 ? 'text-amber-500' : 'text-red-500'
              }`}>{batchPulse.healthScore}<span className="text-sm font-medium text-[var(--muted)]">/100</span></p>
              <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest">HEALTH SCORE</p>
            </div>
          </div>

          {/* Metric health bars */}
          {batchPulse.metricHealth && (
            <div className="space-y-2 mb-6">
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Student Behavior Across Sessions</p>
              {batchPulse.metricHealth.map((m: any) => (
                <div key={m.metric} className="flex items-center gap-4">
                  <span className="text-xs text-[var(--foreground)] w-40 shrink-0 font-medium">{m.metric}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--layer-2)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.flagRate <= 30 ? 'bg-green-500' : m.flagRate <= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${100 - m.flagRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--muted)] w-24 text-right shrink-0">{m.mostCommonScore} ({m.flagRate}% flagged)</span>
                </div>
              ))}
            </div>
          )}

          {/* Confusion hotspots */}
          {batchPulse.confusionTopics?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Confusion Hotspots Detected</p>
              <div className="space-y-2">
                {batchPulse.confusionTopics.slice(0, 5).map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">{t.session}</p>
                      <p className="text-[10px] text-[var(--muted)]">{t.chapter} — {t.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Analysis Hub */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="glass-card shadow-2xl"
      >
        <div className="px-8 py-6 border-b border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20">
              <Activity className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Cohort Intelligence Folder</h2>
              <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest mt-0.5">COMPREHENSIVE BATCH PERFORMANCE LOGS</p>
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

        <SessionTable initialSessions={batch.sessions || []} />
      </motion.div>
    </div>
  );
}
