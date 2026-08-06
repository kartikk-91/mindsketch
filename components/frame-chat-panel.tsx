"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Clock, Loader2, Network, PieChart, RefreshCw, Send, Sparkles, TrendingUp, X, PenTool, WandSparkles } from "lucide-react";
import { getFrameForChat, fileToCompressedChatImage } from "@/lib/explain-frame";
import { useAgentDraw} from "@/hooks/use-agent-draw";
import { MessageBubble, type ChatImagePreview, type DisplayMessage } from "./frame-chat/message-bubble";
import { UploadButton, UploadPreview } from "./frame-chat/upload-preview";
import { useMutation } from "@liveblocks/react/suspense";
import { createLayerFromParams, validateLayerParams, applySmartDefaults, CreateLayerParams } from "@/lib/agent-operations";

type ChatImage = ChatImagePreview & { imageBase64: string; mimeType: string };
type ChatMessage = DisplayMessage & { analysis?: string; hidden?: boolean };
type StreamEvent = { type: "analysis" | "token" | "status" | "done" | "error" | "fallback"; value: string };
type PanelMode = "chat" | "draw";

interface FrameChatPanelProps { boardId: string; isOpen: boolean; initialMode?: PanelMode; viewport?: { x: number; y: number; width: number; height: number }; onClose: () => void; }

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

export const FrameChatPanel = ({ boardId, isOpen, initialMode = "chat", viewport, onClose }: FrameChatPanelProps) => {
  const initialSession = getSession(boardId);
  const [mode, setMode] = useState<PanelMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>(initialSession.messages);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<ChatImage | null>(null);
  const [activeImage, setActiveImage] = useState<ChatImage | null>(initialSession.activeImage);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(initialSession.imageAnalysis);
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Agent drawing hook with canvas mutation
  const insertLayer = useMutation(
    ({ storage }, params: CreateLayerParams) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");

      const validation = validateLayerParams(params);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const finalParams = applySmartDefaults(params);
      if (finalParams.connect) {
        const start = liveLayers.get(finalParams.connect.from);
        const end = liveLayers.get(finalParams.connect.to);
        if (start && end) {
          const sx = start.get("x") as number, sy = start.get("y") as number, sw = start.get("width") as number, sh = start.get("height") as number;
          const ex = end.get("x") as number, ey = end.get("y") as number, ew = end.get("width") as number, eh = end.get("height") as number;
          const sourceCenter = { x: sx + sw / 2, y: sy + sh / 2 };
          const targetCenter = { x: ex + ew / 2, y: ey + eh / 2 };
          const horizontal = Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y);
          const startSide = horizontal ? (targetCenter.x >= sourceCenter.x ? 8 : 4) : (targetCenter.y >= sourceCenter.y ? 2 : 1);
          const endSide = startSide === 8 ? 4 : startSide === 4 ? 8 : startSide === 2 ? 1 : 2;
          const borderPoint = (x: number, y: number, width: number, height: number, side: number) => side === 8 ? { x: x + width, y: y + height / 2 } : side === 4 ? { x, y: y + height / 2 } : side === 2 ? { x: x + width / 2, y: y + height } : { x: x + width / 2, y };
          const startPoint = borderPoint(sx, sy, sw, sh, startSide);
          const endPoint = borderPoint(ex, ey, ew, eh, endSide);
          finalParams.position = startPoint;
          finalParams.size = { width: endPoint.x - startPoint.x, height: endPoint.y - startPoint.y };
          finalParams.connectorSides = { startSide, endSide };
        }
      }
      const layerId = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const layer = createLayerFromParams(finalParams);

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      return layerId;
    },
    []
  );

  const { generateDrawing, isProcessing: isAgentProcessing, messages: agentMessages, error: agentError } = useAgentDraw(insertLayer);
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

  useEffect(() => { setMode(initialMode); }, [initialMode]);

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
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim(), image: image ? { previewUrl: image.previewUrl, name: image.name } : undefined, hidden: text.trim() === INITIAL_QUESTION && suppliedImage?.name === "Current board" };
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
    if (mode !== "chat") return;
    if (hasStarted || getSession(boardId).hasStarted) return;
    frameChatSessions.set(boardId, { ...getSession(boardId), hasStarted: true });
    setHasStarted(true);
    setIsGenerating(true);
    setStatus("Preparing board…");
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
  }, [mode, restartNonce]);

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
    if (mode === "draw") {
      const text = input.trim();
      if (text) {
        void generateDrawing(text, true);
        setInput("");
      }
    } else {
      const text = input.trim() || (pendingImage ? "What can you tell me about this image?" : "");
      const forceAnalysis = !pendingImage && Boolean(activeImage && imageAnalysis && needsFreshAnalysis(text));
      void sendMessage(text, pendingImage ?? undefined, forceAnalysis);
    }
  };

  const handleAgentDraw = async () => {
    const text = input.trim();
    if (!text) return;
    
    setError(null);
    setStatus("Planning your diagram…");
    
    try {
      const created = await generateDrawing(text, true, viewport);
      if (created) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate drawing");
    } finally {
      setStatus("");
    }
  };

  if (mode === "draw" && isOpen) {
    const promptIdeas = [
      { label: "Flowchart", prompt: "Create a polished customer onboarding flowchart with decision points and connected arrows.", icon: Network },
      { label: "Bar chart", prompt: "Create a bar chart for quarterly revenue: Q1 42, Q2 58, Q3 71, Q4 89.", icon: BarChart3 },
      { label: "Pie chart", prompt: "Create a pie chart for traffic sources: Organic 48, Paid 24, Referral 18, Social 10.", icon: PieChart },
      { label: "Trend chart", prompt: "Create a filled area chart for monthly active users: Jan 120, Feb 145, Mar 162, Apr 150, May 188, Jun 224.", icon: TrendingUp },
    ];
    return (
      <section role="dialog" aria-modal="true" aria-label="Draw with AI" className={`fixed inset-0 z-[70] flex items-center justify-center bg-[#181C31]/10 p-4 ${isOpen ? "" : "hidden"}`}>
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-stroke bg-white shadow-[0_18px_55px_rgba(24,28,49,0.2)]">
          <header className="flex items-center gap-3 border-b border-stroke px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#20C5A8] via-[#6F8DFF] to-[#FFB800] text-white shadow-solid-2"><WandSparkles className="h-4 w-4" /></div>
            <div className="flex-1"><h2 className="text-base font-semibold text-black">Draw with AI</h2><p className="text-sm text-waterloo">Describe an idea, diagram, or chart. We’ll compose it on your board.</p></div>
            <button onClick={onClose} className="rounded-full p-2 text-waterloo transition hover:bg-alabaster hover:text-black" aria-label="Close draw with AI"><X className="h-5 w-5" /></button>
          </header>
          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-3 gap-3">
              {promptIdeas.map(({ label, prompt, icon: Icon }) => <button key={label} onClick={() => setInput(prompt)} disabled={isAgentProcessing} className="flex items-center gap-2 rounded-xl border border-stroke bg-alabaster/50 px-3 py-2.5 text-left transition hover:border-[#20C5A8] hover:bg-[#F2FBE3] disabled:opacity-50"><Icon className="h-4 w-4 shrink-0 text-[#149C86]" /><span className="text-xs font-semibold text-black">{label}</span></button>)}
            </div>
            <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleAgentDraw(); } }} rows={3} disabled={isAgentProcessing} placeholder="Describe what you want to create…" className="w-full resize-none rounded-xl border border-stroke bg-alabaster/60 px-3.5 py-3 text-sm text-black outline-none placeholder:text-waterloo focus:border-[#20C5A8] focus:bg-white focus:ring-1 focus:ring-[#20C5A8] disabled:opacity-60" />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-waterloo">Flowcharts, mind maps, and charts.</p>
              <button onClick={handleAgentDraw} disabled={!input.trim() || isAgentProcessing} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#181C31] px-5 text-sm font-semibold text-white transition hover:bg-[#2C3149] disabled:cursor-not-allowed disabled:opacity-50">{isAgentProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}{isAgentProcessing ? "Creating…" : "Create on board"}</button>
            </div>
            {(isAgentProcessing || agentMessages.length > 0 || agentError) && <div className="rounded-2xl border border-stroke bg-alabaster/70 px-4 py-3 text-sm"><div className="flex items-center gap-2 text-waterloo">{isAgentProcessing && <Loader2 className="h-4 w-4 animate-spin text-[#149C86]" />}<span>{agentError || agentMessages.filter((message) => message.type === "result" || message.type === "thought").slice(-1)[0]?.content || "Planning your composition…"}</span></div></div>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      role="dialog"
      aria-label="MindSketch AI chat"
      className={`absolute right-0 top-14 flex h-[min(640px,calc(100vh-5rem))] w-[calc(100vw-2rem)] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-solid-6 sm:w-[430px] ${isOpen ? "" : "hidden"}`}
    >
      <header className="flex items-center gap-3 border-b border-stroke bg-white px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2">
          {mode === "draw" ? <PenTool className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-black">MindSketch AI</h2>
          <p className="truncate text-xs text-waterloo">{mode === "draw" ? "Draw with AI" : "Your board, in conversation"}</p>
        </div>
        <button onClick={restartChat} disabled={isGenerating || isAgentProcessing} className="rounded-full p-2 text-waterloo transition hover:bg-[#F2FBE3] hover:text-[#149C86] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Restart chat" title="Restart chat">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-full p-2 text-waterloo transition hover:bg-alabaster hover:text-black" aria-label="Close chat">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto bg-alabaster/40 px-4 py-4">
        <div className="space-y-3">
          {mode === "chat" ? (
            messages.filter((message) => !message.hidden && (message.role === "user" || Boolean(message.content) || Boolean(message.image))).map((message) => <MessageBubble key={message.id} message={message} />)
          ) : (
            agentMessages.map((message, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2">
                  <PenTool className="h-3.5 w-3.5" />
                </div>
                <div className="flex max-w-[85%] flex-col gap-1.5 rounded-2xl rounded-bl-md border border-stroke bg-white px-3.5 py-2.5 shadow-solid-2">
                  {message.type === "thought" && (
                    <p className="text-sm text-waterloo">{message.content}</p>
                  )}
                  {message.type === "tool_call" && message.toolCall && (
                    <div className="text-sm">
                      <p className="font-medium text-black">Creating: {message.toolCall.name}</p>
                      <p className="text-xs text-waterloo mt-1">{JSON.stringify(message.toolCall.parameters, null, 2)}</p>
                    </div>
                  )}
                  {message.type === "result" && (
                    <p className="text-sm text-black">{message.content}</p>
                  )}
                  {message.type === "error" && (
                    <p className="text-sm text-destructive">{message.error}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {mode === "chat" && isGenerating && (
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

          {mode === "draw" && isAgentProcessing && (
            <div className="flex items-center gap-2 pl-9 text-xs text-waterloo">
              <Loader2 className="h-4 w-4 animate-spin text-meta" />
              {status || "Creating your diagram…"}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-black">
              <p>{error}</p>
              {mode === "chat" && (
                <button
                  onClick={() => { const last = lastRequestRef.current; if (last) void sendMessage(last.text, last.image, last.forceAnalysis); }}
                  className="mt-1 font-medium underline"
                >
                  Try again
                </button>
              )}
              {mode === "draw" && agentError && (
                <button
                  onClick={() => { if (input.trim()) void generateDrawing(input.trim(), true); }}
                  className="mt-1 font-medium underline"
                >
                  Try again
                </button>
              )}
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
        {mode === "chat" && pendingImage && <UploadPreview image={pendingImage} onRemove={() => setPendingImage(null)} />}
        {mode === "chat" && <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/*" className="hidden" />}
        <div className="flex items-end gap-2">
          {mode === "chat" && <UploadButton onClick={() => fileInputRef.current?.click()} />}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }}
            placeholder={mode === "draw" ? "Describe what you want to draw (e.g., 'Draw a flowchart with 3 boxes')..." : dragActive ? "Drop image to attach" : "Ask a follow-up…"}
            rows={1}
            disabled={isGenerating || isAgentProcessing}
            className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-stroke bg-alabaster/60 px-3.5 py-2.5 text-sm text-black outline-none placeholder:text-waterloo focus:border-meta focus:bg-white focus:ring-1 focus:ring-meta disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={(isGenerating || isAgentProcessing) || (!input.trim() && !pendingImage)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#20C5A8] via-[#A9DF52] to-[#FFB800] text-white shadow-solid-2 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label={mode === "draw" ? "Generate drawing" : "Send message"}
          >
            {(isGenerating || isAgentProcessing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-waterloo">
          {mode === "draw" 
            ? "Describe diagrams, flowcharts, or any visual concept. AI will create it on your canvas."
            : "Drop an image here or attach one. Images are compressed before analysis."
          }
        </p>
      </div>
    </section>
  );
};
