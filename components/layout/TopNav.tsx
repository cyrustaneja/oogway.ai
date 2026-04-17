"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export function TopNav({ title }: { title: string }) {
  const { data: session } = useSession();

  // Format title from ALL CAPS to Title Case
  const formattedTitle = title.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[var(--background)]/60 backdrop-blur-[var(--glass-blur)] border-b border-[var(--card-border)] sticky top-0 z-40">
      <h2 className="text-sm font-bold tracking-tight text-[var(--foreground)] outfit">
        {formattedTitle}
      </h2>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[12px] font-bold text-[var(--foreground)]">
            {session?.user?.name || "Administrator"}
          </span>
          <span className="text-[10px] font-medium text-[var(--muted)] tracking-widest uppercase">
            Active Session
          </span>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-white/5 border border-[var(--card-border)] flex items-center justify-center text-[var(--muted)]">
          <span className="text-xs font-bold text-[var(--foreground)] uppercase">{session?.user?.name?.[0] || "A"}</span>
        </div>
      </div>
    </header>
  );
}
