import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardWrapper({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopNav title={title} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
