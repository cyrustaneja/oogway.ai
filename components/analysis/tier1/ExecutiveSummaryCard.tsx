'use client';

import React from 'react';
import { CheckCircle2, XCircle, Target, Sparkles } from 'lucide-react';
import { formatCoachingText } from '@/lib/utils/coaching-formatter';

export function ExecutiveSummaryCard({
  title,
  right,
  wrong,
  action,
  icon: Icon,
  badgeColor,
  mode = 'direct',
}: {
  title: string;
  right?: string;
  wrong?: string;
  action?: string;
  icon: any;
  badgeColor: string;
  mode?: 'direct' | 'coaching';
}) {
  if (!right && !wrong && !action) return null;

  const displayWrong = mode === 'coaching' ? formatCoachingText(wrong, 'wrong') : wrong;
  const displayAction = mode === 'coaching' ? formatCoachingText(action, 'action') : action;

  return (
    <div className="glass-card p-6 mb-8 border border-[var(--border)] relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 shadow-sm">
      <div className="flex items-center gap-3 mb-5 border-b border-[var(--border)] pb-4">
        <div className={`p-2.5 rounded-xl ${badgeColor} border border-[var(--border)]`}>
          <Icon className="w-5 h-5 text-[var(--foreground)]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">{title}</h3>
          <p className="text-[11px] text-[var(--muted)] font-medium">
            {mode === 'coaching' ? 'Constructive Growth & Executive Coaching Summary' : 'Executive overall session evaluation'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {right && (
          <div className="p-4 rounded-xl bg-[var(--chip-green-bg)] border border-[var(--chip-green-border)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--chip-green-text)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {mode === 'coaching' ? 'Core Strengths Demonstrated' : 'What Went Right'}
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--foreground)] leading-relaxed">{right}</p>
          </div>
        )}

        {wrong && (
          <div className="p-4 rounded-xl bg-[var(--chip-amber-bg)] border border-[var(--chip-amber-border)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--chip-amber-text)]">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {mode === 'coaching' ? 'Growth Opportunities' : 'Key Flaw / Gap'}
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--foreground)] leading-relaxed">{displayWrong}</p>
          </div>
        )}

        {action && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5 md:col-span-1">
            <div className="flex items-center gap-1.5 text-blue-900">
              <Target className="w-4 h-4 shrink-0 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {mode === 'coaching' ? 'Coaching Recommendation' : 'Top Action Item'}
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--foreground)] leading-relaxed">{displayAction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
