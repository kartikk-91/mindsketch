import { captureFrame } from "@/lib/export-canvas";

const CHAT_IMAGE_LONG_SIDE = 1024;
const MAX_BASE64_BYTES = 3 * 1024 * 1024;
const MIN_LONG_SIDE = 480;

function base64ByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function drawScaled(image: HTMLImageElement, longSide: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null {
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, longSide / longestSide);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

/**
 * Shrinks screenshots before vision analysis. Re-encodes as JPEG and, if the result is still
 * too large for the vision API, progressively lowers quality and then resolution until it fits.
 */
export async function compressImageForChat(dataUrl: string, maxLongSide = CHAT_IMAGE_LONG_SIDE): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  let longSide = maxLongSide;
  let quality = 0.82;
  let result = dataUrl;

  for (let attempt = 0; attempt < 6; attempt++) {
    const drawn = drawScaled(image, longSide);
    if (!drawn) return result;
    result = drawn.canvas.toDataURL("image/jpeg", quality);

    if (base64ByteLength(result) <= MAX_BASE64_BYTES) return result;

    if (quality > 0.5) {
      quality -= 0.12;
    } else if (longSide > MIN_LONG_SIDE) {
      longSide = Math.max(MIN_LONG_SIDE, Math.round(longSide * 0.75));
      quality = 0.6;
    } else {
      break;
    }
  }

  return result;
}

export async function fileToCompressedChatImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const compressed = await compressImageForChat(dataUrl);
  if (base64ByteLength(compressed) > MAX_BASE64_BYTES) {
    throw new Error("This image is too large even after compression. Please try a smaller image.");
  }
  const [, metadata = "", imageBase64 = ""] = compressed.match(/^data:([^;]+);base64,(.*)$/) ?? [];
  return { imageBase64, mimeType: metadata || "image/jpeg", previewUrl: compressed, name: file.name };
}

export async function getFrameBase64(): Promise<string | null> {
  const dataUrl = await captureFrame("png");
  return dataUrl?.replace(/^data:image\/png;base64,/, "") ?? null;
}


export async function getFrameForChat(): Promise<{ imageBase64: string; mimeType: string } | null> {
  const dataUrl = await captureFrame("jpeg", 0.76);
  if (!dataUrl) return null;

  const compressed = await compressImageForChat(dataUrl);

  return {
    imageBase64: compressed.replace(/^data:image\/jpeg;base64,/, ""),
    mimeType: "image/jpeg",
  };
}

export async function explainCurrentFrame() {
  const frameBase64 = await getFrameBase64();
  if (!frameBase64) return null;

  const response = await fetch("/api/explain-frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: frameBase64, mimeType: "image/png" }),
  });

  return response.json();
}