import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Shield, Users, Activity, BookOpen, Database } from "lucide-react";

import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { PipelineMonitor } from "@/components/admin/PipelineMonitor";
import { RecentUsersList } from "@/components/admin/RecentUsersList";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const [userCount, expertCount, sessionCount, courseCount, analysisCount] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.expert.count({ where: { deletedAt: null } }),
    prisma.analysisSession.count({ where: { deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null } }),
    Promise.resolve(0),
  ]);

  const statusCounts: any[] = [];

  const recentUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const failedSessions = await prisma.analysisSession.findMany({
    where: { v3Status: "FAILED", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { expert: { select: { name: true } } },
  });

  const ROLE_COLOR: Record<string, string> = {
    ADMIN: "text-brand-orange bg-brand-orange/10 border-brand-orange/20",
    TEAM:  "text-brand-info bg-brand-info/10 border-brand-info/20",
    EXPERT:"text-brand-success bg-brand-success/10 border-brand-success/20",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand-orange" />
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>Control Panel</h1>
            <p className="text-xs text-slate-500 mt-0.5">System administration — ADMIN only</p>
          </div>
        </div>
        <CreateUserForm />
      </div>


      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Users,    label: "Users",              value: userCount },
          { icon: Users,    label: "Experts",            value: expertCount },
          { icon: Activity, label: "Total Analyses",     value: sessionCount },
          { icon: BookOpen, label: "Courses",            value: courseCount },
          { icon: Database, label: "Completed Reports",  value: analysisCount },
        ].map(s => (
          <div key={s.label} className="glass-card p-5">
            <s.icon className="w-4 h-4 text-brand-orange mb-2" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1" style={{ fontFamily: "var(--font-outfit)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Monitoring */}
      <PipelineMonitor />

      <div className="grid grid-cols-2 gap-6">
        <RecentUsersList initialUsers={recentUsers} />

        {/* Failed Sessions */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Failed Sessions</p>
            {failedSessions.length > 0 && (
              <span className="text-[10px] font-bold text-brand-danger">{failedSessions.length} failed</span>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {failedSessions.length === 0 ? (
              <p className="px-6 py-8 text-xs text-brand-success text-center">✓ No failed sessions</p>
            ) : failedSessions.map(s => (
              <div key={s.id} className="px-6 py-3">
                <p className="text-xs font-bold text-white uppercase truncate">{s.name}</p>
                <p className="text-[10px] text-slate-500">{s.expert.name} · Failed {new Date(s.updatedAt).toLocaleDateString("en-GB")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-card p-6 border border-brand-orange/10">
        <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-2">System Info</p>
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <p className="font-bold text-white">Pipeline Architecture</p>
            <p>6-stage async LLM pipeline. Fire-and-forget. DB-backed status polling.</p>
          </div>
          <div>
            <p className="font-bold text-white">AI Model</p>
            <p>Gemini 2.0 Flash (primary) → Gemini 1.5 Flash (fallback). 3 retries per call.</p>
          </div>
          <div>
            <p className="font-bold text-white">Auth</p>
            <p>NextAuth v4 · Credentials provider · JWT session strategy</p>
          </div>
          <div>
            <p className="font-bold text-white">Database</p>
            <p>PostgreSQL via Prisma ORM (Supabase)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
