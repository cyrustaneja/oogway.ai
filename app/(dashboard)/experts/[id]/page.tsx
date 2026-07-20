"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Tag, Calendar, Activity, ChevronLeft, Zap, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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

export default function ExpertDetailPage() {
  const { id } = useParams();
  const [expert, setExpert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/experts/${id}`)
      .then(r => r.json())
      .then(data => {
        setExpert(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const [pulse, setPulse] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/experts/${id}/pulse-summary`)
      .then(r => r.json())
      .then(setPulse)
      .catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
    </div>
  );

  if (!expert) return (
    <div className="text-center py-40 text-[var(--muted)]">Expert not found.</div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumb */}
      <Link 
        href="/experts" 
        className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)] hover:text-brand-orange transition-colors tracking-widest uppercase"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Roster
      </Link>

      {/* Profile Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="glass-card p-10 relative overflow-hidden shadow-2xl"
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 0% 0%, rgba(243,112,33,0.1), transparent 50%)`
          }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-[var(--card-border)] flex items-center justify-center text-3xl font-bold text-[var(--foreground)] shrink-0 shadow-2xl">
            {expert.name[0]}
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">{expert.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 opacity-60">
                  <Mail className="w-4 h-4 text-brand-orange" />
                  <span className="text-sm font-medium text-[var(--muted)]">{expert.email}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Calendar className="w-4 h-4 text-brand-orange" />
                  <span className="text-sm font-medium text-[var(--muted)]">Joined {new Date(expert.createdAt).toLocaleDateString("en-GB", { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {expert.bio && (
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-2xl font-medium italic">
                "{expert.bio}"
              </p>
            )}

            {expert.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {expert.tags.map((t: string) => (
                  <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-bold tracking-wide italic">
                    <Tag className="w-3 h-3 opacity-50" /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6 bg-white/5 border-white/5 shadow-inner hidden lg:block">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-brand-orange">{expert.sessions?.length || 0}</span>
              <span className="text-[10px] font-bold text-[var(--muted)] tracking-[0.2em] uppercase mt-1">Sessions Logged</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pulse Cross-Session Summary */}
      {pulse && pulse.sessions > 0 && (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="glass-card shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20">
              <Zap className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold">KraftShala Pulse — Cross-Session Pattern</h2>
              <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest mt-0.5">{pulse.sessions} SESSIONS ANALYSED</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {pulse.biggestGap && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Consistent Gap</p>
                  <p className="font-semibold text-sm">{pulse.biggestGap}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Flagged in {pulse.biggestGapCount} of {pulse.sessions} sessions</p>
                </div>
              </div>
            )}
            {pulse.biggestStrength && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Consistent Strength</p>
                  <p className="font-semibold text-sm">{pulse.biggestStrength}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Rated well across sessions</p>
                </div>
              </div>
            )}
          </div>

          {pulse.metricSummaries && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Metric Breakdown</p>
              {pulse.metricSummaries.map((m: any) => {
                const pct = m.totalSessions > 0 ? Math.round((m.goodCount / m.totalSessions) * 100) : 0;
                return (
                  <div key={m.metric} className="flex items-center gap-4">
                    <span className="text-xs text-[var(--foreground)] w-44 shrink-0 font-medium">{m.metric}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--layer-2)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--muted)] w-20 text-right shrink-0">{m.mostCommonScore} ({pct}% good)</span>
                  </div>
                );
              })}
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
              <h2 className="text-lg font-bold text-[var(--foreground)]">Intelligence Folder</h2>
              <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest mt-0.5">CHRONOLOGICAL PERFORMANCE LOGS</p>
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

        <SessionTable initialSessions={expert.sessions || []} />
      </motion.div>
    </div>
  );
}
