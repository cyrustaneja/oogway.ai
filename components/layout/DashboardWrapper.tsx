"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardWrapper({ children, title }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors duration-400">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <main className={cn(
        "flex-1 min-h-screen flex flex-col relative transition-all duration-300",
        "lg:ml-64" // Desktop fixed margin
      )}>
        <TopNav title={title} onMenuClick={() => setIsOpen(true)} />
        {/* Responsive padding container */}
        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-[100vw]">
          {children}
        </div>
      </main>
    </div>
  );
}
