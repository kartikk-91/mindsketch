"use client";

import { cn, ColorToCSS, getContrastingTextColor } from "@/lib/utils";
import { useMutation } from "@liveblocks/react";
import { NoteFontFamily, NoteLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import {
  Kalam,
  Inter,
  Nunito,
  JetBrains_Mono,
  Lora,
} from "next/font/google";
import React from "react";



const kalam = Kalam({ subsets: ["latin"], weight: ["400"] });
const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"] });
const serif = Lora({ subsets: ["latin"] });

const fonts: Record<NoteFontFamily, { className: string }> = {
  kalam,
  inter,
  nunito,
  mono,
  serif,
};



interface NoteProps {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}



export function Note({
  id,
  layer,
  onPointerDown,
  selectionColor,
}: NoteProps) {
  const {
    x,
    y,
    width,
    height,
    fill,
    value,
    rotation = 0,
    fontFamily = "kalam",
    fontSize = 16,
    padding = 14,
  } = layer;

  const cx = x + width / 2;
  const cy = y + height / 2;

  const updateValue = useMutation(({ storage }, text: string) => {
    storage.get("layers").get(id)?.set("value", text);
  }, []);

  const handleChange = (e: ContentEditableEvent) => {
    updateValue(e.target.value);
  };

  

  const stopScrollPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const fontClass = fonts[fontFamily].className;

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
      <foreignObject
        x={x}
        y={y}
        width={width}
        height={height}
        onPointerDown={(e) => onPointerDown(e, id)}
        className="pointer-events-auto"
      >
        <div
          className={cn(
            "relative w-full h-full rounded-lg overflow-hidden",
           
            "shadow-[0_6px_14px_rgba(0,0,0,0.18),0_2px_4px_rgba(0,0,0,0.12)]"
          )}
          style={{
            backgroundColor: fill ? ColorToCSS(fill) : "#FFF6A5",
            outline: selectionColor
              ? `2px solid ${selectionColor}`
              : "1px solid rgba(0,0,0,0.06)",
          }}
        >
                    <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)",
              opacity: 0.25,
            }}
          />

                    <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          />

                    <div className="absolute top-0 right-0 w-0 h-0 pointer-events-none">
                        <div
              className="absolute -left-[22px] top-0 w-0 h-0"
              style={{
                borderTop: "22px solid rgba(0,0,0,0.15)",
                borderLeft: "22px solid transparent",
              }}
            />
                        <div
              className="absolute -left-[20px] top-0 w-0 h-0"
              style={{
                borderTop: "20px solid rgba(255,255,255,0.55)",
                borderLeft: "20px solid transparent",
              }}
            />
          </div>

          <ContentEditable
            html={value || ""}
            onChange={handleChange}
            onWheel={stopScrollPropagation}
            className={cn(
              "w-full h-full outline-none",
              "whitespace-pre-wrap break-words",
              "overflow-y-auto scrollbar-none",
              fontClass
            )}
            style={{
              padding,
              fontSize,
              lineHeight: 1.55,
              color: fill
                ? getContrastingTextColor(fill)
                : "#222",
            }}
          />
        </div>
      </foreignObject>
    </g>
  );
}
