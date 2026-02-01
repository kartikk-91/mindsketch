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
    const { x, y, width, height, fill, stroke, strokeWidth } = layer;

    return (
        <rect
            className="drop-shadow-md"
            onPointerDown={(e) => onPointerDown(e, id)}
            style={{
                transform: `translate(${x}px,${y}px)`,
            }}
            x={0}
            y={0}
            width={width}
            height={height}
            fill={fill ? ColorToCSS(fill) : "none"}
            stroke={
                selectionColor
                    ? selectionColor
                    : stroke
                    ? ColorToCSS(stroke)
                    : "transparent"
            }
            strokeWidth={strokeWidth ?? 2}
        />
    );
};
