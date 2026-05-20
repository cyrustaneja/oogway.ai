import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingBatchDetails() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-3xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex items-center justify-center mb-6 shadow-xl">
        <Loader2 className="w-8 h-8 text-[var(--muted-foreground)] animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight mb-2">
        Loading Cohort Data
      </h2>
      <p className="text-xs font-bold text-[var(--muted)] tracking-widest uppercase">
        Fetching aggregate metrics and sessions...
      </p>
    </main>
  );
}
