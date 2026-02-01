/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Camera, Color } from "@/types/canvas";
import { useSelf, useMutation, useStorage } from "@liveblocks/react";
import { memo } from "react";
import { ColorPicker } from "./color-picker";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import { ColorToCSS } from "@/lib/utils";

interface SelectionToolsProps {
  camera: Camera;
  setLastUsedColor: (color: Color) => void;
}

export const SelectionTools = memo(
  ({ camera, setLastUsedColor }: SelectionToolsProps) => {
    const selection = useSelf((me) => me.presence.selection);
    const selectionBounds = useSelectionBounds();

    
    const selectedLayer = useStorage((root) => {
      const id = selection?.[0];
      return id ? root.layers.get(id) : null;
    });

       const currentStroke: Color | null =
      selectedLayer && "stroke" in selectedLayer && selectedLayer.stroke
        ? selectedLayer.stroke
        : null;

    
    const moveToBack = useMutation(
      ({ storage }) => {
        const liveLayerIds = storage.get("layerIds");
        const arr = liveLayerIds.toImmutable();

        arr.forEach((id, i) => {
          if (selection?.includes(id)) {
            liveLayerIds.move(i, 0);
          }
        });
      },
      [selection]
    );

    const moveToFront = useMutation(
      ({ storage }) => {
        const liveLayerIds = storage.get("layerIds");
        const arr = liveLayerIds.toImmutable();

        arr.forEach((id, i) => {
          if (selection?.includes(id)) {
            liveLayerIds.move(i, liveLayerIds.length - 1);
          }
        });
      },
      [selection]
    );

    
    const setFillColor = useMutation(
      ({ storage }, color: Color | null) => {
        const liveLayers = storage.get("layers");

        if (color) setLastUsedColor(color);

        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;

          layer.update({
            fill: color ?? undefined ,
          });
        });
      },
      [selection, setLastUsedColor]
    );

    
    const setStrokeColor = useMutation(
        ({ storage }, color: Color | null) => {
          const liveLayers = storage.get("layers");
      
          selection?.forEach((id) => {
            const layer = liveLayers.get(id);
            if (!layer) return;
      
            if (color) {
              layer.update({
                stroke: color,
                strokeWidth: 2,              });
            } else {
              layer.update({
                stroke: undefined,
                strokeWidth: 0,              });
            }
          });
        },
        [selection]
      );
      


    const deleteLayers = useDeleteLayers();

    if (!selectionBounds) return null;

    return (
      <div className="absolute top-[60px] h-28 ml-2 p-3 rounded-xl bg-white shadow-sm border flex items-center select-none gap-4">
                <div className="flex flex-col gap-1 pr-2 mr-2 border-r border-neutral-200">
          <span className="text-xs text-neutral-500">Color</span>
          <ColorPicker onChange={setFillColor} />
        </div>

                <div className="flex flex-col gap-1 pr-2 mr-2 border-r border-neutral-200">
          <span className="text-xs text-neutral-500">Border</span>

          <div className="grid grid-rows-2 gap-2">
                        <button
              title="Transparent border"
              className="w-8 h-8 rounded-md border border-neutral-300
                         bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)]
                         bg-[length:8px_8px]"
              onClick={() => setStrokeColor(null)}
            />

                        <label className="relative w-8 h-8 rounded-md border border-neutral-300 cursor-pointer">
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={currentStroke ? ColorToCSS(currentStroke) : "#000000"}
                onChange={(e) => {
                  const hex = e.target.value;
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  setStrokeColor({ r, g, b });
                }}
              />
              <div
                className="w-full h-full rounded-md"
                style={{
                  backgroundColor: currentStroke
                    ? ColorToCSS(currentStroke)
                    : "transparent",
                }}
              />
            </label>
          </div>
        </div>

                <div className="flex flex-col gap-y-0.5">
          <Hint label="Bring to Front">
            <Button variant="board" size="icon" onClick={moveToFront}>
              <BringToFront />
            </Button>
          </Hint>

          <Hint label="Send to Back">
            <Button variant="board" size="icon" onClick={moveToBack}>
              <SendToBack />
            </Button>
          </Hint>
        </div>

                <div className="flex items-center pl-2 ml-2 border-l h-full border-neutral-200">
          <Hint label="Delete">
            <Button variant="board" size="icon" onClick={deleteLayers}>
              <Trash2 />
            </Button>
          </Hint>
        </div>
      </div>
    );
  }
);

SelectionTools.displayName = "SelectionTools";
