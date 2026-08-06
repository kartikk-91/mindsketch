"use client";

import { BoardList } from "../_components/board-list";
import { EmptyOrg } from "../_components/empty-org";
import { useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDashboard } from "../dashboard-context";

export const dynamic = "force-dynamic";

const DashboardPage = () => {
  const { organization, isLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const { view } = useDashboard();

  const query = useMemo(
    () => ({
      search: searchParams.get("search") ?? undefined,
      ...(view === "favorites" ? { favorites: true } : {}),
    }),
    [searchParams, view]
  );

  if (!isLoaded) {
    return (
      <div className="flex-1 h-[calc(100%-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#EEEEEE] border-t-[#20C5A8] animate-spin" />
          <p className="text-sm text-[#696969]">Loading workspaceâ€¦</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return <EmptyOrg />;
  }

  return (
    <div className="flex-1 h-[calc(100%-80px)]">
      <BoardList orgId={organization.id} query={query} />
    </div>
  );
};

export default DashboardPage;
