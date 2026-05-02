"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Activity, ChevronLeft, Target, Award, Users } from "lucide-react";
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

export default function ModuleDetailPage() {
  const { id } = useParams();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/modules/${id}`)
      .then(r => r.json())
      .then(data => {
        setModule(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
    </div>
  );

  if (!module) return (
    <div className="text-center py-40 text-[var(--muted)]">Module history not found.</div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumb */}
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2 text-[10px] font-bold text-[var(--muted)] hover:text-brand-orange transition-colors tracking-widest uppercase"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Stream
      </Link>

      {/* Topic Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="glass-card p-10 relative overflow-hidden shadow-2xl"
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 120%, rgba(243,112,33,0.15), transparent 70%)`
          }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-3xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center text-brand-orange shrink-0 shadow-2xl">
            <Target className="w-10 h-10" />
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <p className="text-[10px] font-bold text-brand-orange tracking-widest uppercase mb-1">{module.course?.name || "Unmapped Course"}</p>
              <h1 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">{module.name}</h1>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-2xl font-medium italic">
              "Curriculum-wide intelligence folder for the {module.name} module. Analyze delivery consistency and identified student friction across all experts."
            </p>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-orange/60" />
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {new Set((module.allAnalyses || []).map((a: any) => a.expertId)).size} Experts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-orange/60" />
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {module.allAnalyses?.length || 0} Validated Sessions
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cross-Session Analysis */}
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
              <h2 className="text-lg font-bold text-[var(--foreground)]">Curriculum Intelligence Folder</h2>
              <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest mt-0.5">TOPIC-WISE DELIVERY LOGS</p>
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

        <SessionTable initialSessions={module.allAnalyses || []} />
      </motion.div>
    </div>
  );
}
