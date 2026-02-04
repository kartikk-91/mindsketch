"use client";

import { Canvas } from "./_components/canvas";
import { Room } from "@/components/room";
import { Loading } from "./_components/loading";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const [resolvedParams, setResolvedParams] =
    useState<{ boardId: string } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  const board = useQuery(
    api.board.get,
    resolvedParams
      ? { id: resolvedParams.boardId as Id<"boards"> }
      : "skip"
  );

  if (!resolvedParams || !board) {
    return <Loading />;
  }

  return (
    <Room
      roomId={resolvedParams.boardId}
      templateId={board.templateId}
      fallback={<Loading />}
    >
      <Canvas boardId={resolvedParams.boardId} />
    </Room>
  );
}
