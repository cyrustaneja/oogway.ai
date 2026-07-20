"use client";

import { TopNav } from "./TopNav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardWrapper({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] transition-colors duration-400">
      <TopNav />
      
      <main className={cn(
        "flex-1 flex flex-col relative transition-all duration-300 w-full"
      )}>
        {/* Added a subtle page title banner if needed, otherwise content takes over */}
        
        {/* Responsive padding container */}
        <div className="flex-1 p-4 md:p-8 lg:px-12 lg:py-16 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
