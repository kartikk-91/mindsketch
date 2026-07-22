/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ToolButton } from "./tool-button";
import {
  Circle,
  MousePointer2,
  Pencil,
  Eraser,
  WandSparkles,
  Redo2,
  Square,
  StickyNote,
  Type,
  Undo2,
  Image as ImageIcon,
  Loader2,
  Shapes,
  Minus,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  MoveHorizontal,
  Code2,
  Diamond,
  Triangle,
  Star,
  Pill,
  Cloud,
  Heart,
  Hexagon,
  MessageSquare,
  FileText,
  Database,
  Box,
  Pyramid,
  Cone,
  ZoomIn,
  ZoomOut,
  RefreshCcw,
  GitFork,
} from "lucide-react";

import {
  CanvasMode,
  CanvasState,
  LayerType,
  ShapeType,
} from "@/types/canvas";
import { useRef, useState, useEffect } from "react";
import { CylinderIcon, ParallelogramIcon } from "./shape.icons";
import { useImageUpload } from "@/hooks/use-image-upload";

interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  penSize: number;
  setPenSize: (size: number) => void;
  penColor: { r: number; g: number; b: number };
  setPenColor: (color: { r: number; g: number; b: number }) => void;
  smartDrawing: boolean;
  setSmartDrawing: (enabled: boolean) => void;
}


export const Toolbar = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  zoomIn,
  zoomOut,
  resetZoom,
  penSize,
  setPenSize,
  penColor,
  setPenColor,
  smartDrawing,
  setSmartDrawing,
}: ToolbarProps) => {

  const shapePopoverRef = useRef<HTMLDivElement>(null);

  const [isShapeOpen, setIsShapeOpen] = useState(false);
  const { pickImage, isUploading } = useImageUpload();



  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsShapeOpen(false);
      }
    };

    const onClickOutside = (e: MouseEvent) => {
      if (
        shapePopoverRef.current &&
        !shapePopoverRef.current.contains(e.target as Node)
      ) {
        setIsShapeOpen(false);
      }
    };

    if (isShapeOpen) {
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("mousedown", onClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [isShapeOpen]);



  const insertShape = (shape: ShapeType) => {
    setCanvasState({
      mode: CanvasMode.Inserting,
      layertype: LayerType.Shape,
      shape,
    });
    setIsShapeOpen(false);
  };

  return (
    <>
      <div className="absolute top-1/2 left-4 z-20 -translate-y-1/2 flex flex-col gap-3">
        <div className="relative flex flex-col items-center gap-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
          <ToolButton
            label="Select"
            icon={MousePointer2}
            onClick={() => setCanvasState({ mode: CanvasMode.None })}
            isActive={
              canvasState.mode === CanvasMode.None ||
              canvasState.mode === CanvasMode.Translating ||
              canvasState.mode === CanvasMode.SelectionNet ||
              canvasState.mode === CanvasMode.Resizing ||
              canvasState.mode === CanvasMode.Pressing
            }
          />

          <ToolButton
            label="Text"
            icon={Type}
            onClick={() =>
              setCanvasState({
                mode: CanvasMode.Inserting,
                layertype: LayerType.Text,
              })
            }
            isActive={
              canvasState.mode === CanvasMode.Inserting &&
              canvasState.layertype === LayerType.Text
            }
          />

          <ToolButton
            label="Sticky Note"
            icon={StickyNote}
            onClick={() =>
              setCanvasState({
                mode: CanvasMode.Inserting,
                layertype: LayerType.Note,
              })
            }
            isActive={
              canvasState.mode === CanvasMode.Inserting &&
              canvasState.layertype === LayerType.Note
            }
          />

          <div className="relative" ref={shapePopoverRef}>
            <ToolButton
              label="Shape"
              icon={Shapes}
              onClick={() => setIsShapeOpen((v) => !v)}
              isActive={isShapeOpen}
            />

            {isShapeOpen && (
              <div
                className="
                absolute left-full ml-2 top-0
                bg-white rounded-md shadow-lg
                p-2 z-50
                grid grid-cols-4 gap-1
                w-[216px]
              "
              >
                <ToolButton label="Rectangle" icon={Square} onClick={() => insertShape(ShapeType.Rectangle)} />
                <ToolButton label="Ellipse" icon={Circle} onClick={() => insertShape(ShapeType.Ellipse)} />
                <ToolButton label="Line" icon={Minus} onClick={() => insertShape(ShapeType.Line)} />
                <ToolButton label="Right arrow" icon={ArrowRight} onClick={() => insertShape(ShapeType.Arrow)} />
                <ToolButton label="Left arrow" icon={ArrowLeft} onClick={() => insertShape(ShapeType.ArrowLeftLine)} />
                <ToolButton label="Double-sided arrow" icon={MoveHorizontal} onClick={() => insertShape(ShapeType.ArrowBidirectionalLine)} />
                <ToolButton label="Right block arrow" icon={ArrowRight} onClick={() => insertShape(ShapeType.ArrowRight)} />
                <ToolButton label="Left block arrow" icon={ArrowLeft} onClick={() => insertShape(ShapeType.ArrowLeft)} />
                <ToolButton label="Double-sided block arrow" icon={ArrowLeftRight} onClick={() => insertShape(ShapeType.ArrowBidirectional)} />
                <ToolButton label="Diamond" icon={Diamond} onClick={() => insertShape(ShapeType.Diamond)} />
                <ToolButton label="Triangle" icon={Triangle} onClick={() => insertShape(ShapeType.Triangle)} />
                <ToolButton label="Star" icon={Star} onClick={() => insertShape(ShapeType.Star)} />
                <ToolButton label="Capsule" icon={Pill} onClick={() => insertShape(ShapeType.Capsule)} />
                <ToolButton label="Parallelogram" icon={ParallelogramIcon} onClick={() => insertShape(ShapeType.Parallelogram)} />
                <ToolButton label="Cylinder" icon={CylinderIcon} onClick={() => insertShape(ShapeType.Cylinder)} />
                <ToolButton label="Cloud" icon={Cloud} onClick={() => insertShape(ShapeType.Cloud)} />
                <ToolButton label="Pentagon" icon={Shapes} onClick={() => insertShape(ShapeType.Pentagon)} />
                <ToolButton label="Hexagon" icon={Hexagon} onClick={() => insertShape(ShapeType.Hexagon)} />
                <ToolButton label="Heart" icon={Heart} onClick={() => insertShape(ShapeType.Heart)} />
                <ToolButton label="Speech bubble" icon={MessageSquare} onClick={() => insertShape(ShapeType.SpeechBubble)} />
                <ToolButton label="Document" icon={FileText} onClick={() => insertShape(ShapeType.Document)} />
                <ToolButton label="Database" icon={Database} onClick={() => insertShape(ShapeType.Database)} />
                <ToolButton label="Cube" icon={Box} onClick={() => insertShape(ShapeType.Cube)} />
                <ToolButton label="Pyramid" icon={Pyramid} onClick={() => insertShape(ShapeType.Pyramid)} />
                <ToolButton label="Cone" icon={Cone} onClick={() => insertShape(ShapeType.Cone)} />
                <ToolButton label="Code" icon={Code2} showHint={false} onClick={() => insertShape(ShapeType.Code)} />
              </div>
            )}
          </div>

          <ToolButton
            label={isUploading ? "Uploading..." : "Image"}
            icon={isUploading ? Loader2 : ImageIcon}
            onClick={pickImage}
            isDisabled={isUploading}
            isActive={
              canvasState.mode === CanvasMode.Inserting &&
              canvasState.layertype === LayerType.Image
            }
          />

          <ToolButton
            label="Pen"
            icon={Pencil}
            onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
            isActive={canvasState.mode === CanvasMode.Pencil}
          />
          <ToolButton
            label="Connect shapes"
            icon={GitFork}
            onClick={() => setCanvasState({ mode: CanvasMode.Connecting })}
            isActive={canvasState.mode === CanvasMode.Connecting}
          />
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-neutral-200/80 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur">
          <ToolButton label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
          <ToolButton label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
        </div>
      </div>
      {(canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Erasing) && (
        <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 border border-b-0 border-neutral-200/80 bg-white/95 px-5 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.14)] backdrop-blur [clip-path:polygon(7%_0,93%_0,100%_100%,0_100%)]">
          <div className="flex rounded-xl bg-neutral-100 p-1">
            <button aria-label="Pen" onClick={() => setCanvasState({ mode: CanvasMode.Pencil })} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${canvasState.mode === CanvasMode.Pencil ? "bg-[#FFF1BF] text-[#5b4713] shadow-sm" : "text-neutral-600 hover:bg-white"}`}><Pencil className="h-[18px] w-[18px]" /></button>
            <button aria-label="Erase pencil strokes" onClick={() => setCanvasState({ mode: CanvasMode.Erasing })} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${canvasState.mode === CanvasMode.Erasing ? "bg-[#FFF1BF] text-[#5b4713] shadow-sm" : "text-neutral-600 hover:bg-white"}`}><Eraser className="h-[18px] w-[18px]" /></button>
          </div>
          {canvasState.mode === CanvasMode.Pencil && <>
          <div className="min-w-32">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Stroke</span><span>{penSize}px</span>
            </div>
            <input
              aria-label="Pen thickness"
              type="range"
              min="2"
              max="24"
              value={penSize}
              onChange={(event) => setPenSize(Number(event.target.value))}
              className="h-1.5 w-36 cursor-pointer accent-neutral-900"
            />
          </div>
          <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm" title="Pen color">
            <span className="h-5 w-5 rounded-lg border border-black/10" style={{ backgroundColor: `rgb(${penColor.r}, ${penColor.g}, ${penColor.b})` }} />
            <input
              aria-label="Pen color"
              type="color"
              value={`#${[penColor.r, penColor.g, penColor.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`}
              onChange={(event) => {
                const hex = event.target.value;
                setPenColor({ r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) });
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <button onClick={() => setSmartDrawing(!smartDrawing)} className={`flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition ${smartDrawing ? "bg-[#FFF1BF] text-[#5b4713]" : "bg-[#FFF8E7] text-neutral-600 hover:bg-[#FFF1BF]"}`} title="Turn rough closed shapes into clean shapes"><WandSparkles className="h-4 w-4" />Smart shapes</button>
          </>}
          {canvasState.mode === CanvasMode.Erasing && <p className="px-2 text-sm font-medium text-neutral-600">Sweep over pencil strokes to erase</p>}
        </div>
      )}
      {canvasState.mode === CanvasMode.Connecting && (
        <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-neutral-200/80 bg-white/95 px-4 py-3 text-sm font-medium text-neutral-700 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur">
          {canvasState.sourceId ? "Choose a second shape to connect" : "Choose the first shape to connect"}
        </div>
      )}
      <div className="absolute bottom-5 right-4 flex flex-col items-center rounded-2xl border border-neutral-200/80 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur">
        <ToolButton
          label="Zoom In"
          icon={ZoomIn}
          onClick={zoomIn}
        />

        <ToolButton
          label="Zoom Out"
          icon={ZoomOut}
          onClick={zoomOut}
        />

        <ToolButton
          label="Reset Zoom"
          icon={RefreshCcw}
          onClick={resetZoom}
        />
      </div>
    </>
  );
};

Toolbar.Skeleton = function ToolbarSkeleton() {
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <Skeleton className="h-12 w-12" />
        <Skeleton className="h-12 w-12" />
        <Skeleton className="h-12 w-12" />
        <Skeleton className="h-12 w-12" />
      </div>
      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <Skeleton className="h-12 w-12" />
        <Skeleton className="h-12 w-12" />
      </div>
    </div>
  );
};
