import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatImage = { imageBase64: string; mimeType: string };

interface FrameChatRequest {
  messages: ChatMessage[];
  image?: ChatImage;
  /** Analysis is held by the open chat session so follow-ups never need a second vision call. */
  imageAnalysis?: string;
  forceAnalysis?: boolean;
}

const IMAGE_ANALYSIS_PROMPT = `You are an image understanding engine. Analyze the image thoroughly. Return structured markdown containing: ## OCR (extract every visible text exactly) ## Objects (list every object with location) ## UI Elements (buttons, icons, menus, inputs, windows) ## Errors (any error messages or warnings) ## Tables (extract all tables) ## Charts (explain charts) ## Code (extract visible code exactly) ## Layout (describe positions of important elements) ## Important Context (anything that could become useful later). Do not summarize. Be exhaustive.`;

const CHAT_SYSTEM_PROMPT = "You are a helpful assistant discussing a MindSketch board. Be clear and practical. Use the supplied image analysis when it is relevant, but do not claim to see information that is not in it.";

// Both models are open-weight models served through Groq's OpenAI-compatible API. Llama 4
// Scout handles the board image once, while GPT-OSS answers the rest of the conversation from
// that retained analysis.
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_MODEL = "openai/gpt-oss-20b";

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

async function analyzeImage(image: ChatImage): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error("Groq is not configured");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: IMAGE_ANALYSIS_PROMPT },
          { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.imageBase64}` } },
        ],
      }],
      temperature: 0.1,
      max_completion_tokens: 8192,
    }),
  });
  if (!response.ok) throw new Error(`Vision request failed (${response.status})`);
  const payload = await response.json();
  const analysis = payload.choices?.[0]?.message?.content;
  if (!analysis) throw new Error("Vision model returned no image analysis");
  return analysis;
}

function groqMessages(messages: ChatMessage[], imageAnalysis?: string) {
  return [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...(imageAnalysis ? [{ role: "system", content: `Image analysis:\n${imageAnalysis}` }] : []),
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ];
}

/** Streams Groq's OpenAI-compatible SSE response as plain message deltas. */
async function streamGroq(messages: ChatMessage[], imageAnalysis: string | undefined, emit: (type: string, value: string) => void) {
  if (!process.env.GROQ_API_KEY) throw new Error("Groq is not configured");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: groqMessages(messages, imageAnalysis),
      temperature: 0.4,
      stream: true,
    }),
  });
  if (!response.ok || !response.body) throw new Error(`Groq request failed (${response.status})`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) emit("token", delta);
      } catch {
        // Ignore keep-alives or malformed provider events and continue the stream.
      }
    }
    if (done) return;
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!checkRateLimit(userId)) return new Response(JSON.stringify({ error: "Too many messages. Please wait a moment and try again." }), { status: 429 });

  let body: FrameChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid chat request." }), { status: 400 });
  }
  if (!body.messages?.length) return new Response(JSON.stringify({ error: "A chat message is required." }), { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type: string, value: string) => controller.enqueue(event(type, value));
      try {
        // Vision runs once per board session. The client retains this analysis for all later
        // questions, so neither the screenshot nor the vision model is sent again.
        let imageAnalysis = body.imageAnalysis;
        if (body.image && (!imageAnalysis || body.forceAnalysis)) {
          emit("status", "Understanding the image…");
          imageAnalysis = await analyzeImage(body.image);
          emit("analysis", imageAnalysis);
        }

        emit("status", "Thinking…");
        await streamGroq(body.messages, imageAnalysis, emit);
        emit("done", "");
      } catch (error) {
        console.error("frame-chat error:", error);
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
    },
  });
}
