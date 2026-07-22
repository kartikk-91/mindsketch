"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Point, Side, XYWH } from "@/types/canvas";
import { memo } from "react";

interface SelectionFrame {
  bounds: XYWH;
  rotation: number;
  translation: Point;
}

interface SelectionBoxProps {
  onResizeHandlePointerDown: (corner: Side, initialBounds: XYWH) => void;
  onRotateHandlePointerDown?: (e: React.PointerEvent, bounds: XYWH) => void;
  onSelectionPointerDown?: (e: React.PointerEvent) => void;
  rotation?: number;
  frame?: SelectionFrame | null;
}

const HANDLE_WIDTH = 8;
const ROTATE_HANDLE_OFFSET = 28;

function rotatedResizeCursor(base: "ew" | "ns" | "nwse" | "nesw", rotation: number) {
  const directions: Array<"ew" | "nesw" | "ns" | "nwse"> = ["ew", "nesw", "ns", "nwse"];
  const index = directions.indexOf(base);
  return `${directions[(index + Math.round(rotation / 45)) & 3]}-resize`;
}

export const SelectionBox = memo(({
  onResizeHandlePointerDown,
  onRotateHandlePointerDown,
  onSelectionPointerDown,
  rotation = 0,
  frame,
}: SelectionBoxProps) => {
  const selectionBounds = useSelectionBounds();
  const bounds = frame?.bounds ?? selectionBounds;
  if (!bounds) return null;

  const boxRotation = frame?.rotation ?? rotation;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const transform = frame
    ? `translate(${frame.translation.x} ${frame.translation.y}) rotate(${frame.rotation})`
    : `rotate(${boxRotation} ${cx} ${cy})`;
  const handles: Array<{ side: Side; x: number; y: number; cursor: "ew" | "ns" | "nwse" | "nesw" }> = [
    { side: Side.Top + Side.Left, x: bounds.x, y: bounds.y, cursor: "nwse" },
    { side: Side.Top, x: cx, y: bounds.y, cursor: "ns" },
    { side: Side.Top + Side.Right, x: bounds.x + bounds.width, y: bounds.y, cursor: "nesw" },
    { side: Side.Right, x: bounds.x + bounds.width, y: cy, cursor: "ew" },
    { side: Side.Bottom + Side.Right, x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: "nwse" },
    { side: Side.Bottom, x: cx, y: bounds.y + bounds.height, cursor: "ns" },
    { side: Side.Bottom + Side.Left, x: bounds.x, y: bounds.y + bounds.height, cursor: "nesw" },
    { side: Side.Left, x: bounds.x, y: cy, cursor: "ew" },
  ];

  return (
    <g transform={transform}>
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="transparent"
        stroke="#20C5A8"
        strokeWidth={1}
        pointerEvents={onSelectionPointerDown ? "all" : "none"}
        onPointerDown={onSelectionPointerDown}
      />
      {onRotateHandlePointerDown && (
        <>
          <line x1={cx} y1={bounds.y} x2={cx} y2={bounds.y - ROTATE_HANDLE_OFFSET} stroke="#20C5A8" strokeWidth={1} pointerEvents="none" />
          <circle
            cx={cx}
            cy={bounds.y - ROTATE_HANDLE_OFFSET}
            r={6}
            fill="white"
            stroke="#20C5A8"
            strokeWidth={2}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onRotateHandlePointerDown(e, bounds);
            }}
          />
        </>
      )}
      {handles.map(({ side, x, y, cursor }) => (
        <rect
          key={side}
          className="fill-white stroke-1 stroke-[#20C5A8]"
          x={x - HANDLE_WIDTH / 2}
          y={y - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          style={{ cursor: rotatedResizeCursor(cursor, boxRotation) }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeHandlePointerDown(side, bounds);
          }}
        />
      ))}
    </g>
  );
});

SelectionBox.displayName = "SelectionBox";
