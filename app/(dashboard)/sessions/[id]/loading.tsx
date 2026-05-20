import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSessionAnalysis() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-3xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6 shadow-xl shadow-brand-orange/5">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight mb-2">
        Retrieving Insights
      </h2>
      <p className="text-xs font-bold text-[var(--muted)] tracking-widest uppercase">
        Fetching session transcript and pedagogical data...
      </p>
    </main>
  );
}
