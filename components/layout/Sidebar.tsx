"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navItems = [
  { label: "ALL ANALYSIS", href: "/dashboard", icon: BarChart2 },
  { label: "EXPERTS", href: "/experts", icon: Users },
  { label: "BATCHES", href: "/batches", icon: LayoutGrid },
  { label: "ADD SESSION", href: "/courses", icon: FilePlus },
  { label: "RECYCLE BIN", href: "/recycle-bin", icon: Trash2 },
  { label: "CONTROL PANEL", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#0F172A] border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-50">
      {/* Logo Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white outfit">OOGWAY <span className="text-brand-orange">AI</span></h1>
        </div>
        <div className="flex items-center gap-1.5 opacity-50 ml-1">
          <span className="text-[10px] font-medium tracking-widest text-slate-400">POWERED BY</span>
          <span className="text-[10px] font-bold text-white tracking-widest">KRAFTSHALA</span>
        </div>
      </div>

      {/* Node Badge */}
      <div className="mb-8 pl-4 pr-3 py-2 bg-slate-800/40 rounded-full border border-white/5 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-brand-warning animate-pulse" />
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ADMIN NODE <span className="text-white">#042</span></span>
      </div>

      {/* Primary Action */}
      <Link 
        href="/analysis/new"
        className="group relative flex items-center justify-center gap-3 w-full py-3.5 bg-brand-orange text-white rounded-full font-bold text-xs tracking-wider mb-8 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-orange/20"
      >
        <PlusCircle className="w-5 h-5" />
        OOGWAY ANALYSIS
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/5 text-brand-orange" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-brand-orange" : "text-slate-500 group-hover:text-white")} />
              <span className="text-[11px] font-bold tracking-widest uppercase">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-brand-orange rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="pt-6 border-t border-white/5">
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-brand-danger transition-colors group"
        >
          <LogOut className="w-5 h-5 text-slate-500 group-hover:text-brand-danger" />
          <span className="text-[11px] font-bold tracking-widest uppercase">SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
