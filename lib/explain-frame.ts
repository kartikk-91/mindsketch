import { captureFrame } from "@/lib/export-canvas";

export async function getFrameBase64(): Promise<string | null> {
  const dataUrl = await captureFrame("png");
  return dataUrl?.replace(/^data:image\/png;base64,/, "") ?? null;
}

/** Lower-resolution JPEG capture for frame chat. */
export async function getFrameForChat(): Promise<{ imageBase64: string; mimeType: string } | null> {
  const dataUrl = await captureFrame("jpeg", 0.76);
  if (!dataUrl) return null;

  return {
    imageBase64: dataUrl.replace(/^data:image\/jpeg;base64,/, ""),
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
