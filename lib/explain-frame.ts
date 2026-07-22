import { captureFrame } from "@/lib/export-canvas";

const CHAT_IMAGE_LONG_SIDE = 1024;

/** Shrinks screenshots before vision analysis; OCR remains sharp while requests stay inexpensive. */
export async function compressImageForChat(dataUrl: string, maxLongSide = CHAT_IMAGE_LONG_SIDE): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (longestSide <= maxLongSide) return dataUrl;

  const scale = maxLongSide / longestSide;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
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
  const [, metadata = "", imageBase64 = ""] = compressed.match(/^data:([^;]+);base64,(.*)$/) ?? [];
  return { imageBase64, mimeType: metadata || "image/jpeg", previewUrl: compressed, name: file.name };
}

export async function getFrameBase64(): Promise<string | null> {
  const dataUrl = await captureFrame("png");
  return dataUrl?.replace(/^data:image\/png;base64,/, "") ?? null;
}

/** Lower-resolution JPEG capture for frame chat. */
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
