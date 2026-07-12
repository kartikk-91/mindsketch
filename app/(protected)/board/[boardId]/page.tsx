"use client";

import { Canvas } from "./_components/canvas";
import { Room } from "@/components/room";
import { Loading } from "./_components/loading";
import { useEffect, useState } from "react";
import { useBoard } from "@/hooks/use-board";

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

  const { data: board, isLoading: loading } = useBoard(
    resolvedParams?.boardId ?? ""
  );

  if (!resolvedParams || loading || !board) {
    return <Loading />;
  }

  return (
    <Room
      roomId={resolvedParams.boardId}
      templateId={board.templateId || undefined}
      fallback={<Loading />}
    >
      <Canvas boardId={resolvedParams.boardId} />
    </Room>
  );
}
