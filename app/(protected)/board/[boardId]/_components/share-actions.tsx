"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Link2, X, Volume2, Square } from "lucide-react";
import { toast } from "sonner";

import { exportFramePNG } from "@/lib/export-canvas";
import { explainCurrentFrame } from "@/lib/explain-frame";

interface ShareActionProps {
  id: string;
}

const ShareActions = ({ id }: ShareActionProps) => {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

 

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/board/${id}`
      );
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleExportPNG = async () => {
    try {
      setExporting(true);
      await exportFramePNG();
      toast.success("PNG exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExplainFrame = async () => {
    if (open) return;

    try {
      setOpen(true);
      setLoadingExplain(true);
      setExplanation(null);

      const result = await explainCurrentFrame();
      setExplanation(result.explanation);
    } catch {
      toast.error("Could not get insight");
      setOpen(false);
    } finally {
      setLoadingExplain(false);
    }
  };

  

  const handleSpeak = () => {
    if (!explanation) return;

    const utterance = new SpeechSynthesisUtterance(explanation);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    utterance.onend = () => setSpeaking(false);

    speechRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };



  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        handleStopSpeak();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        handleStopSpeak();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

 

  return (
    <div className="hidden md:flex absolute top-3 right-3 z-50 h-12 items-center gap-2">
            <div className="relative">
        <button
          onClick={handleExplainFrame}
          aria-label="Show frame insight"
          className="
            bg-[linear-gradient(43deg,rgb(49,76,217)_13.33%,rgb(99,85,227)_27.99%,rgb(151,94,237)_57.31%,rgb(201,102,246)_86.64%)]
            p-1 rounded-full
            transition-all duration-300
            hover:scale-110
            hover:shadow-[0_10px_30px_rgba(151,94,237,0.45)]
            active:scale-95
            focus:outline-none focus:ring-2 focus:ring-purple-400
          "
        >
          <Image
            src="/ai.svg"
            alt=""
            width={36}
            height={36}
            className="text-white"
          />
        </button>

        
        {open && (
          <div
            ref={popoverRef}
            role="dialog"
            className="
              absolute right-0 top-14 w-[380px]
              rounded-2xl border border-neutral-200
              bg-white shadow-2xl
              overflow-hidden
              animate-in fade-in slide-in-from-top-2
            "
          >
            
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-neutral-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                <Image src="/genai.png" alt="" width={26} height={26} />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-medium text-neutral-900">
                  Frame insight
                </h3>
                <p className="text-xs text-neutral-500">
                  What&apos;s happening in this frame
                </p>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  handleStopSpeak();
                }}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

                        <div className="max-h-72 overflow-y-auto px-4 py-3 text-sm text-neutral-700 leading-relaxed">
              {loadingExplain ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 w-3/4 rounded bg-neutral-200" />
                  <div className="h-3 w-full rounded bg-neutral-200" />
                  <div className="h-3 w-5/6 rounded bg-neutral-200" />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {explanation}
                </p>
              )}
            </div>

                        <div className="flex items-center justify-end px-4 py-2 border-t bg-neutral-50">
              {speaking ? (
                <button
                  onClick={handleStopSpeak}
                  className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-800"
                >
                  <Square className="h-3 w-3" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSpeak}
                  disabled={!explanation}
                  className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-800 disabled:opacity-50"
                >
                  <Volume2 className="h-3 w-3" />
                  Read
                </button>
              )}
            </div>
          </div>
        )}
      </div>

            <div className="hidden md:flex h-12 items-center gap-1 rounded-xl bg-white/90 backdrop-blur border border-neutral-200 shadow-sm px-1.5">
        <button
          onClick={handleExportPNG}
          disabled={exporting}
          className="
            group flex h-8 items-center gap-2 rounded-lg px-3
            text-sm font-medium text-neutral-700
            hover:bg-neutral-100 active:bg-neutral-200
            transition disabled:opacity-50
          "
        >
          <Download className="h-4 w-4 text-neutral-500 group-hover:text-neutral-700 transition" />
          {exporting ? "Exporting…" : "Export Frame"}
        </button>

        <button
          onClick={handleCopyLink}
          className="
            group flex h-8 items-center gap-2 rounded-lg
            bg-blue-600 px-3
            text-sm font-medium text-white
            hover:bg-blue-700 active:bg-blue-800
            transition
          "
        >
          <Link2 className="h-4 w-4 opacity-90 group-hover:opacity-100" />
          Share
        </button>
      </div>
    </div>
  );
};

export default ShareActions;
