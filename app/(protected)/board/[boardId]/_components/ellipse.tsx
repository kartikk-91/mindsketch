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
    const { x, y, width, height, fill, stroke, strokeWidth } = layer;

    return (
        <ellipse
            className="drop-shadow-md"
            style={{
                transform: `translate(${x}px, ${y}px)`,
            }}
            cx={width / 2}
            cy={height / 2}
            rx={width / 2}
            ry={height / 2}
            fill={fill ? ColorToCSS(fill) : "none"}
            stroke={
                selectionColor
                    ? selectionColor
                    : stroke
                    ? ColorToCSS(stroke)
                    : "transparent"
            }
            strokeWidth={strokeWidth ?? 2}
            onPointerDown={(e) => onPointerDown(e, id)}
        />
    );
};
