"use client";

import { Canvas } from "./_components/canvas";
import { Room } from "@/components/room";
import { Loading } from "./_components/loading";
import { useEffect, useState } from "react";

export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ boardId: string } | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  if (!resolvedParams) {
    return <Loading />;
  }

  return (
    <Room roomId={resolvedParams.boardId} fallback={<Loading />}>
      <Canvas boardId={resolvedParams.boardId} />
    </Room>
  );
}
