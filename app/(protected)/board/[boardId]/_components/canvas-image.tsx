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
        const {
            x,
            y,
            width,
            height,
            rotation = 0,
        } = layer;

        const cx = x + width / 2;
        const cy = y + height / 2;

        return (
            <g
                transform={`rotate(${rotation} ${cx} ${cy}) translate(${x}, ${y})`}
                onPointerDown={(e) => onPointerDown(e, id)}
            >
                <image
                    href={layer.src}
                    width={width}
                    height={height}
                    preserveAspectRatio="none"
                    role="presentation"
                    aria-label=""
                />

                {selectionColor && (
                    <rect
                        width={width}
                        height={height}
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
