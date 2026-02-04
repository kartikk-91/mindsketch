"use client";
import { BoardList } from "./_components/board-list";
import { EmptyOrg } from "./_components/empty-org";
import { useOrganization } from "@clerk/nextjs";

interface DashboardPageProps {
  searchParams: Promise<{ search?: string; favorites?: string }>;
}

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

const DashboardPage = ({ searchParams }: DashboardPageProps) => {
  const { organization } = useOrganization();
  const [query, setQuery] = useState<{ search?: string; favorites?: string }>({});

  useEffect(() => {
    searchParams.then(params => setQuery(params));
  }, [searchParams]);

  

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
