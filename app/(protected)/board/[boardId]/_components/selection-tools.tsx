/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Camera, Color, LayerType } from "@/types/canvas";
import { useSelf } from "@liveblocks/react";
import { memo } from "react";
import { ColorPicker } from "./color-picker";
import { useMutation } from "@liveblocks/react";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";

interface SelectionToolsProps {
    camera: Camera;
    setLastUsedColor: (color: Color) => void;
}

export const SelectionTools = memo(
    ({ camera, setLastUsedColor }: SelectionToolsProps) => {
        const selection = useSelf((me) => me.presence.selection);
        const selectionBounds = useSelectionBounds();

        

        const moveToBack = useMutation(
            ({ storage }) => {
                const liveLayerIds = storage.get("layerIds");
                const indices: number[] = [];

                const arr = liveLayerIds.toImmutable();
                for (let i = 0; i < arr.length; i++) {
                    if (selection?.includes(arr[i])) {
                        indices.push(i);
                    }
                }

                for (let i = 0; i < indices.length; i++) {
                    liveLayerIds.move(indices[i], i);
                }
            },
            [selection]
        );

        const moveToFront = useMutation(
            ({ storage }) => {
                const liveLayerIds = storage.get("layerIds");
                const indices: number[] = [];

                const arr = liveLayerIds.toImmutable();
                for (let i = 0; i < arr.length; i++) {
                    if (selection?.includes(arr[i])) {
                        indices.push(i);
                    }
                }

                for (let i = 0; i < indices.length; i++) {
                    liveLayerIds.move(indices[i], liveLayerIds.length - 1);
                }
            },
            [selection]
        );

        

        const setColor = useMutation(
            ({ storage }, color: Color) => {
                const liveLayers = storage.get("layers");

                               setLastUsedColor(color);

                selection?.forEach((id) => {
                    const layer = liveLayers.get(id);
                    if (!layer) return;

                    const type = layer.get("type");

                    if (type === LayerType.Shape) {
                        layer.update({
                            fill: color, 
                        });
                    } else {
                        layer.update({
                            fill: color,
                        });
                    }

                });
            },
            [selection, setLastUsedColor]
        );

        const deleteLayers = useDeleteLayers();

        if (!selectionBounds) {
            return null;
        }

        

        return (
            <div
                className="absolute top-[60px] ml-2 p-3 rounded-xl bg-white shadow-sm border flex select-none"
                
            >
                <ColorPicker onChange={setColor} />

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

                <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
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
