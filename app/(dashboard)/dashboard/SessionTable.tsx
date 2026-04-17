"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Trash2, Loader2, Target } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:       { label: "Queued",       color: "text-[var(--muted)]", dot: "bg-slate-500" },
  PREPROCESSING: { label: "Processing",   color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  EXTRACTING:    { label: "Scanning",     color: "text-brand-info",     dot: "bg-brand-info animate-pulse" },
  AGGREGATING:   { label: "Structuring",  color: "text-purple-400",     dot: "bg-purple-400 animate-pulse" },
  SYNTHESISING:  { label: "Synthesising", color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  COMPLETE:      { label: "Validated",    color: "text-brand-success",  dot: "bg-brand-success" },
  FAILED:        { label: "Draft Error",  color: "text-brand-danger",   dot: "bg-brand-danger" },
};

export function SessionTable({ initialSessions }: { initialSessions: any[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Move session "${name}" to the Recycle Bin? (It can be restored within 7 days)`)) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/analysis/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete session.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="px-6 py-20 text-center text-[var(--muted)] text-sm border-t border-[var(--card-border)]">
        No analysis sessions found in your roster.
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--card-border)]">
      {sessions.map((a) => {
        const cfg = STATUS_CONFIG[a.v3Status] ?? STATUS_CONFIG.PENDING;
        const isDeleting = deletingId === a.id;

        return (
          <div key={a.id} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-[var(--inner-bg)] transition-all duration-300 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="col-span-4 min-w-0">
              <p className="text-sm font-bold text-[var(--foreground)] truncate">{a.name}</p>
              {a.sessionNote ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Link 
                    href={`/modules/${a.sessionNote.moduleId}`}
                    className="flex items-center gap-1 text-[10px] text-brand-orange hover:underline font-bold whitespace-nowrap"
                  >
                    <Target className="w-2.5 h-2.5" />
                    {a.sessionNote.module?.name || "Unmapped Topic"}
                  </Link>
                  <span className="text-[10px] text-[var(--muted)] opacity-40">·</span>
                  <Link 
                    href={`/session-notes/${a.sessionNoteId}`}
                    className="text-[10px] text-[var(--muted)] hover:text-brand-orange font-medium truncate italic hover:underline"
                  >
                    {a.sessionNote.name}
                  </Link>
                </div>
              ) : (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 truncate font-medium">Standalone Analysis</p>
              )}
            </div>
            <div className="col-span-2 min-w-0">
              {a.batch?.name ? (
                <Link 
                  href={`/batches/${a.batchId}`}
                  className="text-[11px] font-bold text-brand-orange hover:underline truncate block"
                >
                  {a.batch.name}
                </Link>
              ) : (
                <span className="text-[10px] text-[var(--muted-foreground)] font-bold italic">No Batch Assigned</span>
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center text-[10px] font-bold text-[var(--foreground)] shrink-0 shadow-sm capitalize">
                {a.expert.name[0]}
              </div>
              <Link 
                href={`/experts/${a.expertId}`}
                className="text-[11px] font-bold text-[var(--foreground)] opacity-90 truncate hover:text-brand-orange transition-colors"
              >
                {a.expert.name}
              </Link>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dot} shadow-sm`} />
              <span className={`text-[11px] font-bold tracking-tight ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="col-span-1 text-[11px] font-bold text-[var(--muted)]">
              {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </div>
            <div className="col-span-1 flex justify-end items-center gap-3">
              <Link
                href={`/analysis/${a.id}`}
                className="p-2.5 rounded-full bg-[var(--inner-bg)] border border-[var(--inner-border)] text-[var(--muted-foreground)] hover:text-brand-orange transition-all hover:scale-110 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDelete(a.id, a.name)}
                disabled={isDeleting}
                className="p-2.5 rounded-full bg-brand-danger/5 border border-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-all hover:scale-110"
                title="Delete Session"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
