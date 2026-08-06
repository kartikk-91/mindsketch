import * as domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";

type ExportFormat = "png" | "jpeg";

const EXPORT_PADDING = 48;

async function inlineImages(root: SVGSVGElement) {
  const images = Array.from(root.querySelectorAll("image"));

  await Promise.all(images.map(async (image) => {
    const href = image.getAttribute("href");
    if (!href || href.startsWith("data:")) return;

    try {
      const response = await fetch(href, { mode: "cors" });
      if (!response.ok) return;
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      image.setAttribute("href", dataUrl);
    } catch {
    }
  }));
}

function getVisibleContentBounds(sourceLayers: SVGGElement): DOMRect | null {
  const matrix = sourceLayers.getScreenCTM();
  if (!matrix) return null;

  const inverse = matrix.inverse();
  const point = new DOMPoint();
  const boxes = Array.from(sourceLayers.children)
    .map((element) => element.getBoundingClientRect())
    .filter((box) => box.width > 0 || box.height > 0);

  if (!boxes.length) return null;

  const coordinates = boxes.flatMap((box) => [
    [box.left, box.top],
    [box.right, box.top],
    [box.right, box.bottom],
    [box.left, box.bottom],
  ].map(([x, y]) => {
    point.x = x;
    point.y = y;
    return point.matrixTransform(inverse);
  }));

  const xs = coordinates.map((coordinate) => coordinate.x);
  const ys = coordinates.map((coordinate) => coordinate.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);

  return new DOMRect(left, top, right - left, bottom - top);
}

/** Replace HTML shape labels with SVG text in the export clone.
 * `foreignObject` layout is the source of the nested borders/scroll artifacts in PNG exports. */
function flattenShapeLabelsForExport(layers: SVGGElement) {
  const namespace = "http://www.w3.org/2000/svg";
  layers.querySelectorAll<SVGForeignObjectElement>("foreignObject[data-export-shape-text]").forEach((foreignObject) => {
    const label = foreignObject.textContent?.replace(/\s+/g, " ").trim();
    if (!label) {
      foreignObject.remove();
      return;
    }
    const x = Number(foreignObject.getAttribute("x") ?? 0);
    const y = Number(foreignObject.getAttribute("y") ?? 0);
    const width = Number(foreignObject.getAttribute("width") ?? 0);
    const height = Number(foreignObject.getAttribute("height") ?? 0);
    const htmlLabel = foreignObject.querySelector<HTMLElement>("div, textarea, span");
    const fontSize = Number.parseFloat(htmlLabel?.style.fontSize || "14") || 14;
    const color = htmlLabel?.style.color || "#181C31";
    const text = document.createElementNS(namespace, "text");
    text.setAttribute("x", String(x + width / 2));
    text.setAttribute("y", String(y + height / 2));
    text.setAttribute("fill", color);
    text.setAttribute("font-family", htmlLabel?.style.fontFamily || "Inter, Arial, sans-serif");
    text.setAttribute("font-size", String(fontSize));
    text.setAttribute("font-weight", htmlLabel?.style.fontWeight || "500");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("pointer-events", "none");
    const words = label.split(" ");
    const maxChars = Math.max(8, Math.floor(width / Math.max(fontSize * 0.56, 1)));
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) { lines.push(line); line = word; }
      else line = candidate;
    });
    if (line) lines.push(line);
    const visibleLines = lines.slice(0, Math.max(1, Math.floor(height / (fontSize * 1.25))));
    visibleLines.forEach((value, index) => {
      const tspan = document.createElementNS(namespace, "tspan");
      tspan.setAttribute("x", String(x + width / 2));
      tspan.setAttribute("dy", index === 0 ? String(-(visibleLines.length - 1) * fontSize * 0.62) : String(fontSize * 1.25));
      tspan.textContent = value;
      text.appendChild(tspan);
    });
    foreignObject.replaceWith(text);
  });
}

function createExportSvg(): { root: HTMLDivElement; svg: SVGSVGElement; width: number; height: number } | null {
  const sourceLayers = document.getElementById("export-layers") as SVGGElement | null;
  if (!sourceLayers) return null;

  const bounds = getVisibleContentBounds(sourceLayers);

  if (!bounds || !bounds.width || !bounds.height) return null;

  const x = Math.floor(bounds.x - EXPORT_PADDING);
  const y = Math.floor(bounds.y - EXPORT_PADDING);
  const width = Math.ceil(bounds.width + EXPORT_PADDING * 2);
  const height = Math.ceil(bounds.height + EXPORT_PADDING * 2);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
  svg.setAttribute("aria-hidden", "true");
  svg.style.display = "block";
  svg.style.background = "#ffffff";
  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.left = "-100000px";
  root.style.top = "0";
  root.style.width = `${width}px`;
  root.style.height = `${height}px`;
  root.style.pointerEvents = "none";
  root.style.background = "#ffffff";

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", String(x));
  background.setAttribute("y", String(y));
  background.setAttribute("width", String(width));
  background.setAttribute("height", String(height));
  background.setAttribute("fill", "#ffffff");
  svg.appendChild(background);

  const layers = sourceLayers.cloneNode(true) as SVGGElement;
  layers.removeAttribute("id");
  layers.querySelectorAll("[data-export-exclude], [data-export-decorative]").forEach((element) => element.remove());
  layers.querySelectorAll<SVGElement>("[data-export-stroke]").forEach((element) => {
    const stroke = element.dataset.exportStroke;
    if (stroke === "none") element.removeAttribute("stroke");
    else if (stroke) element.setAttribute("stroke", stroke);
  });
  layers.querySelectorAll<HTMLElement>("[data-export-selected]").forEach((element) => {
    element.style.outline = "none";
  });

  flattenShapeLabelsForExport(layers);
  layers.querySelectorAll<SVGElement>("foreignObject").forEach((element) => {
    element.style.outline = "none";
    element.style.border = "none";
    element.style.overflow = "visible";
  });
  layers.querySelectorAll<HTMLElement>("[contenteditable]").forEach((element) => {
    element.style.overflow = "hidden";
    element.style.overflowY = "hidden";
    element.style.outline = "none";
    element.style.border = "none";
  });
  layers.querySelectorAll<HTMLElement>("[data-export-note]").forEach((element) => {
    element.style.outline = "none";
    element.style.border = "none";
  });
  layers.querySelectorAll<SVGElement>("[data-export-shape-text]").forEach((element) => {
    element.style.outline = "none";
    element.style.border = "none";
    element.style.overflow = "hidden";
  });
  layers.querySelectorAll(".drop-shadow-md").forEach((element) => element.classList.remove("drop-shadow-md"));
  layers.querySelectorAll("*").forEach((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.filter = "none";
    htmlElement.style.boxShadow = "none";
    htmlElement.style.outline = "none";
    htmlElement.style.caretColor = "transparent";
    if (htmlElement.getAttribute("contenteditable") === "true") {
      htmlElement.setAttribute("contenteditable", "false");
    }
  });

  svg.appendChild(layers);
  root.appendChild(svg);
  document.body.appendChild(root);
  return { root, svg, width, height };
}

export async function captureFrame(format: ExportFormat, quality?: number): Promise<string | null> {
  const capture = createExportSvg();
  if (!capture) return null;

  try {
    await inlineImages(capture.svg);
    const options = {
      bgcolor: "#ffffff",
      width: capture.width,
      height: capture.height,
      scale: 2,
      cacheBust: true,
    };
    return format === "png"
      ? await domtoimage.toPng(capture.root, options)
      : await domtoimage.toJpeg(capture.root, { ...options, quality: quality ?? 0.82 });
  } catch (error) {
    console.error("Frame export failed", error);
    return null;
  } finally {
    capture.root.remove();
  }
}

export async function exportFramePNG() {
  const dataUrl = await captureFrame("png");
  if (!dataUrl) throw new Error("No board content available to export");

  const link = document.createElement("a");
  link.download = "mindsketch-board.png";
  link.href = dataUrl;
  link.click();
}

export async function exportFramePDF() {
  const dataUrl = await captureFrame("png");
  if (!dataUrl) throw new Error("No board content available to export");

  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const pdf = new jsPDF({
    orientation: image.width > image.height ? "landscape" : "portrait",
    unit: "px",
    format: [image.width, image.height],
  });
  pdf.addImage(image, "PNG", 0, 0, image.width, image.height);
  pdf.save("mindsketch-board.pdf");
}


/**
 * Agent-optimized export with dynamic scaling for efficient API transmission.
 * Reduces image size from 5-10MB to 100-300KB while maintaining vision quality.
 */
export async function captureFrameForAgent(
  format: ExportFormat = "jpeg",
  maxDimension: number = 1024
): Promise<string | null> {
  const capture = createExportSvg();
  if (!capture) return null;
  const scale = Math.min(1, maxDimension / Math.max(capture.width, capture.height));

  try {
    await inlineImages(capture.svg);
    const options = {
      bgcolor: "#ffffff",
      width: capture.width,
      height: capture.height,
      scale: scale, // Dynamic scale instead of hardcoded 2
      cacheBust: true,
    };
    return format === "png"
      ? await domtoimage.toPng(capture.root, options)
      : await domtoimage.toJpeg(capture.root, { ...options, quality: 0.7 });
  } catch (error) {
    console.error("Agent frame export failed", error);
    return null;
  } finally {
    capture.root.remove();
  }
}
