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
