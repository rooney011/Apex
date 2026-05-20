"use client";

import { ASPECT_RATIOS, type Aspect } from "./params";

/* Trigger a download for the given blob. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* Give the browser a tick to flush the download before revoking */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

/* Clone the SVG node so we don't mutate the live one. */
function cloneSvgWithDimensions(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  /* Most browsers serialize viewBox correctly, but force explicit w/h to make
     the standalone file self-contained. */
  const vb = clone.getAttribute("viewBox");
  if (vb) {
    const [, , vw, vh] = vb.split(/\s+/).map(parseFloat);
    clone.setAttribute("width", String(vw));
    clone.setAttribute("height", String(vh));
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return clone;
}

export function exportSvg(
  svg: SVGSVGElement,
  lapId: string,
  aspect: Aspect,
): void {
  const clone = cloneSvgWithDimensions(svg);
  const serialiser = new XMLSerializer();
  const xml = serialiser.serializeToString(clone);
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', xml], {
    type: "image/svg+xml;charset=utf-8",
  });
  triggerDownload(blob, `apex_${lapId}_${aspect}_${safeStamp()}.svg`);
}

export type PngResolution = 1024 | 2048 | 4096;

/* Rasterise the SVG to PNG by drawing it into an OffscreenCanvas-shaped
   <canvas> at the requested longest-edge resolution. */
export async function exportPng(
  svg: SVGSVGElement,
  lapId: string,
  aspect: Aspect,
  resolution: PngResolution,
): Promise<void> {
  const clone = cloneSvgWithDimensions(svg);
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', xml], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("SVG image failed to load"));
      img.src = url;
    });

    const { w, h } = ASPECT_RATIOS[aspect];
    const longest = Math.max(w, h);
    const k = resolution / longest;
    const outW = Math.round(w * k);
    const outH = Math.round(h * k);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D context");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, outW, outH);

    const pngBlob: Blob = await new Promise((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("canvas.toBlob returned null"))),
        "image/png",
      ),
    );

    triggerDownload(
      pngBlob,
      `apex_${lapId}_${aspect}_${resolution}_${safeStamp()}.png`,
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
