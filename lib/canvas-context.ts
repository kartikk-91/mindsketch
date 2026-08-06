import { Layer, LayerType, ShapeType } from "@/types/canvas";

export interface CanvasContext {
  layers: LayerSummary[];
  layerCount: number;
  bounds: { x: number; y: number; width: number; height: number } | null;
  isEmpty: boolean;
}

export interface LayerSummary {
  id: string;
  type: LayerType;
  shapeType?: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  hasContent: boolean;
  contentPreview?: string;
}

/**
 * Extracts structured context from canvas layers for agent understanding.
 * This provides a machine-readable summary of the canvas state.
 */
export function extractCanvasContext(layers: Map<string, Layer>): CanvasContext {
  const layerSummaries: LayerSummary[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const [id, layer] of layers.entries()) {
    const summary = layerToSummary(id, layer);
    layerSummaries.push(summary);
    minX = Math.min(minX, summary.x);
    minY = Math.min(minY, summary.y);
    maxX = Math.max(maxX, summary.x + summary.width);
    maxY = Math.max(maxY, summary.y + summary.height);
  }

  const bounds = layerSummaries.length > 0 
    ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    : null;

  return {
    layers: layerSummaries,
    layerCount: layerSummaries.length,
    bounds,
    isEmpty: layerSummaries.length === 0,
  };
}

/**
 * Converts a layer to a simplified summary for agent consumption.
 */
function layerToSummary(id: string, layer: Layer): LayerSummary {
  const base = {
    id,
    type: layer.type,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    hasContent: false,
  };
  switch (layer.type) {
    case LayerType.Shape:
      return {
        ...base,
        shapeType: layer.shape,
        hasContent: !!layer.value,
        contentPreview: layer.value,
      };
    case LayerType.Text:
      return {
        ...base,
        hasContent: !!layer.value,
        contentPreview: layer.value,
      };
    case LayerType.Note:
      return {
        ...base,
        hasContent: !!layer.value,
        contentPreview: layer.value?.substring(0, 50),
      };
    case LayerType.Rectangle:
    case LayerType.Ellipse:
      return {
        ...base,
        hasContent: !!layer.value,
        contentPreview: layer.value,
      };
    case LayerType.Path:
      return {
        ...base,
        hasContent: layer.points.length > 0,
      };
    case LayerType.Image:
      return {
        ...base,
        hasContent: true,
        contentPreview: "[Image]",
      };
    default:
      return base;
  }
}

/**
 * Formats canvas context as a natural language description for the agent.
 */
export function formatContextForAgent(context: CanvasContext): string {
  if (context.isEmpty) {
    return "The canvas is currently empty.";
  }

  const lines = [
    `The canvas contains ${context.layerCount} element(s):`,
  ];
  const byType = new Map<LayerType, LayerSummary[]>();
  for (const layer of context.layers) {
    if (!byType.has(layer.type)) {
      byType.set(layer.type, []);
    }
    byType.get(layer.type)!.push(layer);
  }
  for (const [type, layers] of byType.entries()) {
    const count = layers.length;
    const typeName = type.toString().toLowerCase();
    lines.push(`- ${count} ${typeName}(s)`);
    const withContent = layers.filter(l => l.hasContent && l.contentPreview);
    if (withContent.length > 0 && withContent.length <= 5) {
      for (const layer of withContent) {
        lines.push(`  - "${layer.contentPreview}" at (${layer.x}, ${layer.y})`);
      }
    }
  }
  if (context.bounds) {
    lines.push(`\nCanvas bounds: ${context.bounds.width}x${context.bounds.height} at (${context.bounds.x}, ${context.bounds.y})`);
  }

  return lines.join("\n");
}

/**
 * Finds available space on the canvas for placing new elements.
 * Returns a suggested position that avoids overlaps.
 */
export function findAvailablePosition(
  context: CanvasContext,
  requestedSize: { width: number; height: number },
  preferredPosition?: { x: number; y: number }
): { x: number; y: number } {
  if (context.isEmpty) {
    return preferredPosition || { x: 100, y: 100 };
  }

  const bounds = context.bounds;
  if (!bounds) {
    return preferredPosition || { x: 100, y: 100 };
  }
  if (preferredPosition) {
    const overlaps = checkOverlap(
      preferredPosition.x,
      preferredPosition.y,
      requestedSize.width,
      requestedSize.height,
      context.layers
    );
    if (!overlaps) {
      return preferredPosition;
    }
  }
  const suggestedX = bounds.x + bounds.width + 50;
  const suggestedY = bounds.y;

  return { x: suggestedX, y: suggestedY };
}

/**
 * Checks if a rectangle overlaps with any existing layers.
 */
function checkOverlap(
  x: number,
  y: number,
  width: number,
  height: number,
  layers: LayerSummary[]
): boolean {
  const padding = 20; // Minimum spacing between elements

  for (const layer of layers) {
    const layerRight = layer.x + layer.width + padding;
    const layerBottom = layer.y + layer.height + padding;
    const right = x + width + padding;
    const bottom = y + height + padding;
    if (!(right < layer.x || x > layerRight || bottom < layer.y || y > layerBottom)) {
      return true;
    }
  }

  return false;
}

/**
 * Estimates the complexity of the canvas for agent planning.
 */
export function estimateCanvasComplexity(context: CanvasContext): "simple" | "medium" | "complex" {
  if (context.isEmpty) return "simple";
  
  const count = context.layerCount;
  if (count <= 5) return "simple";
  if (count <= 15) return "medium";
  return "complex";
}
