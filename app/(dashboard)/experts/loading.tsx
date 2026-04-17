import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-900 rounded-lg animate-pulse" />
          <div className="h-3 w-32 bg-slate-900/50 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-800 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-6 h-64 flex flex-col space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-800/50 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-12 w-full bg-slate-900/30 rounded-lg animate-pulse" />
            <div className="mt-auto h-10 w-full border-t border-white/5 pt-4 flex justify-between">
              <div className="h-4 w-12 bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-12 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
