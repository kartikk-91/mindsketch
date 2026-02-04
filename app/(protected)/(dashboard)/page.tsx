"use client";

import { BoardList } from "./_components/board-list";
import { EmptyOrg } from "./_components/empty-org";
import { useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export const dynamic = "force-dynamic";

const DashboardPage = () => {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();

  const query = useMemo<{
    search?: string;
    favorites?: true;
  }>(() => ({
    search: searchParams.get("search") ?? undefined,
    favorites:
      searchParams.get("favorites") === "true"
        ? true
        : undefined,
  }), [searchParams]);
  

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      {!organization ? (
        <EmptyOrg />
      ) : (
        <BoardList orgId={organization.id} query={query} />
      )}
    </div>
  );
};

export default DashboardPage;
