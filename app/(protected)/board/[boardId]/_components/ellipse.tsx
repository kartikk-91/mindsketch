import { ColorToCSS } from "@/lib/utils";
import { EllipseLayer } from "@/types/canvas";

interface EllipseProps {
    id: string;
    layer: EllipseLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
}

export const Ellipse = ({
    id,
    layer,
    onPointerDown,
    selectionColor,
}: EllipseProps) => {
    const { x, y, width, height, fill, stroke, strokeWidth, rotation = 0, opacity = 1 } = layer;
    const hasFill = Boolean(fill && fill.r !== -1);
    const resolvedStroke = stroke ? ColorToCSS(stroke) : hasFill ? "transparent" : "#000";

    return (
        <ellipse
            className="drop-shadow-md"
            data-export-stroke={stroke ? ColorToCSS(stroke) : "transparent"}
            data-export-selected={selectionColor ? "true" : undefined}
            transform={`rotate(${rotation} ${x + width / 2} ${y + height / 2})`}
            cx={x + width / 2}
            cy={y + height / 2}
            rx={width / 2}
            ry={height / 2}
            fill={hasFill ? ColorToCSS(fill!) : "none"}
            stroke={
                selectionColor
                    ? selectionColor
                    : resolvedStroke
            }
            strokeWidth={stroke ? (strokeWidth || 2) : hasFill ? 0 : 2}
            opacity={opacity}
            onPointerDown={(e) => onPointerDown(e, id)}
        />
    );
};
