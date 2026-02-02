/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ShapeLayer, ShapeType, Color } from "@/types/canvas";
import { ColorToCSS } from "@/lib/utils";

interface ShapeRendererProps {
  id: string;
  layer: ShapeLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const BLACK = "#000000";

const isTransparentColor = (c?: Color) =>
  !c || (c.r === -1 && c.g === -1 && c.b === -1);

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
  } = layer;

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
      }
    : null;

  

  const renderShape = (props: any) => {
    switch (shape) {
      case ShapeType.Rectangle:
        return <rect {...props} x={x} y={y} width={width} height={height} />;

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
        const angle = Math.atan2(y2 - y1, x2 - x1);

        const hx1 = x2 - headLength * Math.cos(angle - Math.PI / 6);
        const hy1 = y2 - headLength * Math.sin(angle - Math.PI / 6);
        const hx2 = x2 - headLength * Math.cos(angle + Math.PI / 6);
        const hy2 = y2 - headLength * Math.sin(angle + Math.PI / 6);

        return (
          <path
            {...props}
            fill="none"
            stroke={props.stroke || BLACK}
            d={`
              M ${x1} ${y1}
              L ${x2} ${y2}
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
        return (
          <>
            <ellipse {...props} cx={cx} cy={y} rx={width / 2} ry={height * 0.15} />
            <rect {...props} x={x} y={y} width={width} height={height} />
            <ellipse
              {...props}
              cx={cx}
              cy={y + height}
              rx={width / 2}
              ry={height * 0.15}
            />
          </>
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
    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
      {renderShape(baseProps)}
      {selectionProps && renderShape(selectionProps)}
    </g>
  );
};
