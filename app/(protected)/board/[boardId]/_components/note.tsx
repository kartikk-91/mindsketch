"use client";

import { cn, ColorToCSS, getContrastingTextColor } from "@/lib/utils";
import { useMutation } from "@liveblocks/react";
import { Color, NoteFontFamily, NoteLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import {
  Kalam,
  Inter,
  Nunito,
  JetBrains_Mono,
  Lora,
} from "next/font/google";

const kalam = Kalam({ subsets: ["latin"], weight: ["400"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const serif = Lora({ subsets: ["latin"], weight: ["400", "700"] });

const fonts: Record<NoteFontFamily, { className: string }> = {
  kalam,
  inter,
  nunito,
  mono,
  serif,
};

const tint = (color: Color, amount: number): Color => ({
  r: Math.round(color.r + (255 - color.r) * amount),
  g: Math.round(color.g + (255 - color.g) * amount),
  b: Math.round(color.b + (255 - color.b) * amount),
});

const shade = (color: Color, amount: number): Color => ({
  r: Math.round(color.r * (1 - amount)),
  g: Math.round(color.g * (1 - amount)),
  b: Math.round(color.b * (1 - amount)),
});



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
    fontWeight = "regular",
    padding = 14,
    opacity = 1,
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
  const baseColor = fill ?? { r: 254, g: 202, b: 202 };
  const backgroundColor = tint(baseColor, 0.24);
  const foldColor = shade(baseColor, 0.28);

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
          data-export-note="true"
          data-export-selected={selectionColor ? "true" : undefined}
          className={cn(
            "relative h-full w-full overflow-hidden rounded-[3px]",
            "shadow-[0_4px_12px_rgba(15,23,42,0.16)]"
          )}
          style={{
              backgroundColor: ColorToCSS(backgroundColor),
              opacity,
            outline: selectionColor
              ? `2px solid ${selectionColor}`
              : "1px solid rgba(15,23,42,0.10)",
          }}
        >
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
              fontWeight: fontWeight === "bold" ? 700 : 400,
              lineHeight: 1.55,
              color: getContrastingTextColor(backgroundColor),
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-5 w-5"
            style={{
              background: ColorToCSS(foldColor),
              clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
            }}
          />
        </div>
      </foreignObject>
    </g>
  );
}
