/* eslint-disable @typescript-eslint/no-explicit-any */
import { ShapeLayer, ShapeType } from "@/types/canvas";
import { ColorToCSS } from "@/lib/utils";

interface ShapeRendererProps {
  id: string;
  layer: ShapeLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

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
  } = layer;

  const fillColor = fill ? ColorToCSS(fill) : "none";
  const strokeColor = stroke ? ColorToCSS(stroke) : "currentColor";


  const baseProps = {
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, id),
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: dashed ? "6 4" : undefined,
    vectorEffect: "non-scaling-stroke" as const,
  };

  const selectionProps = selectionColor
    ? {
        fill: "none",
        stroke: selectionColor,
        strokeWidth: strokeWidth + 2,
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
            cx={x + width / 2}
            cy={y + height / 2}
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

      case ShapeType.Arrow:
        return (
          <path
            {...props}
            fill="none"
            d={`
              M ${x} ${y}
              L ${x + width} ${y + height}
              L ${x + width - 10} ${y + height - 5}
              M ${x + width} ${y + height}
              L ${x + width - 5} ${y + height - 10}
            `}
          />
        );

      case ShapeType.Diamond:
        return (
          <polygon
            {...props}
            points={`
              ${x + width / 2},${y}
              ${x + width},${y + height / 2}
              ${x + width / 2},${y + height}
              ${x},${y + height / 2}
            `}
          />
        );

      case ShapeType.Triangle:
        return (
          <polygon
            {...props}
            points={`
              ${x + width / 2},${y}
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
            <ellipse {...props} cx={x + width / 2} cy={y} rx={width / 2} ry={height * 0.15} />
            <rect {...props} x={x} y={y} width={width} height={height} />
            <ellipse {...props} cx={x + width / 2} cy={y + height} rx={width / 2} ry={height * 0.15} />
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
    <>
      {renderShape(baseProps)}
      {selectionProps && renderShape(selectionProps)}
    </>
  );
};
