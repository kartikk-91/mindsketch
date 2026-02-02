import { getSvgPathFromStroke } from "@/lib/utils";
import getStroke from "perfect-freehand";

interface PathProps {
  x: number;
  y: number;
  points: number[][];
  fill: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  stroke?: string;
  rotation?: number;
}

export const Path = ({
  x,
  y,
  points,
  fill,
  onPointerDown,
  stroke,
  rotation = 0,
}: PathProps) => {
 
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;

  const cx = x + minX + width / 2;
  const cy = y + minY + height / 2;

  return (
    <g transform={`rotate(${rotation} ${cx} ${cy}) translate(${x}, ${y})`}>
      <path
        className="drop-shadow-md"
        onPointerDown={onPointerDown}
        d={getSvgPathFromStroke(
          getStroke(points, {
            size: 8,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          })
        )}
        x={0}
        y={0}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
    </g>
  );
};
