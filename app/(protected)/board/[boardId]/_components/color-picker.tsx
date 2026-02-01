"use client";

import { ColorToCSS } from "@/lib/utils";
import { Color } from "@/types/canvas";

interface ColorPickerProps {
  onChange: (color: Color | null) => void;
}

const PRESET_COLORS: Color[] = [
  { r: 243, g: 82, b: 35 },
  { r: 255, g: 249, b: 177 },
  { r: 68, g: 202, b: 99 },
  { r: 39, g: 142, b: 237 },
];

export const ColorPicker = ({ onChange }: ColorPickerProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 pr-2 mr-2 ">
            {PRESET_COLORS.map((color, i) => (
        <button
          key={i}
          className="w-8 h-8 rounded-md border border-neutral-300 hover:opacity-75 transition"
          style={{ backgroundColor: ColorToCSS(color) }}
          onClick={() => onChange(color)}
        />
      ))}

            <button
        title="Transparent"
        className="w-8 h-8 rounded-md border border-neutral-300
                   bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)]
                   bg-[length:8px_8px]"
        onClick={() => onChange({r:-1,g:-1,b:-1})}
      />

            <label
        title="Custom color"
        className="w-8 h-8 rounded-md border border-neutral-300 cursor-pointer
                   flex items-center justify-center text-xs text-neutral-500"
      >
        +
        <input
          type="color"
          className="absolute opacity-0 cursor-pointer"
          onChange={(e) => {
            const hex = e.target.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            onChange({ r, g, b });
          }}
        />
      </label>
    </div>
  );
};
