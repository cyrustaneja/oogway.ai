import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardWrapper({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors duration-400">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col relative">
        <TopNav title={title} />
        {/* Large breathing space container */}
        <div className="flex-1 p-10 lg:p-12 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
