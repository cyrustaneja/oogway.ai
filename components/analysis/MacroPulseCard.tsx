"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Zap, Award, AlertTriangle, Lightbulb, Users, CheckCircle2, Lock, RefreshCw, Calendar } from "lucide-react";
import { MacroPulseSummary } from "@/lib/server/macro-pulse-analyzer";

interface Props {
  targetType: 'course' | 'module' | 'batch' | 'expert';
  targetId: string;
  targetName: string;
  userRole?: string;
  initialSummary?: MacroPulseSummary | null;
}

export function MacroPulseCard({ targetType, targetId, targetName, userRole = "ADMIN", initialSummary = null }: Props) {
  const isAdmin = userRole === "ADMIN";
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MacroPulseSummary | null>(initialSummary);

  // Fetch saved Macro Analysis summary on mount
  useEffect(() => {
    if (!initialSummary && targetId) {
      fetch(`/api/macro-pulse?targetType=${targetType}&targetId=${targetId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.summary) {
            setSummary(data.summary);
          }
        })
        .catch(() => {});
    }
  }, [targetType, targetId, initialSummary]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/macro-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
      } else {
        alert(data.error || "Failed to generate Macro AI audit.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating Macro AI audit.");
    } finally {
      setLoading(false);
    }
  };

  const folderTitle = targetType.toUpperCase();

  return (
    <div className="glass-card p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8A020]/15 border border-[#E8A020]/30 text-[#E8A020]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[var(--foreground)] tracking-tight">
                10-Session Macro AI Audit — {targetName}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#E8A020] fill-current" /> {folderTitle} LEVEL
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] font-medium mt-0.5">
              Synthesizes past 10 Oogway Pulse session audits for overall engagement drivers, analogies, &amp; growth trends.
            </p>
          </div>
        </div>

        {/* Action Button for Admins vs Coming Soon for Team */}
        <div className="flex items-center gap-2 shrink-0">
          {!isAdmin ? (
            <span className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Lock className="w-3.5 h-3.5" /> 🚀 Coming Soon for Team
            </span>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#E8A020]/20 disabled:opacity-50 cursor-pointer transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing 10 Sessions...
                </>
              ) : summary ? (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-900" /> Regenerate &amp; Replace Audit
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-slate-900" /> Generate 10-Session Macro Audit
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Generated Summary Display */}
      {summary ? (
        <div className="space-y-4 animate-in fade-in duration-300 pt-1">
          {/* Health Score Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#E8A020]">Saved Macro Verdict</span>
                {summary.generatedAt && (
                  <span className="text-[9px] font-bold text-[var(--muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#E8A020]" /> Last updated {new Date(summary.generatedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-[var(--foreground)]">{summary.summaryTitle}</p>
              <p className="text-[10px] font-medium text-[var(--muted)]">Analyzed across {summary.sessionCount} Oogway Pulse sessions</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-1.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
                <span className="text-2xl font-black text-[#E8A020]">{summary.healthScore}</span>
                <span className="text-[9px] font-extrabold text-[var(--muted)] uppercase block">Score / 100</span>
              </div>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Strengths */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> Top Strengths Across 10 Sessions
              </span>
              <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                {summary.topStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Recurring Friction / Coaching Areas
              </span>
              <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                {summary.topImprovementAreas.map((a, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Best Analogies & Engagement Drivers */}
          {summary.bestAnalogiesUsed.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-[var(--border)] space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E8A020] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Top Tried-and-Tested Analogies in this {targetType}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {summary.bestAnalogiesUsed.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                    <span className="font-extrabold text-amber-900 text-[10px] block">🎯 {item.concept}</span>
                    <p className="italic text-[11px] font-bold text-slate-800">"{item.analogy}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Engaged Students (if available) */}
          {summary.topEngagedStudents && summary.topEngagedStudents.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" /> Top Participating Student Catalysts Across 10 Sessions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {summary.topEngagedStudents.map((name, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-950 text-[10px] font-bold shadow-2xs">
                    ⭐ {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview Banner for Initial State */
        <div className="p-4 rounded-xl bg-white/60 border border-[var(--border)] text-xs text-[var(--muted)] flex items-center justify-between">
          <p className="font-medium">
            Click <strong className="text-slate-900 font-bold">Generate 10-Session Macro Audit</strong> to run deep cross-session synthesis for this {targetType}.
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8A020] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Admins Enabled
          </span>
        </div>
      )}
    </div>
  );
}
