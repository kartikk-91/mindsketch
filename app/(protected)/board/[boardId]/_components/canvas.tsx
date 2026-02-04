/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";

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
// import { useExportTemplate } from "@/hooks/use-export-template";


const MAX_LAYERS = 100;

interface CanvasProps {
    boardId: string;
}
export const Canvas = ({ boardId }: CanvasProps) => {
    // const exportTemplate = useExportTemplate();



    const layerIds = useStorage((root) => root.layerIds);
    const pencilDraft = useSelf((me) => me.presence.pencilDraft);
    const [canvasState, setCanvasState] = useState<CanvasState>({
        mode: CanvasMode.None,
    });
    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
    const [lastUsedColor, setLastUsedColor] = useState<Color>({
        r: 124,
        g: 232,
        b: 145,
    });
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
        }))
    }, [])
    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const deleteLayers = useDeleteLayers();
    const selection = useSelf((me) => me.presence.selection);

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


    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            const isMod = e.ctrlKey || e.metaKey;

            if (isMod && e.key.toLowerCase() === "d") {
                e.preventDefault();

                copySelectedLayers();
                pasteLayers();
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
    }, [copySelectedLayers, pasteLayers, deleteLayers, history]);


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

            const layer = new LiveObject<{
                type: LayerType.Ellipse | LayerType.Note | LayerType.Rectangle | LayerType.Text;
                x: number;
                y: number;
                width: number;
                height: number;
                fill: Color;
            }>({
                type: layerType,
                x: position.x,
                y: position.y,
                width: 100,
                height: 100,
                fill: resolveColor(lastUsedColor),
            });

            liveLayerIds.push(layerId);
            liveLayers.set(layerId, layer as LiveObject<Layer>);
            setMyPresence({ selection: [layerId] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });
        },
        [lastUsedColor]
    );


    const insertImageLayer = useMutation(
        ({ storage, setMyPresence }, position: Point) => {
            const liveLayers = storage.get("layers");
            if (liveLayers.size >= MAX_LAYERS) {
                return;
            }

            const liveLayerIds = storage.get("layerIds");
            const layerId = nanoid();

            const layer = new LiveObject({
                type: LayerType.Image,
                x: position.x,
                y: position.y,
                width: 300,
                height: 200,
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
                fill: resolveColor(lastUsedColor),
                stroke: undefined,
                strokeWidth: 2,
                rotation: 0,
            });


            storage.get("layerIds").push(id);
            liveLayers.set(id, layer);
            setMyPresence({ selection: [id] }, { addToHistory: true });
            setCanvasState({ mode: CanvasMode.None });
        },
        [lastUsedColor]
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
        setCanvasState({
            mode: CanvasMode.Translating,
            current: point,
        })
    }, [canvasState])


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
        liveLayers.set(
            id,
            new LiveObject(penPointsToPathLayer(
                pencilDraft,
                resolveColor(lastUsedColor),
            ))
        );
        const liveLayerIds = storage.get('layerIds');
        liveLayerIds.push(id);
        setMyPresence({ pencilDraft: null });
        setCanvasState({ mode: CanvasMode.Pencil });
    }, [lastUsedColor])

    const startDrawing = useMutation(({ setMyPresence }, point: Point, pressure: number) => {
        setMyPresence({
            pencilDraft: [[point.x, point.y, pressure]],
            penColor: resolveColor(lastUsedColor),
        })
    }, [lastUsedColor])

    function rotatePointAround(
        px: number,
        py: number,
        cx: number,
        cy: number,
        angleDeg: number
    ) {
        const rad = (angleDeg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dx = px - cx;
        const dy = py - cy;

        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos,
        };
    }


    const resizeSelectedLayer = useMutation(
        ({ storage, self }, point: Point) => {
            if (canvasState.mode !== CanvasMode.Resizing) return;

            const liveLayers = storage.get("layers");
            const id = self.presence.selection[0];
            const layer = liveLayers.get(id);
            if (!layer) return;

            let rotation = 0;
            if (layer.get("type") === LayerType.Shape) {
                const shapeLayer = layer as unknown as LiveObject<ShapeLayer>;
                rotation = Number(shapeLayer.get("rotation") ?? 0);
            }

            const { x, y, width, height } = canvasState.intialBounds;

            const cx = x + width / 2;
            const cy = y + height / 2;

            const localPoint = rotatePointAround(
                point.x,
                point.y,
                cx,
                cy,
                -rotation
            );

            const bounds = resizeBounds(
                canvasState.intialBounds,
                canvasState.corner,
                localPoint
            );

            layer.update(bounds);
        },
        [canvasState]
    );



    const rotateSelectedLayer = useMutation(
        ({ storage, self }, rotation: number) => {
            const id = self.presence.selection[0];
            if (!id) return;

            const layer = storage.get("layers").get(id);
            if (!layer) return;

            layer.update({ rotation });
        },
        []
    );



    const onRotateHandlePointerDown = useCallback(
        (e: React.PointerEvent, cx: number, cy: number) => {
            e.stopPropagation();
            history.pause();

            const point = pointerEventToCanvasPoint(e, camera);

            const initialRotation =
                selectedLayer && "rotation" in selectedLayer
                    ? selectedLayer.rotation ?? 0
                    : 0;

            const startAngle =
                Math.atan2(point.y - cy, point.x - cx) * (180 / Math.PI);

            setCanvasState({
                mode: CanvasMode.Rotating,
                center: { x: cx, y: cy },
                startAngle,
                initialRotation,
            });
        },
        [camera, history, selectedLayer]
    );



    const onResizeHandlePointerDown = useCallback((corner: Side, intialBounds: XYWH) => {
        history.pause();
        setCanvasState({
            mode: CanvasMode.Resizing,
            corner,
            intialBounds,
        });
    }, [history])

    const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
        e.preventDefault();
        const current = pointerEventToCanvasPoint(e, camera);
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
        else if (canvasState.mode === CanvasMode.Pencil) {
            continueDrawing(current, e);
        }
        else if (canvasState.mode === CanvasMode.Rotating) {
            const { center, startAngle, initialRotation } = canvasState;

            const angle =
                Math.atan2(current.y - center.y, current.x - center.x) *
                (180 / Math.PI);

            const delta = angle - startAngle;

            rotateSelectedLayer(initialRotation + delta);
        }

        setMyPresence({ cursor: current });
        setCanvasState((prev) =>
            prev.mode === CanvasMode.Inserting
                ? { ...prev, current }
                : prev
        );

    }, [canvasState, resizeSelectedLayer, camera, continueDrawing, translateSelectedLayers, updateSelectionNet, startMultiSelection])

    const onPointerLeave = useMutation(({ setMyPresence }) => {
        setMyPresence({ cursor: null });
    }, [])

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        const point = pointerEventToCanvasPoint(e, camera);
        if (canvasState.mode === CanvasMode.Inserting) {
            return;
        }
        if (canvasState.mode === CanvasMode.Pencil) {
            startDrawing(point, e.pressure);
            return;
        }
        setCanvasState({
            origin: point,
            mode: CanvasMode.Pressing,
        })
    }, [camera, canvasState.mode, setCanvasState, startDrawing])

    const onPointerUp = useMutation(({ }, e) => {
        const point = pointerEventToCanvasPoint(e, camera);
        if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
            unselectLayers();
            setCanvasState({ mode: CanvasMode.None });
        }
        else if (canvasState.mode === CanvasMode.Pencil) {
            insertPath();
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
    }, [camera, canvasState, history, insertLayer, unselectLayers, insertPath, setCanvasState]);

    const selections = useOthersMapped((other) => other.presence.selection);




    const onLayerPointerDown = useMutation(
        ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
            if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting) {
                return;
            }

            history.pause();
            e.stopPropagation();

            const point = pointerEventToCanvasPoint(e, camera);
            if (!point) return;

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
            canvasState.mode,
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

    return (
        <main
            className="h-full w-full relative  bg-neutral-100 touch-none select-none"
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
            />
            <SelectionTools
                camera={camera}
                setLastUsedColor={setLastUsedColor}
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
                            canvasState.mode === CanvasMode.Inserting &&
                                canvasState.layertype === LayerType.Image
                                ? "crosshair"
                                : "default",
                    }}

                >
                    <defs>

                        <pattern
                            id="grid-small"
                            width="24"
                            height="24"
                            patternUnits="userSpaceOnUse"
                            patternTransform={`translate(${camera.x}, ${camera.y})`}
                        >
                            <path
                                d="M 24 0 L 0 0 0 24"
                                fill="none"
                                stroke="rgba(0,0,0,0.04)"
                                strokeWidth="1"
                            />
                        </pattern>


                        <pattern
                            id="grid-large"
                            width="120"
                            height="120"
                            patternUnits="userSpaceOnUse"
                            patternTransform={`translate(${camera.x}, ${camera.y})`}
                        >
                            <path
                                d="M 120 0 L 0 0 0 120"
                                fill="none"
                                stroke="rgba(0,0,0,0.07)"
                                strokeWidth="1"
                            />
                        </pattern>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#grid-small)" />


                    <rect width="100%" height="100%" fill="url(#grid-large)" />

                    <g id="canvas-content"
                        style={{ transform: `translate(${camera.x}px,${camera.y}px)` }}
                    >
                        {
                            layerIds && layerIds.map((layerId) => {
                                return <LayerPreview key={layerId} id={layerId} onLayerPointerDown={onLayerPointerDown}
                                    selectionColor={layerIdsToColorSelection[layerId]}
                                />
                            })
                        }
                        <SelectionBox
                            onResizeHandlePointerDown={onResizeHandlePointerDown}
                            onRotateHandlePointerDown={onRotateHandlePointerDown}
                            rotation={
                                selectedLayer && "rotation" in selectedLayer
                                    ? selectedLayer.rotation ?? 0
                                    : 0
                            }
                        />
                        {
                            canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
                                <rect
                                    className="fill-blue-500/5 stroke-blue-500 stroke-1"
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