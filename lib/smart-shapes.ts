import { Color, LayerType, ShapeLayer, ShapeType } from "@/types/canvas";

type Point = { x: number; y: number };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const perpendicularDistance = (point: Point, start: Point, end: Point) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return distance(point, start);
  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / Math.hypot(dx, dy);
};

const simplify = (points: Point[], tolerance: number): Point[] => {
  if (points.length < 3) return points;
  let furthestIndex = 0;
  let furthestDistance = 0;
  for (let index = 1; index < points.length - 1; index++) {
    const nextDistance = perpendicularDistance(points[index], points[0], points[points.length - 1]);
    if (nextDistance > furthestDistance) {
      furthestDistance = nextDistance;
      furthestIndex = index;
    }
  }
  if (furthestDistance <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, furthestIndex + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(furthestIndex), tolerance),
  ];
};

const cleanedCorners = (points: Point[], tolerance: number) => {
  const closed = [...points, points[0]];
  const simplified = simplify(closed, tolerance).slice(0, -1);
  return simplified.filter((point, index) => index === 0 || distance(point, simplified[index - 1]) > tolerance * 0.6);
};

const segmentsIntersect = (a: Point, b: Point, c: Point, d: Point) => {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
};

const selfIntersectionCount = (corners: Point[]) => {
  let intersections = 0;
  for (let index = 0; index < corners.length; index++) {
    const next = (index + 1) % corners.length;
    for (let other = index + 2; other < corners.length; other++) {
      const otherNext = (other + 1) % corners.length;
      if (index === otherNext || next === other || (index === 0 && otherNext === 0)) continue;
      if (segmentsIntersect(corners[index], corners[next], corners[other], corners[otherNext])) intersections++;
    }
  }
  return intersections;
};

const vector = (from: Point, to: Point): Point => ({ x: to.x - from.x, y: to.y - from.y });
const parallel = (a: Point, b: Point) => Math.abs(a.x * b.y - a.y * b.x) / Math.max(1, Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y)) < 0.2;

const isConvex = (corners: Point[]) => {
  let sign = 0;
  for (let index = 0; index < corners.length; index++) {
    const turn = cross(corners[index], corners[(index + 1) % corners.length], corners[(index + 2) % corners.length]);
    if (Math.abs(turn) < 0.001) continue;
    if (sign && Math.sign(turn) !== sign) return false;
    sign = Math.sign(turn);
  }
  return Boolean(sign);
};

const looksLikeHeart = (points: Point[], x: number, y: number, width: number, height: number) => {
  const centerX = x + width / 2;
  const notch = points.filter((point) => Math.abs(point.x - centerX) < width * 0.14 && point.y > y + height * 0.16 && point.y < y + height * 0.58);
  const hasLobes = notch.some((point) => points.some((other) => other.x < centerX - width * 0.14 && other.y < point.y - height * 0.08)
    && points.some((other) => other.x > centerX + width * 0.14 && other.y < point.y - height * 0.08));
  const hasBottomPoint = points.some((point) => Math.abs(point.x - centerX) < width * 0.2 && point.y > y + height * 0.84);
  return hasLobes && hasBottomPoint;
};

const looksLikeParallelogram = (points: Point[], y: number, width: number, height: number) => {
  const edgeBand = height * 0.14;
  const top = points.filter((point) => point.y < y + edgeBand).map((point) => point.x);
  const bottom = points.filter((point) => point.y > y + height - edgeBand).map((point) => point.x);
  if (top.length < 2 || bottom.length < 2) return false;
  const topLeft = Math.min(...top);
  const topRight = Math.max(...top);
  const bottomLeft = Math.min(...bottom);
  const bottomRight = Math.max(...bottom);
  const topSpan = topRight - topLeft;
  const bottomSpan = bottomRight - bottomLeft;
  const horizontalShift = ((topLeft - bottomLeft) + (topRight - bottomRight)) / 2;
  return topSpan > width * 0.45
    && bottomSpan > width * 0.45
    && Math.abs(topSpan - bottomSpan) < width * 0.2
    && Math.abs(horizontalShift) > width * 0.1;
};

const looksLikeOpenArrow = (points: Point[]) => {
  if (points.length < 12) return false;
  const start = points[0];
  let tipIndex = 1;
  for (let index = 2; index < points.length - 1; index++) {
    if (distance(points[index], start) > distance(points[tipIndex], start)) tipIndex = index;
  }
  const tip = points[tipIndex];
  const shaft = distance(start, tip);
  if (tipIndex < points.length * 0.25 || shaft < 45) return false;
  const returnIndex = points.findIndex((point, index) => index > tipIndex + 1 && distance(point, tip) < shaft * 0.16);
  if (returnIndex === -1 || returnIndex >= points.length - 1) return false;
  const firstWing = points[Math.min(points.length - 1, tipIndex + 1)];
  const secondWing = points[points.length - 1];
  const wingLength = (point: Point) => distance(point, tip);
  const acceptableWing = (point: Point) => wingLength(point) > shaft * 0.07 && wingLength(point) < shaft * 0.42;
  return acceptableWing(firstWing) && acceptableWing(secondWing);
};


export const recognizeSmartShape = (rawPoints: number[][], color: Color, strokeWidth: number): ShapeLayer | null => {
  if (rawPoints.length < 10) return null;
  const points = rawPoints.map(([x, y]) => ({ x, y }));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  const diagonal = Math.hypot(width, height);
  const smallestSide = Math.min(width, height);
  const build = (shape: ShapeType): ShapeLayer => ({
    type: LayerType.Shape,
    shape,
    x,
    y,
    width,
    height,
    fill: undefined,
    stroke: color,
    strokeWidth: Math.max(2, Math.round(strokeWidth / 3)),
  });

  const isClosed = distance(points[0], points[points.length - 1]) < Math.max(18, smallestSide * 0.28);
  if (!isClosed && looksLikeOpenArrow(points)) {
    const start = points[0];
    const tip = points.reduce((furthest, point) => distance(point, start) > distance(furthest, start) ? point : furthest, points[1]);
    const length = distance(start, tip);
    const center = { x: (start.x + tip.x) / 2, y: (start.y + tip.y) / 2 };
    return {
      ...build(ShapeType.Arrow),
      x: center.x - length / 2,
      y: center.y,
      width: length,
      height: 0,
      rotation: Math.atan2(tip.y - start.y, tip.x - start.x) * 180 / Math.PI,
    };
  }
  if (!isClosed) return null;
  if (smallestSide < 30 || diagonal < 45) return null;

  const center = { x: x + width / 2, y: y + height / 2 };
  const radii = points.map((point) => Math.hypot((point.x - center.x) / (width / 2), (point.y - center.y) / (height / 2)));
  const averageRadius = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
  const radialVariation = radii.reduce((sum, radius) => sum + Math.abs(radius - averageRadius), 0) / radii.length;
  const corners = cleanedCorners(points, Math.max(6, diagonal * 0.035));
  const concaveTurns = corners.reduce((count, point, index) => {
    const previous = corners[(index - 1 + corners.length) % corners.length];
    const next = corners[(index + 1) % corners.length];
    const direction = Math.sign(cross(previous, point, next));
    const reference = Math.sign(cross(corners[0], corners[1], corners[2]));
    return reference && direction && direction !== reference ? count + 1 : count;
  }, 0);
  if (selfIntersectionCount(corners) >= 3 || (corners.length >= 8 && corners.length <= 12 && concaveTurns >= 4)) return build(ShapeType.Star);
  if (looksLikeHeart(points, x, y, width, height)) return build(ShapeType.Heart);

  const aspect = Math.max(width, height) / Math.min(width, height);
  if (aspect > 1.7 && corners.length > 7 && radialVariation < 0.2) return build(ShapeType.Capsule);

  if (corners.length === 4) {
    const edges = corners.map((corner, index) => vector(corner, corners[(index + 1) % 4]));
    const topBottomHorizontal = Math.abs(edges[0].y) <= Math.abs(edges[0].x) * 0.18
      && Math.abs(edges[2].y) <= Math.abs(edges[2].x) * 0.18;
    const sidesVertical = Math.abs(edges[1].x) <= Math.abs(edges[1].y) * 0.18
      && Math.abs(edges[3].x) <= Math.abs(edges[3].y) * 0.18;
    const diamond = corners.filter((point) => Math.abs(point.x - center.x) < width * 0.22 && (point.y < y + height * 0.22 || point.y > y + height * 0.78)).length >= 2
      && corners.filter((point) => Math.abs(point.y - center.y) < height * 0.22 && (point.x < x + width * 0.22 || point.x > x + width * 0.78)).length >= 2;
    if (diamond) return build(ShapeType.Diamond);
    if (topBottomHorizontal && sidesVertical) return build(ShapeType.Rectangle);
    if (parallel(edges[0], edges[2]) && parallel(edges[1], edges[3])) return build(ShapeType.Parallelogram);
  }
  if (looksLikeParallelogram(points, y, width, height)) return build(ShapeType.Parallelogram);

  if (isConvex(corners)) {
    if (corners.length === 3) return build(ShapeType.Triangle);
    if (corners.length === 5) return build(ShapeType.Pentagon);
    if (corners.length === 6) return build(ShapeType.Hexagon);
  }
  if (corners.length >= 7 && radialVariation < 0.1 && averageRadius > 0.8 && averageRadius < 1.16) return build(ShapeType.Ellipse);
  if (corners.length >= 7 && concaveTurns >= 2) return build(ShapeType.Cloud);

  const edgeDistance = points.map((point) => Math.min(Math.abs(point.x - x), Math.abs(point.x - (x + width)), Math.abs(point.y - y), Math.abs(point.y - (y + height))));
  if (edgeDistance.filter((value) => value < smallestSide * 0.1).length / points.length > 0.82) return build(ShapeType.Rectangle);
  return null;
};
