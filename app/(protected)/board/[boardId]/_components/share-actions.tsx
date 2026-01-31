"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { exportFramePNG } from "@/lib/export-canvas";
import { Link2, Download } from "lucide-react";

interface ShareActionProps {
    id: string;
}

const ShareActions = ({ id }: ShareActionProps) => {
    const [exporting, setExporting] = useState(false);

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

    return (
        <div className="hidden md:flex absolute top-3 right-3 z-50 h-12 items-center gap-1 rounded-xl bg-white/90 backdrop-blur border border-neutral-200 shadow-sm px-1.5">
            <button
                onClick={handleExportPNG}
                disabled={exporting}
                className="group flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-neutral-700
                   hover:bg-neutral-100 active:bg-neutral-200 transition
                   disabled:opacity-50 disabled:pointer-events-none
                   focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1"
            >
                <Download className="h-4 w-4 text-neutral-500 group-hover:text-neutral-700 transition" />
                {exporting ? "Exporting…" : "Export Frame"}
            </button>

            <button
                onClick={handleCopyLink}
                className="group flex h-8 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white
                   hover:bg-blue-700 active:bg-blue-800 transition
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
                <Link2 className="h-4 w-4 opacity-90 group-hover:opacity-100" />
                Share
            </button>
        </div>
    );
};

export default ShareActions;
