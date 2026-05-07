import { useSession } from "next-auth/react";
import { User, Menu, X } from "lucide-react";

export function TopNav({ title, onMenuClick }: { title: string, onMenuClick?: () => void }) {
  const { data: session } = useSession();

  // Format title from ALL CAPS to Title Case
  const formattedTitle = title.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-[var(--background)]/60 backdrop-blur-[var(--glass-blur)] border-b border-[var(--card-border)] sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-[var(--card-border)] text-[var(--muted)] hover:text-brand-orange transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold tracking-tight text-[var(--foreground)] outfit truncate max-w-[120px] md:max-w-none">
          {formattedTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[12px] font-bold text-[var(--foreground)]">
            {session?.user?.name || "Administrator"}
          </span>
          <span className="text-[10px] font-medium text-[var(--muted)] tracking-widest uppercase">
            Active Session
          </span>
        </div>
        
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 dark:bg-white/5 border border-[var(--card-border)] flex items-center justify-center text-[var(--muted)]">
          <span className="text-xs font-bold text-[var(--foreground)] uppercase">{session?.user?.name?.[0] || "A"}</span>
        </div>
      </div>
    </header>
  );
}
