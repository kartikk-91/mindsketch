/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

type CanvasImage = { imageBase64: string; mimeType: string };
type DrawRequest = { prompt: string; image?: CanvasImage; viewport?: { x: number; y: number; width: number; height: number } };
type DrawOperation = {
  layerType: "Rectangle" | "Ellipse" | "Text" | "Note" | "Shape" | "Image";
  id?: string;
  shapeType?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: { fill?: string; stroke?: string; strokeWidth?: number };
  content?: string;
  chart?: { type: "bar" | "pie" | "area" | "donut"; title?: string; data: Array<{ label: string; value: number; color?: string }> };
  connect?: { from: string; to: string };
};
const MODEL = "gemini-3-flash-preview";
const MAX_OPERATIONS = 48;
const FREE_KEY_ATTEMPTS = 5;
const FREE_KEY_NAMES = Array.from({ length: 3 }, (_, index) => `GEMINI_API_KEY_F${index + 1}`);
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const encoder = new TextEncoder();
const event = (type: string, value: string) => encoder.encode(`${JSON.stringify({ type, value })}\n`);

function allowed(userId: string) {
  const now = Date.now();
  const current = rateLimits.get(userId);
  if (!current || now > current.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (current.count >= 20) return false;
  current.count += 1;
  return true;
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The drawing planner returned an invalid plan.");
  return JSON.parse(fenced.slice(start, end + 1));
}

const LAYER_TYPES = new Set<DrawOperation["layerType"]>(["Rectangle", "Ellipse", "Text", "Note", "Shape", "Image"]);
const SHAPE_TYPES = new Set(["Rectangle", "Ellipse", "Line", "Arrow", "Diamond", "Triangle", "Star", "Capsule", "Parallelogram", "Cylinder", "Cloud", "Pentagon", "Hexagon", "Heart", "SpeechBubble", "Document", "ArrowLeft", "ArrowRight", "ArrowBidirectional", "Code"]);

const finite = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const color = (value: unknown, fallback: string) => typeof value === "string" && /^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/.test(value) ? value : fallback;

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function plannerKeys() {
  const freeKeys = FREE_KEY_NAMES
    .map((name) => ({ name, value: process.env[name] }))
    .filter((key): key is { name: string; value: string } => Boolean(key.value));
  const selectedFreeKeys = shuffled(freeKeys).slice(0, FREE_KEY_ATTEMPTS);
  const paidKey = process.env.GEMINI_API_KEY;

  if (!selectedFreeKeys.length && !paidKey) {
    throw new Error("Drawing AI is not configured. Add GEMINI_API_KEY_F1 through GEMINI_API_KEY_F3 or GEMINI_API_KEY.");
  }

  return [
    ...selectedFreeKeys.map((key) => ({ ...key, source: "free" as const })),
    ...(paidKey ? [{ name: "GEMINI_API_KEY", value: paidKey, source: "paid" as const }] : []),
  ];
}

function normalizeOperation(value: unknown): DrawOperation | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, any>;
  if (!LAYER_TYPES.has(raw.layerType)) return null;
  if (raw.layerType === "Shape" && !SHAPE_TYPES.has(raw.shapeType)) return null;
  const width = Math.max(24, Math.min(900, finite(raw.size?.width, 160)));
  const height = Math.max(20, Math.min(640, finite(raw.size?.height, 80)));
  const result: DrawOperation = {
    layerType: raw.layerType,
    ...(typeof raw.id === "string" ? { id: raw.id.slice(0, 60) } : {}),
    ...(raw.layerType === "Shape" ? { shapeType: raw.shapeType } : {}),
    position: { x: Math.max(-5000, Math.min(5000, finite(raw.position?.x, 100))), y: Math.max(-5000, Math.min(5000, finite(raw.position?.y, 100))) },
    size: { width, height },
    style: { fill: color(raw.style?.fill, "59,130,246"), stroke: color(raw.style?.stroke, "30,30,40"), strokeWidth: Math.max(1, Math.min(8, finite(raw.style?.strokeWidth, 2))) },
  };
  if (typeof raw.content === "string") result.content = raw.content.slice(0, 500);
  if ((result.layerType === "Rectangle" || result.layerType === "Ellipse") && result.content?.trim()) {
    result.shapeType = result.layerType;
    result.layerType = "Shape";
  }
  if (raw.layerType === "Image" && raw.chart && (["bar", "pie", "area", "donut"] as const).includes(raw.chart.type) && Array.isArray(raw.chart.data)) {
    const data = raw.chart.data.slice(0, 8).map((item: any) => ({ label: typeof item?.label === "string" ? item.label.slice(0, 30) : "Item", value: Math.max(0, Math.min(1_000_000, finite(item?.value, 0))), color: typeof item?.color === "string" ? item.color.slice(0, 30) : undefined }));
    if (data.length) result.chart = { type: raw.chart.type, title: typeof raw.chart.title === "string" ? raw.chart.title.slice(0, 100) : undefined, data };
  }
  if (raw.layerType === "Shape" && raw.shapeType === "Arrow" && typeof raw.connect?.from === "string" && typeof raw.connect?.to === "string") {
    result.connect = { from: raw.connect.from.slice(0, 60), to: raw.connect.to.slice(0, 60) };
  }
  if ((result.layerType === "Text" || result.layerType === "Note") && !result.content?.trim()) return null;
  if (result.layerType === "Image" && !result.chart) return null;
  return result;
}

async function createPlan(prompt: string, image: CanvasImage | undefined, viewport: DrawRequest["viewport"], requestId: string): Promise<{ operations: DrawOperation[]; credential: "free" | "paid" }> {
  const visibleArea = viewport ? `The user is currently viewing canvas coordinates x=${Math.round(viewport.x)}..${Math.round(viewport.x + viewport.width)}, y=${Math.round(viewport.y)}..${Math.round(viewport.y + viewport.height)}.` : "The visible canvas area is approximately x=0..1400, y=0..900.";
  const instruction = `You are MindSketch's diagram planner. Turn the user's request into a finished, presentation-ready whiteboard composition, never a single generic object. Return JSON only: {"summary":"short progress label","operations":[...]}. Each operation has a unique short id, layerType (Rectangle, Ellipse, Text, Note, Shape, Image), optional shapeType, position {x,y}, size {width,height}, style {fill,stroke,strokeWidth}, and optional content. IMPORTANT: every meaningful diagram node MUST have a short, visible content label. For a labelled rectangle or ellipse, always use layerType:"Shape" with shapeType:"Rectangle" or "Ellipse"—never use the base Rectangle/Ellipse types—because Shape is the text-capable node type. Only arrows and clearly decorative elements may have no content. For Image, provide chart {type:"bar"|"pie"|"area"|"donut",title,data:[{label,value,color?}]}. Use bar for comparisons, area for time-series/trends and filled charts, pie/donut for shares. For every chart request emit one or more Image chart operations with clear titles, complete supplied data, 4-8 values, and unique category colors. Add useful supporting notes or KPI shapes around it when requested. Do not use Image for anything else. For Shape Arrow that connects two generated nodes, add connect:{from:"node-id",to:"node-id"}; these must refer to node operation ids, and arrows must come after their nodes. This creates true board connectors that stay attached as nodes move. Allowed Shape values: Rectangle, Ellipse, Line, Arrow, Diamond, Triangle, Star, Capsule, Parallelogram, Cylinder, Cloud, Pentagon, Hexagon, Heart, SpeechBubble, Document, ArrowLeft, ArrowRight, ArrowBidirectional, Code. Use 6-30 operations when the request is a diagram: include a title, labelled nodes, and Arrow connectors. Visual direction is mandatory: use 3-5 distinct harmonious rgb fills (examples: teal 32,197,168; blue 91,141,239; violet 139,92,246; amber 255,184,0; coral 251,113,133), a dark stroke 24,28,49, and 1-3px stroke widths. Color-code meaning consistently: start/success teal, actions blue, decisions amber, data violet, risks coral. Make the primary element larger, use spacing and alignment, and avoid repeating the same fill for every node. ${visibleArea} Position every new element within this visible area. Use the supplied screenshot to identify empty space; if there is existing work, place the new composition in the largest clear region rather than overlapping it. Never use a fixed global origin. User request: ${prompt}`;
  const parts: Array<Record<string, unknown>> = [{ text: instruction }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.imageBase64 } });
  let operations: DrawOperation[] | undefined;
  let selectedCredential: "free" | "paid" | undefined;
  let lastFailure = "Drawing service unavailable";
  const keys = plannerKeys();
  const startedAt = Date.now();
  logger.info("ai.draw", "planner_started", { request: requestId, image: Boolean(image), viewport: Boolean(viewport) });
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[attempt];
    if (key.source === "paid" && attempt > 0) {
      logger.warn("ai.draw", "paid_fallback", { request: requestId, provider: "gemini", afterAttempts: attempt });
    }
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key.value}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.25, responseMimeType: "application/json" } }),
      });
      if (response.ok) {
        const responsePayload = await response.json();
        const responseText = responsePayload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
        if (!responseText) throw new Error("Gemini returned no drawing plan");
        const plan = extractJson(responseText);
        const candidateOperations = Array.isArray(plan.operations) ? plan.operations.map(normalizeOperation).filter(Boolean) as DrawOperation[] : [];
        if (!candidateOperations.length) throw new Error("Gemini returned no drawable elements");
        operations = candidateOperations;
        selectedCredential = key.source;
        break;
      }
      lastFailure = `HTTP ${response.status}`;
      logger.warn("ai.draw", "provider_retry", { request: requestId, provider: "gemini", credential: key.source, attempt: attempt + 1, status: response.status });
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : "Network error";
      logger.warn("ai.draw", "provider_retry", { request: requestId, provider: "gemini", credential: key.source, attempt: attempt + 1, error: logger.errorKind(error) });
    }
  }
  if (!operations || !selectedCredential) {
    logger.error("ai.draw", "planner_failed", { request: requestId, attempts: keys.length });
    throw new Error("Drawing AI is temporarily unavailable. Please try again in a moment.");
  }
  const visualNodes = operations.filter((operation) => ["Rectangle", "Ellipse", "Note", "Shape"].includes(operation.layerType) && !(operation.layerType === "Shape" && operation.shapeType === "Arrow"));
  const fills = new Set(visualNodes.map((operation) => operation.style?.fill).filter(Boolean));
  if (visualNodes.length > 2 && fills.size <= 1) {
    const palette = ["32,197,168", "91,141,239", "139,92,246", "255,184,0", "251,113,133"];
    let colorIndex = 0;
    operations = operations.map((operation) => {
      if (!visualNodes.includes(operation)) return operation;
      const fill = palette[colorIndex++ % palette.length];
      return { ...operation, style: { ...operation.style, fill, stroke: "24,28,49", strokeWidth: operation.style?.strokeWidth ?? 2 } };
    });
  }
  const finalOperations = operations.slice(0, MAX_OPERATIONS);
  logger.info("ai.draw", "planner_complete", { request: requestId, provider: "gemini", credential: selectedCredential, model: MODEL, operations: finalOperations.length, durationMs: Date.now() - startedAt });
  return { operations: finalOperations, credential: selectedCredential };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!allowed(userId)) return Response.json({ error: "Too many drawing requests. Please wait a moment." }, { status: 429 });
  let body: DrawRequest;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid drawing request." }, { status: 400 }); }
  if (!body.prompt?.trim()) return Response.json({ error: "Describe what you want to draw." }, { status: 400 });
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("ai.draw", "request_started", { request: requestId, image: Boolean(body.image), viewport: Boolean(body.viewport), promptLength: body.prompt.trim().length });

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type: string, value: string) => controller.enqueue(event(type, value));
      try {
        emit("thought", "Planning a complete diagram…");
        const { operations } = await createPlan(body.prompt.trim(), body.image, body.viewport, requestId);
        emit("thought", `Adding ${operations.length} elements to the board…`);
        for (const operation of operations) emit("tool_call", JSON.stringify({ name: "create_layer", parameters: operation }));
        emit("result", `Created a ${operations.length}-element composition. You can refine any element directly on the board.`);
        emit("done", "");
        logger.info("ai.draw", "request_complete", { request: requestId, operations: operations.length, durationMs: Date.now() - startedAt });
      } catch (error) {
        logger.error("ai.draw", "request_failed", { request: requestId, durationMs: Date.now() - startedAt, error: logger.errorKind(error) });
        emit("error", error instanceof Error ? error.message : "Unable to create the drawing.");
      } finally { controller.close(); }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Request-Id": requestId } });
}
