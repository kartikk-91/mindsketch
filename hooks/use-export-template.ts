// hooks/use-export-template.ts
import { useRoom } from "@liveblocks/react";
import { Layer } from "@/types/canvas";
import { LiveObject } from "@liveblocks/client";

export function useExportTemplate() {
  const room = useRoom();

  return async () => {
    const { root } = await room.getStorage();

    const layers = root.get("layers");
    const layerIds = root.get("layerIds");

    const snapshot = {
      layerIds: layerIds.toArray(),
      layers: Object.fromEntries(
        Array.from(layers.entries()).map(
          ([id, layer]: [string, LiveObject<Layer>]) => [
            id,
            layer.toObject(),
          ]
        )
      ) as Record<string, Layer>,
    };

    console.log("===== TEMPLATE SNAPSHOT =====");
    console.log(JSON.stringify(snapshot, null, 2));

    return snapshot;
  };
}
