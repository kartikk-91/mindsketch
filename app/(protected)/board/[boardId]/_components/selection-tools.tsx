/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { Camera, CanvasMode, CanvasState, Color, LayerType, NoteFontFamily, ShapeType, Side } from "@/types/canvas";
import { useSelf, useMutation, useStorage } from "@liveblocks/react";
import { memo, useEffect, useState } from "react";
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
  Palette,
  Droplets,
  Type,
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
  { value: "caveat", label: "Caveat" },
  { value: "poppins", label: "Poppins" },
  { value: "playfair", label: "Playfair" },
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
  canvasState: CanvasState;
}

export const SelectionTools = memo(
  ({ camera, setLastUsedColor, canvasState }: SelectionToolsProps) => {
    const selection = useSelf((me) => me.presence.selection);
    const selectedId = selection?.[0];
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
      : isNote ? selectedLayer.fontFamily ?? "mono"
      : "mono";

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
    const [panel, setPanel] = useState<"color" | "opacity" | "text" | "connector" | null>(null);

    useEffect(() => {
      setPanel(null);
    }, [selectedId]);

    const canChangeColor = selectedLayer?.type !== LayerType.Image && (canFill || canStroke);

    if (!selectionBounds || !selectedLayer || canvasState.mode !== CanvasMode.None) return null;

    return (
      <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 select-none items-end">
        <div className="relative">
        <div className="flex items-center gap-1 border border-b-0 border-neutral-200/90 bg-white/95 px-5 py-2.5 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur [clip-path:polygon(5%_0,95%_0,100%_100%,0_100%)]">
          {canChangeColor && <Hint label="Color">
            <button onClick={() => setPanel(panel === "color" ? null : "color")} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100"><Palette className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Color</span></button>
          </Hint>}
          <Hint label={`Opacity: ${currentOpacity}%`}>
            <button onClick={() => setPanel(panel === "opacity" ? null : "opacity")} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100"><Droplets className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Opacity</span></button>
          </Hint>
          {isBoundArrow && <Hint label="Connector ports"><button onClick={() => setPanel(panel === "connector" ? null : "connector")} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100"><span className="text-lg">↔</span><span className="mt-0.5 text-[9px] font-medium">Ports</span></button></Hint>}
          {hasText && <>
            <Hint label="Text settings"><button onClick={() => setPanel(panel === "text" ? null : "text")} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100"><Type className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Text</span></button></Hint>
            <Hint label="Bold"><button onClick={toggleFontWeight} className={`flex h-11 w-11 flex-col items-center justify-center rounded-xl transition ${currentFontWeight === "bold" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}><Bold className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Bold</span></button></Hint>
            <Hint label={`Align: ${currentTextAlign}`}><button onClick={toggleTextAlign} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100">{currentTextAlign === "left" && <AlignLeft className="h-[18px] w-[18px]" />}{currentTextAlign === "center" && <AlignCenter className="h-[18px] w-[18px]" />}{currentTextAlign === "right" && <AlignRight className="h-[18px] w-[18px]" />}<span className="mt-0.5 text-[9px] font-medium">Align</span></button></Hint>
          </>}
          <span className="mx-1 h-6 w-px bg-neutral-200" />
          <Hint label="Bring to Front"><button onClick={moveToFront} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100"><BringToFront className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Front</span></button></Hint>
          <Hint label="Send to Back"><button onClick={moveToBack} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-neutral-700 transition hover:bg-neutral-100"><SendToBack className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Back</span></button></Hint>
          <span className="mx-1 h-6 w-px bg-neutral-200" />
          <Hint label="Delete"><button onClick={deleteLayers} className="flex h-11 w-11 flex-col items-center justify-center rounded-xl text-[#D65A43] transition hover:bg-[#FFF0ED]"><Trash2 className="h-[18px] w-[18px]" /><span className="mt-0.5 text-[9px] font-medium">Delete</span></button></Hint>
        </div>
          {panel && <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
            {panel === "opacity" && <div className="w-48"><div className="mb-2 flex justify-between text-xs font-medium text-neutral-600"><span>Opacity</span><span>{currentOpacity}%</span></div><input aria-label="Element opacity" type="range" min="10" max="100" value={currentOpacity} onChange={(event) => setOpacity(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-neutral-900" /></div>}
            {panel === "color" && <div className="flex gap-4"><div>{canFill && !isLineOrArrow && <><p className="mb-2 text-xs font-medium text-neutral-600">Fill</p><ColorPicker onChange={setFillColor} /></>}</div>{canStroke && <div><p className="mb-2 text-xs font-medium text-neutral-600">Stroke</p><label className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-neutral-200"><span className="h-5 w-5 rounded-lg" style={{ backgroundColor: currentStroke ? ColorToCSS(currentStroke) : "transparent" }} /><input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={currentStroke ? ColorToCSS(currentStroke) : "#000000"} onChange={(e) => { const hex = e.target.value; setStrokeColor({ r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) }); }} /></label></div>}</div>}
            {panel === "text" && <div className="w-64"><p className="mb-2 text-xs font-medium text-neutral-600">Typeface</p><div className="grid grid-cols-2 gap-1">{FONT_OPTIONS.map((option) => <button key={option.value} onClick={() => setFontFamily(option.value)} className={`rounded-xl px-3 py-2 text-left text-xs transition ${currentFontFamily === option.value ? "bg-[#FFF1BF] font-semibold text-[#5b4713]" : "bg-neutral-50 text-neutral-700 hover:bg-[#FFF8E7]"}`}>{option.label}</button>)}</div>{isNote && <><p className="mb-2 mt-3 text-xs font-medium text-neutral-600">Size</p><div className="flex gap-1">{SIZE_PRESETS.map((preset) => <button key={preset.value} onClick={() => setFontSize(preset.value)} className={`rounded-lg px-2 py-1 text-xs ${currentFontSize === preset.value ? "bg-[#FFF1BF] text-[#5b4713]" : "bg-neutral-100 text-neutral-700"}`}>{preset.label}</button>)}</div></>}</div>}
            {panel === "connector" && <div className="flex gap-3 text-sm"><label>Start <select value={(selectedLayer as any).startSide ?? Side.Right} onChange={(e) => setConnectionSide("startSide", Number(e.target.value) as Side)}><option value={Side.Top}>Top</option><option value={Side.Right}>Right</option><option value={Side.Bottom}>Bottom</option><option value={Side.Left}>Left</option></select></label><label>End <select value={(selectedLayer as any).endSide ?? Side.Left} onChange={(e) => setConnectionSide("endSide", Number(e.target.value) as Side)}><option value={Side.Top}>Top</option><option value={Side.Right}>Right</option><option value={Side.Bottom}>Bottom</option><option value={Side.Left}>Left</option></select></label></div>}
          </div>}
        </div>
      </div>
    );
  }
);

SelectionTools.displayName = "SelectionTools";
