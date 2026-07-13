/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Camera, Color, LayerType, NoteFontFamily, ShapeType, Side } from "@/types/canvas";
import { useSelf, useMutation, useStorage } from "@liveblocks/react";
import { memo } from "react";
import { ColorPicker } from "./color-picker";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import {
  BringToFront,
  SendToBack,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  ChevronDown,
} from "lucide-react";
import { ColorToCSS } from "@/lib/utils";

const nextAlign = (
  align: "left" | "center" | "right"
): "left" | "center" | "right" => {
  if (align === "left") return "center";
  if (align === "center") return "right";
  return "left";
};

const FONT_OPTIONS: { value: NoteFontFamily; label: string }[] = [
  { value: "kalam", label: "Handwriting" },
  { value: "inter", label: "Sans" },
  { value: "nunito", label: "Rounded" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];

const SIZE_PRESETS = [
  { value: 12, label: "XS" },
  { value: 16, label: "SM" },
  { value: 20, label: "MD" },
  { value: 28, label: "LG" },
  { value: 40, label: "XL" },
];

const DEFAULT_STROKE: Color = { r: 0, g: 0, b: 0 };

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

    const isShape = selectedLayer?.type === LayerType.Shape;
    const shapeKind =
      isShape && "shape" in selectedLayer
        ? selectedLayer.shape
        : null;

    const isLine = shapeKind === ShapeType.Line;
    const isArrow = shapeKind === ShapeType.Arrow;
    const isLineOrArrow = isLine || isArrow;
    const isBoundArrow = isArrow && Boolean((selectedLayer as any)?.startLayerId && (selectedLayer as any)?.endLayerId);

    const isPath = selectedLayer?.type === LayerType.Path;
    const isText = selectedLayer?.type === LayerType.Text;
    const isNote = selectedLayer?.type === LayerType.Note;
    const hasText = isText || isNote;

    const currentTextAlign =
      isText ? selectedLayer.textAlign ?? "center"
      : isNote ? selectedLayer.textAlign ?? "left"
      : null;

    const currentFontFamily: NoteFontFamily =
      isText ? (selectedLayer as any).fontFamily ?? "mono"
      : isNote ? selectedLayer.fontFamily ?? "kalam"
      : "kalam";

    const currentFontSize: number =
      isNote ? (typeof selectedLayer.fontSize === "number" ? selectedLayer.fontSize : 16) : 16;

    const currentFontWeight: "regular" | "bold" =
      isText ? (selectedLayer as any).fontWeight ?? "regular"
      : isNote ? (selectedLayer as any).fontWeight ?? "regular"
      : "regular";

    const canFill =
      selectedLayer?.type === LayerType.Shape && !isLineOrArrow ||
      selectedLayer?.type === LayerType.Rectangle ||
      selectedLayer?.type === LayerType.Ellipse ||
      selectedLayer?.type === LayerType.Text ||
      selectedLayer?.type === LayerType.Note ||
      isPath;

    const canStroke =
      (selectedLayer?.type === LayerType.Shape && isLineOrArrow) ||
      (selectedLayer?.type === LayerType.Shape && !isLineOrArrow) ||
      selectedLayer?.type === LayerType.Rectangle ||
      selectedLayer?.type === LayerType.Ellipse;

    const currentStroke: Color | null =
      canStroke &&
      selectedLayer &&
      "stroke" in selectedLayer &&
      selectedLayer.stroke
        ? selectedLayer.stroke
        : null;

    const currentOpacity = Math.round(((selectedLayer as any)?.opacity ?? 1) * 100);

    const setOpacity = useMutation(
      ({ storage }, value: number) => {
        const layers = storage.get("layers");
        selection?.forEach((id) => layers.get(id)?.set("opacity", value / 100));
      },
      [selection]
    );

    const setConnectionSide = useMutation(({ storage }, key: "startSide" | "endSide", side: Side) => {
      const id = selection?.[0];
      if (!id) return;
      const arrow = storage.get("layers").get(id) as any;
      if (!arrow) return;
      arrow.set(key, side);
      arrow.set(key === "startSide" ? "startSideLocked" : "endSideLocked", true);
      const start = storage.get("layers").get(arrow.get("startLayerId")) as any;
      const end = storage.get("layers").get(arrow.get("endLayerId")) as any;
      if (!start || !end) return;
      const point = (layer: any, edge: Side) => edge === Side.Left ? { x: layer.get("x"), y: layer.get("y") + layer.get("height") / 2 } : edge === Side.Right ? { x: layer.get("x") + layer.get("width"), y: layer.get("y") + layer.get("height") / 2 } : edge === Side.Top ? { x: layer.get("x") + layer.get("width") / 2, y: layer.get("y") } : { x: layer.get("x") + layer.get("width") / 2, y: layer.get("y") + layer.get("height") };
      const startPoint = point(start, key === "startSide" ? side : arrow.get("startSide"));
      const endPoint = point(end, key === "endSide" ? side : arrow.get("endSide"));
      arrow.update({ x: startPoint.x, y: startPoint.y, width: endPoint.x - startPoint.x, height: endPoint.y - startPoint.y });
    }, [selection]);

    const setFillColor = useMutation(
      ({ storage }, color: Color | null) => {
        if (!canFill) return;

        const liveLayers = storage.get("layers");
        if (color) setLastUsedColor(color);

        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;
          const liveLayer = layer as any;

          if (color) {
            liveLayer.set("fill", color);
            return;
          }

          // "No fill" means transparent interior, never an invisible shape.
          liveLayer.delete("fill");
          const type = liveLayer.get("type");
          const shape = liveLayer.get("shape");
          const supportsBorder = type === LayerType.Rectangle || type === LayerType.Ellipse || (type === LayerType.Shape && shape !== ShapeType.Line && shape !== ShapeType.Arrow);
          if (supportsBorder && !liveLayer.get("stroke")) {
            liveLayer.update({ stroke: DEFAULT_STROKE, strokeWidth: 2 });
          }
        });
      },
      [selection, canFill, setLastUsedColor]
    );

    const setStrokeColor = useMutation(
      ({ storage }, color: Color | null) => {
        if (!canStroke) return;

        const liveLayers = storage.get("layers");

        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;
          const liveLayer = layer as any;

          if (color) {
            liveLayer.update({
              stroke: color,
              strokeWidth: 2,
            });
          } else if (liveLayer.get("fill") && liveLayer.get("fill").r !== -1) {
            // A filled shape may intentionally have no border.
            liveLayer.delete("stroke");
            liveLayer.set("strokeWidth", 0);
          } else {
            // An unfilled shape must remain visible; its default is a black outline.
            liveLayer.update({
              stroke: DEFAULT_STROKE,
              strokeWidth: 2,
            });
          }
        });
      },
      [selection, canStroke]
    );

    const toggleTextAlign = useMutation(
      ({ storage }) => {
        if (!isText && !isNote) return;

        const liveLayers = storage.get("layers");
        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;

          if (layer.get("type") === LayerType.Text || layer.get("type") === LayerType.Note) {
            const current = ((layer as any).get("textAlign") ?? "left") as "left" | "center" | "right";
            layer.update({
              textAlign: nextAlign(current),
            });
          }
        });
      },
      [selection, isText, isNote]
    );

    const setFontFamily = useMutation(
      ({ storage }, font: NoteFontFamily) => {
        const liveLayers = storage.get("layers");
        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;
          layer.update({ fontFamily: font } as any);
        });
      },
      [selection]
    );

    const setFontSize = useMutation(
      ({ storage }, size: number) => {
        const liveLayers = storage.get("layers");
        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;
          layer.update({ fontSize: size } as any);
        });
      },
      [selection]
    );

    const toggleFontWeight = useMutation(
      ({ storage }) => {
        const next: "regular" | "bold" = currentFontWeight === "bold" ? "regular" : "bold";
        const liveLayers = storage.get("layers");
        selection?.forEach((id) => {
          const layer = liveLayers.get(id);
          if (!layer) return;
          layer.update({ fontWeight: next } as any);
        });
      },
      [selection, currentFontWeight]
    );

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

    const deleteLayers = useDeleteLayers();

    if (!selectionBounds || !selectedLayer) return null;

    return (
      <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-t-2xl border border-b-0 border-neutral-200/80 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur select-none">
        <div className="flex min-w-24 flex-col gap-1 pr-2 mr-2 border-r border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-500"><span>Opacity</span><span>{currentOpacity}%</span></div>
          <input
            aria-label="Element opacity"
            type="range"
            min="10"
            max="100"
            value={currentOpacity}
            onChange={(event) => setOpacity(Number(event.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-neutral-900"
          />
        </div>

        {isBoundArrow && (
          <div className="flex gap-2 border-r border-neutral-200 pr-3">
            <label className="flex flex-col gap-1 text-[11px] text-neutral-500">Start
              <select value={(selectedLayer as any).startSide ?? Side.Right} onChange={(e) => setConnectionSide("startSide", Number(e.target.value) as Side)} className="rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-700">
                <option value={Side.Top}>Top</option><option value={Side.Right}>Right</option><option value={Side.Bottom}>Bottom</option><option value={Side.Left}>Left</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-neutral-500">End
              <select value={(selectedLayer as any).endSide ?? Side.Left} onChange={(e) => setConnectionSide("endSide", Number(e.target.value) as Side)} className="rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-700">
                <option value={Side.Top}>Top</option><option value={Side.Right}>Right</option><option value={Side.Bottom}>Bottom</option><option value={Side.Left}>Left</option>
              </select>
            </label>
          </div>
        )}
        {canFill && !isLineOrArrow && (
          <div className="flex flex-col gap-1 pr-2 mr-2 border-r border-neutral-200">
            <span className="text-xs text-neutral-500">Color</span>
            <ColorPicker onChange={setFillColor} />
          </div>
        )}

        {canStroke && (
          <div className="flex flex-col gap-1 pr-2 mr-2 border-r border-neutral-200">
            <span className="text-xs text-neutral-500">Stroke</span>

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
        )}

        
        {hasText && (
          <div className="flex flex-col gap-1.5 pr-2 mr-2 border-r border-neutral-200">
            
            <div className="flex items-center gap-2">
              
              {hasText ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-500">Font</span>
                  <div className="relative">
                    <select
                      value={currentFontFamily}
                      onChange={(e) => setFontFamily(e.target.value as NoteFontFamily)}
                      className="appearance-none bg-white border border-neutral-300 rounded-md px-2 py-1 pr-6 text-xs font-medium text-neutral-700 cursor-pointer hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Bold</span>
                <button
                  onClick={toggleFontWeight}
                  className={`p-1.5 rounded-md border transition-colors ${
                    currentFontWeight === "bold"
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
                  }`}
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            
            {isNote && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">Size</span>
                <div className="flex gap-0.5">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setFontSize(preset.value)}
                      className={`px-1.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                        currentFontSize === preset.value
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        <div className="flex flex-col items-center pl-2 ml-2 border-l h-full border-neutral-200 gap-1">
          {(isText || isNote) && (
            <Hint label={`Align: ${currentTextAlign}`}>
              <Button
                variant="board"
                size="icon"
                onClick={toggleTextAlign}
              >
                {currentTextAlign === "left" && <AlignLeft />}
                {currentTextAlign === "center" && <AlignCenter />}
                {currentTextAlign === "right" && <AlignRight />}
              </Button>
            </Hint>
          )}

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
