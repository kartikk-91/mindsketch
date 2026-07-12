/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";


interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FrameChatRequest {
  imageBase64: string;
  mimeType: string;
  messages: ChatMessage[];
}


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});


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

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}


const SYSTEM_PROMPT = `You are a helpful assistant discussing a whiteboard screenshot. Be conversational. Reference visible shapes, text, arrows, and diagrams. Keep answers short (1-3 sentences) unless asked for detail. Don't mention you're "looking at an image."`;


export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded (20 messages/min)." },
        { status: 429 }
      );
    }

    const body: FrameChatRequest = await req.json();
    const { imageBase64, mimeType, messages } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "imageBase64 and mimeType required" }, { status: 400 });
    }

    if (!messages?.length) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const parts: any[] = [
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: mimeType ?? "image/png",
          data: imageBase64,
        },
      },
      { text: messages[0].content || "What's on this board?" },
    ];

    const contents: any[] = [{ role: "user", parts }];

    for (let i = 1; i < messages.length; i++) {
      contents.push({
        role: messages[i].role === "assistant" ? "model" : "user",
        parts: [{ text: messages[i].content }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      config: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.95,
      },
      contents,
    });

    const reply = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json({ error: "Empty response" }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("frame-chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}