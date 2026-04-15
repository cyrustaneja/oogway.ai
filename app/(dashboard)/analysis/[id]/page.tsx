"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, RefreshCw, Loader2, CheckCircle2, XCircle,
  Clock, BookOpen, Users, BarChart2, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Chapter { chapterIndex: number; chapterTitle: string; startTime: string; endTime: string }
interface OverallAnalysis {
  status: string;
  contextSetting: any;
  sessionLogistics: any;
  sessionCounts: any;
  sessionFlow: any[];
  studentProfiles: any[];
  pedagogicalGaps: any[];
  overallSynthesis: any;
  failedChapterIndices: number[];
}
interface Session {
  id: string; name: string; v3Status: string; v3Error: string | null; createdAt: string; scheduledDuration: number | null;
  expert: { name: string; tags: string[] };
  sessionNote: { name: string; module: { name: string; course: { name: string } } } | null;
  chapters: Chapter[];
  overallAnalysis: OverallAnalysis | null;
}

// ── Status helper ──────────────────────────────────────────────────────────────
const PIPELINE_STEPS = ["PREPROCESSING","EXTRACTING","AGGREGATING","SYNTHESISING","COMPLETE"];
const STATUS_ORDER: Record<string, number> = Object.fromEntries(PIPELINE_STEPS.map((s,i) => [s,i]));

function PipelineProgress({ status, error }: { status: string; error?: string | null }) {
  const current = STATUS_ORDER[status] ?? (status === "FAILED" ? -1 : 0);
  return (
    <div className="glass-card p-6">
      <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-4">Pipeline Progress</p>
      <div className="flex items-center gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const done   = status === "COMPLETE" || (current > i);
          const active = current === i && status !== "COMPLETE" && status !== "FAILED";
          const failed = status === "FAILED" && i === current;
          return (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 flex flex-col items-center gap-1`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                  done   ? "bg-brand-success/20 border-brand-success text-brand-success" :
                  active ? "bg-brand-orange/20 border-brand-orange text-brand-orange animate-pulse" :
                  failed ? "bg-brand-danger/20 border-brand-danger text-brand-danger" :
                           "bg-slate-800 border-white/10 text-slate-600"
                }`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[9px] font-bold tracking-widest text-center uppercase ${
                  done ? "text-brand-success" : active ? "text-brand-orange" : "text-slate-600"
                }`}>{step}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={`h-px flex-1 mb-4 ${done ? "bg-brand-success/40" : "bg-white/5"}`} />
              )}
            </div>
          );
        })}
      </div>
      {status === "FAILED" && (
        <div className="mt-4 p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm space-y-1">
          <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
            <XCircle className="w-3.5 h-3.5" />
            Pipeline failure detected
          </div>
          <p className="leading-relaxed">{error || "An unknown error occurred. Please retry from the dashboard."}</p>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>{value}</p>
    </div>
  );
}

// ── Chapter Row ────────────────────────────────────────────────────────────────
function ChapterRow({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const depthColor: Record<string, string> = {
    deep_with_edge_cases: "text-brand-success",
    reasoning_and_examples: "text-brand-info",
    definitions_with_examples: "text-brand-warning",
    definitions_only: "text-orange-400",
    surface_only: "text-brand-danger",
    unknown: "text-slate-500",
  };
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="col-span-1 text-[10px] font-bold text-slate-600">#{item.chapterIndex}</div>
        <div className="col-span-5 text-sm font-bold text-white uppercase truncate">{item.chapterTitle}</div>
        <div className="col-span-2 text-[10px] font-bold text-slate-500">{item.startTime} → {item.endTime}</div>
        <div className={`col-span-2 text-[10px] font-bold uppercase ${depthColor[item.depthClassification] ?? "text-slate-500"}`}>
          {item.depthClassification?.replace(/_/g, " ") ?? "—"}
        </div>
        <div className="col-span-1 text-[11px] font-bold text-slate-400">{item.trainerQuestionsCount}Q / {item.studentInteractionsCount}I</div>
        <div className="col-span-1 flex justify-end">
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-6 pb-4 space-y-2">
          {item.topicsCovered?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Topics Covered</p>
              <div className="flex flex-wrap gap-2">
                {item.topicsCovered.map((t: string) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-success/10 border border-brand-success/20 text-brand-success">{t}</span>
                ))}
              </div>
            </div>
          )}
          {item.topicsSkipped?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-brand-danger/70 uppercase tracking-widest mb-1">Topics Skipped</p>
              <div className="flex flex-wrap gap-2">
                {item.topicsSkipped.map((t: string) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-danger/10 border border-brand-danger/20 text-brand-danger">{t}</span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] text-slate-500">
            Pacing: <span className="text-white font-bold uppercase">{item.pacing ?? "—"}</span> · Confusion signals: <span className="text-white font-bold">{item.confusionCount}</span> · Live demo: <span className="text-white font-bold">{item.hasLiveDemo ? "Yes" : "No"}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AnalysisDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData]       = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/analysis/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
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
    await fetch(`/api/analysis/${id}/start`, { method: "POST" });
    setTimeout(fetchData, 2000);
    setRetrying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-500">Session not found.</div>
    );
  }

  const oa = data.overallAnalysis;
  const counts = oa?.sessionCounts;
  const synthesis = oa?.overallSynthesis;
  const isRunning = ["PREPROCESSING","EXTRACTING","AGGREGATING","SYNTHESISING"].includes(data.v3Status);
  const isComplete = data.v3Status === "COMPLETE";
  const isFailed   = data.v3Status === "FAILED";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/dashboard")} className="mt-1 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: "var(--font-outfit)" }}>{data.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 font-bold">
              <span className="text-white">{data.expert.name}</span>
              {data.sessionNote && (
                <>
                  <span>·</span>
                  <span>{data.sessionNote.module.course.name} / {data.sessionNote.module.name}</span>
                </>
              )}
              <span>·</span>
              <span>{new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isFailed && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange text-white text-[11px] font-bold tracking-widest uppercase hover:bg-brand-orange/80 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
              Retry Pipeline
            </button>
          )}
          {isRunning && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-white/10 text-[11px] font-bold text-brand-warning tracking-widest">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              RUNNING
            </div>
          )}
          {isComplete && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-success/10 border border-brand-success/20 text-[11px] font-bold text-brand-success tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5" />
              COMPLETE
            </div>
          )}
        </div>
      </div>

      {/* Pipeline progress bar */}
      {!isComplete && <PipelineProgress status={data.v3Status} error={data.v3Error} />}

      {/* Failed chapter warnings */}
      {oa?.failedChapterIndices?.length > 0 && (
        <div className="p-4 bg-brand-warning/10 border border-brand-warning/20 rounded-xl flex items-center gap-3 text-sm text-brand-warning">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Chapters {oa.failedChapterIndices.join(", ")} failed to extract. Results may be partial.</span>
        </div>
      )}

      {/* Session counts */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Trainer Questions" value={counts.totalTrainerQuestions} />
          <StatCard label="Student Interactions" value={counts.totalStudentInteractions} />
          <StatCard label="Unique Students" value={counts.uniqueStudentCount} />
          <StatCard label="Confusion Points" value={counts.totalConfusionPoints} />
          <StatCard label="Analogies & Examples" value={counts.totalAnalogiesAndExamples} />
          <StatCard label="Topics Skipped" value={counts.topicSkippedCount} />
          <StatCard label="Chapters w/ Demo" value={counts.chaptersWithLiveDemo} />
          <StatCard label="Jargon Undefined" value={counts.totalJargonWithoutDefinition} />
        </div>
      )}

      {/* Context Setting */}
      {oa?.contextSetting && (
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-orange" />
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Context Setting</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${
              oa.contextSetting.classification === "set_with_examples_and_usecases"
                ? "bg-brand-success/10 border-brand-success/20 text-brand-success"
                : oa.contextSetting.classification === "set_without_examples"
                ? "bg-brand-warning/10 border-brand-warning/20 text-brand-warning"
                : "bg-brand-danger/10 border-brand-danger/20 text-brand-danger"
            }`}>
              {oa.contextSetting.classification?.replace(/_/g, " ") ?? "Unknown"}
            </span>
            {oa.contextSetting.timestamp && (
              <span className="text-[11px] text-slate-500 font-bold">@ {oa.contextSetting.timestamp}</span>
            )}
          </div>
          {oa.contextSetting.findings?.length > 0 && (
            <div className="space-y-2 pt-2">
              {oa.contextSetting.findings.map((f: any, i: number) => (
                <div key={i} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">{f.type?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-300 italic">"{f.verbatim_quote}"</p>
                  <p className="text-[10px] text-slate-500 mt-1">@ {f.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overall Synthesis */}
      {synthesis && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-orange" />
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Overall Synthesis</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{synthesis.session_summary}</p>

          {synthesis.key_strengths?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-brand-success uppercase tracking-widest mb-2">Key Strengths</p>
              <ul className="space-y-1">
                {synthesis.key_strengths.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {synthesis.notable_patterns?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-brand-warning uppercase tracking-widest mb-2">Notable Patterns</p>
              <div className="space-y-2">
                {synthesis.notable_patterns.map((p: any, i: number) => (
                  <div key={i} className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-white">{p.pattern}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            {synthesis.student_engagement_summary && (
              <div className="bg-slate-900/40 rounded-lg p-3">
                <p className="text-[10px] font-bold text-brand-info uppercase tracking-widest mb-1">Student Engagement</p>
                <p className="text-xs text-slate-300">{synthesis.student_engagement_summary}</p>
              </div>
            )}
            {synthesis.curriculum_coverage_summary && (
              <div className="bg-slate-900/40 rounded-lg p-3">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Curriculum Coverage</p>
                <p className="text-xs text-slate-300">{synthesis.curriculum_coverage_summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapter Flow */}
      {oa?.sessionFlow && oa.sessionFlow.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-orange" />
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Chapter Flow</p>
          </div>
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[9px] font-bold text-slate-600 tracking-widest uppercase">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Chapter</div>
            <div className="col-span-2">Timespan</div>
            <div className="col-span-2">Depth</div>
            <div className="col-span-2">Q / Interactions</div>
          </div>
          {oa.sessionFlow.map((item) => <ChapterRow key={item.chapterIndex} item={item} />)}
        </div>
      )}

      {/* Student Profiles */}
      {oa?.studentProfiles && oa.studentProfiles.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-orange" />
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Student Profiles</p>
          </div>
          <div className="divide-y divide-white/5">
            {oa.studentProfiles.map((s: any) => (
              <div key={s.studentName} className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                    {s.studentName[0]}
                  </div>
                  <span className="text-sm font-bold text-white uppercase">{s.studentName}</span>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs font-bold text-white">{s.totalInteractions}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Interactions</p>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs font-bold text-white">{s.questionsAsked}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Questions</p>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs font-bold text-brand-warning">{s.confusionSignals}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Confusion</p>
                </div>
                <div className="col-span-3 text-right">
                  <p className="text-[10px] text-slate-500">
                    Resolved: <span className="text-brand-success font-bold">{s.resolvedDoubts}</span>
                    {" / "}
                    Unresolved: <span className="text-brand-danger font-bold">{s.unresolvedDoubts}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedagogical Gaps */}
      {oa?.pedagogicalGaps && oa.pedagogicalGaps.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-warning" />
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Pedagogical Gaps Detected</p>
            <span className="ml-auto text-[10px] font-bold text-brand-warning">{oa.pedagogicalGaps.length} found</span>
          </div>
          <div className="divide-y divide-white/5">
            {oa.pedagogicalGaps.map((g: any, i: number) => (
              <div key={i} className="px-6 py-3 flex items-start gap-4">
                <span className="mt-0.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-warning/10 border border-brand-warning/20 text-brand-warning shrink-0">
                  Ch.{g.chapterIndex}
                </span>
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">{g.gapType?.replace(/_/g, " ")}</p>
                  <p className="text-[11px] text-slate-400">{g.factualStatement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending state — no results yet */}
      {data.v3Status === "PENDING" && (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">Pipeline has not been started yet.</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="btn-primary px-6 py-2.5 text-sm font-bold tracking-widest uppercase"
          >
            {retrying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Start Pipeline"}
          </button>
        </div>
      )}
    </div>
  );
}
