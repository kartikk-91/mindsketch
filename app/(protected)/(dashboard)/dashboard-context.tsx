"use client";

import { createContext, useContext, useState } from "react";

export type DashboardView = "all" | "favorites";

type DashboardContextType = {
  view: DashboardView;
  setView: (v: DashboardView) => void;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [view, setView] = useState<DashboardView>("all");

  return (
    <DashboardContext.Provider value={{ view, setView }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }
  return ctx;
};
