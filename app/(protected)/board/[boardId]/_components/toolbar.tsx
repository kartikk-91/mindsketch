/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ToolButton } from "./tool-button";
import {
    Circle,
    MousePointer2,
    Pencil,
    Redo2,
    Square,
    StickyNote,
    Type,
    Undo2,
    Image as ImageIcon,
    Loader2,
} from "lucide-react";
import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";
import { useRef, useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ToolbarProps {
    canvasState: CanvasState;
    setCanvasState: (newState: CanvasState) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const Toolbar = ({
    canvasState,
    setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
}: ToolbarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadImage = useAction(api.images.uploadImage);

    const [pendingImageId, setPendingImageId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const imageUrl = useQuery(
        api.images.getImageUrl,
        pendingImageId ? { storageId: pendingImageId } : "skip"
    );

    useEffect(() => {
        if (!imageUrl) return;

        setCanvasState({
            mode: CanvasMode.Inserting,
            layertype: LayerType.Image,
            imageSrc: imageUrl,
        });

        setPendingImageId(null);
        setIsUploading(false);
    }, [imageUrl, setCanvasState]);

    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 pt-8">
            <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
                <ToolButton
                    label="Select"
                    icon={MousePointer2}
                    onClick={() => setCanvasState({ mode: CanvasMode.None })}
                    isActive={
                        canvasState.mode === CanvasMode.None ||
                        canvasState.mode === CanvasMode.Translating ||
                        canvasState.mode === CanvasMode.SelectionNet ||
                        canvasState.mode === CanvasMode.Resizing ||
                        canvasState.mode === CanvasMode.Pressing
                    }
                />

                <ToolButton
                    label="Text"
                    icon={Type}
                    onClick={() =>
                        setCanvasState({
                            mode: CanvasMode.Inserting,
                            layertype: LayerType.Text,
                        })
                    }
                    isActive={
                        canvasState.mode === CanvasMode.Inserting &&
                        canvasState.layertype === LayerType.Text
                    }
                />

                <ToolButton
                    label="Sticky Note"
                    icon={StickyNote}
                    onClick={() =>
                        setCanvasState({
                            mode: CanvasMode.Inserting,
                            layertype: LayerType.Note,
                        })
                    }
                    isActive={
                        canvasState.mode === CanvasMode.Inserting &&
                        canvasState.layertype === LayerType.Note
                    }
                />

                <ToolButton
                    label="Rectangle"
                    icon={Square}
                    onClick={() =>
                        setCanvasState({
                            mode: CanvasMode.Inserting,
                            layertype: LayerType.Rectangle,
                        })
                    }
                    isActive={
                        canvasState.mode === CanvasMode.Inserting &&
                        canvasState.layertype === LayerType.Rectangle
                    }
                />

                <ToolButton
                    label="Ellipse"
                    icon={Circle}
                    onClick={() =>
                        setCanvasState({
                            mode: CanvasMode.Inserting,
                            layertype: LayerType.Ellipse,
                        })
                    }
                    isActive={
                        canvasState.mode === CanvasMode.Inserting &&
                        canvasState.layertype === LayerType.Ellipse
                    }
                />

                <ToolButton
                    label={isUploading ? "Uploading..." : "Image"}
                    icon={isUploading ? Loader2 : ImageIcon}
                    onClick={() => fileInputRef.current?.click()}
                    isDisabled={isUploading}
                    isActive={
                        canvasState.mode === CanvasMode.Inserting &&
                        canvasState.layertype === LayerType.Image
                    }
                />

                <ToolButton
                    label="Pen"
                    icon={Pencil}
                    onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
                    isActive={canvasState.mode === CanvasMode.Pencil}
                />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsUploading(true);

                        const buffer = await file.arrayBuffer();

                        const { storageId } = await uploadImage({
                            file: buffer,
                            contentType: file.type,
                        });

                        setPendingImageId(storageId);

                        e.target.value = "";
                    }}
                />
            </div>

            <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
                <ToolButton
                    label="Undo"
                    icon={Undo2}
                    onClick={undo}
                    isDisabled={!canUndo}
                />
                <ToolButton
                    label="Redo"
                    icon={Redo2}
                    onClick={redo}
                    isDisabled={!canRedo}
                />
            </div>
        </div>
    );
};

Toolbar.Skeleton = function ToolbarSkeleton() {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
            <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
            </div>
            <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-12 w-12" />
            </div>
        </div>
    );
};
