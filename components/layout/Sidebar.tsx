"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { 
  PlusCircle, 
  BarChart2, 
  Users, 
  FilePlus, 
  Trash2, 
  Settings, 
  LogOut,
  ChevronRight,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

const navItems = [
  { label: "All Analysis", href: "/dashboard", icon: BarChart2 },
  { label: "Experts", href: "/experts", icon: Users },
  { label: "Batches", href: "/batches", icon: LayoutGrid },
  { label: "Course Content", href: "/courses", icon: FilePlus },
  { label: "Recycle Bin", href: "/recycle-bin", icon: Trash2 },
  { label: "Control Panel", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[var(--sidebar-bg)] backdrop-blur-[var(--glass-blur)] border-r border-[var(--card-border)] flex flex-col p-6 fixed left-0 top-0 z-50 shadow-2xl">
      {/* Glossy Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent dark:from-white/0" />
      
      {/* Logo Section */}
      <div className="mb-10 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20">
            <div className="w-4 h-4 rounded-sm bg-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] outfit">Oogway <span className="text-brand-orange">AI</span></h1>
        </div>
        <div className="flex items-center gap-1.5 opacity-50 ml-1">
          <span className="text-[10px] font-bold tracking-widest text-[var(--muted)]">Powered By</span>
          <span className="text-[10px] font-extrabold text-[var(--foreground)] tracking-widest">KRAFTSHALA</span>
        </div>
      </div>

      {/* Node Badge */}
      <div className="mb-8 pl-4 pr-3 py-2 bg-white/20 dark:bg-white/5 rounded-full border border-[var(--card-border)] flex items-center gap-3 relative z-10">
        <div className="w-2 h-2 rounded-full bg-brand-warning animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        <span className="text-[10px] font-bold text-[var(--muted)] tracking-widest">Admin Node <span className="text-[var(--foreground)]">#042</span></span>
      </div>

      {/* Primary Action */}
      <Link 
        href="/analysis/new"
        className="group relative flex items-center justify-center gap-3 w-full py-3.5 bg-brand-orange text-white rounded-full font-bold text-xs tracking-wider mb-8 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-orange/30 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <PlusCircle className="w-5 h-5 relative z-10" />
        <span className="relative z-10">Oogway Analysis</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 relative z-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-brand-orange/10 text-brand-orange shadow-sm" 
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/10"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-brand-orange" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]")} />
              <span className="text-[12px] font-semibold tracking-wide">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full shadow-[2px_0_8px_rgba(243,112,33,0.5)]" 
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Themes & Sign Out */}
      <div className="pt-4 border-t border-[var(--card-border)] space-y-1 relative z-10">
        <ThemeToggle />
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full text-[var(--muted)] hover:text-brand-danger transition-colors group"
        >
          <LogOut className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-brand-danger" />
          <span className="text-[12px] font-semibold tracking-wide">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
