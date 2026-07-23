export const BACKGROUND_PATTERNS = ["graph", "grid", "dots", "plain"] as const;
export const COLOR_THEMES = ["default", "charcoal", "paper", "midnight"] as const;

export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];
export type ColorTheme = (typeof COLOR_THEMES)[number];

export const DEFAULT_BACKGROUND_PATTERN: BackgroundPattern = "graph";
export const DEFAULT_COLOR_THEME: ColorTheme = "default";

export const boardThemes: Record<ColorTheme, {
  label: string;
  canvas: string;
  pattern: string;
  graphMinorPattern: string;
  defaultStroke: { r: number; g: number; b: number };
}> = {
  default: { label: "Default", canvas: "#FFFFFF", pattern: "rgba(0,0,0,0.07)", graphMinorPattern: "rgba(0,0,0,0.04)", defaultStroke: { r: 0, g: 0, b: 0 } },
  charcoal: { label: "Charcoal black", canvas: "#1E1E1E", pattern: "rgba(255,255,255,0.22)", graphMinorPattern: "rgba(255,255,255,0.13)", defaultStroke: { r: 255, g: 255, b: 255 } },
  paper: { label: "Warm paper", canvas: "#FFF7E8", pattern: "rgba(118,91,50,0.25)", graphMinorPattern: "rgba(118,91,50,0.14)", defaultStroke: { r: 0, g: 0, b: 0 } },
  midnight: { label: "Midnight blue", canvas: "#172033", pattern: "rgba(170,190,224,0.34)", graphMinorPattern: "rgba(170,190,224,0.19)", defaultStroke: { r: 255, g: 255, b: 255 } },
};

export const boardPatterns: Record<BackgroundPattern, { label: string }> = {
  graph: { label: "Graph" },
  grid: { label: "Grid" },
  dots: { label: "Dots" },
  plain: { label: "Plain" },
};

export function resolveBoardAppearance(pattern?: string | null, theme?: string | null) {
  const backgroundPattern = BACKGROUND_PATTERNS.includes(pattern as BackgroundPattern)
    ? pattern as BackgroundPattern
    : DEFAULT_BACKGROUND_PATTERN;
  const colorTheme = COLOR_THEMES.includes(theme as ColorTheme)
    ? theme as ColorTheme
    : DEFAULT_COLOR_THEME;

  return { backgroundPattern, colorTheme, theme: boardThemes[colorTheme] };
}
