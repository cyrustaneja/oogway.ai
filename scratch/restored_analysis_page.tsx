"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, RefreshCw, Loader2, CheckCircle2, XCircle,
  Clock, BookOpen, Users, BarChart2, AlertTriangle, ChevronDown, ChevronUp, UserCheck, Trash2
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Chapter { chapterIndex: number; chapterTitle: string; startTime: string; endTime: string }
interface OverallAnalysis {
  status: string;
  overallSummary: any;
  expertAnalysis: any;
  studentAnalysis: any;
  sessionFlow: any[];
  failedChapterIndices: number[];
}
interface Session {
  id: string; name: string; v3Status: string; v3Error: string | null; createdAt: string; scheduledDuration: number | null;
  expert: { name: string; tags: string[] };
  sessionNote: { name: string; module: { name: string; course: { name: string } } } | null;
  chapters: Chapter[];
  overallAnalysis: OverallAnalysis | null;
}

// ── Motion Variants ───────────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

function PipelineProgress({ status, error }: { status: string; error?: string | null }) {
  const messages: Record<string, {text: string, percent: number}> = {
    PENDING: { text: "Waking up...", percent: 5 },
    PREPROCESSING: { text: "Processing your session...", percent: 20 },
    EXTRACTING: { text: "Extracting timeline...", percent: 50 },
    AGGREGATING: { text: "Structuring chapters...", percent: 75 },
    SYNTHESISING: { text: "Synthesizing deep insights...", percent: 90 },
    COMPLETE: { text: "Throwing light on the session.", percent: 100 },
    FAILED: { text: "The universe has encountered an error.", percent: 100 },
  };

  const quotes = [
    "“Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present.”",
    "“There are no accidents.”",
    "“You must believe.”",
    "“One often meets his destiny on the road he takes to avoid it.”",
    "“The more you take, the less you have.”",
    "“If you only do what you can do, you will never be more than what you are now.”",
    "“Your mind is like this water, my friend. When it is agitated, it becomes difficult to see. But if you allow it to settle, the answer becomes clear.”",
    "“You are too concerned with what was and what will be.”",
    "“There is just news. There is no good or bad.”",
    "“The universe has brought us the Dragon Warrior.”"
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (status === "COMPLETE" || status === "FAILED") return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000); 
    return () => clearInterval(interval);
  }, [status, quotes.length]);

  const current = messages[status] || messages.PENDING;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="glass-card p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px] border-b-4 border-b-brand-orange/20"
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 120%, ${status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(243,112,33,0.15)'}, transparent 70%)`
        }}
      />

      <div className="relative z-10 mb-8">
        <div className={`w-32 h-32 rounded-full border-4 p-1.5 relative transition-all duration-1000 ${
          status === "COMPLETE" ? "border-brand-orange shadow-[0_0_60px_rgba(243,112,33,0.4)]" : 
          status === "FAILED" ? "border-brand-danger shadow-[0_0_30px_rgba(239,68,68,0.3)]" : 
          "border-brand-orange/30 shadow-[0_0_40px_rgba(243,112,33,0.2)]"
        }`}>
          <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center overflow-hidden shadow-inner backdrop-blur-md">
            <img 
              src="/oogway.jpg" 
              alt="Master Oogway" 
              className={`w-full h-full object-cover transition-opacity duration-1000 ${status === "COMPLETE" ? "opacity-100" : "opacity-80"}`}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-[500px] relative z-10">
        <div className="flex justify-between items-end mb-3">
          <p className="text-sm font-bold tracking-tight text-[var(--foreground)]">
             {current.text}
          </p>
          <p className="text-xs font-bold text-brand-orange">{current.percent}%</p>
        </div>
        <div className="h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${current.percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full rounded-full ${
              status === "FAILED" ? "bg-brand-danger" : "bg-brand-orange shadow-[0_0_15px_rgba(243,112,33,0.5)]"
            }`}
          />
        </div>
        
        <AnimatePresence mode="wait">
          {status !== "FAILED" && status !== "COMPLETE" && (
            <motion.div 
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 text-center space-y-4"
            >
              <p className="text-sm text-[var(--muted)] max-w-lg mx-auto italic font-medium">
                {quotes[quoteIndex]}
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                <span>ETA: ~2 Minutes</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {status === "FAILED" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 p-5 rounded-2xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm w-full max-w-[500px] relative z-10"
        >
          <div className="flex items-center gap-2 font-bold mb-2">
            <XCircle className="w-4 h-4" />
            Analysis Interrupted
          </div>
          <p className="opacity-90 leading-relaxed font-medium">{error || "The universe encountered a minor disturbance. Please retry."}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Chapter Flow Element ────────────────────────────────────────────────────────
function SessionFlowTimeline({ flow }: { flow: any[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(flow[0]?.chapter_index || null);

  if (!flow || flow.length === 0) return null;
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="glass-card overflow-hidden"
    >
      <div className="px-8 py-5 border-b border-[var(--card-border)] flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-orange/10">
          <Clock className="w-4 h-4 text-brand-orange" />
        </div>
        <p className="text-sm font-bold text-[var(--foreground)]">Session Flow Timeline</p>
      </div>

      <div className="p-8">
        <div className="relative border-l-2 border-[var(--timeline-line)] ml-6 space-y-4 pb-4">
          {flow.map((ch, i) => {
            const isExpanded = expandedIndex === ch.chapter_index;
            return (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="relative pl-10"
              >
                <div 
                  className={`absolute -left-[13px] top-6 w-6 h-6 rounded-full border-4 bg-[var(--background)] transition-all duration-300 ${
                    isExpanded ? "border-brand-orange scale-110 shadow-[0_0_15px_rgba(243,112,33,0.3)]" : "border-[var(--timeline-line)]"
                  }`} 
                />
                
                <button 
                  onClick={() => setExpandedIndex(isExpanded ? null : ch.chapter_index)}
                  className="w-full text-left p-5 rounded-2xl hover:bg-white/5 dark:hover:bg-white/5 transition-all group flex items-start justify-between border border-transparent hover:border-[var(--card-border)]"
                >
                  <div className="pr-8">
                    <p className={`text-[11px] font-bold tracking-wide mb-1 transition-colors ${isExpanded ? "text-brand-orange" : "text-[var(--muted-foreground)]"}`}>
                      Chapter {ch.chapter_index} · {ch.start_time} - {ch.end_time}
                    </p>
                    <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight leading-snug first-letter:uppercase lowercase">{ch.chapter_title?.toLowerCase()}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[var(--foreground)] leading-tight">{ch.duration_minutes}m</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-bold tracking-wider">{ch.percentage_of_session}% Space</p>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-6 px-5 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="bg-[var(--inner-bg)] p-5 rounded-2xl border border-[var(--inner-border)] shadow-sm">
                            <p className="text-[10px] font-bold text-brand-info tracking-widest mb-3">Topic Context</p>
                            <p className="text-sm text-[var(--foreground)] leading-relaxed opacity-90 first-letter:uppercase lowercase">{ch.what_was_taught?.toLowerCase()}</p>
                          </div>
                          <div className="bg-[var(--inner-bg)] p-5 rounded-2xl border border-[var(--inner-border)] shadow-sm">
                            <p className="text-[10px] font-bold text-brand-success tracking-widest mb-3">Delivery Style</p>
                            <p className="text-sm text-[var(--foreground)] leading-relaxed opacity-90 first-letter:uppercase lowercase">{ch.how_it_was_taught?.toLowerCase()}</p>
                          </div>
                        </div>

                        {ch.analogies_and_examples?.length > 0 && (
                          <div className="bg-[var(--inner-bg)] p-6 rounded-2xl border border-[var(--inner-border)] shadow-sm">
                            <p className="text-[10px] font-bold text-brand-warning tracking-widest mb-4">Analogies & Demonstrations</p>
                            <ul className="space-y-4">
                              {ch.analogies_and_examples.map((a: any, j: number) => (
                                <li key={j} className="text-sm flex gap-4">
                                  <span className="text-brand-orange font-bold shrink-0">{a.timestamp}</span>
                                  <div>
                                    <p className="text-[var(--foreground)] font-medium leading-relaxed first-letter:uppercase lowercase">{a.analogy_used?.toLowerCase()}</p>
                                    <p className="mt-2 inline-block px-2 py-0.5 rounded bg-brand-orange/10 text-[10px] font-bold text-brand-orange tracking-wider">Impact: {a.impact}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ch.confusion_points?.length > 0 && (
                          <div className="bg-brand-danger/5 border border-brand-danger/10 p-6 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-brand-danger tracking-widest mb-4">Friction Points</p>
                            <ul className="space-y-4">
                              {ch.confusion_points.map((c: any, j: number) => (
                                <li key={j} className="text-sm flex gap-4">
                                  <span className="text-brand-danger font-bold shrink-0">{c.timestamp}</span>
                                  <div>
                                    <p className="text-[var(--foreground)] font-bold mb-1 first-letter:uppercase lowercase">{c.student_name || "Student"}</p>
                                    <p className="text-[var(--foreground)] opacity-90 mb-2 first-letter:uppercase lowercase">{c.confusion?.toLowerCase()}</p>
                                    <p className="text-[11px] text-[var(--muted-foreground)] border-l-2 border-brand-danger/30 pl-3">
                                      <span className="text-brand-danger font-bold text-[9px] mr-2">Resolution</span>
                                      {c.resolution}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Overall Analysis Part ────────────────────────────────────────────────────────
function PillarsView({ oa }: { oa: OverallAnalysis }) {
  const [activeTab, setActiveTab] = useState<"EXPERT"|"STUDENT">("EXPERT");

  const summary = oa.overallSummary || {};
  const expert = oa.expertAnalysis || {};
  const student = oa.studentAnalysis || {};

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="glass-card overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-[var(--card-border)] flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 shadow-sm">
          <BookOpen className="w-5 h-5 text-brand-orange" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight leading-tight">
            {oa.name} 
            {expert?.name && (
              <> · <Link href={`/experts/${expert.id}`} className="hover:text-brand-orange transition-colors">{expert.name}</Link></>
            )} 
            {oa.batch?.name && (
              <> · <Link href={`/batches/${oa.batchId}`} className="hover:text-brand-orange transition-colors">{oa.batch.name}</Link></>
            )}
          </h2>
          <p className="text-[10px] font-bold text-[var(--muted)] tracking-widest mt-0.5">Verified Intelligence Log</p>
        </div>
      </div>

      <motion.div variants={fadeInUp} className="p-8 space-y-10">
          <div className="space-y-10">
            <div>
              <p className="text-[11px] font-bold text-[var(--muted)] tracking-widest mb-4">Context Setup</p>
            <div className="bg-[var(--inner-bg)] p-6 rounded-2xl border border-[var(--inner-border)] shadow-md">
              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4 font-medium italic first-letter:uppercase lowercase">
                {summary.context_setting?.how_it_was_done?.toLowerCase() || "Not established."}
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-warning/10 border border-brand-warning/20 w-fit">
                <BarChart2 className="w-3.5 h-3.5 text-brand-warning" />
                <span className="text-[10px] text-brand-warning font-bold tracking-tight">{summary.context_setting?.evaluation}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[var(--muted)] tracking-widest mb-4">Curriculum Pulse</p>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {summary.topics_covered?.map((t: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-brand-success/10 border border-brand-success/20 text-brand-success">
                    {t}
                  </span>
                ))}
              </div>
              {summary.topics_missed_from_notes?.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-brand-danger mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Gap Alert: {summary.topics_missed_from_notes.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Segmented Control Toggle */}
      <div className="mx-8 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl flex border border-[var(--card-border)] mb-4">
        <button 
          onClick={() => setActiveTab("EXPERT")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeTab === "EXPERT" ? "bg-white dark:bg-slate-800 text-brand-orange shadow-lg" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Expert Performance
        </button>
        <button 
          onClick={() => setActiveTab("STUDENT")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
            activeTab === "STUDENT" ? "bg-white dark:bg-slate-800 text-brand-info shadow-lg" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Student Engagement
        </button>
      </div>

      <div className="p-8 pb-10">
        <AnimatePresence mode="wait">
          {activeTab === "EXPERT" ? (
            <motion.div 
              key="expert"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[var(--inner-bg)] p-5 rounded-2xl border border-[var(--inner-border)] shadow-sm">
                  <p className="text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1">Knowledge Coverage</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">{expert.depth_analysis?.overall_depth?.replace(/_/g," ")} · {expert.pacing_issues?.overall}</p>
                </div>
                <div className="bg-[var(--inner-bg)] p-5 rounded-2xl border border-[var(--inner-border)] shadow-sm">
                  <p className="text-[11px] font-bold text-[var(--muted-foreground)] tracking-widest mb-1">Learning Efficiency</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">{expert.general_check?.start_time} to {expert.general_check?.end_time}</p>
                </div>
              </div>

              {expert.depth_analysis?.topics_lacking_examples?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-warning" />
                    Refinement Opportunities
                  </h4>
                  <div className="space-y-3">
                    {expert.depth_analysis.topics_lacking_examples.map((t: any, i: number) => (
                      <div key={i} className="bg-brand-orange/5 border border-brand-orange/10 p-5 rounded-2xl">
                        <span className="font-bold text-[var(--foreground)] block mb-1 first-letter:uppercase lowercase">{t.topic?.toLowerCase()}</span>
                        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed first-letter:uppercase lowercase">{t.feedback?.toLowerCase()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expert.doubt_resolution?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">Methodology Pulse</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expert.doubt_resolution.map((d: any, i: number) => (
                      <div key={i} className="bg-[var(--inner-bg)] p-5 rounded-2xl border border-[var(--inner-border)] shadow-sm">
                        <p className="text-xs font-bold text-[var(--foreground)] mb-2 first-letter:uppercase lowercase">{d.major_doubt?.toLowerCase()}</p>
                         <p className="text-[11px] text-brand-success font-bold tracking-tight first-letter:uppercase lowercase">Strategy: {d.how_it_was_resolved?.replace(/_/g," ")?.toLowerCase()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-brand-success/5 border border-brand-success/10 p-6 rounded-2xl">
                     <p className="text-[11px] font-bold text-brand-success tracking-widest mb-2">High Engagement Peak</p>
                     <p className="text-lg font-bold text-[var(--foreground)] tracking-tight first-letter:uppercase lowercase">{student.engagement?.most_engaging_topic?.toLowerCase() || "—"}</p>
                  </div>
                  <div className="bg-brand-danger/5 border border-brand-danger/10 p-6 rounded-2xl">
                     <p className="text-[11px] font-bold text-brand-danger tracking-widest mb-2">Cognitive Low</p>
                     <p className="text-lg font-bold text-[var(--foreground)] tracking-tight first-letter:uppercase lowercase">{student.engagement?.least_engaging_topic?.toLowerCase() || "—"}</p>
                  </div>
               </div>

              {student.major_technical_doubts?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">Critical Technical Friction</h4>
                  <div className="space-y-3">
                    {student.major_technical_doubts.map((d: any, i: number) => (
                      <div key={i} className="bg-[var(--inner-bg)] p-5 rounded-2xl border border-[var(--inner-border)] flex items-start justify-between shadow-sm">
                        <div className="pr-10">
                          <p className="text-sm font-bold text-[var(--foreground)] mb-1 first-letter:uppercase lowercase">{d.student_name}: {d.doubt?.toLowerCase()}</p>
                          <span className="text-xs text-[var(--muted-foreground)]">Impacted at {d.timestamp}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${d.resolved ? "bg-brand-success/10 text-brand-success" : "bg-brand-danger/10 text-brand-danger"}`}>
                          {d.resolved ? 'Resolved' : 'Pending Gap'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Key Learnings Sequence */}
      <motion.div variants={fadeInUp} className="p-8 border-t border-[var(--card-border)] bg-[var(--accent)]/[0.03] shadow-inner">
        <h4 className="text-sm font-bold text-[var(--foreground)] mb-2">Verified Key Learnings</h4>
        <p className="text-xs text-[var(--muted-foreground)] mb-6 font-medium leading-relaxed first-letter:uppercase lowercase">{summary.agenda_evaluation?.toLowerCase()}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.key_learnings_sequence?.map((k: string, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[var(--inner-bg)] p-4 rounded-xl border border-[var(--inner-border)] flex items-start gap-3 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-brand-success shrink-0 mt-0.5" />
              <span className="text-sm text-[var(--foreground)] font-medium leading-tight first-letter:uppercase lowercase">{k?.toLowerCase()}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AnalysisDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData]       = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [mainTab, setMainTab] = useState<"OVERALL"|"FLOW">("OVERALL");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      setData(await res.json());
    } catch (err) {
      setError("Failed to fetch analysis.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll while pipeline is running
  useEffect(() => {
    if (!data) return;
    const running = ["PREPROCESSING","EXTRACTING","AGGREGATING","SYNTHESISING"].includes(data.v3Status);
    if (!running) return;
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [data, fetchData]);

  const handleRetry = async () => {
    setRetrying(true);
    if (data) setData({ ...data, v3Status: "PENDING" });
    await fetch(`/api/analysis/${id}/start`, { method: "POST" });
    setRetrying(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete session "${data?.name}"?`)) return;
    try {
      const res = await fetch(`/api/analysis/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Loader2 className="w-10 h-10 text-brand-orange" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="p-10 glass-card bg-brand-danger/5 border-brand-danger/20 flex flex-col items-center">
          <XCircle className="w-12 h-12 text-brand-danger mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Access Interrupted</h2>
          <p className="text-sm text-[var(--muted)] mb-8">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  const oa = data.overallAnalysis;
  const isRunning = ["PREPROCESSING","EXTRACTING","AGGREGATING","SYNTHESISING"].includes(data.v3Status);
  const isComplete = data.v3Status === "COMPLETE";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start justify-between gap-6 px-2"
      >
        <div className="flex items-start gap-5">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="mt-2 p-2 rounded-xl bg-white/5 dark:bg-white/5 border border-[var(--card-border)] text-[var(--muted)] hover:text-brand-orange transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight leading-tight" style={{ fontFamily: "var(--font-outfit)" }}>{data.name}</h1>
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-2 text-xs font-semibold text-[var(--muted-foreground)]">
              <span className="text-[var(--foreground)] flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-orange" /> {data.expert.name}
              </span>
              {data.sessionNote && (
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-info" />
                  {data.sessionNote.module.course.name} / {data.sessionNote.module.name}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(!isRunning) && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
                Rethink Analysis
              </button>
              <button
                onClick={handleDelete}
                className="p-3 rounded-full bg-brand-danger/10 border border-brand-danger/20 text-brand-danger hover:bg-brand-danger/20 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
          {isRunning && (
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-warning/10 border border-brand-warning/30 text-[11px] font-bold text-brand-warning tracking-widest uppercase shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing Intelligence
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-success/10 border border-brand-success/30 text-[11px] font-bold text-brand-success tracking-widest shadow-lg">
              <CheckCircle2 className="w-4 h-4" />
              Insight Validated
            </div>
          )}
        </div>
      </motion.div>

      {!isComplete && <PipelineProgress status={data.v3Status} error={data.v3Error} />}

      {isComplete && oa && (
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {oa.failedChapterIndices?.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-brand-warning/10 border border-brand-warning/20 rounded-2xl flex items-center gap-4 text-sm text-brand-warning shadow-xl"
              >
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <span className="font-medium font-outfit tracking-tight text-xs">Note: Chapters {oa.failedChapterIndices.join(", ")} reported telemetry gaps. Logic remains robust.</span>
              </motion.div>
            )}

            {/* Segmented Control for Main Navigation */}
            <div className="flex p-1 bg-black/5 dark:bg-white/5 border border-[var(--card-border)] rounded-2xl w-fit mx-auto sticky top-20 z-30 backdrop-blur-md shadow-2xl">
              <button 
                onClick={() => setMainTab("OVERALL")}
                className={`py-3 px-10 rounded-xl text-xs font-bold transition-all duration-300 ${
                  mainTab === "OVERALL" ? "bg-white dark:bg-slate-800 text-brand-orange shadow-lg" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Overall Synthesis
              </button>
              <button 
                onClick={() => setMainTab("FLOW")}
                className={`py-3 px-10 rounded-xl text-xs font-bold transition-all duration-300 ${
                  mainTab === "FLOW" ? "bg-white dark:bg-slate-800 text-brand-orange shadow-lg" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Timeline Flow
              </button>
            </div>

            <div key={mainTab} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {mainTab === "OVERALL" && <PillarsView oa={oa} />}
              {mainTab === "FLOW" && <SessionFlowTimeline flow={oa.sessionFlow} />}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
