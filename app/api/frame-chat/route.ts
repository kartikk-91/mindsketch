import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatImage = { imageBase64: string; mimeType: string };

interface FrameChatRequest {
  messages: ChatMessage[];
  image?: ChatImage;
  
  imageAnalysis?: string;
  forceAnalysis?: boolean;
}

const IMAGE_ANALYSIS_PROMPT = `Analyze this MindSketch board for another assistant. Produce a compact but information-rich board brief: visible text and labels, objects and their relationships, layout, flow/diagram meaning, notable gaps or errors, and any relevant image content. Be precise. This brief will be the only visual context supplied to the chat model.`;

const CHAT_SYSTEM_PROMPT = "You are a helpful assistant discussing a MindSketch board. Be clear and practical. Use the supplied image analysis when it is relevant, but do not claim to see information that is not in it.";
const GEMINI_VISION_MODEL = "gemini-3-flash-preview";
const GROQ_MODEL = "openai/gpt-oss-20b";
const GEMINI_FREE_KEY_NAMES = Array.from({ length: 3 }, (_, index) => `GEMINI_API_KEY_F${index + 1}`);
const GROQ_FREE_KEY_NAMES = Array.from({ length: 3 }, (_, index) => `GROQ_API_KEY_F${index + 1}`);
const GEMINI_FREE_KEY_ATTEMPTS = 5;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const encoder = new TextEncoder();
const event = (type: string, value: string) => encoder.encode(`${JSON.stringify({ type, value })}\n`);

function friendlyError() {
  return "I couldn't generate a reply right now. Please try again in a moment.";
}

type ProviderKey = { name: string; value: string; source: "free" | "paid" };
type ProviderResult = { provider: "groq"; credential: "free" | "paid"; outputCharacters: number };

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function providerKeys(freeKeyNames: string[], paidKeyName: string, maxFreeAttempts: number, provider: string): ProviderKey[] {
  const freeKeys = freeKeyNames
    .map((name) => ({ name, value: process.env[name] }))
    .filter((key): key is { name: string; value: string } => Boolean(key.value));
  const selectedFreeKeys = shuffled(freeKeys).slice(0, maxFreeAttempts);
  const paidKey = process.env[paidKeyName];

  if (!selectedFreeKeys.length && !paidKey) {
    throw new Error(`${provider} is not configured. Add one or more free keys or ${paidKeyName}.`);
  }

  return [
    ...selectedFreeKeys.map((key) => ({ ...key, source: "free" as const })),
    ...(paidKey ? [{ name: paidKeyName, value: paidKey, source: "paid" as const }] : []),
  ];
}

async function analyzeImage(image: ChatImage, requestId: string): Promise<string> {
  const keys = providerKeys(GEMINI_FREE_KEY_NAMES, "GEMINI_API_KEY", GEMINI_FREE_KEY_ATTEMPTS, "Gemini");
  let lastFailure = "Gemini vision request failed";
  const startedAt = Date.now();
  logger.info("ai.chat", "vision_started", { request: requestId, image: true });

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (key.source === "paid" && index > 0) {
      logger.warn("ai.chat", "paid_fallback", { request: requestId, provider: "gemini", afterAttempts: index });
    }
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${key.value}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: IMAGE_ANALYSIS_PROMPT },
              { inlineData: { mimeType: image.mimeType, data: image.imageBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 4096 },
        }),
      });
      if (!response.ok) {
        lastFailure = `HTTP ${response.status}`;
        logger.warn("ai.chat", "provider_retry", { request: requestId, provider: "gemini", credential: key.source, attempt: index + 1, status: response.status });
        continue;
      }
      const payload = await response.json();
      const analysis = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
      if (!analysis) throw new Error("Gemini returned no board brief");
      logger.info("ai.chat", "vision_complete", { request: requestId, provider: "gemini", credential: key.source, model: GEMINI_VISION_MODEL, durationMs: Date.now() - startedAt });
      return analysis;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : "Network error";
      logger.warn("ai.chat", "provider_retry", { request: requestId, provider: "gemini", credential: key.source, attempt: index + 1, error: logger.errorKind(error) });
    }
  }

  logger.error("ai.chat", "vision_failed", { request: requestId, attempts: keys.length });
  throw new Error(`Gemini vision request failed after free-key rotation and paid fallback: ${lastFailure}`);
}

function groqMessages(messages: ChatMessage[], imageAnalysis?: string) {
  return [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...(imageAnalysis ? [{ role: "system", content: `Image analysis:\n${imageAnalysis}` }] : []),
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ];
}


async function streamGroq(messages: ChatMessage[], imageAnalysis: string | undefined, emit: (type: string, value: string) => void, requestId: string): Promise<ProviderResult> {
  const keys = providerKeys(GROQ_FREE_KEY_NAMES, "GROQ_API_KEY", GROQ_FREE_KEY_NAMES.length, "Groq");
  let response: Response | undefined;
  let selectedKey: ProviderKey | undefined;
  let lastFailure = "Groq request failed";

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (key.source === "paid" && index > 0) {
      logger.warn("ai.chat", "paid_fallback", { request: requestId, provider: "groq", afterAttempts: index });
    }
    try {
      const candidateResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key.value}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: groqMessages(messages, imageAnalysis),
          temperature: 0.4,
          stream: true,
        }),
      });
      if (candidateResponse.ok && candidateResponse.body) {
        response = candidateResponse;
        selectedKey = key;
        break;
      }
      lastFailure = `HTTP ${candidateResponse.status}`;
      logger.warn("ai.chat", "provider_retry", { request: requestId, provider: "groq", credential: key.source, attempt: index + 1, status: candidateResponse.status });
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : "Network error";
      logger.warn("ai.chat", "provider_retry", { request: requestId, provider: "groq", credential: key.source, attempt: index + 1, error: logger.errorKind(error) });
    }
  }
  if (!response?.body || !selectedKey) {
    logger.error("ai.chat", "completion_failed", { request: requestId, attempts: keys.length });
    throw new Error(`Groq request failed after free-key rotation and paid fallback: ${lastFailure}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputCharacters = 0;
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return { provider: "groq", credential: selectedKey.source, outputCharacters };
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) {
          outputCharacters += delta.length;
          emit("token", delta);
        }
      } catch {
      }
    }
    if (done) return { provider: "groq", credential: selectedKey.source, outputCharacters };
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!checkRateLimit(userId)) return new Response(JSON.stringify({ error: "Too many messages. Please wait a moment and try again." }), { status: 429 });
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  let body: FrameChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid chat request." }), { status: 400 });
  }
  if (!body.messages?.length) return new Response(JSON.stringify({ error: "A chat message is required." }), { status: 400 });
  logger.info("ai.chat", "request_started", { request: requestId, messages: body.messages.length, image: Boolean(body.image), reuseAnalysis: Boolean(body.imageAnalysis) });

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type: string, value: string) => controller.enqueue(event(type, value));
      try {
        let imageAnalysis = body.imageAnalysis;
        if (body.image && (!imageAnalysis || body.forceAnalysis)) {
          emit("status", "Understanding the image…");
          imageAnalysis = await analyzeImage(body.image, requestId);
          emit("analysis", imageAnalysis);
        }

        emit("status", "Thinking…");
        const result = await streamGroq(body.messages, imageAnalysis, emit, requestId);
        emit("done", "");
        logger.info("ai.chat", "request_complete", { request: requestId, provider: result.provider, credential: result.credential, model: GROQ_MODEL, durationMs: Date.now() - startedAt, outputCharacters: result.outputCharacters });
      } catch (error) {
        logger.error("ai.chat", "request_failed", { request: requestId, durationMs: Date.now() - startedAt, error: logger.errorKind(error) });
        emit("error", friendlyError());
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Request-Id": requestId,
    },
  });
}
