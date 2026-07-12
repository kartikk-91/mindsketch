"use client";
import { ReactNode, useMemo } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveMap, LiveList, LiveObject } from "@liveblocks/client";
import { Layer } from "@/types/canvas";
import { useTemplate } from "@/hooks/use-template";

type TemplateSnapshot = {
  layerIds: string[];
  layers: Record<string, Layer>;
};

interface RoomProps {
  children: ReactNode;
  roomId: string;
  fallback: NonNullable<ReactNode> | null;
  templateId?: string;
}

export const Room = ({
  children,
  roomId,
  fallback,
  templateId,
}: RoomProps) => {
  const { data: template, isLoading: loading } = useTemplate(templateId);

  const initialStorage = useMemo(() => {
   
    if (!template) {
      return {
        layers: new LiveMap<string, LiveObject<Layer>>(),
        layerIds: new LiveList<string>([]),
      };
    }

    const snapshot = template.snapshot as TemplateSnapshot;

    return {
      layers: new LiveMap(
        Object.entries(snapshot.layers).map(([id, layer]) => [
          id,
          new LiveObject(layer),
        ])
      ),
      layerIds: new LiveList<string>(snapshot.layerIds),
    };
  }, [template]);

  if (templateId && loading) {
    return fallback;
  }

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint="/api/liveblocks-auth"
    >
      <RoomProvider
        id={roomId}
        initialStorage={initialStorage}
        initialPresence={{
          cursor: null,
          selection: [],
          pencilDraft: null,
          penColor: null,
        }}
      >
        <ClientSideSuspense fallback={fallback}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
