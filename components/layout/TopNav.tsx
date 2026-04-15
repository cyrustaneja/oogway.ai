"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export function TopNav({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#0F172A] border-b border-white/5 sticky top-0 z-40">
      <h2 className="text-sm font-bold tracking-widest uppercase text-white outfit">
        {title}
      </h2>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">
            {session?.user?.name || "ADMIN"}
          </span>
          <span className="text-[9px] font-medium text-slate-500 tracking-widest uppercase">
            ACTIVE SESSION
          </span>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
          <span className="text-xs font-bold text-white uppercase">{session?.user?.name?.[0] || "A"}</span>
        </div>
      </div>
    </header>
  );
}
