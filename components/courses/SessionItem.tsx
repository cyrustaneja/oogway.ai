'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Clock, Users, CheckCircle2, Presentation, FileSpreadsheet, Award, ExternalLink, Brain, Sparkles } from 'lucide-react';

export function ResourceLink({ href, label, icon: Icon, color }: { href: string; label: string; icon: any; color: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80 ${color}`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </a>
  );
}

export function SessionItem({ sn }: { sn: any }) {
  return (
    <div className="group/sn p-4 sm:p-5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[#1D1D1F]/20 transition-all shadow-sm space-y-4">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[var(--layer-2)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <FileText className="w-5 h-5 text-[var(--foreground)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {sn.sessionId && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--layer-1)] border border-[var(--border)] text-[10px] font-bold text-[var(--muted)] font-mono shrink-0">
                  {sn.sessionId}
                </span>
              )}
              {sn.phase && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--chip-blue-bg)] border border-[var(--chip-blue-border)] text-[10px] font-bold text-[var(--chip-blue-text)]">
                  {sn.phase}
                </span>
              )}
              {sn.sessionType && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--chip-amber-bg)] border border-[var(--chip-amber-border)] text-[10px] font-bold text-[var(--chip-amber-text)]">
                  {sn.sessionType}
                </span>
              )}
              {sn.expertType && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--chip-darkgreen-bg)] border border-[var(--chip-darkgreen-border)] text-[10px] font-bold text-[var(--chip-darkgreen-text)] flex items-center gap-1">
                  <Users className="w-3 h-3" />{sn.expertType}
                </span>
              )}
              {sn.duration && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--layer-1)] border border-[var(--border)] text-[10px] font-bold text-[var(--muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />{sn.duration}m
                </span>
              )}
              {sn.evaluationRequired && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--chip-green-bg)] border border-[var(--chip-green-border)] text-[10px] font-bold text-[var(--chip-green-text)] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Eval
                </span>
              )}
            </div>
            <p className="text-[15px] font-semibold text-[var(--foreground)] tracking-tight break-words">{sn.name}</p>
          </div>
        </div>
        <Link
          href={`/session-notes/${sn.id}`}
          className="shrink-0 w-full sm:w-auto justify-center px-4 py-2 rounded-lg bg-[var(--layer-2)] border border-[var(--border)] text-[12px] font-semibold text-[var(--foreground)] hover:bg-[#1D1D1F] hover:text-white transition-all flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View Notes
        </Link>
      </div>

      {/* What to Teach */}
      {sn.content && (
        <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-[var(--chip-blue-bg)] border border-[var(--chip-blue-border)]">
          <Brain className="w-4 h-4 text-[var(--chip-blue-text)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-[var(--chip-blue-text)] uppercase tracking-widest mb-1">What to Teach (AI)</p>
            <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed line-clamp-3">{sn.content}</p>
          </div>
        </div>
      )}

      {/* Expert Brief */}
      {sn.expertBrief && (
        <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-[var(--chip-amber-bg)] border border-[var(--chip-amber-border)]">
          <Sparkles className="w-4 h-4 text-[var(--chip-amber-text)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-[var(--chip-amber-text)] uppercase tracking-widest mb-1">Expert Brief</p>
            <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed line-clamp-3">{sn.expertBrief}</p>
          </div>
        </div>
      )}

      {/* Resource Links */}
      {(sn.linkContent || sn.linkCharter || sn.linkModelSolution || sn.linkTest) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
          <ResourceLink href={sn.linkContent!} label="Slides" icon={Presentation} color="bg-[var(--chip-amber-bg)] border border-[var(--chip-amber-border)] text-[var(--chip-amber-text)]" />
          <ResourceLink href={sn.linkCharter!} label="Charter" icon={FileSpreadsheet} color="bg-[var(--chip-green-bg)] border border-[var(--chip-green-border)] text-[var(--chip-green-text)]" />
          <ResourceLink href={sn.linkModelSolution!} label="Model Solution" icon={CheckCircle2} color="bg-[var(--chip-blue-bg)] border border-[var(--chip-blue-border)] text-[var(--chip-blue-text)]" />
          <ResourceLink href={sn.linkTest!} label="MCQ Test" icon={Award} color="bg-[var(--chip-darkgreen-bg)] border border-[var(--chip-darkgreen-border)] text-[var(--chip-darkgreen-text)]" />
        </div>
      )}
    </div>
  );
}
