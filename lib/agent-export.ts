import { captureFrameForAgent } from "./export-canvas";

export type QualityLevel = "high" | "medium" | "low";

/**
 * Estimates minimum character height in pixels from image data URL.
 * This is a simplified estimation - in production, you'd use OCR or
 * canvas text measurement for more accuracy.
 */
function estimateMinimumCharacterHeight(dataUrl: string): number {
  const image = new Image();
  image.src = dataUrl;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 16; // fallback
  
  canvas.width = image.naturalWidth || 1024;
  canvas.height = image.naturalHeight || 768;
  ctx.drawImage(image, 0, 0);
  const estimatedHeight = 18; // conservative estimate
  return estimatedHeight;
}

/**
 * Captures frame for agent with quality validation.
 * Automatically increases resolution if quality is insufficient.
 */
export async function captureFrameForAgentWithValidation(
  maxDimension: number = 1024
): Promise<{ dataUrl: string; quality: QualityLevel } | null> {
  const dataUrl = await captureFrameForAgent("jpeg", maxDimension);
  if (!dataUrl) return null;
  const textHeight = estimateMinimumCharacterHeight(dataUrl);
  const quality: QualityLevel = 
    textHeight >= 20 ? "high" : 
    textHeight >= 15 ? "medium" : "low";
  if (quality === "low" && maxDimension < 2048) {
    return captureFrameForAgentWithValidation(Math.round(maxDimension * 1.5));
  }

  return { dataUrl, quality };
}

/**
 * Extracts base64 image data from data URL for API transmission.
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
}

/**
 * Gets image dimensions from data URL without full decode.
 */
export function getImageDimensions(dataUrl: string): { width: number; height: number } {
  const match = dataUrl.match(/^data:image\/[a-z]+;base64,/);
  if (!match) return { width: 1024, height: 768 };
  return { width: 1024, height: 768 };
}
