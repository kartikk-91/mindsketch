"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateBoard } from "@/hooks/use-create-board";
import { boardPatterns, boardThemes, DEFAULT_BACKGROUND_PATTERN, DEFAULT_COLOR_THEME, type BackgroundPattern, type ColorTheme } from "@/lib/board-appearance";
import { cn } from "@/lib/utils";

interface NewBoardDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (boardId: string) => void;
}

const previewStyle = (pattern: BackgroundPattern, theme: ColorTheme) => {
  const colors = boardThemes[theme];
  const line = colors.pattern;
  const base = { backgroundColor: colors.canvas };

  if (pattern === "plain") return base;
  if (pattern === "dots") {
    const previewDot = theme === "default" || theme === "paper" ? "rgba(24,28,49,0.42)" : line;
    return { ...base, backgroundImage: `radial-gradient(${previewDot} 2.25px, transparent 2.25px)`, backgroundSize: "14px 14px" };
  }
  if (pattern === "grid") return { ...base, backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`, backgroundSize: "18px 18px" };
  return { ...base, backgroundImage: `linear-gradient(rgba(0,0,0,0) 23px, ${line} 24px), linear-gradient(90deg, rgba(0,0,0,0) 23px, ${line} 24px), linear-gradient(rgba(0,0,0,0) 119px, ${line} 120px), linear-gradient(90deg, rgba(0,0,0,0) 119px, ${line} 120px)`, backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px" };
};

export const NewBoardDialog = ({ orgId, open, onOpenChange, onCreated }: NewBoardDialogProps) => {
  const { createBoard } = useCreateBoard();
  const [backgroundPattern, setBackgroundPattern] = useState<BackgroundPattern>(DEFAULT_BACKGROUND_PATTERN);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  const [pending, setPending] = useState(false);

  if (!open) return null;

  const create = async () => {
    setPending(true);
    try {
      const board = await createBoard({ orgId, title: "Untitled", backgroundPattern, colorTheme });
      onOpenChange(false);
      onCreated(board.id);
    } catch {
      toast.error("Failed to create board");
    } finally {
      setPending(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-board-title">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div><h2 id="new-board-title" className="text-xl font-bold text-[#181C31]">Create a new board</h2><p className="mt-1 text-sm text-[#696969]">Choose the canvas background for this board.</p></div>
        <button aria-label="Close" onClick={() => onOpenChange(false)} className="rounded-lg p-2 text-[#696969] hover:bg-[#F4F4F4]"><X className="h-5 w-5" /></button>
      </div>
      <section><h3 className="mb-3 text-sm font-semibold text-[#181C31]">Background pattern</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(boardPatterns) as BackgroundPattern[]).map((pattern) => <button key={pattern} onClick={() => setBackgroundPattern(pattern)} className={cn("relative overflow-hidden rounded-xl border-2 bg-white p-2 text-left transition", backgroundPattern === pattern ? "border-[#20C5A8] ring-2 ring-[#20C5A8]/20" : "border-[#EEEEEE] hover:border-[#B8E8DE]")}>
          <span className="block h-20 rounded-lg border border-black/5" style={previewStyle(pattern, colorTheme)} />
          <span className="mt-2 block text-center text-xs font-semibold text-[#181C31]">{boardPatterns[pattern].label}</span>
          {backgroundPattern === pattern && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#20C5A8] text-white"><Check className="h-3.5 w-3.5" /></span>}
        </button>)}</div></section>
      <section className="mt-7"><h3 className="mb-3 text-sm font-semibold text-[#181C31]">Color theme</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(boardThemes) as ColorTheme[]).map((theme) => <button key={theme} onClick={() => setColorTheme(theme)} className={cn("relative overflow-hidden rounded-xl border-2 bg-white p-2 text-left transition", colorTheme === theme ? "border-[#20C5A8] ring-2 ring-[#20C5A8]/20" : "border-[#EEEEEE] hover:border-[#B8E8DE]")}>
          <span className="block h-20 rounded-lg border border-black/5" style={previewStyle(backgroundPattern, theme)} />
          <span className="mt-2 block text-center text-xs font-semibold text-[#181C31]">{boardThemes[theme].label}</span>
          {colorTheme === theme && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#20C5A8] text-white"><Check className="h-3.5 w-3.5" /></span>}
        </button>)}</div></section>
      <div className="mt-8 flex justify-end gap-3"><button onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#696969] hover:bg-[#F4F4F4]">Cancel</button><button disabled={pending} onClick={create} className="rounded-lg bg-[#181C31] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2C3149] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Creating..." : "Create board"}</button></div>
    </div>
  </div>;
};
