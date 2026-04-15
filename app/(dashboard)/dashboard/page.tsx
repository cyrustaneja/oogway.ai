import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Activity, Sparkles, Search, ChevronRight, Plus } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:       { label: "Pending",       color: "text-slate-400",      dot: "bg-slate-500" },
  PREPROCESSING: { label: "Preprocessing", color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  EXTRACTING:    { label: "Extracting",    color: "text-brand-info",     dot: "bg-brand-info animate-pulse" },
  AGGREGATING:   { label: "Aggregating",   color: "text-purple-400",     dot: "bg-purple-400 animate-pulse" },
  SYNTHESISING:  { label: "Synthesising",  color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  COMPLETE:      { label: "Complete",      color: "text-brand-success",  dot: "bg-brand-success" },
  FAILED:        { label: "Failed",        color: "text-brand-danger",   dot: "bg-brand-danger" },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  let where = {};
  if (role === "EXPERT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { expertId: true } });
    if (user?.expertId) where = { expertId: user.expertId };
  }

  const [analyses, totalExperts] = await Promise.all([
    prisma.analysisSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        expert: { select: { name: true } },
        sessionNote: { select: { name: true } },
        batch: { select: { name: true } },
      },
    }),
    prisma.expert.count(),
  ]);

  const complete  = analyses.filter((a) => a.v3Status === "COMPLETE").length;
  const inProgress = analyses.filter((a) =>
    ["PREPROCESSING","EXTRACTING","AGGREGATING","SYNTHESISING"].includes(a.v3Status)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="glass-card p-8 flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-[10px] font-bold tracking-widest text-brand-orange uppercase">Master Oogway AI</span>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3" style={{ fontFamily: "var(--font-outfit)" }}>
            Analysis Dashboard
          </h1>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            High-fidelity pedagogical diagnostics. Track session quality, expert performance, and student engagement — all in one place.
          </p>
          {role !== "EXPERT" && (
            <Link
              href="/analysis/new"
              className="btn-primary inline-flex items-center gap-2 tracking-widest text-[11px] py-3 px-6 shadow-lg shadow-brand-orange/20"
            >
              <Plus className="w-4 h-4" />
              NEW SESSION AUDIT
            </Link>
          )}
        </div>
        <div className="relative z-10 hidden md:block">
          <div className="w-48 h-48 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-center p-8">
            <Activity className="w-full h-full text-brand-orange/20" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Analyses", value: analyses.length },
          { label: "Complete",       value: complete },
          { label: "In Progress",    value: inProgress },
          { label: "Experts",        value: totalExperts },
        ].map((s) => (
          <div key={s.label} className="glass-card p-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">All Sessions</span>
        </div>

        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          <div className="col-span-3">Session</div>
          <div className="col-span-2">Batch</div>
          <div className="col-span-2">Expert</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Created</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {analyses.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500 text-sm">
            No analysis sessions yet.{" "}
            {role !== "EXPERT" && (
              <Link href="/analysis/new" className="text-brand-orange underline">Create one</Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {analyses.map((a) => {
              const cfg = STATUS_CONFIG[a.v3Status] ?? STATUS_CONFIG.PENDING;
              return (
                <div key={a.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-3">
                    <p className="text-sm font-bold text-white uppercase truncate">{a.name}</p>
                    {a.sessionNote && (
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{a.sessionNote.name}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    {a.batch ? (
                      <span className="text-[11px] font-bold text-slate-300 uppercase truncate">{a.batch.name}</span>
                    ) : (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {a.expert.name[0]}
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 truncate uppercase">{a.expert.name}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="col-span-1 text-[11px] font-bold text-slate-500 uppercase">
                    {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Link
                      href={`/analysis/${a.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black border border-white/10 text-[10px] font-bold tracking-widest text-white uppercase hover:border-brand-orange/50 transition-colors"
                    >
                      VIEW <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
