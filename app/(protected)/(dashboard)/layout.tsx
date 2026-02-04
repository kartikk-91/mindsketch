"use client";

import { Navbar } from "./_components/navbar";
import { OrgSidebar } from "./_components/org-sidebar";
import { Sidebar } from "./_components/sidebar";
import { DashboardProvider } from "./dashboard-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <DashboardProvider>
      <div className="h-screen w-full overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex h-full w-full">
          <div className="hidden lg:block w-[64px]" />

          <div className="flex h-full w-full">
            <div className="hidden lg:block">
              <OrgSidebar />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <Navbar />

              <main className="flex-1 overflow-y-auto bg-slate-50">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
};

export default DashboardLayout;
