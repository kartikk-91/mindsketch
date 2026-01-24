"use client";
import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Side, XYWH } from "@/types/canvas";
import { memo } from "react";
interface SelectionBoxProps {
    onResizeHandlePointerDown: (corner: Side, intialBounds: XYWH) => void;
};

const HANDLE_WIDTH = 8;

export const SelectionBox = memo(({ onResizeHandlePointerDown }: SelectionBoxProps) => {
    
    const bounds = useSelectionBounds();
    if (!bounds) {
        return null;
    }
    return (
        <>
            <rect
                className="fill-white stroke-1 stroke-blue-500"
                style={{
                    cursor: "nwse-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "ns-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "nesw-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "ew-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height / 2 - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "nwse-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "ns-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "nesw-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`,
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
                    cursor: "ew-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height / 2 - HANDLE_WIDTH / 2}px)`,
                }}
                x={0}
                y={0}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onResizeHandlePointerDown(Side.Left, bounds);
                }}
            />
        </>
    )
})

SelectionBox.displayName = "SelectionBox";