import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-800 rounded-full" />
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
        Synchronising KraftShala Ecosystem...
      </p>
    </div>
  );
}
