"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { Clock, Loader2, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { getFrameForChat, fileToCompressedChatImage } from "@/lib/explain-frame";
import { MessageBubble, type ChatImagePreview, type DisplayMessage } from "./frame-chat/message-bubble";
import { UploadButton, UploadPreview } from "./frame-chat/upload-preview";

type ChatImage = ChatImagePreview & { imageBase64: string; mimeType: string };
type ChatMessage = DisplayMessage & { analysis?: string };
type StreamEvent = { type: "analysis" | "token" | "status" | "done" | "error" | "fallback"; value: string };

interface FrameChatPanelProps { boardId: string; isOpen: boolean; onClose: () => void; }

const INITIAL_QUESTION = "What do you see on this board? Give me a brief overview.";

const needsFreshAnalysis = (message: string) => /\b(re-?analy[sz]e|run ocr|read (?:the )?(?:small|tiny|hidden) (?:text|code)|extract (?:the )?(?:text|code))\b/i.test(message);

type FrameChatSession = {
  activeImage: ChatImage | null;
  hasStarted: boolean;
  imageAnalysis: string | null;
  isFirstReply: boolean;
  messages: ChatMessage[];
};

// Preserved when the panel closes, but reset automatically by a browser reload.
const frameChatSessions = new Map<string, FrameChatSession>();

function getSession(boardId: string): FrameChatSession {
  return frameChatSessions.get(boardId) ?? {
    activeImage: null,
    hasStarted: false,
    imageAnalysis: null,
    isFirstReply: true,
    messages: [],
  };
}

export const FrameChatPanel = ({ boardId, isOpen, onClose }: FrameChatPanelProps) => {
  const initialSession = getSession(boardId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialSession.messages);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<ChatImage | null>(null);
  const [activeImage, setActiveImage] = useState<ChatImage | null>(initialSession.activeImage);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(initialSession.imageAnalysis);
  const [status, setStatus] = useState(initialSession.hasStarted ? "" : "Preparing board…");
  const [isGenerating, setIsGenerating] = useState(!initialSession.hasStarted);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  // The very first reply has to run a vision pass plus a completion, so it is
  // meaningfully slower than every follow-up. We only want to warn about that once.
  const [isFirstReply, setIsFirstReply] = useState(initialSession.isFirstReply);
  const [hasStarted, setHasStarted] = useState(initialSession.hasStarted);
  const [restartNonce, setRestartNonce] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastRequestRef = useRef<{ text: string; image?: ChatImage; forceAnalysis?: boolean } | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  useEffect(() => {
    frameChatSessions.set(boardId, { activeImage, hasStarted, imageAnalysis, isFirstReply, messages });
  }, [activeImage, boardId, hasStarted, imageAnalysis, isFirstReply, messages]);

  const appendStream = useCallback(async (response: Response, assistantId: string, analyzedMessageId?: string) => {
    if (!response.ok || !response.body) throw new Error("The assistant is temporarily unavailable.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line) continue;
        const event = JSON.parse(line) as StreamEvent;
        if (event.type === "analysis") {
          setImageAnalysis(event.value);
          setMessages((current) => current.map((message) => message.id === analyzedMessageId ? { ...message, analysis: event.value } : message));
        } else if (event.type === "token") {
          setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: message.content + event.value } : message));
        } else if (event.type === "status") {
          setStatus(event.value);
        } else if (event.type === "error") {
          throw new Error(event.value);
        }
      }
      if (done) return;
    }
  }, []);

  const sendMessage = useCallback(async (text: string, suppliedImage?: ChatImage, forceAnalysis = false, allowWhileGenerating = false) => {
    if (!text.trim() || (isGenerating && !allowWhileGenerating)) return;
    const image = suppliedImage ?? (forceAnalysis ? activeImage ?? undefined : undefined);
    const isNewImage = Boolean(suppliedImage);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim(), image: image ? { previewUrl: image.previewUrl, name: image.name } : undefined };
    const assistantId = crypto.randomUUID();
    const nextMessages = [...messages, userMessage];
    lastRequestRef.current = { text, image: suppliedImage, forceAnalysis };
    setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setPendingImage(null);
    setError(null);
    setStatus(image ? "Understanding the image…" : "Thinking…");
    setIsGenerating(true);
    if (suppliedImage) {
      setActiveImage(suppliedImage);
      setImageAnalysis(null);
    }

    try {
      const response = await fetch("/api/frame-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          image: image ? { imageBase64: image.imageBase64, mimeType: image.mimeType } : undefined,
          imageAnalysis: isNewImage ? undefined : imageAnalysis ?? undefined,
          forceAnalysis,
        }),
      });
      await appendStream(response, assistantId, userMessage.id);
      setMessages((current) => current.filter((message) => message.id !== assistantId || message.content));
      setIsFirstReply(false);
    } catch (cause) {
      setMessages((current) => current.filter((message) => message.id !== assistantId));
      setError(cause instanceof Error ? cause.message : "I couldn't generate a reply. Please try again.");
    } finally {
      setIsGenerating(false);
      setStatus("");
      inputRef.current?.focus();
    }
  }, [activeImage, appendStream, imageAnalysis, isGenerating, messages]);

  useEffect(() => {
    if (hasStarted || getSession(boardId).hasStarted) return;
    frameChatSessions.set(boardId, { ...getSession(boardId), hasStarted: true });
    setHasStarted(true);
    let cancelled = false;
    async function startFrameChat() {
      try {
        const capture = await getFrameForChat();
        if (!capture || cancelled) throw new Error("I couldn't capture this board. Please try again.");
        const image: ChatImage = { ...capture, previewUrl: `data:${capture.mimeType};base64,${capture.imageBase64}`, name: "Current board" };
        // The open-weight vision model analyzes this frame once; follow-ups reuse that analysis.
        await sendMessage(INITIAL_QUESTION, image, false, true);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "I couldn't start the chat.");
          setIsGenerating(false);
        }
      }
    }
    void startFrameChat();
    return () => { cancelled = true; };
    // This runs only for a new session or an explicit restart. `sendMessage` uses the empty
    // history for the opening prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  const restartChat = () => {
    frameChatSessions.delete(boardId);
    lastRequestRef.current = null;
    setMessages([]);
    setActiveImage(null);
    setImageAnalysis(null);
    setIsFirstReply(true);
    setError(null);
    setStatus("Preparing board…");
    setIsGenerating(true);
    setHasStarted(false);
    setRestartNonce((current) => current + 1);
  };

  const loadImage = async (file?: File) => {
    if (!file) return;
    try {
      setPendingImage(await fileToCompressedChatImage(file));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please choose a valid image.");
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => loadImage(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    void loadImage(event.dataTransfer.files?.[0]);
  };
  const submit = () => {
    const text = input.trim() || (pendingImage ? "What can you tell me about this image?" : "");
    const forceAnalysis = !pendingImage && Boolean(activeImage && imageAnalysis && needsFreshAnalysis(text));
    void sendMessage(text, pendingImage ?? undefined, forceAnalysis);
  };

  return (
    <section
      role="dialog"
      aria-label="MindSketch AI chat"
      className={`absolute right-0 top-14 flex h-[min(640px,calc(100vh-5rem))] w-[calc(100vw-2rem)] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-solid-6 sm:w-[430px] ${isOpen ? "" : "hidden"}`}
    >
      <header className="flex items-center gap-3 border-b border-stroke bg-white px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-black">MindSketch AI</h2>
          <p className="truncate text-xs text-waterloo">Your board, in conversation</p>
        </div>
        <button onClick={restartChat} disabled={isGenerating} className="rounded-full p-2 text-waterloo transition hover:bg-[#F2FBE3] hover:text-[#149C86] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Restart chat" title="Restart chat">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-full p-2 text-waterloo transition hover:bg-alabaster hover:text-black" aria-label="Close chat">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto bg-alabaster/40 px-4 py-4">
        <div className="space-y-3">
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}

          {isGenerating && (
            isFirstReply ? (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex max-w-[85%] flex-col gap-1.5 rounded-2xl rounded-bl-md border border-stroke bg-white px-3.5 py-2.5 shadow-solid-2">
                  <div className="flex items-center gap-2 text-xs text-waterloo">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-meta" />
                    {status || "Thinking…"}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-zumthor px-2.5 py-1 text-[11px] font-medium text-black">
                    <Clock className="h-3 w-3" />
                    First reply takes a moment while the board is understood
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-9 text-xs text-waterloo">
                <Loader2 className="h-4 w-4 animate-spin text-meta" />
                {status || "Thinking…"}
              </div>
            )
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-black">
              <p>{error}</p>
              <button
                onClick={() => { const last = lastRequestRef.current; if (last) void sendMessage(last.text, last.image, last.forceAnalysis); }}
                className="mt-1 font-medium underline"
              >
                Try again
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className={`border-t border-stroke bg-white px-4 py-3 transition-colors ${dragActive ? "bg-zumthor" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        {pendingImage && <UploadPreview image={pendingImage} onRemove={() => setPendingImage(null)} />}
        <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/*" className="hidden" />
        <div className="flex items-end gap-2">
          <UploadButton onClick={() => fileInputRef.current?.click()} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }}
            placeholder={dragActive ? "Drop image to attach" : "Ask a follow-up…"}
            rows={1}
            disabled={isGenerating}
            className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-stroke bg-alabaster/60 px-3.5 py-2.5 text-sm text-black outline-none placeholder:text-waterloo focus:border-meta focus:bg-white focus:ring-1 focus:ring-meta disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={isGenerating || (!input.trim() && !pendingImage)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Send message"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-waterloo">Drop an image here or attach one. Images are compressed before analysis.</p>
      </div>
    </section>
  );
};
