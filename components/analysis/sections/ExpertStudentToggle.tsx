"use client";

import React, { useState } from 'react';
import { SessionAnalysis } from '@/lib/types/analysis';
import { ExpertView } from './ExpertView';
import { StudentView } from './StudentView';
import { Award, Users } from 'lucide-react';

type Props = {
  data: SessionAnalysis;
};

export function ExpertStudentToggle({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'expert' | 'student'>('expert');

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--inner-bg)] border border-[var(--inner-border)] max-w-md mb-6 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('expert')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'expert'
              ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/25'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Expert Audit
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
            activeTab === 'student'
              ? 'bg-brand-info/15 text-brand-info border border-brand-info/25'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Student Log
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'expert' ? <ExpertView data={data} /> : <StudentView data={data} />}
      </div>
    </div>
  );
}
