// @ts-expect-error: No types for 'dom-to-image-more'
import * as domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";


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


export async function exportFramePNG() {
  const clone = createExportClone();
  if (!clone) return;

  try {
    const dataUrl = await domtoimage.toPng(clone, {
      bgcolor: "#ffffff",
      scale: 2,
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = "mindsketch-frame.png";
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Frame export failed", err);
    alert("Export failed");
  } finally {
    clone.remove();
  }
}


export async function exportFramePDF() {
  const clone = createExportClone();
  if (!clone) return;

  try {
    const dataUrl = await domtoimage.toPng(clone, {
      bgcolor: "#ffffff",
      scale: 2,
      cacheBust: true,
    });

    const img = new Image();
    img.src = dataUrl;

    img.onload = () => {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [img.width, img.height],
      });

      pdf.addImage(img, "PNG", 0, 0, img.width, img.height);
      pdf.save("mindsketch-frame.pdf");
    };
  } catch (err) {
    console.error("Frame PDF export failed", err);
    alert("Export failed");
  } finally {
    clone.remove();
  }
}
