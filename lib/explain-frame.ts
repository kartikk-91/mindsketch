// @ts-expect-error: No types for 'dom-to-image-more'
import * as domtoimage from "dom-to-image-more";

async function inlineImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("image"));

  await Promise.all(
    images.map(async (img) => {
      const href = img.getAttribute("href");
      if (!href || href.startsWith("data:")) return;

      const res = await fetch(href);
      const blob = await res.blob();

      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      img.setAttribute("href", dataUrl);
    })
  );
}

function createExportClone(): HTMLElement | null {
  const original = document.getElementById("export-root");
  if (!original) return null;

  const clone = original.cloneNode(true) as HTMLElement;

  clone.style.position = "fixed";
  clone.style.left = "-99999px";
  clone.style.top = "0";
  clone.style.pointerEvents = "none";
  clone.style.background = "#ffffff";

  clone.querySelectorAll("foreignObject *").forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.background = "transparent";
    htmlEl.style.border = "none";
    htmlEl.style.outline = "none";
    htmlEl.style.boxShadow = "none";
    htmlEl.style.filter = "none";
  });

  document.body.appendChild(clone);
  return clone;
}


export async function getFrameBase64(): Promise<string | null> {
  const clone = createExportClone();
  if (!clone) return null;
  await inlineImages(clone);
  try {
    const dataUrl = await domtoimage.toPng(clone, {
      bgcolor: "#ffffff",
      scale: 2,
      cacheBust: true,
    });

    return dataUrl.replace(/^data:image\/png;base64,/, "");
  } catch (err) {
    console.error("Frame capture failed", err);
    return null;
  } finally {
    clone.remove();
  }
}


export async function explainCurrentFrame() {
    const frameBase64 = await getFrameBase64();
    if (!frameBase64) return null;
  
    const res = await fetch("/api/explain-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: frameBase64,
        mimeType: "image/png",
      }),
    });
  
    return res.json(); 
  }
  