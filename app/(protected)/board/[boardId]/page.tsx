"use client";

import { Canvas } from "./_components/canvas";
import { Room } from "@/components/room";
import { Loading } from "./_components/loading";
import { BoardAccessState } from "./_components/board-access-state";
import { useEffect, useState } from "react";
import { BoardRequestError, useBoard } from "@/hooks/use-board";
import { resolveBoardAppearance } from "@/lib/board-appearance";

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

  const { data: board, error, isLoading: loading } = useBoard(
    resolvedParams?.boardId ?? ""
  );

  if (!resolvedParams || loading) {
    return <Loading />;
  }

  if (error || !board) {
    const status = error instanceof BoardRequestError ? error.status : 500;
    return <BoardAccessState status={status} />;
  }
  const appearance = resolveBoardAppearance(board.backgroundPattern, board.colorTheme);

  return (
    <Room
      roomId={resolvedParams.boardId}
      templateId={board.templateId || undefined}
      fallback={<Loading />}
    >
      <Canvas boardId={resolvedParams.boardId} backgroundPattern={appearance.backgroundPattern} colorTheme={appearance.colorTheme} />
    </Room>
  );
}
