"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Download, Link2,} from "lucide-react";
import { toast } from "sonner";

import { exportFramePNG } from "@/lib/export-canvas";
import { FrameChatPanel } from "@/components/frame-chat-panel";


interface ShareActionProps {
  id: string;
}

const ShareActions = ({ id }: ShareActionProps) => {
  const [exporting, setExporting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
 

 

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

  const handleOpenChat = () => {
    setChatMounted(true);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  


  return (
    <div className="hidden md:flex absolute top-3 right-3 z-50 h-12 items-center gap-2">
      
      <div className="relative">
        <button
          onClick={handleOpenChat}
          aria-label="Chat about this frame"
          className="
            bg-[linear-gradient(135deg,#20C5A8_0%,#FFB800_100%)]
            p-1 rounded-full
            transition-all duration-300
            hover:scale-110
            hover:shadow-[0_10px_30px_rgba(32,197,168,0.35)]
            active:scale-95
            focus:outline-none focus:ring-2 focus:ring-[#20C5A8]
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

        {chatMounted && <FrameChatPanel boardId={id} isOpen={chatOpen} onClose={handleCloseChat} />}
      </div>

    
            <div className="hidden md:flex h-14 items-center gap-1 rounded-xl bg-white/90 backdrop-blur border border-neutral-200 shadow-sm px-1.5">
        <button
          onClick={handleExportPNG}
          disabled={exporting}
          className="
            group flex h-10 items-center gap-2 rounded-lg px-3
            text-base font-medium text-neutral-700
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
            group flex h-10 items-center gap-2 rounded-lg
            bg-[#181C31] px-4
            text-base font-medium text-white
            hover:bg-[#2C3149] active:bg-[#181C31]
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
