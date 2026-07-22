/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";

import { useCallback, useMemo, useState } from "react";
import { Camera, CanvasMode, CanvasState, Color, LayerType, Point, Side, XYWH, Layer, ShapeLayer, ShapeType } from "@/types/canvas";


import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { useCanRedo, useCanUndo, useHistory, useSelf, useMutation } from "@liveblocks/react/suspense";
import { CursorsPresence } from "./cursors-presence";
import { ColorToCSS, connectionIdToColor, findIntersectingLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds } from "@/lib/utils";
import { useOthersMapped, useStorage } from "@liveblocks/react";
import { nanoid } from "nanoid";
import { LiveObject } from "@liveblocks/client";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import ShareActions from "./share-actions";



const LONG_PRESS_MS = 350;
const MOVE_TOLERANCE = 6;

const MAX_LAYERS = 100;

const recognizeSmartShape = (points: number[][], color: Color, strokeWidth: number): ShapeLayer | null => {
    if (points.length < 8) return null;
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const x = Math.min(...xs), y = Math.min(...ys);
    const width = Math.max(...xs) - x, height = Math.max(...ys) - y;
    if (width < 30 || height < 30) return null;
    const [startX, startY] = points[0];
    const [endX, endY] = points[points.length - 1];
    if (Math.hypot(endX - startX, endY - startY) > Math.min(width, height) * 0.45) return null;
    const cx = x + width / 2, cy = y + height / 2;
    const radii = points.map(([px, py]) => Math.hypot((px - cx) / (width / 2), (py - cy) / (height / 2)));
    const averageRadius = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
    const variation = radii.reduce((sum, radius) => sum + Math.abs(radius - averageRadius), 0) / radii.length;
    return {
        type: LayerType.Shape,
        shape: variation < 0.18 ? ShapeType.Ellipse : ShapeType.Rectangle,
        x, y, width, height, fill: undefined, stroke: color, strokeWidth: Math.max(2, Math.round(strokeWidth / 3)),
    };
};

type SelectionFrame = {
    ids: string[];
    bounds: XYWH;
    rotation: number;
    translation: Point;
};

const rotatePointAround = (px: number, py: number, cx: number, cy: number, angleDeg: number): Point => {
    const radians = angleDeg * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = px - cx;
    const dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

const createSelectionFrame = (ids: readonly string[], bounds: XYWH, rotation = 0): SelectionFrame => {
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const rotatedCenter = rotatePointAround(center.x, center.y, 0, 0, rotation);
    return {
        ids: [...ids],
        bounds,
        rotation,
        // The transform is `rotate(rotation)` followed by this translation.
        // At creation this is equivalent to rotating around the selection centre.
        translation: { x: center.x - rotatedCenter.x, y: center.y - rotatedCenter.y },
    };
};

const applySelectionFrame = (point: Point, frame: SelectionFrame): Point => {
    const rotated = rotatePointAround(point.x, point.y, 0, 0, frame.rotation);
    return { x: rotated.x + frame.translation.x, y: rotated.y + frame.translation.y };
};

const invertSelectionFrame = (point: Point, frame: SelectionFrame): Point =>
    rotatePointAround(point.x - frame.translation.x, point.y - frame.translation.y, 0, 0, -frame.rotation);

const selectionFrameCenter = (frame: SelectionFrame): Point =>
    applySelectionFrame({ x: frame.bounds.x + frame.bounds.width / 2, y: frame.bounds.y + frame.bounds.height / 2 }, frame);

const rotateSelectionFrame = (frame: SelectionFrame, delta: number): SelectionFrame => {
    const center = selectionFrameCenter(frame);
    const rotatedTranslation = rotatePointAround(frame.translation.x, frame.translation.y, 0, 0, delta);
    const rotatedCenter = rotatePointAround(center.x, center.y, 0, 0, delta);
    return {
        ...frame,
        rotation: frame.rotation + delta,
        // Compose a rotation around the visible selection centre with the frame transform.
        translation: { x: rotatedTranslation.x + center.x - rotatedCenter.x, y: rotatedTranslation.y + center.y - rotatedCenter.y },
    };
};

const closestSide = (from: XYWH & { rotation?: number }, to: XYWH & { rotation?: number }): Side => {
    const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    // Pick the nearest border in the source layer's local axes, not the canvas axes.
    const localTarget = rotatePointAround(toCenter.x, toCenter.y, fromCenter.x, fromCenter.y, -(from.rotation ?? 0));
    const dx = localTarget.x - fromCenter.x;
    const dy = localTarget.y - fromCenter.y;
    return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? Side.Right : Side.Left) : (dy >= 0 ? Side.Bottom : Side.Top);
};
const connectionPoint = (layer: XYWH & { rotation?: number }, side: Side) => {
    const center = { x: layer.x + layer.width / 2, y: layer.y + layer.height / 2 };
    const localPoint = side === Side.Left ? { x: layer.x, y: center.y }
        : side === Side.Right ? { x: layer.x + layer.width, y: center.y }
            : side === Side.Top ? { x: center.x, y: layer.y }
                : { x: center.x, y: layer.y + layer.height };
    return rotatePointAround(localPoint.x, localPoint.y, center.x, center.y, layer.rotation ?? 0);
};

/** Keep the stored arrow endpoints on the border of their bound layers. */
const syncBoundArrows = (layers: any, ids: readonly string[]) => {
    ids.forEach((id) => {
        const arrow = layers.get(id);
        if (!arrow || arrow.get("type") !== LayerType.Shape || arrow.get("shape") !== ShapeType.Arrow) return;
        const start = layers.get(arrow.get("startLayerId"));
        const end = layers.get(arrow.get("endLayerId"));
        if (!start || !end) return;
        const startBounds = { x: start.get("x"), y: start.get("y"), width: start.get("width"), height: start.get("height"), rotation: start.get("rotation") ?? 0 };
        const endBounds = { x: end.get("x"), y: end.get("y"), width: end.get("width"), height: end.get("height"), rotation: end.get("rotation") ?? 0 };
        // Default connectors follow the nearest facing borders as shapes move. A side is fixed
        // only after the user chooses it from the connector controls.
        const startSide = arrow.get("startSideLocked")
            ? (arrow.get("startSide") ?? closestSide(startBounds, endBounds))
            : closestSide(startBounds, endBounds);
        const endSide = arrow.get("endSideLocked")
            ? (arrow.get("endSide") ?? closestSide(endBounds, startBounds))
            : closestSide(endBounds, startBounds);
        const startPoint = connectionPoint(startBounds, startSide);
        const endPoint = connectionPoint(endBounds, endSide);
        // Bound arrows store world-space endpoints. Keeping the arrow itself unrotated avoids
        // applying a second transform after its endpoints have been recalculated.
        arrow.update({ startSide, endSide, x: startPoint.x, y: startPoint.y, width: endPoint.x - startPoint.x, height: endPoint.y - startPoint.y, rotation: 0 });
    });
};


interface CanvasProps {
    boardId: string;
}
export const Canvas = ({ boardId }: CanvasProps) => {
   
    const longPressTimer = useRef<number | null>(null);
    const pressStart = useRef<Point | null>(null);
    const activePointers = useRef<Map<number, Point>>(new Map());
    const lastPanCenter = useRef<Point | null>(null);
    const resizeOrigins = useRef<Map<string, XYWH>>(new Map());
    const rotateOrigins = useRef<Map<string, XYWH & { rotation: number }>>(new Map());
    const activeSelectionFrame = useRef<SelectionFrame | null>(null);


    const layerIds = useStorage((root) => root.layerIds);
    const pencilDraft = useSelf((me) => me.presence.pencilDraft);
    const [canvasState, setCanvasState] = useState<CanvasState>({
        mode: CanvasMode.None,
    });
    const [selectionFrame, setSelectionFrameState] = useState<SelectionFrame | null>(null);
    const selectionFrameRef = useRef<SelectionFrame | null>(null);
    const setSelectionFrame = useCallback((frame: SelectionFrame | null) => {
        selectionFrameRef.current = frame;
        setSelectionFrameState(frame);
    }, []);
    const [camera, setCamera] = useState<Camera>({
        x: 0,
        y: 0,
        scale: 1,
    });

    const [lastUsedColor, setLastUsedColor] = useState<Color>({ r: 0, g: 0, b: 0 });
    const [penSize, setPenSize] = useState(8);
    const [smartDrawing, setSmartDrawing] = useState(false);
    const BLACK: Color = { r: 0, g: 0, b: 0 };
    ;

    function resolveColor(
        color?: Color,
        setColor?: (c: Color) => void
    ): Color {
        if (
            !color ||
            (color.r === -1 && color.g === -1 && color.b === -1)
        ) {
            setColor?.(BLACK);
            return BLACK;
        }

        return color;
    }


    type ClipboardItem = {
        layer: Layer;
    };

    const [clipboard, setClipboard] = useState<ClipboardItem[] | null>(null);

    useDisableScrollBounce();
    const onWheel = useCallback((e: React.WheelEvent) => {
        setCamera((camera) => ({
            x: camera.x - e.deltaX,
            y: camera.y - e.deltaY,
            scale: camera.scale
        }))
    }, [])
    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const deleteLayers = useDeleteLayers();
    const selection = useSelf((me) => me.presence.selection);
    const selectionKey = selection.join("|");

    useEffect(() => {
        const frame = selectionFrameRef.current;
        if (frame && frame.ids.join("|") !== selectionKey) {
            setSelectionFrame(null);
        }
    }, [selectionKey, setSelectionFrame]);

    const visibleSelectionFrame = selectionFrame?.ids.join("|") === selectionKey ? selectionFrame : null;

    const selectedLayer = useStorage((root) => {
        const id = selection?.[0];
        return id ? root.layers.get(id) : null;
    });

    const copySelectedLayers = useMutation(({ storage, self }) => {
        const selection = self.presence.selection;
        if (!selection || selection.length === 0) return;

        const liveLayers = storage.get("layers");

        const copied: ClipboardItem[] = [];

        for (const id of selection) {
            const layer = liveLayers.get(id);
            if (!layer) continue;


            copied.push({
                layer: layer.toObject() as Layer,
            });
        }

        setClipboard(copied);
    }, []);

    const pasteLayers = useMutation(
        ({ storage, setMyPresence }) => {
            if (!clipboard || clipboard.length === 0) return;

            const liveLayers = storage.get("layers");
            const liveLayerIds = storage.get("layerIds");

            if (liveLayers.size + clipboard.length > MAX_LAYERS) return;

            const OFFSET = 20;
            const newSelection: string[] = [];

            for (const item of clipboard) {
                const id = nanoid();

                const clonedLayer: Layer = {
                    ...item.layer,
                    x: item.layer.x + OFFSET,
                    y: item.layer.y + OFFSET,
                };

                liveLayerIds.push(id);
                liveLayers.set(id, new LiveObject(clonedLayer));
                newSelection.push(id);
            }

            setMyPresence({ selection: newSelection }, { addToHistory: true });
        },
        [clipboard]
    );

    const duplicateSelectedLayers = useMutation(({ storage, self, setMyPresence }) => {
        const selected = self.presence.selection;
        if (!selected?.length) return;
        const layers = storage.get("layers");
        const ids = storage.get("layerIds");
        if (layers.size + selected.length > MAX_LAYERS) return;
        const idMap = new Map(selected.map((id) => [id, nanoid()]));
        const duplicates: string[] = [];
        selected.forEach((selectedId) => {
            const original = layers.get(selectedId);
            if (!original) return;
            const id = idMap.get(selectedId)!;
            const clone = { ...(original.toObject() as Layer), x: original.get("x") + 20, y: original.get("y") + 20 } as ShapeLayer;
            if (clone.type === LayerType.Shape && clone.shape === ShapeType.Arrow) {
                const startId = clone.startLayerId && idMap.get(clone.startLayerId);
                const endId = clone.endLayerId && idMap.get(clone.endLayerId);
                // A copied connector only remains bound when both endpoints were copied too.
                if (startId && endId) {
                    clone.startLayerId = startId;
                    clone.endLayerId = endId;
                } else {
                    delete clone.startLayerId;
                    delete clone.endLayerId;
                    delete clone.startSide;
                    delete clone.endSide;
                }
            }
            ids.push(id);
            layers.set(id, new LiveObject(clone));
            duplicates.push(id);
        });
        syncBoundArrows(layers, duplicates);
        setMyPresence({ selection: duplicates }, { addToHistory: true });
    }, []);

    const insertPastedImage = useMutation(({ storage, setMyPresence }, src: string) => {
        const layers = storage.get("layers");
        if (layers.size >= MAX_LAYERS) return;
        const id = nanoid();
        const width = 320;
        const height = 220;
        // Pasted content belongs where the user is looking, not at a fixed board coordinate.
        const x = (window.innerWidth / 2 - camera.x) / camera.scale - width / 2;
        const y = (window.innerHeight / 2 - camera.y) / camera.scale - height / 2;
        layers.set(id, new LiveObject({ type: LayerType.Image, x, y, width, height, src }) as LiveObject<Layer>);
        storage.get("layerIds").push(id);
        setMyPresence({ selection: [id] }, { addToHistory: true });
    }, [camera]);


    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            const isMod = e.ctrlKey || e.metaKey;

            if (isMod && e.key.toLowerCase() === "d") {
                e.preventDefault();

                duplicateSelectedLayers();
                return;
            }


            switch (e.key) {
                case "Escape":
                    setCanvasState({ mode: CanvasMode.None });
                    break;

                case "Delete":
                    deleteLayers();
                    break;

                case "z":
                    if (e.ctrlKey || e.metaKey) {
                        if (e.shiftKey) {
                            history.redo();
                        }
                        else {
                            history.undo();
                        }
                    }
                    break;
                case "y":
                    if (e.ctrlKey || e.metaKey) {
                        history.redo();
                    }
                    break;
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [duplicateSelectedLayers, deleteLayers, history]);

    useEffect(() => {
        const onPaste = (event: ClipboardEvent) => {
            const image = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"))
                ?? Array.from(event.clipboardData?.items ?? []).map((item) => item.type.startsWith("image/") ? item.getAsFile() : null).find(Boolean);
            if (!image) return;
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = () => typeof reader.result === "string" && insertPastedImage(reader.result);
            reader.readAsDataURL(image);
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [insertPastedImage]);

    useEffect(() => {
        function onImageUploaded(e: Event) {
            const detail = (e as CustomEvent<{ secure_url: string; width: number; height: number }>).detail;
            setCanvasState({
                mode: CanvasMode.Inserting,
                layertype: LayerType.Image,
                imageSrc: detail.secure_url,
            });
        }

        window.addEventListener("mindsketch:image-uploaded", onImageUploaded);
        return () => window.removeEventListener("mindsketch:image-uploaded", onImageUploaded);
    }, []);


    const insertLayer = useMutation(
        (
            { storage, setMyPresence },
            layerType: LayerType.Ellipse | LayerType.Note | LayerType.Rectangle | LayerType.Text,
            position: Point
        ) => {
            const liveLayers = storage.get("layers");
            if (liveLayers.size >= MAX_LAYERS) {
                return;
            }

            const liveLayerIds = storage.get("layerIds");
            const layerId = nanoid();

            const baseLayer = {
                type: layerType,
                x: position.x,
                y: position.y,
                width: 100,
                height: 100,
            };
            const layerData = layerType === LayerType.Note
                ? { ...baseLayer, fill: { r: 254, g: 202, b: 202 }, value: "", fontFamily: "mono" as const, fontSize: 16, textAlign: "left" as const, verticalAlign: "top" as const, padding: 14 }
                : layerType === LayerType.Text
                    ? { ...baseLayer, fill: BLACK, value: "", textAlign: "center" as const, fontFamily: "mono" as const, fontWeight: "regular" as const }
                    : { ...baseLayer, fill: undefined, stroke: BLACK, strokeWidth: 2 };
            const layer = new LiveObject(layerData);

            liveLayerIds.push(layerId);
            liveLayers.set(layerId, layer as LiveObject<Layer>);
            setMyPresence({ selection: [layerId] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });
        },
        []
    );


    const insertImageLayer = useMutation(
        ({ storage, setMyPresence }, position: Point) => {
            const liveLayers = storage.get("layers");
            if (liveLayers.size >= MAX_LAYERS) {
                return;
            }

            const liveLayerIds = storage.get("layerIds");
            const layerId = nanoid();

            const DEFAULT_WIDTH = 300;
            const DEFAULT_HEIGHT = 200;

            const layer = new LiveObject({
                type: LayerType.Image,
                x: position.x - DEFAULT_WIDTH / 2,
                y: position.y - DEFAULT_HEIGHT / 2,
                width: DEFAULT_WIDTH,
                height: DEFAULT_HEIGHT,
                src: (canvasState as any).imageSrc,
            });

            liveLayerIds.push(layerId);
            liveLayers.set(layerId, layer as LiveObject<Layer>);
            setMyPresence({ selection: [layerId] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });
        },
        [canvasState]
    );

    const insertShape = useMutation(
        ({ storage, setMyPresence }, shape: ShapeType, position: Point) => {
            const liveLayers = storage.get("layers");
            if (liveLayers.size >= MAX_LAYERS) return;

            const id = nanoid();

            const layer = new LiveObject<ShapeLayer>({
                type: LayerType.Shape,
                shape,
                x: position.x,
                y: position.y,
                width: 120,
                height: 80,
                fill: undefined,
                stroke: BLACK,
                strokeWidth: 2,
                rotation: 0,
            });


            storage.get("layerIds").push(id);
            liveLayers.set(id, layer);
            setMyPresence({ selection: [id] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });
        },
        []
    );



    const translateSelectedLayers = useMutation(({ storage, self }, point: Point) => {
        if (canvasState.mode !== CanvasMode.Translating) {
            return;
        }
        const offset = {
            x: point.x - canvasState.current.x,
            y: point.y - canvasState.current.y,
        }
        const liveLayers = storage.get('layers');
        for (const id of self.presence.selection) {
            const layer = liveLayers.get(id);
            if (layer) {
                layer.update({
                    x: layer.get("x") + offset.x,
                    y: layer.get("y") + offset.y,
                })
            }
        }
        const frame = selectionFrameRef.current;
        if (frame && frame.ids.join("|") === self.presence.selection.join("|")) {
            setSelectionFrame({
                ...frame,
                translation: { x: frame.translation.x + offset.x, y: frame.translation.y + offset.y },
            });
        }
        syncBoundArrows(liveLayers, storage.get("layerIds").toImmutable());
        setCanvasState({
            mode: CanvasMode.Translating,
            current: point,
        })
    }, [canvasState, setSelectionFrame])


    const unselectLayers = useMutation(({ self, setMyPresence }) => {
        if (self.presence.selection.length > 0) {
            setMyPresence({ selection: [] }, { addToHistory: true });
        }
    }, [])

    const updateSelectionNet = useMutation((
        { storage, setMyPresence },
        current: Point,
        origin: Point,
    ) => {
        const layers = storage.get('layers').toImmutable();
        setCanvasState({
            mode: CanvasMode.SelectionNet,
            origin,
            current,
        });
        const ids = findIntersectingLayersWithRectangle(layerIds || [], layers, origin, current);
        setMyPresence({ selection: ids },);
    }, [layerIds])

    const startMultiSelection = useCallback((
        current: Point,
        origin: Point,
    ) => {
        if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
            setCanvasState({
                mode: CanvasMode.SelectionNet,
                origin,
                current,
            });
        }
    }, [])

    const continueDrawing = useMutation(({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
        const pencilDraft = self.presence.pencilDraft;
        if (canvasState.mode !== CanvasMode.Pencil || e.buttons !== 1 || pencilDraft == null) {
            return;
        }

        setMyPresence({
            cursor: point,
            pencilDraft:
                pencilDraft.length === 1 &&
                    pencilDraft[0][0] === point.x &&
                    pencilDraft[0][1] === point.y
                    ? pencilDraft
                    : [...pencilDraft, [point.x, point.y, e.pressure]],
        });
    }, [canvasState]);

    const insertPath = useMutation(({ storage, self, setMyPresence },) => {
        const liveLayers = storage.get('layers');
        const pencilDraft = self.presence.pencilDraft;
        if (pencilDraft == null || pencilDraft.length < 2 || liveLayers.size >= MAX_LAYERS) {
            setMyPresence({ pencilDraft: null });
            return;
        }
        const id = nanoid();
        const color = resolveColor(lastUsedColor);
        const smartShape = smartDrawing ? recognizeSmartShape(pencilDraft, color, penSize) : null;
        liveLayers.set(
            id,
            new LiveObject(smartShape ?? penPointsToPathLayer(pencilDraft, color, penSize))
        );
        const liveLayerIds = storage.get('layerIds');
        liveLayerIds.push(id);
        setMyPresence({ pencilDraft: null });
        setCanvasState({ mode: CanvasMode.Pencil });
    }, [lastUsedColor, penSize, smartDrawing])

    const startDrawing = useMutation(({ setMyPresence }, point: Point, pressure: number) => {
        setMyPresence({
            pencilDraft: [[point.x, point.y, pressure]],
            penColor: resolveColor(lastUsedColor),
        })
    }, [lastUsedColor])

    const eraseLayer = useMutation(({ storage, setMyPresence }, layerId: string) => {
        const layers = storage.get("layers");
        const ids = storage.get("layerIds");
        const layer = layers.get(layerId);
        // The eraser is intentionally limited to freehand pencil strokes.
        if (!layer || layer.get("type") !== LayerType.Path) return;
        const index = ids.toImmutable().indexOf(layerId);
        if (index === -1) return;
        layers.delete(layerId);
        ids.delete(index);
        setMyPresence({ selection: [] }, { addToHistory: true });
    }, []);

    const resizeSelectedLayer = useMutation(
        ({ storage }, point: Point) => {
            if (canvasState.mode !== CanvasMode.Resizing) return;

            const liveLayers = storage.get("layers");
            const frame = activeSelectionFrame.current;
            if (!frame) return;
            const { x, y, width, height } = frame.bounds;
            const localPoint = invertSelectionFrame(point, frame);
            const bounds = resizeBounds(
                frame.bounds,
                canvasState.corner,
                localPoint
            );
            const scaleX = width ? bounds.width / width : 1;
            const scaleY = height ? bounds.height / height : 1;

            resizeOrigins.current.forEach((original, id) => {
                const layer = liveLayers.get(id);
                if (!layer) return;
                const originalCenter = { x: original.x + original.width / 2, y: original.y + original.height / 2 };
                const localCenter = invertSelectionFrame(originalCenter, frame);
                const nextLocalCenter = {
                    x: bounds.x + (localCenter.x - x) * scaleX,
                    y: bounds.y + (localCenter.y - y) * scaleY,
                };
                const nextCenter = applySelectionFrame(nextLocalCenter, frame);
                const nextWidth = Math.max(10, original.width * scaleX);
                const nextHeight = Math.max(10, original.height * scaleY);
                layer.update({
                    x: nextCenter.x - nextWidth / 2,
                    y: nextCenter.y - nextHeight / 2,
                    width: nextWidth,
                    height: nextHeight,
                });
            });
            setSelectionFrame({ ...frame, bounds });
            syncBoundArrows(liveLayers, storage.get("layerIds").toImmutable());
        },
        [canvasState, setSelectionFrame]
    );



    const rotateSelectedLayer = useMutation(
        ({ storage }, delta: number) => {
            const layers = storage.get("layers");
            if (canvasState.mode !== CanvasMode.Rotating) return;
            const frame = activeSelectionFrame.current;
            if (!frame) return;
            rotateOrigins.current.forEach((original, id) => {
                const layer = layers.get(id);
                if (!layer) return;
                const originalCenter = { x: original.x + original.width / 2, y: original.y + original.height / 2 };
                const nextCenter = rotatePointAround(originalCenter.x, originalCenter.y, canvasState.center.x, canvasState.center.y, delta);
                layer.update({
                    x: nextCenter.x - original.width / 2,
                    y: nextCenter.y - original.height / 2,
                    rotation: original.rotation + delta,
                });
            });
            setSelectionFrame(rotateSelectionFrame(frame, delta));
            syncBoundArrows(layers, storage.get("layerIds").toImmutable());
        },
        [canvasState, setSelectionFrame]
    );



    const onRotateHandlePointerDown = useMutation(
        ({ storage, self }, e: React.PointerEvent, bounds: XYWH) => {
            e.stopPropagation();
            history.pause();
            const point = pointerEventToCanvasPoint(e, camera);
            const existingFrame = selectionFrameRef.current;
            const ids = self.presence.selection;
            const selectedRotation = ids.length === 1
                ? ((storage.get("layers").get(ids[0]) as any)?.get("rotation") ?? 0)
                : 0;
            const frame = existingFrame && existingFrame.ids.join("|") === ids.join("|")
                ? existingFrame
                : createSelectionFrame(ids, bounds, selectedRotation);
            activeSelectionFrame.current = frame;
            setSelectionFrame(frame);
            const center = selectionFrameCenter(frame);
            const startAngle =
                Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);

            const origins = new Map<string, XYWH & { rotation: number }>();
            self.presence.selection.forEach((id) => {
                const layer = storage.get("layers").get(id) as any;
                if (layer) origins.set(id, { x: layer.get("x"), y: layer.get("y"), width: layer.get("width"), height: layer.get("height"), rotation: layer.get("rotation") ?? 0 });
            });
            rotateOrigins.current = origins;

            setCanvasState({
                mode: CanvasMode.Rotating,
                center,
                startAngle,
                initialRotation: 0,
            });
        },
        [camera, history, setSelectionFrame]
    );



    const onResizeHandlePointerDown = useMutation(({ storage, self }, corner: Side, intialBounds: XYWH) => {
        history.pause();
        const existingFrame = selectionFrameRef.current;
        const ids = self.presence.selection;
        const selectedRotation = ids.length === 1
            ? ((storage.get("layers").get(ids[0]) as any)?.get("rotation") ?? 0)
            : 0;
        const frame = existingFrame && existingFrame.ids.join("|") === ids.join("|")
            ? existingFrame
            : createSelectionFrame(ids, intialBounds, selectedRotation);
        activeSelectionFrame.current = frame;
        setSelectionFrame(frame);
        const nextOrigins = new Map<string, XYWH>();
        self.presence.selection.forEach((id) => {
            const layer = storage.get("layers").get(id);
            if (layer) nextOrigins.set(id, { x: layer.get("x"), y: layer.get("y"), width: layer.get("width"), height: layer.get("height") });
        });
        resizeOrigins.current = nextOrigins;
        setCanvasState({
            mode: CanvasMode.Resizing,
            corner,
            intialBounds: frame.bounds,
        });
    }, [history, setSelectionFrame])

    const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
        if (activePointers.current.has(e.pointerId)) {
            activePointers.current.set(e.pointerId, {
                x: e.clientX,
                y: e.clientY,
            });
        }

       
        if (activePointers.current.size === 2) {
            e.preventDefault();

            const pts = Array.from(activePointers.current.values());
            const center = {
                x: (pts[0].x + pts[1].x) / 2,
                y: (pts[0].y + pts[1].y) / 2,
            };

            if (lastPanCenter.current) {
                const dx = center.x - lastPanCenter.current.x;
                const dy = center.y - lastPanCenter.current.y;

                setCamera((cam) => ({
                    x: cam.x + dx,
                    y: cam.y + dy,
                    scale: cam.scale,
                }));
            }

            lastPanCenter.current = center;
            return;
        }

        const current = pointerEventToCanvasPoint(e, camera);
        if (!current) return;

       
        if (canvasState.mode === CanvasMode.Pencil) {
            e.preventDefault();
            continueDrawing(current, e);
            setMyPresence({ cursor: current });
            return;
        }

        if (
            e.pointerType === "touch" &&
            pressStart.current &&
            canvasState.mode === CanvasMode.None
        ) {
            const dx = Math.abs(current.x - pressStart.current.x);
            const dy = Math.abs(current.y - pressStart.current.y);

            if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
                return;
            }
        }

       
        e.preventDefault();

        if (canvasState.mode === CanvasMode.Pressing) {
            startMultiSelection(current, canvasState.origin);
        }
        else if (canvasState.mode === CanvasMode.SelectionNet) {
            updateSelectionNet(current, canvasState.origin);
        }
        else if (canvasState.mode === CanvasMode.Translating) {
            translateSelectedLayers(current);
        }
        else if (canvasState.mode === CanvasMode.Resizing) {
            resizeSelectedLayer(current);
        }
        else if (canvasState.mode === CanvasMode.Rotating) {
            const { center, startAngle } = canvasState;

            const angle =
                Math.atan2(current.y - center.y, current.x - center.x) *
                (180 / Math.PI);

            const delta = angle - startAngle;

            rotateSelectedLayer(delta);
        }

        setMyPresence({ cursor: current });
        setCanvasState((prev) =>
            prev.mode === CanvasMode.Inserting
                ? { ...prev, current }
                : prev
        );

    }, [
        canvasState,
        resizeSelectedLayer,
        camera,
        continueDrawing,
        translateSelectedLayers,
        updateSelectionNet,
        startMultiSelection,
    ]);

    const onPointerLeave = useMutation(({ setMyPresence }) => {
        setMyPresence({ cursor: null });
    }, [])

    const onPointerDown = useCallback((e: React.PointerEvent) => {
       
        (e.target as Element).setPointerCapture(e.pointerId);

        activePointers.current.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY,
        });

       
        if (activePointers.current.size === 2) {
            pressStart.current = null;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }

            const pts = Array.from(activePointers.current.values());
            lastPanCenter.current = {
                x: (pts[0].x + pts[1].x) / 2,
                y: (pts[0].y + pts[1].y) / 2,
            };

            return;
        }

        if (e.pointerType === "touch" && e.isPrimary === false) return;

        const point = pointerEventToCanvasPoint(e, camera);
        if (!point) return;

        if (canvasState.mode === CanvasMode.Inserting) {
            return;
        }

        if (canvasState.mode === CanvasMode.Pencil) {
            startDrawing(point, e.pressure);
            return;
        }

       
        if (e.pointerType !== "touch") {
            setCanvasState({
                origin: point,
                mode: CanvasMode.Pressing,
            });
            return;
        }

       
        pressStart.current = point;

        longPressTimer.current = window.setTimeout(() => {
            setCanvasState({
                origin: point,
                mode: CanvasMode.Pressing,
            });
        }, LONG_PRESS_MS);

    }, [camera, canvasState.mode, startDrawing]);


    const onPointerUp = useMutation(({ }, e) => {
        activePointers.current.delete(e.pointerId);

        if (activePointers.current.size < 2) {
            lastPanCenter.current = null;
        }


       
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressStart.current = null;

        const point = pointerEventToCanvasPoint(e, camera);

        if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
            unselectLayers();
            setCanvasState({ mode: CanvasMode.None });
        }
        else if (canvasState.mode === CanvasMode.Pencil) {
            insertPath();
        }
        else if (canvasState.mode === CanvasMode.Connecting) {
            // Connector mode stays active until the user presses Escape or picks another tool.
        }
        else if (canvasState.mode === CanvasMode.Inserting) {
            if (
                canvasState.layertype === LayerType.Text ||
                canvasState.layertype === LayerType.Note ||
                canvasState.layertype === LayerType.Rectangle ||
                canvasState.layertype === LayerType.Ellipse
            ) {
                insertLayer(canvasState.layertype, point);
            }

            if (canvasState.layertype === LayerType.Shape) {
                insertShape(
                    (canvasState as any).shape,
                    point
                );
            }

            if (
                canvasState.layertype === LayerType.Image &&
                canvasState.imageSrc
            ) {
                insertImageLayer(point);
            }
        }
        else if (canvasState.mode === CanvasMode.Rotating) {
            setCanvasState({ mode: CanvasMode.None });
        }
        else {
            setCanvasState({ mode: CanvasMode.None });
        }

        history.resume();
    }, [
        camera,
        canvasState,
        history,
        insertLayer,
        unselectLayers,
        insertPath,
        setCanvasState
    ]);


    const selections = useOthersMapped((other) => other.presence.selection);

    useEffect(() => {
        const svg = document.getElementById("mindsketch-canvas");
        if (!svg) return;


        svg.style.touchAction = "none";
    }, []);




    const onLayerPointerDown = useMutation(
        ({ storage, self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
            if (canvasState.mode === CanvasMode.Erasing) {
                eraseLayer(layerId);
                return;
            }

            if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting) {
                return;
            }

            history.pause();
            e.stopPropagation();

            const point = pointerEventToCanvasPoint(e, camera);
            pressStart.current = null;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            if (!point) return;

            if (canvasState.mode === CanvasMode.Connecting) {
                const target = storage.get("layers").get(layerId) as any;
                const connectable = target && [LayerType.Shape, LayerType.Rectangle, LayerType.Ellipse].includes(target.get("type"));
                if (!connectable) return;
                if (!canvasState.sourceId) {
                    setCanvasState({ mode: CanvasMode.Connecting, sourceId: layerId });
                    setMyPresence({ selection: [layerId] });
                    return;
                }
                if (canvasState.sourceId === layerId) return;
                const source = storage.get("layers").get(canvasState.sourceId) as any;
                if (!source) return;
                const sourceBounds = { x: source.get("x"), y: source.get("y"), width: source.get("width"), height: source.get("height"), rotation: source.get("rotation") ?? 0 };
                const targetBounds = { x: target.get("x"), y: target.get("y"), width: target.get("width"), height: target.get("height"), rotation: target.get("rotation") ?? 0 };
                const startSide = closestSide(sourceBounds, targetBounds);
                const endSide = closestSide(targetBounds, sourceBounds);
                const startPoint = connectionPoint(sourceBounds, startSide);
                const endPoint = connectionPoint(targetBounds, endSide);
                const id = nanoid();
                storage.get("layerIds").push(id);
                storage.get("layers").set(id, new LiveObject<ShapeLayer>({
                    type: LayerType.Shape, shape: ShapeType.Arrow, x: startPoint.x, y: startPoint.y,
                    width: endPoint.x - startPoint.x, height: endPoint.y - startPoint.y, fill: undefined, stroke: BLACK,
                    strokeWidth: 2, startLayerId: canvasState.sourceId, endLayerId: layerId, startSide, endSide,
                    startSideLocked: false, endSideLocked: false,
                }));
                setMyPresence({ selection: [id] }, { addToHistory: true });
                setCanvasState({ mode: CanvasMode.Connecting });
                return;
            }

            if (!self.presence?.selection?.includes(layerId)) {
                setMyPresence({ selection: [layerId] }, { addToHistory: true });
            }

            setCanvasState({
                mode: CanvasMode.Translating,
                current: point,
            });
        },
        [
            setCanvasState,
            camera,
            history,
            canvasState,
            eraseLayer,
        ]
    );


    const layerIdsToColorSelection = useMemo(() => {
        const layerIdsToColorSelection: Record<string, string> = {};

        for (const user of selections) {
            const [connectionId, selection] = user;
            for (const layerId of selection) {
                layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
            }
        }
        return layerIdsToColorSelection;
    }, [selections])

    const MIN_ZOOM = 0.3;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.1;

    function clampZoom(z: number) {
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    }

    const zoomOut = () => {
        setCamera((cam) => {
            const nextScale = clampZoom(cam.scale - ZOOM_STEP);
            const ratio = nextScale / cam.scale;

            return {
                scale: nextScale,
                x: cam.x * ratio,
                y: cam.y * ratio,
            };
        });
    };
    const resetZoom = () => {
        setCamera({
            x: 0,
            y: 0,
            scale: 1,
        });
    };

    const zoomIn = () => {
        setCamera((cam) => {
            const nextScale = clampZoom(cam.scale + ZOOM_STEP);
            const ratio = nextScale / cam.scale;

            return {
                scale: nextScale,
                x: cam.x * ratio,
                y: cam.y * ratio,
            };
        });
    };



    return (
        <main
            className="h-full w-full relative  bg-neutral-100 select-none"
        >
            <Info boardId={boardId} />
            <Participants />
            <Toolbar
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                undo={history.undo}
                redo={history.redo}
                canUndo={canUndo}
                canRedo={canRedo}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetZoom={resetZoom}
                penSize={penSize}
                setPenSize={setPenSize}
                penColor={lastUsedColor}
                setPenColor={setLastUsedColor}
                smartDrawing={smartDrawing}
                setSmartDrawing={setSmartDrawing}
            />

            <SelectionTools
                camera={camera}
                setLastUsedColor={setLastUsedColor}
                canvasState={canvasState}
            />
            <ShareActions id={boardId} />
            {canvasState.mode === CanvasMode.Inserting &&
                canvasState.layertype === LayerType.Image && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-3 py-1 rounded">
                        Click anywhere to place image
                    </div>
                )}

            <div id="export-root" className="w-[100vw] h-[100vh]">
                <svg id="mindsketch-canvas"
                    className="h-[100vh] w-[100vw]"
                    onWheel={onWheel}
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onPointerMove={onPointerMove}
                    onPointerLeave={onPointerLeave}
                    style={{
                        cursor:
                            canvasState.mode === CanvasMode.Erasing
                                ? 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%235b4713%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m7 21-4-4 9.5-9.5 4 4L7 21Z%27/%3E%3Cpath d=%27m13.5 6.5 4 4%27/%3E%3Cpath d=%27M3 17h4%27/%3E%3C/svg%3E") 4 20, auto'
                                : canvasState.mode === CanvasMode.Inserting &&
                                canvasState.layertype === LayerType.Image
                                ? "crosshair"
                                : "default",
                    }}

                >
                    <defs>

                        <pattern
                            id="grid-small"
                            width={24 * camera.scale}
                            height={24 * camera.scale}
                            patternUnits="userSpaceOnUse"
                            patternTransform={`translate(${camera.x}, ${camera.y})`}
                        >
                            <path
                                d="M 24 0 L 0 0 0 24"
                                fill="none"
                                stroke="rgba(0,0,0,0.04)"
                                strokeWidth={1 / camera.scale}
                            />
                        </pattern>



                        <pattern
                            id="grid-large"
                            width={120 * camera.scale}
                            height={120 * camera.scale}
                            patternUnits="userSpaceOnUse"
                            patternTransform={`translate(${camera.x}, ${camera.y})`}
                        >
                            <path
                                d="M 120 0 L 0 0 0 120"
                                fill="none"
                                stroke="rgba(0,0,0,0.07)"
                                strokeWidth={1 / camera.scale}
                            />
                        </pattern>

                    </defs>

                    <rect width="100%" height="100%" fill="url(#grid-small)" />


                    <rect width="100%" height="100%" fill="url(#grid-large)" />

                    <g
                        id="canvas-content"
                        style={{
                            transform: `
      translate(${camera.x}px, ${camera.y}px)
      scale(${camera.scale})
    `,
                            transformOrigin: "0 0",
                        }}
                    >

                        <g id="export-layers">
                            {
                                layerIds && layerIds.map((layerId) => {
                                    return <LayerPreview key={layerId} id={layerId} onLayerPointerDown={onLayerPointerDown}
                                        selectionColor={layerIdsToColorSelection[layerId]}
                                    />
                                })
                            }
                        </g>
                        <SelectionBox
                            onResizeHandlePointerDown={onResizeHandlePointerDown}
                            onRotateHandlePointerDown={onRotateHandlePointerDown}
                            frame={visibleSelectionFrame}
                            rotation={
                                selection.length === 1 && selectedLayer && "rotation" in selectedLayer
                                    ? selectedLayer.rotation ?? 0
                                    : 0
                            }
                        />
                        {
                            canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
                                <rect
                                    className="fill-[#20C5A8]/5 stroke-[#20C5A8] stroke-1"
                                    x={Math.min(canvasState.origin.x, canvasState.current.x)}
                                    y={Math.min(canvasState.origin.y, canvasState.current.y)}
                                    width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                                    height={Math.abs(canvasState.origin.y - canvasState.current.y)}

                                />
                            )
                        }
                        <CursorsPresence />
                        {pencilDraft != null && pencilDraft.length > 0 && (
                            <Path
                                fill={ColorToCSS(resolveColor(lastUsedColor))}
                                points={pencilDraft}
                                x={0}
                                y={0}
                                size={penSize}
                            />
                        )
                        }
                        {canvasState.mode === CanvasMode.Inserting &&
                            canvasState.layertype === LayerType.Image &&
                            canvasState.imageSrc &&
                            canvasState.current && (
                                <image
                                    href={canvasState.imageSrc}
                                    x={canvasState.current.x - 150}
                                    y={canvasState.current.y - 100}
                                    width={300}
                                    height={200}
                                    opacity={0.6}
                                    pointerEvents="none"
                                />
                            )}

                    </g>
                </svg>

            </div>
            {/* <button
                onClick={exportTemplate}
                style={{
                    position: "fixed",
                    bottom: 16,
                    right: 16,
                    background: "black",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 6,
                    zIndex: 1000,
                }}
            >
                Export Template (DEV)
            </button> */}
        </main>
    )
}
