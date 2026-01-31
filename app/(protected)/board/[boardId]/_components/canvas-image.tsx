"use client";

import { ImageLayer } from "@/types/canvas";
import { memo } from "react";

interface CanvasImageProps {
    id: string;
    layer: ImageLayer;
    onPointerDown: (e: React.PointerEvent, layerId: string) => void;
    selectionColor?: string;
}

export const CanvasImage = memo(
    ({ id, layer, onPointerDown, selectionColor }: CanvasImageProps) => {
        return (
            <g
                transform={`translate(${layer.x}, ${layer.y})`}
                onPointerDown={(e) => onPointerDown(e, id)}
            >
                <image
                    href={layer.src}
                    width={layer.width}
                    height={layer.height}
                    preserveAspectRatio="none"
                    role="presentation"
                    aria-label=""
                />

                {selectionColor && (
                    <rect
                        width={layer.width}
                        height={layer.height}
                        fill="none"
                        stroke={selectionColor}
                        strokeWidth={2}
                        pointerEvents="none"
                    />
                )}
            </g>
        );
    }
);

CanvasImage.displayName = "CanvasImage";
