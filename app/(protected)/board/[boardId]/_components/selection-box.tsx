"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Side, XYWH } from "@/types/canvas";
import { memo } from "react";

interface SelectionBoxProps {
  onResizeHandlePointerDown: (corner: Side, intialBounds: XYWH) => void;

  onRotateHandlePointerDown?: (
    e: React.PointerEvent,
    centerX: number,
    centerY: number
  ) => void;

  rotation?: number;
}

const HANDLE_WIDTH = 8;
const ROTATE_HANDLE_OFFSET = 28;

function rotatedResizeCursor(
  base: "ew" | "ns" | "nwse" | "nesw",
  rotation: number
) {
  const angle = ((rotation % 360) + 360) % 360;
  const snap = Math.round(angle / 90) % 4;

  const order: Array<"ew" | "nesw" | "ns" | "nwse"> = [
    "ew",
    "nesw",
    "ns",
    "nwse",
  ];

  const index = order.indexOf(base);
  return `${order[(index + snap) % 4]}-resize`;
}

export const SelectionBox = memo(
  ({
    onResizeHandlePointerDown,
    onRotateHandlePointerDown,
    rotation = 0,
  }: SelectionBoxProps) => {
    const bounds = useSelectionBounds();
    if (!bounds) return null;

    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const rotateHandleX = cx;
    const rotateHandleY = bounds.y - ROTATE_HANDLE_OFFSET;

    return (
      <g transform={`rotate(${rotation} ${cx} ${cy})`}>
                {onRotateHandlePointerDown && (
          <>
            <line
              x1={cx}
              y1={bounds.y}
              x2={rotateHandleX}
              y2={rotateHandleY}
              stroke="#2563eb"
              strokeWidth={1}
              pointerEvents="none"
            />
            <circle
              cx={rotateHandleX}
              cy={rotateHandleY}
              r={6}
              fill="white"
              stroke="#2563eb"
              strokeWidth={2}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onRotateHandlePointerDown(e, cx, cy);
              }}
            />
          </>
        )}

        
                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("nwse", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${
              bounds.y - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Top + Side.Left, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("ns", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, ${
              bounds.y - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Top, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("nesw", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${
              bounds.y - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Top + Side.Right, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("ew", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${
              bounds.y + bounds.height / 2 - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Right, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("nwse", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${
              bounds.y + bounds.height - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Bottom + Side.Right, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("ns", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, ${
              bounds.y + bounds.height - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Bottom, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("nesw", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${
              bounds.y + bounds.height - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Bottom + Side.Left, bounds);
          }}
        />

                <rect
          className="fill-white stroke-1 stroke-blue-500"
          style={{
            cursor: rotatedResizeCursor("ew", rotation),
            width: `${HANDLE_WIDTH}px`,
            height: `${HANDLE_WIDTH}px`,
            transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${
              bounds.y + bounds.height / 2 - HANDLE_WIDTH / 2
            }px)`,
          }}
          x={0}
          y={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(Side.Left, bounds);
          }}
        />
      </g>
    );
  }
);

SelectionBox.displayName = "SelectionBox";
