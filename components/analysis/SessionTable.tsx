"use client";

import React, { startTransition, memo } from "react";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Trash2, Loader2, Target, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:       { label: "Processing",   color: "text-brand-warning font-semibold", dot: "bg-brand-warning animate-pulse" },
  PREPROCESSING: { label: "Processing",   color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  EXTRACTING:    { label: "Scanning",     color: "text-brand-info",     dot: "bg-brand-info animate-pulse" },
  AGGREGATING:   { label: "Structuring",  color: "text-purple-400",     dot: "bg-purple-400 animate-pulse" },
  SYNTHESISING:  { label: "Synthesising", color: "text-brand-warning",  dot: "bg-brand-warning animate-pulse" },
  COMPLETE:      { label: "Validated",    color: "text-brand-success",  dot: "bg-brand-success" },
  FAILED:        { label: "Error",        color: "text-brand-danger",   dot: "bg-brand-danger" },
};

export function SessionTable({ 
  initialSessions, 
  onClearFilters 
}: { 
  initialSessions: any[]; 
  onClearFilters?: () => void; 
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkRerunning, setBulkRerunning] = useState(false);

  // Sync internal state when initialSessions prop changes from filtering
  React.useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sessions.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Move session "${name}" to the Recycle Bin? (It can be restored within 7 days)`)) return;
    
    // OPTIMISTIC UI: Instantly remove item from state
    const previousSessions = [...sessions];
    const previousSelected = [...selectedIds];
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));

    try {
      const res = await fetch(`/api/analysis/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Rollback on error
        setSessions(previousSessions);
        setSelectedIds(previousSelected);
        const data = await res.json();
        alert(data.error || "Failed to delete session.");
      }
    } catch (err) {
      // Rollback on error
      setSessions(previousSessions);
      setSelectedIds(previousSelected);
      alert("An error occurred while deleting.");
    }
  };

  const handleRerun = async (id: string, name: string) => {
    if (!confirm(`Re-run analysis for "${name}"? Existing evaluation will be re-analysed and overwritten upon completion.`)) return;

    setRerunningId(id);
    try {
      const res = await fetch("/api/analysis/bulk-rerun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        // Update local session status to PENDING
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, v3Status: "PENDING", pipeline_stage: "UPLOADED" } : s))
        );
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to trigger re-analysis.");
      }
    } catch (err) {
      alert("An error occurred while triggering re-analysis.");
    } finally {
      setRerunningId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const toDeleteIds = [...selectedIds];
    if (!confirm(`Move ${toDeleteIds.length} selected session(s) to the Recycle Bin?`)) return;

    // OPTIMISTIC UI: Instantly remove all selected items from state
    const previousSessions = [...sessions];
    setSessions((prev) => prev.filter((s) => !toDeleteIds.includes(s.id)));
    setSelectedIds([]);

    setBulkDeleting(true);
    try {
      const res = await fetch("/api/trash/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analysisSession", ids: toDeleteIds }),
      });
      if (!res.ok) {
        // Rollback on error
        setSessions(previousSessions);
        setSelectedIds(toDeleteIds);
        const data = await res.json();
        alert(data.error || "Failed to delete selected sessions.");
      }
    } catch (err) {
      // Rollback on error
      setSessions(previousSessions);
      setSelectedIds(toDeleteIds);
      alert("An error occurred during bulk deletion.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkRerun = async () => {
    if (selectedIds.length === 0) return;
    const toRerunIds = [...selectedIds];
    if (!confirm(`Re-run analysis for ${toRerunIds.length} selected session(s)? Existing evaluation results will be overwritten upon completion.`)) return;

    setBulkRerunning(true);
    try {
      const res = await fetch("/api/analysis/bulk-rerun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: toRerunIds }),
      });

      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (toRerunIds.includes(s.id) ? { ...s, v3Status: "PENDING", pipeline_stage: "UPLOADED" } : s))
        );
        setSelectedIds([]);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to trigger bulk re-analysis.");
      }
    } catch (err) {
      alert("An error occurred during bulk re-analysis.");
    } finally {
      setBulkRerunning(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="px-6 py-16 text-center border-t border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/30">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-brand-orange flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Target className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">No sessions found matching your filters</h4>
        <p className="text-xs text-[var(--muted)] mb-5 max-w-sm mx-auto">
          Try expanding your search query or resetting your active module, batch, or status filters.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-brand-orange hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        )}
      </div>
    );
  }

  const allSelected = sessions.length > 0 && selectedIds.length === sessions.length;

  return (
    <div className="space-y-0">
      {/* Table Selection Header */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-2.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-[var(--card-border)] text-xs font-bold text-[var(--muted)]">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer"
          />
          <span className="text-slate-700 dark:text-slate-300 font-extrabold">{allSelected ? "Deselect All Sessions" : "Select All Sessions"}</span>
        </label>

        {selectedIds.length > 0 && (
          <span className="text-[11px] font-black text-brand-orange">
            {selectedIds.length} of {sessions.length} selected
          </span>
        )}
      </div>

      <div className="divide-y divide-[var(--card-border)] overflow-hidden">
        {sessions.map((a) => {
          const cfg = STATUS_CONFIG[a.v3Status] ?? STATUS_CONFIG.PENDING;
          const isDeleting = deletingId === a.id;
          const isRerunning = rerunningId === a.id;
          const isChecked = selectedIds.includes(a.id);

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
                "flex flex-col lg:grid lg:grid-cols-13 gap-4 lg:gap-4 px-6 lg:px-8 py-4 lg:py-4 items-start lg:items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 relative",
                isDeleting || isRerunning ? 'opacity-50 pointer-events-none' : '',
                isChecked ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
              )}
            >
              {/* Checkbox & Session & Module Identity (col-span-4) */}
              <div className="col-span-4 min-w-0 w-full flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelectOne(a.id)}
                  className="w-4 h-4 mt-1 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Top Line: Module Badge & Session Note Topic */}
                  {a.sessionNote ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link 
                        href={`/modules/${a.sessionNote.moduleId || a.sessionNote.module?.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-brand-orange hover:bg-amber-500/20 font-extrabold text-[10px] uppercase tracking-wider transition-colors shrink-0"
                      >
                        <Target className="w-3 h-3 shrink-0 text-brand-orange" />
                        <span>{a.sessionNote.module?.name || "Unmapped Topic"}</span>
                      </Link>
                      <span className="text-[10px] text-[var(--muted)] opacity-60">•</span>
                      <Link 
                        href={`/session-notes/${a.sessionNoteId}`}
                        className="text-[11px] text-[var(--muted)] hover:text-brand-orange font-medium truncate max-w-[200px]"
                        title={a.sessionNote.name}
                      >
                        {a.sessionNote.name}
                      </Link>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      Standalone Analysis
                    </span>
                  )}

                  {/* Bottom Line: Session Name */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/sessions/${a.id}`} className="group block min-w-0">
                      <p className="text-sm font-extrabold text-[var(--foreground)] truncate group-hover:text-brand-orange transition-colors">
                        {a.name}
                      </p>
                    </Link>
                    {a.analysisType === "EVALUATION" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-100 text-violet-800 border border-violet-300 uppercase tracking-wide shrink-0">
                        {a.evaluationConfig?.evaluationType ?? "EVALUATION"}
                      </span>
                    )}
                  </div>

                  {/* Mobile-only status indicator */}
                  <div className="lg:hidden flex items-center gap-2 pt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>{displayLabel}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Data Wrapper / Desktop Content */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 w-full lg:contents border-t border-[var(--inner-border)] lg:border-none pt-3 lg:pt-0">
                {/* Batch / Course (col-span-2) */}
                <div className="lg:col-span-2 min-w-0 flex flex-col gap-1 lg:block">
                  <span className="lg:hidden text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">Cohort</span>
                  {a.batch?.name ? (
                    <Link 
                      href={`/batches/${a.batchId}`}
                      className="text-[12px] font-bold text-brand-orange hover:underline truncate block"
                    >
                      {a.batch.name}
                    </Link>
                  ) : (
                    <span className="text-[11px] text-[var(--muted-foreground)] font-medium italic">Unassigned</span>
                  )}
                </div>

                {/* Expert Partner (col-span-3) */}
                <div className="lg:col-span-3 flex items-center gap-2.5 min-w-0">
                  <span className="lg:hidden text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mr-1">Expert</span>
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-extrabold text-[var(--foreground)] shrink-0 shadow-sm capitalize">
                    {a.expert?.name?.[0] || "?"}
                  </div>
                  <Link 
                    href={`/experts/${a.expertId}`}
                    className="text-[12px] font-bold text-[var(--foreground)] opacity-90 truncate hover:text-brand-orange transition-colors"
                  >
                    {a.expert?.name || "Unassigned"}
                  </Link>
                </div>

                {/* Growth Status (col-span-2) */}
                <div className="hidden lg:flex lg:col-span-2 items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusDot} shadow-sm`} />
                  <span className={`text-[11px] font-bold tracking-tight ${statusColor}`}>{displayLabel}</span>
                </div>

                {/* Timeline (col-span-1) */}
                <div className="lg:col-span-1 text-[11px] font-semibold text-[var(--muted)] flex items-center gap-2">
                  <span className="lg:hidden text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">Conducted</span>
                  {new Date(a.conductedAt || a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </div>
              </div>

              {/* Actions (col-span-1) */}
              <div className="flex items-center justify-end gap-1.5 w-full lg:w-auto lg:col-span-1 mt-3 lg:pt-0 border-t border-[var(--inner-border)] lg:border-none">
                <Link 
                  href={`/sessions/${a.id}`}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange text-slate-600 dark:text-slate-300 transition-all hover:scale-105 shadow-sm"
                  title="Open Session Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleRerun(a.id, a.name)}
                  disabled={isRerunning || isDeleting}
                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-brand-orange hover:bg-amber-100 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  title="Re-run / Re-analyse Session"
                >
                  {isRerunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  disabled={isDeleting || isRerunning}
                  className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  title="Delete Session"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING ACTION BAR FOR BULK RE-RUN & BULK DELETION */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
          <span className="text-xs font-bold whitespace-nowrap">
            <span className="text-brand-orange font-black">{selectedIds.length}</span> session(s) selected
          </span>

          <div className="h-4 w-px bg-slate-700" />

          {/* Bulk Re-Run Button */}
          <button
            onClick={handleBulkRerun}
            disabled={bulkRerunning || bulkDeleting}
            className="px-4 py-2 bg-brand-orange hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {bulkRerunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>Re-Run Selected</span>
          </button>

          {/* Bulk Delete Button */}
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting || bulkRerunning}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete Selected</span>
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors ml-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
