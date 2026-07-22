import * as React from "react";
import { LucideProps } from "lucide-react";

export const ParallelogramIcon = React.forwardRef<
  SVGSVGElement,
  LucideProps
>(({ size = 20, ...props }, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="6 4 20 4 18 20 4 20" />
  </svg>
));

ParallelogramIcon.displayName = "ParallelogramIcon";

export const CylinderIcon = React.forwardRef<
  SVGSVGElement,
  LucideProps
>(({ size = 20, ...props }, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <ellipse cx="12" cy="5" rx="7" ry="3" />
    <path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
    <ellipse cx="12" cy="19" rx="7" ry="3" />
  </svg>
));

CylinderIcon.displayName = "CylinderIcon";

const shapeIcon = (name: string, content: React.ReactNode) => {
  const Icon = React.forwardRef<SVGSVGElement, LucideProps>(({ size = 20, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{content}</svg>
  ));
  Icon.displayName = name;
  return Icon;
};

export const PentagonIcon = shapeIcon("PentagonIcon", <polygon points="12 3 21 9.5 17.6 20 6.4 20 3 9.5" />);
export const BlockArrowRightIcon = shapeIcon("BlockArrowRightIcon", <polygon points="3 8 13 8 13 4 21 12 13 20 13 16 3 16" />);
export const BlockArrowLeftIcon = shapeIcon("BlockArrowLeftIcon", <polygon points="21 8 11 8 11 4 3 12 11 20 11 16 21 16" />);
export const BlockArrowBidirectionalIcon = shapeIcon("BlockArrowBidirectionalIcon", <polygon points="3 12 9 5 9 9 15 9 15 5 21 12 15 19 15 15 9 15 9 19" />);
