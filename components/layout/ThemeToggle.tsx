"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("oogway-theme");
    if (stored === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("oogway-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white transition-colors group"
      title="Switch Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-brand-warning drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500" />
      )}
      <span className="text-[11px] font-bold tracking-widest uppercase">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
