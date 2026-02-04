/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ToolButton } from "./tool-button";
import {
  Circle,
  MousePointer2,
  Pencil,
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
  Diamond,
  Triangle,
  Star,
  Pill,
  Cloud,
  ZoomIn,
  ZoomOut,
  RefreshCcw,
} from "lucide-react";

import {
  CanvasMode,
  CanvasState,
  LayerType,
  ShapeType,
} from "@/types/canvas";
import { useRef, useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CylinderIcon, ParallelogramIcon } from "./shape.icons";

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
}: ToolbarProps) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shapePopoverRef = useRef<HTMLDivElement>(null);

  const uploadImage = useAction(api.images.uploadImage);

  const [pendingImageId, setPendingImageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isShapeOpen, setIsShapeOpen] = useState(false);

  const imageUrl = useQuery(
    api.images.getImageUrl,
    pendingImageId ? { storageId: pendingImageId } : "skip"
  );



  useEffect(() => {
    if (!imageUrl) return;

    setCanvasState({
      mode: CanvasMode.Inserting,
      layertype: LayerType.Image,
      imageSrc: imageUrl,
    });

    setPendingImageId(null);
    setIsUploading(false);
  }, [imageUrl, setCanvasState]);



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
      <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 pt-8">
        <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md relative">
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
                grid grid-cols-3 gap-1
                w-[168px]
              "
              >
                <ToolButton label="Rectangle" icon={Square} onClick={() => insertShape(ShapeType.Rectangle)} />
                <ToolButton label="Ellipse" icon={Circle} onClick={() => insertShape(ShapeType.Ellipse)} />
                <ToolButton label="Line" icon={Minus} onClick={() => insertShape(ShapeType.Line)} />
                <ToolButton label="Arrow" icon={ArrowRight} onClick={() => insertShape(ShapeType.Arrow)} />
                <ToolButton label="Diamond" icon={Diamond} onClick={() => insertShape(ShapeType.Diamond)} />
                <ToolButton label="Triangle" icon={Triangle} onClick={() => insertShape(ShapeType.Triangle)} />
                <ToolButton label="Star" icon={Star} onClick={() => insertShape(ShapeType.Star)} />
                <ToolButton label="Capsule" icon={Pill} onClick={() => insertShape(ShapeType.Capsule)} />
                <ToolButton label="Parallelogram" icon={ParallelogramIcon} onClick={() => insertShape(ShapeType.Parallelogram)} />
                <ToolButton label="Cylinder" icon={CylinderIcon} onClick={() => insertShape(ShapeType.Cylinder)} />
                <ToolButton label="Cloud" icon={Cloud} onClick={() => insertShape(ShapeType.Cloud)} />
              </div>
            )}
          </div>

          <ToolButton
            label={isUploading ? "Uploading..." : "Image"}
            icon={isUploading ? Loader2 : ImageIcon}
            onClick={() => fileInputRef.current?.click()}
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              setIsUploading(true);
              const buffer = await file.arrayBuffer();

              const { storageId } = await uploadImage({
                file: buffer,
                contentType: file.type,
              });

              setPendingImageId(storageId);
              e.target.value = "";
            }}
          />
        </div>

        <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
          <ToolButton label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
          <ToolButton label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
        </div>
      </div>
      <div className="bg-white rounded-md absolute right-2 bottom-16 p-1.5 flex flex-col items-center shadow-md">
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
