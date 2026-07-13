/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ShapeLayer, ShapeType, Color } from "@/types/canvas";
import { ColorToCSS } from "@/lib/utils";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useMutation } from "@liveblocks/react";
import { useEffect, useRef, useState } from "react";

interface ShapeRendererProps {
  id: string;
  layer: ShapeLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const BLACK = "#000000";

const isTransparentColor = (c?: Color) =>
  !c || (c.r === -1 && c.g === -1 && c.b === -1);

type RoutePoint = { x: number; y: number };

const samePoint = (a: RoutePoint, b: RoutePoint) => a.x === b.x && a.y === b.y;

/** Turns an orthogonal polyline into a route with softly rounded corners. */
const roundedOrthogonalPath = (rawPoints: RoutePoint[]) => {
  const points = rawPoints.filter((point, index) => index === 0 || !samePoint(point, rawPoints[index - 1]));
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const incoming = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const outgoing = Math.hypot(next.x - corner.x, next.y - corner.y);
    const radius = Math.min(14, incoming / 2, outgoing / 2);
    if (radius < 1) {
      path += ` L ${corner.x} ${corner.y}`;
      continue;
    }
    const before = { x: corner.x + (previous.x - corner.x) * radius / incoming, y: corner.y + (previous.y - corner.y) * radius / incoming };
    const after = { x: corner.x + (next.x - corner.x) * radius / outgoing, y: corner.y + (next.y - corner.y) * radius / outgoing };
    path += ` L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`;
  }
  const end = points[points.length - 1];
  return `${path} L ${end.x} ${end.y}`;
};

export const ShapeRenderer = ({
  id,
  layer,
  onPointerDown,
  selectionColor,
}: ShapeRendererProps) => {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth = 2,
    dashed,
    shape,
    rotation = 0,
    opacity = 1,
  } = layer;
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLElement>(null);

  const updateValue = useMutation(({ storage }, value: string) => {
    storage.get("layers").get(id)?.set("value", value);
  }, [id]);

  useEffect(() => {
    if (isEditing) textRef.current?.focus();
  }, [isEditing]);

  const cx = x + width / 2;
  const cy = y + height / 2;

  

  const resolvedFill = isTransparentColor(fill)
    ? "transparent"
    : ColorToCSS(fill as Color);

  const requiresStroke =
    shape === ShapeType.Line || shape === ShapeType.Arrow;

  let resolvedStroke: string;

  if (stroke) {
    resolvedStroke = ColorToCSS(stroke);
  } else if (requiresStroke) {
   
    resolvedStroke = BLACK;
  } else if (resolvedFill === "transparent") {
   
    resolvedStroke = BLACK;
  } else {
    resolvedStroke = "transparent";
  }

  const finalStrokeWidth = Math.max(strokeWidth, 1);

  

  const baseProps = {
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, id),
    onDoubleClick: () => setIsEditing(true),
    fill: resolvedFill,
    stroke: resolvedStroke,
    strokeWidth: finalStrokeWidth,
    strokeDasharray: dashed ? "6 4" : undefined,
    vectorEffect: "non-scaling-stroke" as const,
    pointerEvents: "all" as const,
  };

  const selectionProps = selectionColor
    ? {
        fill: "none",
        stroke: selectionColor,
        strokeWidth: finalStrokeWidth + 2,
        opacity: 0.9,
        pointerEvents: "none" as const,
        "data-export-exclude": "true",
      }
    : null;

  

  const renderShape = (props: any) => {
    switch (shape) {
      case ShapeType.Rectangle:
        return <rect {...props} x={x} y={y} width={width} height={height} rx={12} ry={12} />;

      case ShapeType.Ellipse:
        return (
          <ellipse
            {...props}
            cx={cx}
            cy={cy}
            rx={width / 2}
            ry={height / 2}
          />
        );

      case ShapeType.Line:
        return (
          <line
            {...props}
            x1={x}
            y1={y}
            x2={x + width}
            y2={y + height}
          />
        );

      case ShapeType.Arrow: {
        const x1 = x;
        const y1 = y;
        const x2 = x + width;
        const y2 = y + height;

        const headLength = 12;
        const inferredStartSide = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
          ? (x2 >= x1 ? 8 : 4)
          : (y2 >= y1 ? 2 : 1);
        const inferredEndSide = inferredStartSide === 4 ? 8 : inferredStartSide === 8 ? 4 : inferredStartSide === 1 ? 2 : 1;
        // Some arrows created before border-side persistence have no side metadata.
        // Infer it from the endpoints instead of defaulting to Bottom (which caused a bad target elbow).
        const direction = (side: number) => side === 4 ? { x: -1, y: 0 } : side === 8 ? { x: 1, y: 0 } : side === 1 ? { x: 0, y: -1 } : { x: 0, y: 1 };
        const startDirection = direction(layer.startSide ?? inferredStartSide);
        const endDirection = direction(layer.endSide ?? inferredEndSide);
        const distance = Math.hypot(x2 - x1, y2 - y1);
        // Each connector visibly leaves the chosen border before it is allowed to turn.
        const stub = Math.min(30, Math.max(14, distance * 0.18));
        const startStub = { x: x1 + startDirection.x * stub, y: y1 + startDirection.y * stub };
        const endStub = { x: x2 + endDirection.x * stub, y: y2 + endDirection.y * stub };
        const startHorizontal = startDirection.x !== 0;
        const endHorizontal = endDirection.x !== 0;
        let middle: RoutePoint[];
        if (startHorizontal === endHorizontal) {
          if (startHorizontal) {
            const middleX = (startStub.x + endStub.x) / 2;
            middle = [{ x: middleX, y: startStub.y }, { x: middleX, y: endStub.y }];
          } else {
            const middleY = (startStub.y + endStub.y) / 2;
            middle = [{ x: startStub.x, y: middleY }, { x: endStub.x, y: middleY }];
          }
        } else {
          // One clean elbow is enough for perpendicular sides, matching familiar diagram tools.
          middle = startHorizontal
            ? [{ x: endStub.x, y: startStub.y }]
            : [{ x: startStub.x, y: endStub.y }];
        }
        const route = roundedOrthogonalPath([{ x: x1, y: y1 }, startStub, ...middle, endStub, { x: x2, y: y2 }]);
        const angle = Math.atan2(-endDirection.y, -endDirection.x);

        const hx1 = x2 - headLength * Math.cos(angle - Math.PI / 6);
        const hy1 = y2 - headLength * Math.sin(angle - Math.PI / 6);
        const hx2 = x2 - headLength * Math.cos(angle + Math.PI / 6);
        const hy2 = y2 - headLength * Math.sin(angle + Math.PI / 6);

        return (
          <path
            {...props}
            fill="none"
            stroke={props.stroke || BLACK}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={`${route}
              M ${x2} ${y2}
              L ${hx1} ${hy1}
              M ${x2} ${y2}
              L ${hx2} ${hy2}
            `}
          />
        );
      }

      case ShapeType.Diamond:
        return (
          <polygon
            {...props}
            points={`
              ${cx},${y}
              ${x + width},${cy}
              ${cx},${y + height}
              ${x},${cy}
            `}
          />
        );

      case ShapeType.Triangle:
        return (
          <polygon
            {...props}
            points={`
              ${cx},${y}
              ${x + width},${y + height}
              ${x},${y + height}
            `}
          />
        );

      case ShapeType.Star:
        return (
          <polygon
            {...props}
            points={`
              ${x + width * 0.5},${y}
              ${x + width * 0.62},${y + height * 0.38}
              ${x + width},${y + height * 0.38}
              ${x + width * 0.7},${y + height * 0.62}
              ${x + width * 0.82},${y + height}
              ${x + width * 0.5},${y + height * 0.75}
              ${x + width * 0.18},${y + height}
              ${x + width * 0.3},${y + height * 0.62}
              ${x},${y + height * 0.38}
              ${x + width * 0.38},${y + height * 0.38}
            `}
          />
        );

      case ShapeType.Capsule:
        return (
          <rect
            {...props}
            x={x}
            y={y}
            width={width}
            height={height}
            rx={height / 2}
            ry={height / 2}
          />
        );

      case ShapeType.Parallelogram:
        return (
          <polygon
            {...props}
            points={`
              ${x + width * 0.2},${y}
              ${x + width},${y}
              ${x + width * 0.8},${y + height}
              ${x},${y + height}
            `}
          />
        );

      case ShapeType.Cylinder:
        // One continuous silhouette avoids the stacked-ellipse look of the old cylinder.
        return (
          <path
            {...props}
            d={`M ${x} ${y + height * 0.16}
              A ${width / 2} ${height * 0.16} 0 0 1 ${x + width} ${y + height * 0.16}
              V ${y + height * 0.84}
              A ${width / 2} ${height * 0.16} 0 0 1 ${x} ${y + height * 0.84} Z
              M ${x} ${y + height * 0.16}
              A ${width / 2} ${height * 0.16} 0 0 0 ${x + width} ${y + height * 0.16}`}
          />
        );

      case ShapeType.Cloud:
        return (
          <path
            {...props}
            d={`
              M ${x + width * 0.2} ${y + height * 0.6}
              C ${x} ${y + height * 0.3},
                ${x + width * 0.2} ${y},
                ${x + width * 0.4} ${y + height * 0.2}
              C ${x + width * 0.6} ${y},
                ${x + width * 0.8} ${y},
                ${x + width * 0.85} ${y + height * 0.3}
              C ${x + width} ${y + height * 0.5},
                ${x + width * 0.8} ${y + height * 0.8},
                ${x + width * 0.5} ${y + height * 0.75}
              Z
            `}
          />
        );

      default:
        return null;
    }
  };

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`} opacity={opacity}>
      {renderShape(baseProps)}
      {selectionProps && renderShape(selectionProps)}
      {shape !== ShapeType.Line && shape !== ShapeType.Arrow && layer.value && !isEditing && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#171717" fontSize="14" fontWeight="500" pointerEvents="none">
          {layer.value.replace(/<[^>]*>/g, "")}
        </text>
      )}
      {shape !== ShapeType.Line && shape !== ShapeType.Arrow && isEditing && (
        <foreignObject
          x={x + 10}
          y={y + 10}
          width={Math.max(0, width - 20)}
          height={Math.max(0, height - 20)}
          pointerEvents="all"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <ContentEditable
            innerRef={textRef as never}
            html={layer.value || ""}
            onChange={(event: ContentEditableEvent) => updateValue(event.target.value)}
            onBlur={() => setIsEditing(false)}
            className="flex h-full w-full items-center justify-center overflow-hidden break-words text-center text-sm font-medium text-neutral-900 outline-none"
            style={{ pointerEvents: "auto" }}
          />
        </foreignObject>
      )}
    </g>
  );
};
