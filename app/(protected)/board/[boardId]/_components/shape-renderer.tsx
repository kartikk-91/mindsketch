/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ShapeLayer, ShapeType, Color } from "@/types/canvas";
import { ColorToCSS } from "@/lib/utils";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useMutation } from "@liveblocks/react";
import { ReactNode, useEffect, useRef, useState } from "react";

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

const plainCode = (value?: string) => (value ?? "")
  .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
  .replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const editableHtml = (value?: string) => plainCode(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\n/g, "<br />");

const textFromEditor = (event: ContentEditableEvent) =>
  ((event.target as unknown as HTMLElement).innerText || "").replace(/\u00a0/g, " ");

const arrowHead = (tip: RoutePoint, angle: number, length = 12) => {
  const first = { x: tip.x - length * Math.cos(angle - Math.PI / 6), y: tip.y - length * Math.sin(angle - Math.PI / 6) };
  const second = { x: tip.x - length * Math.cos(angle + Math.PI / 6), y: tip.y - length * Math.sin(angle + Math.PI / 6) };
  return `M ${tip.x} ${tip.y} L ${first.x} ${first.y} M ${tip.x} ${tip.y} L ${second.x} ${second.y}`;
};

const highlightCodeLine = (line: string): ReactNode[] => {
  const tokens: ReactNode[] = [];
  const pattern = /(\/\/.*$|#.*$)|((?:"[^"\\]*?(?:\\.[^"\\]*?)*")|(?:'[^'\\]*?(?:\\.[^'\\]*?)*')|(?:`[^`]*`))|\b(const|let|var|function|class|interface|import|export|return|if|else|for|while|async|await|def|public|private|new|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) tokens.push(line.slice(lastIndex, match.index));
    const className = match[1] ? "text-slate-400"
      : match[2] ? "text-emerald-700"
        : match[3] ? "text-violet-700 font-semibold"
          : "text-amber-700";
    tokens.push(<span className={className} key={`${match.index}-${key++}`}>{match[0]}</span>);
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < line.length) tokens.push(line.slice(lastIndex));
  return tokens;
};

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
  const [codeDraft, setCodeDraft] = useState("");
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
  const isCodeShape = shape === ShapeType.Code;
  const codeValue = plainCode(layer.value);

  

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
            y2={y}
          />
        );

      case ShapeType.Arrow: {
        const x1 = x;
        const y1 = y;
        const x2 = x + width;
        const isConnector = Boolean(layer.startLayerId || layer.endLayerId);
        const y2 = isConnector ? y + height : y;
        const directAngle = Math.atan2(y2 - y1, x2 - x1);
        if (!isConnector) {
          return <path {...props} fill="none" stroke={props.stroke || BLACK} strokeLinecap="round" strokeLinejoin="round" d={`M ${x1} ${y1} L ${x2} ${y2} ${arrowHead({ x: x2, y: y2 }, directAngle)}`} />;
        }

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

      case ShapeType.ArrowLeftLine: {
        const start = { x: x + width, y };
        const end = { x, y };
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        return <path {...props} fill="none" stroke={props.stroke || BLACK} strokeLinecap="round" strokeLinejoin="round" d={`M ${start.x} ${start.y} L ${end.x} ${end.y} ${arrowHead(end, angle)}`} />;
      }

      case ShapeType.ArrowBidirectionalLine: {
        const start = { x, y };
        const end = { x: x + width, y };
        const endAngle = Math.atan2(end.y - start.y, end.x - start.x);
        const startAngle = Math.atan2(start.y - end.y, start.x - end.x);
        return <path {...props} fill="none" stroke={props.stroke || BLACK} strokeLinecap="round" strokeLinejoin="round" d={`M ${start.x} ${start.y} L ${end.x} ${end.y} ${arrowHead(start, startAngle)} ${arrowHead(end, endAngle)}`} />;
      }

      case ShapeType.ArrowRight:
        return <polygon {...props} points={`${x},${y + height * 0.24} ${x + width * 0.58},${y + height * 0.24} ${x + width * 0.58},${y} ${x + width},${cy} ${x + width * 0.58},${y + height} ${x + width * 0.58},${y + height * 0.76} ${x},${y + height * 0.76}`} />;
      case ShapeType.ArrowLeft:
        return <polygon {...props} points={`${x + width},${y + height * 0.24} ${x + width * 0.42},${y + height * 0.24} ${x + width * 0.42},${y} ${x},${cy} ${x + width * 0.42},${y + height} ${x + width * 0.42},${y + height * 0.76} ${x + width},${y + height * 0.76}`} />;
      case ShapeType.ArrowBidirectional:
        return <polygon {...props} points={`${x},${cy} ${x + width * 0.22},${y} ${x + width * 0.22},${y + height * 0.25} ${x + width * 0.78},${y + height * 0.25} ${x + width * 0.78},${y} ${x + width},${cy} ${x + width * 0.78},${y + height} ${x + width * 0.78},${y + height * 0.75} ${x + width * 0.22},${y + height * 0.75} ${x + width * 0.22},${y + height}`} />;

      case ShapeType.Code:
        return (
          <foreignObject
            x={x}
            y={y}
            width={width}
            height={height}
            pointerEvents="all"
            onPointerDown={(event) => onPointerDown(event, id)}
            onDoubleClick={() => {
              setCodeDraft(codeValue);
              setIsEditing(true);
            }}
          >
            <div
              className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-[#fffefa] shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
              style={{
                borderColor: selectionColor ?? "#dbe3ed",
                outline: selectionColor ? `2px solid ${selectionColor}` : "none",
                outlineOffset: "-1px",
              }}
            >
              <div className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              {isEditing ? (
                <ContentEditable
                  innerRef={textRef as never}
                  html={editableHtml(codeDraft)}
                  onChange={(event: ContentEditableEvent) => setCodeDraft(textFromEditor(event))}
                  onBlur={() => {
                    updateValue(codeDraft);
                    setIsEditing(false);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onWheelCapture={(event) => event.stopPropagation()}
                  className="min-h-0 w-full flex-1 overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-6 text-slate-800 outline-none"
                />
              ) : (
                <pre onWheelCapture={(event) => event.stopPropagation()} className="m-0 min-h-0 flex-1 overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-6 text-slate-800">
                  <code>{codeValue.split("\n").map((line, index) => <span className="block min-h-6" key={index}>{highlightCodeLine(line)}</span>)}</code>
                </pre>
              )}
            </div>
          </foreignObject>
        );

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
              M ${x + width * 0.18} ${y + height * 0.78}
              C ${x + width * 0.03} ${y + height * 0.78}, ${x} ${y + height * 0.66}, ${x} ${y + height * 0.54}
              C ${x} ${y + height * 0.39}, ${x + width * 0.12} ${y + height * 0.28}, ${x + width * 0.27} ${y + height * 0.3}
              C ${x + width * 0.34} ${y + height * 0.09}, ${x + width * 0.63} ${y + height * 0.06}, ${x + width * 0.74} ${y + height * 0.29}
              C ${x + width * 0.91} ${y + height * 0.25}, ${x + width} ${y + height * 0.39}, ${x + width} ${y + height * 0.53}
              C ${x + width} ${y + height * 0.68}, ${x + width * 0.88} ${y + height * 0.78}, ${x + width * 0.73} ${y + height * 0.78} Z
            `}
          />
        );

      case ShapeType.Pentagon:
        return <polygon {...props} points={`${cx},${y} ${x + width},${y + height * 0.38} ${x + width * 0.81},${y + height} ${x + width * 0.19},${y + height} ${x},${y + height * 0.38}`} />;
      case ShapeType.Hexagon:
        return <polygon {...props} points={`${x + width * 0.25},${y} ${x + width * 0.75},${y} ${x + width},${cy} ${x + width * 0.75},${y + height} ${x + width * 0.25},${y + height} ${x},${cy}`} />;
      case ShapeType.Heart:
        return <path {...props} d={`M ${cx} ${y + height * 0.9} C ${x - width * 0.08} ${y + height * 0.52}, ${x + width * 0.05} ${y + height * 0.08}, ${cx} ${y + height * 0.28} C ${x + width * 0.95} ${y + height * 0.08}, ${x + width * 1.08} ${y + height * 0.52}, ${cx} ${y + height * 0.9} Z`} />;
      case ShapeType.SpeechBubble:
        return <path {...props} d={`M ${x + width * 0.12} ${y} H ${x + width * 0.88} Q ${x + width} ${y} ${x + width} ${y + height * 0.16} V ${y + height * 0.63} Q ${x + width} ${y + height * 0.78} ${x + width * 0.85} ${y + height * 0.78} H ${x + width * 0.45} L ${x + width * 0.25} ${y + height} L ${x + width * 0.3} ${y + height * 0.78} H ${x + width * 0.12} Q ${x} ${y + height * 0.78} ${x} ${y + height * 0.63} V ${y + height * 0.16} Q ${x} ${y} ${x + width * 0.12} ${y} Z`} />;
      case ShapeType.Document:
        return <path {...props} d={`M ${x} ${y} H ${x + width * 0.68} L ${x + width} ${y + height * 0.3} V ${y + height} H ${x} Z M ${x + width * 0.68} ${y} V ${y + height * 0.3} H ${x + width}`} />;
      case ShapeType.Database:
        return <path {...props} d={`M ${x} ${y + height * 0.16} A ${width / 2} ${height * 0.16} 0 0 1 ${x + width} ${y + height * 0.16} V ${y + height * 0.84} A ${width / 2} ${height * 0.16} 0 0 1 ${x} ${y + height * 0.84} Z M ${x} ${cy} A ${width / 2} ${height * 0.16} 0 0 0 ${x + width} ${cy}`} />;
      case ShapeType.Cube:
        return <path {...props} d={`M ${x + width * 0.28} ${y} L ${x + width} ${y + height * 0.2} V ${y + height * 0.76} L ${x + width * 0.7} ${y + height} L ${x} ${y + height * 0.8} V ${y + height * 0.23} Z M ${x} ${y + height * 0.23} L ${x + width * 0.7} ${y + height * 0.43} L ${x + width} ${y + height * 0.2} M ${x + width * 0.7} ${y + height * 0.43} V ${y + height}`} />;
      case ShapeType.Pyramid:
        return <path {...props} d={`M ${cx} ${y} L ${x + width} ${y + height} H ${x} Z M ${cx} ${y} V ${y + height} M ${x} ${y + height} L ${x + width * 0.7} ${y + height * 0.72} L ${x + width} ${y + height}`} />;
      case ShapeType.Cone:
        return <path {...props} d={`M ${cx} ${y} L ${x + width} ${y + height * 0.82} A ${width / 2} ${height * 0.18} 0 0 1 ${x} ${y + height * 0.82} Z`} />;

      default:
        return null;
    }
  };

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy})`} opacity={opacity}>
      {renderShape(baseProps)}
      {!isCodeShape && selectionProps && renderShape(selectionProps)}
      {shape !== ShapeType.Line && shape !== ShapeType.Arrow && shape !== ShapeType.ArrowLeftLine && shape !== ShapeType.ArrowBidirectionalLine && !isCodeShape && layer.value && !isEditing && (
        <foreignObject data-export-shape-text="true" x={x + 12} y={y + 12} width={Math.max(0, width - 24)} height={Math.max(0, height - 24)} pointerEvents="none" style={{ border: "none", outline: "none", overflow: "hidden" }}>
          <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-auto whitespace-pre-wrap break-words text-center text-sm font-medium leading-5 text-neutral-900">
            {plainCode(layer.value)}
          </div>
        </foreignObject>
      )}
      {shape !== ShapeType.Line && shape !== ShapeType.Arrow && shape !== ShapeType.ArrowLeftLine && shape !== ShapeType.ArrowBidirectionalLine && !isCodeShape && isEditing && (
        <foreignObject
          x={x + 10}
          y={y + 10}
          width={Math.max(0, width - 20)}
          height={Math.max(0, height - 20)}
          pointerEvents="all"
          onPointerDown={(event) => event.stopPropagation()}
          data-export-shape-text="true"
          style={{ border: "none", outline: "none", overflow: "hidden" }}
        >
          <ContentEditable
            innerRef={textRef as never}
            html={editableHtml(layer.value)}
            onChange={(event: ContentEditableEvent) => updateValue(textFromEditor(event))}
            onBlur={() => setIsEditing(false)}
            className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-auto whitespace-pre-wrap break-words text-center text-sm font-medium leading-5 text-neutral-900 outline-none"
            style={{ pointerEvents: "auto" }}
          />
        </foreignObject>
      )}
    </g>
  );
};
