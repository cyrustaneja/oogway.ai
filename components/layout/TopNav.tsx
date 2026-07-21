"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Dashboard",     href: "/dashboard" },
  { label: "Experts",       href: "/experts" },
  { label: "Batches",       href: "/batches" },
  { label: "Course Content",href: "/courses" },
];

export function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (session?.user?.name || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="h-[60px] sm:h-20 w-full bg-white border-b border-gray-100 sticky top-0 z-50 px-4 md:px-8 lg:px-12 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]">

        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Oogway Logo" className="w-9 h-9 sm:w-12 sm:h-12 object-contain" />
            </div>
            <div className="flex flex-col justify-center -ml-0.5">
              <p className="text-ks-navy font-black text-xl sm:text-2xl tracking-tighter leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Oogway
              </p>
              <p className="text-[var(--muted)] text-[9px] sm:text-[10px] font-bold tracking-[0.1em] uppercase leading-none mt-0.5 hidden sm:block">
                The Intelligence of KraftShala
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[15px] font-medium transition-colors relative",
                  isActive ? "text-[#E8A020]" : "text-[#4A4A4A] hover:text-[#E8A020]"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#E8A020] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-3 sm:gap-6">

          {/* Main CTA — desktop */}
          <Link
            href="/analysis/new"
            className="hidden md:flex btn-primary shadow-lg shadow-[#E8A020]/20 hover:-translate-y-0.5 py-2.5 px-6 text-sm"
          >
            Run Analysis
          </Link>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-200" />

          {/* User Profile — desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[13px] font-bold text-ks-navy">
                {session?.user?.name || "Administrator"}
              </span>
              <button
                onClick={() => signOut()}
                className="text-[10px] font-bold text-[var(--muted)] tracking-widest uppercase hover:text-brand-danger transition-colors flex items-center gap-1 mt-0.5"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>

            <div className="w-9 h-9 rounded-full bg-ks-navy flex items-center justify-center shadow-md">
              <span className="text-[11px] font-bold text-white tracking-wider">{initials}</span>
            </div>
          </div>

          {/* Mobile: avatar initials */}
          <div className="sm:hidden w-8 h-8 rounded-full bg-ks-navy flex items-center justify-center shadow-md">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-ks-navy bg-gray-50 rounded-lg border border-gray-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-72 bg-white h-full shadow-2xl flex flex-col pt-[60px]">
            <div className="p-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all",
                      isActive
                        ? "bg-brand-orange/10 text-brand-orange"
                        : "text-[#4A4A4A] hover:bg-gray-50 hover:text-brand-orange"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="px-6 pb-4">
              <Link
                href="/analysis/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full btn-primary py-3"
              >
                <Plus className="w-4 h-4" /> Run Analysis
              </Link>
            </div>

            <div className="mt-auto border-t border-gray-100 p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ks-navy flex items-center justify-center shadow-md shrink-0">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ks-navy truncate">{session?.user?.name || "Administrator"}</p>
                <button
                  onClick={() => signOut()}
                  className="text-[10px] font-bold text-[var(--muted)] tracking-widest uppercase hover:text-brand-danger transition-colors flex items-center gap-1 mt-0.5"
                >
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
