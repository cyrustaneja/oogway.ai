"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("oogway-theme");
    const initial = (stored === "dark" ? "dark" : "light") as "dark" | "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("oogway-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-2.5 w-full text-white/50 hover:text-white transition-colors group rounded-xl hover:bg-white/5 text-[12px] font-semibold"
      title="Switch Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-[#E8A020]" />
      ) : (
        <Moon className="w-4 h-4 text-white/50 group-hover:text-white/70" />
      )}
      <span className="tracking-wide">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
