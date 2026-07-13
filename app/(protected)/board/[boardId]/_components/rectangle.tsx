import { ColorToCSS } from "@/lib/utils";
import { RectangleLayer } from "@/types/canvas";

interface RectangleProps {
    id: string;
    layer: RectangleLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
}

export const Rectangle = ({
    id,
    layer,
    onPointerDown,
    selectionColor,
}: RectangleProps) => {
    const { x, y, width, height, fill, stroke, strokeWidth, rotation = 0, opacity = 1 } = layer;
    const hasFill = Boolean(fill && fill.r !== -1);
    const resolvedStroke = stroke ? ColorToCSS(stroke) : hasFill ? "transparent" : "#000";

    return (
        <rect
            className="drop-shadow-md"
            data-export-stroke={stroke ? ColorToCSS(stroke) : "transparent"}
            data-export-selected={selectionColor ? "true" : undefined}
            onPointerDown={(e) => onPointerDown(e, id)}
            transform={`rotate(${rotation} ${x + width / 2} ${y + height / 2})`}
            x={x}
            y={y}
            width={width}
            height={height}
            rx={12}
            ry={12}
            fill={hasFill ? ColorToCSS(fill!) : "none"}
            stroke={
                selectionColor
                    ? selectionColor
                    : resolvedStroke
            }
            strokeWidth={stroke ? (strokeWidth || 2) : hasFill ? 0 : 2}
            opacity={opacity}
        />
    );
};
