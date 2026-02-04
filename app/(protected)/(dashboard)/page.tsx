"use client";

import { BoardList } from "./_components/board-list";
import { EmptyOrg } from "./_components/empty-org";
import { useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDashboard } from "./layout"; 
export const dynamic = "force-dynamic";

const DashboardPage = () => {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();
  const { view } = useDashboard(); 

  const query = useMemo(
    () => ({
      search: searchParams.get("search") ?? undefined,
      ...(view === "favorites" ? { favorites: true } : {}),
    }),
    [searchParams, view]
  );

  if (!organization) {
    return <EmptyOrg />;
  }

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      <BoardList orgId={organization.id} query={query} />
    </div>
  );
};

export default DashboardPage;
