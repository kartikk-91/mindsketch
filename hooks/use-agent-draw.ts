/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback, useRef, useState } from "react";
import { captureFrameForAgentWithValidation, dataUrlToBase64 } from "@/lib/agent-export";
import { createLayerFromParams, validateLayerParams, applySmartDefaults, CreateLayerParams } from "@/lib/agent-operations";
import { LayerType, ShapeType } from "@/types/canvas";

export interface AgentMessage {
  type: "thought" | "tool_call" | "result" | "error" | "done";
  content?: string;
  toolCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
  error?: string;
}

export function useAgentDraw(insertLayerFn?: (params: CreateLayerParams) => Promise<unknown> | unknown) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const generatedLayerIds = useRef(new Map<string, string>());

  const generateDrawing = useCallback(
    async (prompt: string, includeCanvas = true, viewport?: { x: number; y: number; width: number; height: number }) => {
      setIsProcessing(true);
      setMessages([]);
      setError(null);
      generatedLayerIds.current.clear();

      try {
        // Capture canvas state if requested
        let imageData;
        if (includeCanvas) {
          const capture = await captureFrameForAgentWithValidation(1024);
          if (capture) {
            imageData = {
              imageBase64: dataUrlToBase64(capture.dataUrl),
              mimeType: "image/jpeg",
            };
          }
        }

        const response = await fetch("/api/agent/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            image: imageData,
            viewport,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate drawing");
        }

        // Process streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const wire = JSON.parse(line) as AgentMessage & { value?: string };
              const toolCall = wire.type === "tool_call" && !wire.toolCall && wire.value
                ? JSON.parse(wire.value)
                : wire.toolCall;
              const message: AgentMessage = {
                ...wire,
                content: wire.content ?? wire.value,
                error: wire.error ?? (wire.type === "error" ? wire.value : undefined),
                toolCall,
              };
              setMessages((prev) => [...prev, message]);

              if (message.type === "error") {
                const detail = message.error || "Unable to create the drawing";
                setError(detail);
                return false;
              }

              // Execute tool calls
              if (message.type === "tool_call" && message.toolCall) {
                try {
                  await executeToolCall(message.toolCall);
                } catch (cause) {
                  const detail = cause instanceof Error ? cause.message : "Unable to add one diagram element";
                  setMessages((previous) => [...previous, { type: "error", error: detail }]);
                }
              }
            } catch (e) {
              console.error("Failed to parse message:", line, e);
            }
          }
        }
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          { type: "error", error: errorMessage },
        ]);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const executeToolCall = useCallback(
    async (toolCall: { name: string; parameters: Record<string, unknown> }) => {
      if (toolCall.name === "create_layer" && insertLayerFn) {
        try {
          // Convert planner enum names to the application's actual enum values.
          // Keep this tied to the source enum: hand-written number maps had drifted and
          // inserted rectangles as text layers (or rejected them) instead.
          const params = toolCall.parameters as any;
          const operationId = typeof params.id === "string" ? params.id : undefined;
          if (params.connect) {
            const from = generatedLayerIds.current.get(params.connect.from);
            const to = generatedLayerIds.current.get(params.connect.to);
            if (!from || !to) throw new Error("A connector was planned before its target nodes were created");
            params.connect = { from, to };
          }
          if (typeof params.layerType === "string") {
            const value = LayerType[params.layerType as keyof typeof LayerType];
            if (typeof value !== "number") throw new Error(`Unsupported layer type: ${params.layerType}`);
            params.layerType = value;
          }
          if (typeof params.shapeType === "string") {
            const value = ShapeType[params.shapeType as keyof typeof ShapeType];
            if (typeof value !== "number") throw new Error(`Unsupported shape type: ${params.shapeType}`);
            params.shapeType = value;
          }
          
          const layerId = await insertLayerFn(params as CreateLayerParams);
          if (operationId && typeof layerId === "string") generatedLayerIds.current.set(operationId, layerId);
        } catch (err) {
          throw err;
        }
      }
      // Add other tool handlers here as needed
    },
    [insertLayerFn]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    generateDrawing,
    isProcessing,
    messages,
    error,
    clearMessages,
  };
}
