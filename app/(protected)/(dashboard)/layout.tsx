"use client";

import { useState, createContext, useContext } from "react";
import { Navbar } from "./_components/navbar";
import { OrgSidebar } from "./_components/org-sidebar";
import { Sidebar } from "./_components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type DashboardView = "all" | "favorites";

type DashboardContextType = {
  view: DashboardView;
  setView: (v: DashboardView) => void;
};

export const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside DashboardLayout");
  }
  return ctx;
};


const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [view, setView] = useState<DashboardView>("all");

  return (
    <DashboardContext.Provider value={{ view, setView }}>
      <div className="h-screen w-full overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex h-full w-full">
          <div className="hidden lg:block w-[64px]" />

          <div className="flex h-full w-full">
            <div className="hidden lg:block">
              <OrgSidebar view={view} setView={setView} />
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
    </DashboardContext.Provider>
  );
};

export default DashboardLayout;
