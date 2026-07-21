"use client";

import React, { startTransition, memo } from "react";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Trash2, Loader2, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:       { label: "Queued",       color: "text-[var(--muted)]", dot: "bg-slate-500" },
  PREPROCESSING: { label: "Processing",   color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  EXTRACTING:    { label: "Scanning",     color: "text-brand-info",     dot: "bg-brand-info animate-pulse" },
  AGGREGATING:   { label: "Structuring",  color: "text-purple-400",     dot: "bg-purple-400 animate-pulse" },
  SYNTHESISING:  { label: "Synthesising", color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  COMPLETE:      { label: "Validated",    color: "text-brand-success",  dot: "bg-brand-success" },
  FAILED:        { label: "Error",        color: "text-brand-danger",   dot: "bg-brand-danger" },
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
    <div className="divide-y divide-[var(--card-border)] overflow-hidden">
      {sessions.map((a) => {
        const cfg = STATUS_CONFIG[a.v3Status] ?? STATUS_CONFIG.PENDING;
        const isDeleting = deletingId === a.id;

        const isPulseDone =
          Boolean(a.tier1Result) ||
          Boolean(a.tier1_result) ||
          Boolean(a.data?.tier1_result) ||
          Boolean(a.data?.expert_insights) ||
          Boolean(a.data?.overall_expert_summary) ||
          a.pipeline_stage === 'WAITING_FOR_DEEP_ANALYSIS' ||
          a.pipeline_stage === 'COMPLETE' ||
          (a.tier === 'TIER1' && a.v3Status === 'COMPLETE');

        let displayLabel = cfg.label;
        let statusDot = cfg.dot;
        let statusColor = cfg.color;

        if (isPulseDone) {
          displayLabel = 'Pulse Completed';
          statusDot = 'bg-brand-orange';
          statusColor = 'text-brand-orange font-bold';
        } else if (a.tier === 'TIER1') {
          if (a.v3Status === 'FAILED') {
            displayLabel = 'Pulse Processing';
            statusDot = 'bg-brand-warning animate-pulse';
            statusColor = 'text-brand-warning font-semibold';
          } else {
            displayLabel = `Pulse: ${cfg.label}`;
          }
        } else if (a.tier === 'TIER2') {
          if (a.v3Status === 'FAILED') {
            displayLabel = 'Analysis Processing';
            statusDot = 'bg-brand-warning animate-pulse';
            statusColor = 'text-brand-warning font-semibold';
          } else if (a.v3Status === 'COMPLETE') {
            displayLabel = 'Analysis Completed';
          } else {
            displayLabel = `Analysis: ${cfg.label}`;
          }
        }

        return (
          <div 
            key={a.id} 
            className={cn(
              "flex flex-col lg:grid lg:grid-cols-13 gap-4 lg:gap-4 px-6 lg:px-8 py-6 lg:py-5 items-start lg:items-center hover:bg-[var(--inner-bg)] transition-all duration-300 relative",
              isDeleting ? 'opacity-50 pointer-events-none' : ''
            )}
          >
            {/* Session Identity - Main Column */}
            <div className="col-span-4 min-w-0 w-full">
              <div className="flex items-start justify-between lg:block">
                <Link href={`/sessions/${a.id}`} className="group block min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-brand-orange transition-colors">
                    {a.name}
                  </p>
                </Link>
                {/* Mobile-only status indicator */}
                <div className="lg:hidden flex items-center gap-2 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>{displayLabel}</span>
                </div>
              </div>
              {a.sessionNote ? (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1.5 lg:mt-0.5">
                  <Link 
                    href={`/modules/${a.sessionNote.moduleId}`}
                    className="flex items-center gap-1 text-[10px] text-brand-orange hover:underline font-bold whitespace-nowrap"
                  >
                    <Target className="w-2.5 h-2.5" />
                    {a.sessionNote.module?.name || "Unmapped Topic"}
                  </Link>
                  <span className="hidden sm:inline text-[10px] text-[var(--muted)] opacity-40">·</span>
                  <Link 
                    href={`/session-notes/${a.sessionNoteId}`}
                    className="text-[10px] text-[var(--muted)] hover:text-brand-orange font-medium truncate italic hover:underline max-w-[200px]"
                  >
                    {a.sessionNote.name}
                  </Link>
                </div>
              ) : (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1 lg:mt-0.5 truncate font-medium uppercase tracking-widest">Standalone Analysis</p>
              )}
            </div>

            {/* Mobile Data Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 w-full lg:contents border-t border-[var(--inner-border)] lg:border-none pt-4 lg:pt-0">
              {/* Batch / Course */}
              <div className="lg:col-span-2 min-w-0 flex flex-col gap-1 lg:block">
                <span className="lg:hidden text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">Cohort</span>
                {a.batch?.name ? (
                  <Link 
                    href={`/batches/${a.batchId}`}
                    className="text-[11px] font-bold text-brand-orange hover:underline truncate block"
                  >
                    {a.batch.name}
                  </Link>
                ) : (
                  <span className="text-[10px] text-[var(--muted-foreground)] font-bold italic">Unassigned</span>
                )}
              </div>

              {/* Expert Partner */}
              <div className="lg:col-span-2 flex items-center gap-2 min-w-0">
                <span className="lg:hidden text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mr-1">Expert</span>
                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center text-[9px] lg:text-[10px] font-bold text-[var(--foreground)] shrink-0 shadow-sm capitalize">
                  {a.expert.name[0]}
                </div>
                <Link 
                  href={`/experts/${a.expertId}`}
                  className="text-[11px] font-bold text-[var(--foreground)] opacity-90 truncate hover:text-brand-orange transition-colors"
                >
                  {a.expert.name}
                </Link>
              </div>

              {/* Growth Status - Desktop Only Hidden Column */}
              <div className="hidden lg:flex lg:col-span-2 items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusDot} shadow-sm`} />
                <span className={`text-[11px] font-bold tracking-tight ${statusColor}`}>{displayLabel}</span>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-1 text-[11px] font-bold text-[var(--muted)] flex items-center gap-2">
                <span className="lg:hidden text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">Scanned</span>
                {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto lg:contents mt-4 lg:mt-0 pt-4 lg:pt-0 border-t border-[var(--inner-border)] lg:border-none">
              <Link 
                href={`/sessions/${a.id}`}
                className="lg:col-span-1 flex flex-1 lg:justify-end items-center group/arrow"
              >
                <div className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 lg:p-2.5 rounded-xl lg:rounded-full bg-brand-orange/5 lg:bg-[var(--inner-bg)] border border-brand-orange/10 lg:border-[var(--inner-border)] text-brand-orange lg:text-[var(--foreground)] dark:lg:text-[var(--muted-foreground)] group-hover/arrow:text-brand-orange transition-all group-hover/arrow:scale-110 shadow-sm">
                  <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-brand-orange lg:text-inherit">Open Analysis</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
              <div className="lg:col-span-1 flex justify-center items-center">
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  disabled={isDeleting}
                  className="p-3 lg:p-2.5 rounded-xl lg:rounded-full bg-brand-danger/5 border border-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-all hover:scale-110"
                  title="Delete Session"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
