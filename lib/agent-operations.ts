import { LayerType, ShapeType, Layer, ShapeLayer, TextLayer, NoteLayer, RectangleLayer, EllipseLayer, ImageLayer } from "@/types/canvas";
import { LiveObject } from "@liveblocks/client";

export interface CreateLayerParams {
  layerType: LayerType;
  shapeType?: ShapeType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  content?: string;
  src?: string;
  chart?: { type: "bar" | "pie" | "area" | "donut"; title?: string; data: Array<{ label: string; value: number; color?: string }> };
  connect?: { from: string; to: string };
  connectorSides?: { startSide: number; endSide: number };
}

/**
 * Creates a LiveObject layer from agent parameters.
 * This is the core function that translates agent tool calls into canvas operations.
 */
export function createLayerFromParams(params: CreateLayerParams): LiveObject<Layer> {
  const { layerType, position, size, style, content } = params;

  const baseStyle = {
    fill: style?.fill ? parseColor(style.fill) : undefined,
    stroke: style?.stroke ? parseColor(style.stroke) : undefined,
    strokeWidth: style?.strokeWidth,
  };

  switch (layerType) {
    case LayerType.Rectangle:
      return new LiveObject<RectangleLayer>({
        type: LayerType.Rectangle,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        value: content,
        ...baseStyle,
      });

    case LayerType.Ellipse:
      return new LiveObject<EllipseLayer>({
        type: LayerType.Ellipse,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        value: content,
        ...baseStyle,
      });

    case LayerType.Shape:
      if (params.shapeType === undefined || params.shapeType === null) {
        throw new Error("shapeType is required for Shape layers");
      }
      return new LiveObject<ShapeLayer>({
        type: LayerType.Shape,
        shape: params.shapeType,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        value: content,
        ...(params.connect ? { startLayerId: params.connect.from, endLayerId: params.connect.to, arrowhead: "right" as const, ...params.connectorSides } : {}),
        ...baseStyle,
      });

    case LayerType.Text:
      return new LiveObject<TextLayer>({
        type: LayerType.Text,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        value: content || "",
        fill: baseStyle.fill || { r: 30, g: 30, b: 40 },
        textAlign: "center",
        fontFamily: "inter",
        fontWeight: "regular",
      });

    case LayerType.Note:
      return new LiveObject<NoteLayer>({
        type: LayerType.Note,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        value: content || "",
        fill: baseStyle.fill || { r: 255, g: 230, b: 0 },
        fontFamily: "inter",
        fontSize: 14,
        fontWeight: "regular",
        textAlign: "left",
        verticalAlign: "top",
        padding: 8,
      });

    case LayerType.Image:
      if (!params.src && !params.chart) throw new Error("src or chart is required for Image layers");
      return new LiveObject<ImageLayer>({
        type: LayerType.Image,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        src: params.src || chartToSvgDataUri(params.chart!),
        value: content,
      });

    default:
      throw new Error(`Unsupported layer type: ${layerType}`);
  }
}

function chartToSvgDataUri(chart: NonNullable<CreateLayerParams["chart"]>) {
  const width = 720;
  const height = 440;
  const palette = ["#20C5A8", "#5B8DEF", "#FFB800", "#A78BFA", "#FB7185", "#34D399"];
  const data = chart.data.slice(0, 8).map((item, index) => ({ ...item, value: Math.max(0, Number(item.value) || 0), color: item.color || palette[index % palette.length] }));
  const title = escapeSvg(chart.title || (["pie", "donut"].includes(chart.type) ? "Distribution" : "Comparison"));
  let body = `<rect width="${width}" height="${height}" rx="28" fill="#FFFFFF"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="27" fill="none" stroke="#E8EDF5" stroke-width="2"/><text x="44" y="62" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="700" fill="#181C31">${title}</text>`;
  if (chart.type === "bar") {
    const max = Math.max(...data.map((item) => item.value), 1);
    const barWidth = Math.max(34, Math.min(74, 500 / Math.max(data.length, 1)));
    [0.25, 0.5, 0.75, 1].forEach((fraction) => { body += `<path d="M52 ${344 - fraction * 250}H650" stroke="#E8EDF5" stroke-width="1" stroke-dasharray="5 7"/>`; });
    data.forEach((item, index) => {
      const x = 72 + index * (560 / Math.max(data.length, 1));
      const barHeight = item.value / max * 250;
      const y = 342 - barHeight;
      body += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="${item.color}"/><text x="${x + barWidth / 2}" y="370" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" fill="#65708A">${escapeSvg(item.label)}</text><text x="${x + barWidth / 2}" y="${y - 12}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700" fill="#181C31">${item.value}</text>`;
    });
    body += `<path d="M52 344H650" stroke="#DCE2EB" stroke-width="2"/>`;
  } else if (chart.type === "area") {
    const max = Math.max(...data.map((item) => item.value), 1);
    const left = 66, top = 110, chartHeight = 230, chartWidth = 570;
    [0.25, 0.5, 0.75, 1].forEach((fraction) => { body += `<path d="M${left} ${top + chartHeight - fraction * chartHeight}H${left + chartWidth}" stroke="#E8EDF5" stroke-width="1" stroke-dasharray="5 7"/>`; });
    const points = data.map((item, index) => ({ x: left + index * chartWidth / Math.max(data.length - 1, 1), y: top + chartHeight - item.value / max * chartHeight }));
    const line = points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
    const area = `${line} L${points[points.length - 1]?.x ?? left + chartWidth} ${top + chartHeight} L${points[0]?.x ?? left} ${top + chartHeight} Z`;
    body += `<defs><linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#5B8DEF" stop-opacity=".5"/><stop offset="1" stop-color="#5B8DEF" stop-opacity=".04"/></linearGradient></defs><path d="${area}" fill="url(#area-fill)"/><path d="${line}" fill="none" stroke="#5B8DEF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    points.forEach((point, index) => { const item = data[index]; body += `<circle cx="${point.x}" cy="${point.y}" r="6" fill="#fff" stroke="${item.color}" stroke-width="4"/><text x="${point.x}" y="${top + chartHeight + 28}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" fill="#65708A">${escapeSvg(item.label)}</text><text x="${point.x}" y="${point.y - 14}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="700" fill="#181C31">${item.value}</text>`; });
    body += `<path d="M${left} ${top + chartHeight}H${left + chartWidth}" stroke="#DCE2EB" stroke-width="2"/>`;
  } else {
    const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
    let angle = -Math.PI / 2;
    data.forEach((item, index) => {
      const span = item.value / total * Math.PI * 2;
      const end = angle + span;
      const x1 = 236 + Math.cos(angle) * 122, y1 = 238 + Math.sin(angle) * 122;
      const x2 = 236 + Math.cos(end) * 122, y2 = 238 + Math.sin(end) * 122;
      body += `<path d="M236 238 L${x1} ${y1} A122 122 0 ${span > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z" fill="${item.color}" stroke="#fff" stroke-width="3"/>`;
      const legendY = 142 + index * 32;
      body += `<circle cx="430" cy="${legendY}" r="7" fill="${item.color}"/><text x="446" y="${legendY + 5}" font-family="Inter,Arial,sans-serif" font-size="16" fill="#394154">${escapeSvg(item.label)} · ${item.value}</text>`;
      angle = end;
    });
    if (chart.type === "donut") body += `<circle cx="236" cy="238" r="62" fill="#FFFFFF"/><text x="236" y="233" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="14" fill="#65708A">Total</text><text x="236" y="258" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" fill="#181C31">${total}</text>`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`)}`;
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] || character);
}

/**
 * Parses a color string in "r,g,b" format to a Color object.
 */
function parseColor(colorString: string): { r: number; g: number; b: number } {
  const parts = colorString.split(",").map(s => parseInt(s.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { r: 59, g: 130, b: 246 };
  }
  return { r: parts[0], g: parts[1], b: parts[2] };
}

/**
 * Default color palette for different diagram elements.
 */
export const DEFAULT_COLORS = {
  process: "59,130,246", // blue
  startEnd: "16,185,129", // green
  decision: "245,158,11", // orange
  data: "139,92,246", // purple
  connector: "30,30,40", // dark gray
  text: "30,30,40", // dark gray
  note: "255,230,0", // yellow
};

/**
 * Validates layer parameters before creation.
 */
export function validateLayerParams(params: CreateLayerParams): { valid: boolean; error?: string } {
  if (params.layerType === undefined || params.layerType === null) {
    return { valid: false, error: "layerType is required" };
  }

  if (!params.position || typeof params.position.x !== "number" || typeof params.position.y !== "number") {
    return { valid: false, error: "Valid position with x and y coordinates is required" };
  }

  if (!params.size || typeof params.size.width !== "number" || typeof params.size.height !== "number") {
    return { valid: false, error: "Valid size with width and height is required" };
  }

  if (params.size.width <= 0 || params.size.height <= 0) {
    return { valid: false, error: "Width and height must be positive" };
  }
  if (params.layerType === LayerType.Shape && (params.shapeType === undefined || params.shapeType === null)) {
    return { valid: false, error: "shapeType is required for Shape layers" };
  }

  if (params.layerType === LayerType.Image && !params.src && !params.chart) {
    return { valid: false, error: "An image source or chart data is required" };
  }
  const layerTypeNum = params.layerType as number;
  const textTypeNum = LayerType.Text as number;
  const noteTypeNum = LayerType.Note as number;
  
  if (layerTypeNum === textTypeNum || layerTypeNum === noteTypeNum) {
    if (!params.content) {
      return { valid: false, error: "content is required for Text and Note layers" };
    }
  }

  return { valid: true };
}

/**
 * Applies smart defaults to layer parameters.
 */
export function applySmartDefaults(params: CreateLayerParams): CreateLayerParams {
  const result = { ...params };
  if (!result.size) {
    result.size = { width: 120, height: 60 };
  }
  if (!result.position) {
    result.position = { x: 100, y: 100 };
  }
  if (!result.style) {
    result.style = {};
  }

  switch (result.layerType) {
    case LayerType.Shape:
      if (result.shapeType === ShapeType.Diamond) {
        result.style.fill = result.style.fill || DEFAULT_COLORS.decision;
      } else if (result.shapeType === ShapeType.Capsule) {
        result.style.fill = result.style.fill || DEFAULT_COLORS.startEnd;
      } else {
        result.style.fill = result.style.fill || DEFAULT_COLORS.process;
      }
      result.style.stroke = result.style.stroke || DEFAULT_COLORS.connector;
      result.style.strokeWidth = result.style.strokeWidth || 2;
      break;

    case LayerType.Rectangle:
    case LayerType.Ellipse:
      result.style.fill = result.style.fill || DEFAULT_COLORS.process;
      result.style.stroke = result.style.stroke || DEFAULT_COLORS.connector;
      result.style.strokeWidth = result.style.strokeWidth || 2;
      break;

    case LayerType.Note:
      result.style.fill = result.style.fill || DEFAULT_COLORS.note;
      break;

    case LayerType.Text:
      result.style.fill = result.style.fill || DEFAULT_COLORS.text;
      break;
  }

  return result;
}
