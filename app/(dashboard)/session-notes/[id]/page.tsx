"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Activity, ChevronLeft, Target, Award, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { SessionTable } from "../../dashboard/SessionTable";
import { Loader2 } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function SessionNoteDetailPage() {
  const { id } = useParams();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/session-notes/${id}`)
      .then(r => r.json())
      .then(data => {
        setNote(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
    </div>
  );

  if (!note) return (
    <div className="text-center py-40 text-[var(--muted)]">Session history not found.</div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--muted)] tracking-widest uppercase">
        <Link href="/courses" className="hover:text-brand-orange transition-colors">Curriculum</Link>
        <ChevronLeft className="w-3 h-3 rotate-180 opacity-40" />
        <Link href={`/courses/${note.module?.course?.id}`} className="hover:text-brand-orange transition-colors">{note.module?.course?.name}</Link>
        <ChevronLeft className="w-3 h-3 rotate-180 opacity-40" />
        <Link href={`/modules/${note.module?.id}`} className="hover:text-brand-orange transition-colors">{note.module?.name}</Link>
      </div>

      {/* Lesson Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="glass-card p-10 relative overflow-hidden shadow-2xl"
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 100%, rgba(243,112,33,0.1), transparent 50%)`
          }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-3xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center text-brand-orange shrink-0 shadow-2xl">
            <FileText className="w-10 h-10" />
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-bold text-[var(--muted)] tracking-widest uppercase">{note.module?.name}</p>
                <div className="w-1 h-1 rounded-full bg-[var(--muted)] opacity-20" />
                <p className="text-[10px] font-bold text-brand-orange tracking-widest uppercase italic">Session Folder</p>
              </div>
              <h1 className="text-4xl font-bold text-[var(--foreground)] tracking-tight">{note.name}</h1>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-2xl font-medium italic">
              "Granular intelligence folder for this specific session type. Comparison of delivery quality and student reception for {note.name} across different batches and experts."
            </p>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-orange/60" />
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {new Set((note.analysisSessions || []).map((a: any) => a.expertId)).size} Different Experts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-orange/60" />
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {note.analysisSessions?.length || 0} Total Sessions Analysed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-orange/60" />
                <span className="text-sm font-bold text-[var(--foreground)]">{note.module?.course?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lesson Analysis Hub */}
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
              <h2 className="text-lg font-bold text-[var(--foreground)]">Lesson Intelligence Folder</h2>
              <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest mt-0.5">HISTORICAL LESSON COMPARISON</p>
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

        <SessionTable initialSessions={note.analysisSessions || []} />
      </motion.div>
    </div>
  );
}
