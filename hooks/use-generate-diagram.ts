"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { LayerType, ShapeType, ShapeLayer, NoteLayer } from "@/types/canvas";


interface DiagramNode {
  id: string;
  label: string;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: number;
}

interface DiagramEdge {
  from: string;
  to: string;
  label: string | null;
}

interface DiagramResponse {
  diagramType: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}


const FILL_COLORS: Record<string, { r: number; g: number; b: number }> = {
  Rectangle: { r: 59, g: 130, b: 246 },
  Capsule: { r: 16, g: 185, b: 129 },
  Diamond: { r: 245, g: 158, b: 11 },
  Ellipse: { r: 139, g: 92, b: 246 },
  Cylinder: { r: 236, g: 72, b: 153 },
  Cloud: { r: 14, g: 165, b: 233 },
  Triangle: { r: 239, g: 68, b: 68 },
  Parallelogram: { r: 168, g: 85, b: 247 },
};

const STROKE_COLOR = { r: 30, g: 30, b: 40 };
const EDGE_COLOR = { r: 80, g: 80, b: 90 };
const FONT_SIZE = 14;
const MAX_LAYERS = 100;


export function useGenerateDiagram() {
  const [isGenerating, setIsGenerating] = useState(false);

  const insertDiagram = useMutation(
    ({ storage }, diagram: DiagramResponse) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      const nodeIdMap = new Map<string, string>();

      for (const node of diagram.nodes) {
        if (liveLayers.size >= MAX_LAYERS) break;

        const layerId = nanoid();
        nodeIdMap.set(node.id, layerId);

        const shapeType = node.shape as unknown as ShapeType;
        const fill = FILL_COLORS[node.shape] || FILL_COLORS.Rectangle;

        const shapeLayer = new LiveObject<ShapeLayer>({
          type: LayerType.Shape,
          shape: shapeType,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          fill,
          stroke: STROKE_COLOR,
          strokeWidth: 1.5,
          rotation: 0,
        });

        liveLayerIds.push(layerId);
        liveLayers.set(layerId, shapeLayer);

        if (liveLayers.size < MAX_LAYERS) {
          const textId = nanoid();
          const textLayer = new LiveObject<NoteLayer>({
            type: LayerType.Note,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            fill,
            value: node.label,
            fontFamily: "inter",
            fontSize: FONT_SIZE,
            fontWeight: "regular",
            textAlign: "center",
            verticalAlign: "center",
            padding: 8,
            rotation: 0,
          });

          liveLayerIds.push(textId);
          liveLayers.set(textId, textLayer);
        }
      }

      for (const edge of diagram.edges) {
        if (liveLayers.size >= MAX_LAYERS) break;

        const fromId = nodeIdMap.get(edge.from);
        const toId = nodeIdMap.get(edge.to);
        if (!fromId || !toId) {
          console.warn(`Skipping edge ${edge.from}→${edge.to}: node not found`);
          continue;
        }

        const fromLayer = liveLayers.get(fromId) as unknown as { get: (k: string) => number } | undefined;
        const toLayer = liveLayers.get(toId) as unknown as { get: (k: string) => number } | undefined;
        if (!fromLayer || !toLayer) continue;

        const fromX = fromLayer.get("x") + fromLayer.get("width");
        const fromY = fromLayer.get("y") + fromLayer.get("height") / 2;
        const toX = toLayer.get("x");
        const toY = toLayer.get("y") + toLayer.get("height") / 2;

        const arrowId = nanoid();
        const arrowLayer = new LiveObject<ShapeLayer>({
          type: LayerType.Shape,
          shape: ShapeType.Arrow,
          x: fromX,
          y: fromY,
          width: toX - fromX,
          height: toY - fromY,
          fill: undefined,
          stroke: EDGE_COLOR,
          strokeWidth: 2,
          rotation: 0,
        });

        liveLayerIds.push(arrowId);
        liveLayers.set(arrowId, arrowLayer);

        if (edge.label && liveLayers.size < MAX_LAYERS) {
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;

          const dx = toX - fromX;
          const dy = toY - fromY;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const perpX = -dy / len;
          const perpY = dx / len;
          const offset = 22;

          const labelX = midX + perpX * offset - 40;
          const labelY = midY + perpY * offset - 10;

          const bgId = nanoid();
          const bgLayer = new LiveObject<ShapeLayer>({
            type: LayerType.Shape,
            shape: ShapeType.Capsule,
            x: labelX,
            y: labelY,
            width: 80,
            height: 20,
            fill: { r: 255, g: 255, b: 255 },
            stroke: { r: 200, g: 200, b: 210 },
            strokeWidth: 1,
            rotation: 0,
          });

          liveLayerIds.push(bgId);
          liveLayers.set(bgId, bgLayer);

          const labelId = nanoid();
          const labelLayer = new LiveObject<NoteLayer>({
            type: LayerType.Note,
            x: labelX,
            y: labelY,
            width: 80,
            height: 20,
            fill: { r: 255, g: 255, b: 255 },
            value: edge.label,
            fontFamily: "inter",
            fontSize: 11,
            fontWeight: "regular",
            textAlign: "center",
            verticalAlign: "center",
            padding: 2,
            rotation: 0,
          });

          liveLayerIds.push(labelId);
          liveLayers.set(labelId, labelLayer);
        }
      }
    },
    []
  );

  const generateDiagram = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);
      try {
        const response = await fetch("/api/generate-diagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate diagram");
        }

        const diagram: DiagramResponse = await response.json();
        insertDiagram(diagram);
      } finally {
        setIsGenerating(false);
      }
    },
    [insertDiagram]
  );

  return { generateDiagram, isGenerating };
}
