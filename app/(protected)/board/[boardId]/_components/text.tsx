"use client";

import { cn, ColorToCSS } from "@/lib/utils";
import { useMutation } from "@liveblocks/react";
import { NoteFontFamily, TextLayer } from "@/types/canvas";
import {
  JetBrains_Mono,
} from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useEffect, useRef } from "react";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });

const fonts: Record<NoteFontFamily, { className: string }> = {
  kalam: mono,
  inter: mono,
  nunito: mono,
  mono,
  serif: mono,
};

interface TextProps {
  id: string;
  layer: TextLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const fitFontSize = (
  el: HTMLElement,
  maxWidth: number,
  maxHeight: number
) => {
  const MAX = 96;
  const MIN = 10;

  for (let size = MAX; size >= MIN; size--) {
    el.style.fontSize = `${size}px`;
    if (
      el.scrollWidth <= maxWidth &&
      el.scrollHeight <= maxHeight
    ) {
      return size;
    }
  }

  return MIN;
};

export const Text = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
}: TextProps) => {
  const {
    x,
    y,
    width,
    height,
    fill,
    value,
    rotation = 0,
    textAlign = "center",
    fontFamily = "kalam",
    fontWeight = "regular",
  } = layer;

  const cx = x + width / 2;
  const cy = y + height / 2;

  const contentRef = useRef<HTMLDivElement>(null);

  const updateValue = useMutation(({ storage }, newValue: string) => {
    storage.get("layers").get(id)?.set("value", newValue);
  }, []);

  const handleContentChange = (e: ContentEditableEvent) => {
    updateValue(e.target.value);
  };

  useEffect(() => {
    if (!contentRef.current) return;

    const el = contentRef.current;
    const fitted = fitFontSize(el, width, height);
    el.style.fontSize = `${fitted}px`;
  }, [value, width, height, textAlign, fontFamily, fontWeight]);

  const fontClass = fonts[fontFamily]?.className ?? fonts.kalam.className;

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
      <foreignObject
        x={x}
        y={y}
        width={width}
        height={height}
        onPointerDown={(e) => onPointerDown(e, id)}
        style={{
          outline: selectionColor
            ? `1px solid ${selectionColor}`
            : "none",
        }}
      >
        <ContentEditable
          innerRef={contentRef}
          html={value || "Text"}
          onChange={handleContentChange}
          className={cn(
            "w-full h-full outline-none",
            "whitespace-pre-wrap break-words",
            "overflow-hidden",
            "flex items-center",
            textAlign === "left" && "justify-start text-left",
            textAlign === "center" && "justify-center text-center",
            textAlign === "right" && "justify-end text-right",
            fontClass
          )}
          style={{
            color: fill ? ColorToCSS(fill) : "#000",
            lineHeight: 1.25,
            fontWeight: fontWeight === "bold" ? 700 : 400,
          }}
        />
      </foreignObject>
    </g>
  );
};
