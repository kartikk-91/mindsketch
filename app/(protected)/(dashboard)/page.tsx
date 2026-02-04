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

  const favoritesParam = searchParams.get("favorites");

const query = useMemo(() => ({
  search: searchParams.get("search") ?? undefined,
  ...(favoritesParam === "true" ? { favorites: true } : {}),
}), [searchParams,favoritesParam]);

  

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
