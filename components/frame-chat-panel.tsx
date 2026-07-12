/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getFrameForChat } from "@/lib/explain-frame";


interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FrameChatPanelProps {
  onClose: () => void;
}


export const FrameChatPanel = ({ onClose }: FrameChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); // starts true for initial capture+analysis
  const [frameImage, setFrameImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const capture = await getFrameForChat();
        if (cancelled) return;
        if (!capture) {
          setError("Failed to capture frame");
          setLoading(false);
          return;
        }

        setFrameImage(`data:${capture.mimeType};base64,${capture.imageBase64}`);

        const initialMessage: Message = {
          role: "user",
          content: "What do you see on this board? Give me a brief overview.",
        };

        const response = await fetch("/api/frame-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: capture.imageBase64,
            mimeType: capture.mimeType,
            messages: [initialMessage],
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to analyze frame");
        }

        const data = await response.json();

        if (!cancelled) {
          setMessages([
            initialMessage,
            { role: "assistant", content: data.reply },
          ]);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Something went wrong");
          toast.error(err.message || "Failed to analyze frame");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const capture = await getFrameForChat();
      if (!capture) throw new Error("Failed to capture frame");

      const response = await fetch("/api/frame-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: capture.imageBase64,
          mimeType: capture.mimeType,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get response");
      }

      const data = await response.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    setError(null);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
    }
  };

  return (
    <div
      role="dialog"
      className="
        absolute right-0 top-14 w-[400px] h-[520px]
        rounded-2xl border border-neutral-200
        bg-white shadow-2xl
        flex flex-col
        overflow-hidden
        animate-in fade-in slide-in-from-top-2
      "
    >
      
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-neutral-50 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
          <Image src="/genai.png" alt="" width={26} height={26} />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-900">
            Frame Chat
          </h3>
          <p className="text-xs text-neutral-500">
            Ask questions about this frame
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      
      {frameImage && (
        <div className="border-b bg-neutral-100 px-4 py-2 shrink-0">
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-200 bg-white">
            <Image
              src={frameImage}
              alt="Captured frame"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Analyzing frame...</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-[#181C31] text-white rounded-br-md"
                  : "bg-neutral-100 text-neutral-800 rounded-bl-md"
                }
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center gap-2">
              <span>{error}</span>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 underline font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      
      <div className="border-t bg-white px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            disabled={loading}
            className="
              flex-1 h-10 px-4 text-sm
              border border-neutral-200 rounded-full
              focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-neutral-50
            "
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="
              h-10 w-10 flex items-center justify-center
              bg-purple-600 text-white rounded-full
              hover:bg-purple-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition shrink-0
            "
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};