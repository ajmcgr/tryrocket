// Unified export pipeline. Pluggable formatters keyed by format id.
// Today: txt, md, json, html, pdf, png (image assets), jpg (image assets), svg (image wrapper).
// Tomorrow: register additional formats (eps, pptx, figma) without touching call sites.
import jsPDF from "jspdf";
import { brandGuidelinesPdf, structuredMarkdownPdf, presentationPdf } from "@/lib/exporters/pdfMultipage";
import { presentationPptx } from "@/lib/exporters/pptx";

export type ExportableAsset = {
  id: string;
  title: string;
  content?: string | null;
  image_url?: string | null;
  asset_type?: string;
};

export type ExportFormat = "txt" | "md" | "json" | "html" | "pdf" | "png" | "jpg" | "svg" | "pptx";

const safeName = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function fetchImage(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`image fetch failed (${res.status})`);
  return await res.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function rasterToFormat(srcBlob: Blob, format: "png" | "jpg"): Promise<Blob> {
  if (format === "png" && srcBlob.type === "image/png") return srcBlob;
  const dataUrl = await blobToDataUrl(srcBlob);
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("canvas blob failed")), format === "jpg" ? "image/jpeg" : "image/png", 0.95);
  });
}

async function exportImagePdf(asset: ExportableAsset): Promise<Blob> {
  if (!asset.image_url) throw new Error("no image");
  const blob = await fetchImage(asset.image_url);
  const dataUrl = await blobToDataUrl(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
  const pdf = new jsPDF({ orientation: img.width >= img.height ? "landscape" : "portrait", unit: "pt", format: [img.width, img.height] });
  pdf.addImage(dataUrl, blob.type.includes("jpeg") ? "JPEG" : "PNG", 0, 0, img.width, img.height);
  return pdf.output("blob");
}

function exportTextPdf(asset: ExportableAsset): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
  pdf.text(asset.title, margin, margin);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
  const lines = pdf.splitTextToSize(asset.content || "", width);
  let y = margin + 28;
  const lineHeight = 15;
  const pageHeight = pdf.internal.pageSize.getHeight() - margin;
  for (const line of lines) {
    if (y > pageHeight) { pdf.addPage(); y = margin; }
    pdf.text(line, margin, y);
    y += lineHeight;
  }
  return pdf.output("blob");
}

function exportHtml(asset: ExportableAsset): Blob {
  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const body = asset.image_url
    ? `<img src="${asset.image_url}" alt="${escape(asset.title)}" style="max-width:100%;height:auto;border-radius:12px"/>`
    : `<pre style="white-space:pre-wrap;font:14px/1.55 -apple-system,Segoe UI,sans-serif">${escape(asset.content || "")}</pre>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(asset.title)}</title></head><body style="margin:0;padding:32px;background:#fafafa;color:#111;font-family:-apple-system,Segoe UI,sans-serif"><h1 style="font:600 24px/1.2 -apple-system,Segoe UI,sans-serif">${escape(asset.title)}</h1>${body}</body></html>`;
  return new Blob([html], { type: "text/html" });
}

async function exportSvgWrapper(asset: ExportableAsset): Promise<Blob> {
  // Embeds the raster image inside an SVG so it can be opened by vector tools.
  // True vectorization would need potrace and isn't shipped here.
  if (!asset.image_url) throw new Error("no image");
  const blob = await fetchImage(asset.image_url);
  const dataUrl = await blobToDataUrl(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}"><image href="${dataUrl}" width="${img.width}" height="${img.height}"/></svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

export const FORMATS_FOR_TEXT: ExportFormat[] = ["txt", "md", "html", "pdf", "json"];
export const FORMATS_FOR_PRESENTATION: ExportFormat[] = ["pdf", "pptx", "md", "html", "json"];
export const FORMATS_FOR_IMAGE: ExportFormat[] = ["png", "jpg", "pdf", "svg", "html", "json"];

export const FORMAT_LABEL: Record<ExportFormat, string> = {
  txt: "Plain text (.txt)",
  md: "Markdown (.md)",
  json: "JSON (.json)",
  html: "HTML (.html)",
  pdf: "PDF (.pdf)",
  png: "PNG (.png)",
  jpg: "JPEG (.jpg)",
  svg: "SVG (.svg)",
  pptx: "PowerPoint (.pptx)",
};

export function formatsForAsset(asset: ExportableAsset): ExportFormat[] {
  if (asset.image_url) return FORMATS_FOR_IMAGE;
  if (asset.asset_type === "presentation") return FORMATS_FOR_PRESENTATION;
  return FORMATS_FOR_TEXT;
}

export async function exportAsset(asset: ExportableAsset, format: ExportFormat): Promise<void> {
  const base = safeName(asset.title);
  switch (format) {
    case "txt": {
      downloadBlob(new Blob([asset.content || ""], { type: "text/plain" }), `${base}.txt`); return;
    }
    case "md": {
      const md = `# ${asset.title}\n\n${asset.content || ""}\n`;
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${base}.md`); return;
    }
    case "json": {
      const payload = JSON.stringify({ title: asset.title, asset_type: asset.asset_type, content: asset.content || null, image_url: asset.image_url || null }, null, 2);
      downloadBlob(new Blob([payload], { type: "application/json" }), `${base}.json`); return;
    }
    case "html": {
      downloadBlob(exportHtml(asset), `${base}.html`); return;
    }
    case "pdf": {
      let blob: Blob;
      if (asset.image_url) blob = await exportImagePdf(asset);
      else if (asset.asset_type === "brand_guidelines") blob = brandGuidelinesPdf(asset.title, asset.content || "");
      else if (asset.asset_type === "presentation") blob = presentationPdf(asset.title, asset.content || "");
      else if (
        asset.asset_type === "brand_voice" ||
        asset.asset_type === "launch_copy" ||
        asset.asset_type === "product_hunt_copy" ||
        asset.asset_type === "social_post" ||
        asset.asset_type === "founder_bio" ||
        asset.asset_type === "template"
      ) {
        blob = structuredMarkdownPdf(asset.title, asset.content || "", asset.asset_type?.replace(/_/g, " "));
      } else blob = exportTextPdf(asset);
      downloadBlob(blob, `${base}.pdf`); return;
    }
    case "pptx": {
      if (asset.asset_type !== "presentation") throw new Error("PPTX only available for presentations");
      const blob = await presentationPptx(asset.title, asset.content || "");
      downloadBlob(blob, `${base}.pptx`); return;
    }
    case "png":
    case "jpg": {
      if (!asset.image_url) throw new Error("no image to export");
      const src = await fetchImage(asset.image_url);
      const out = await rasterToFormat(src, format);
      downloadBlob(out, `${base}.${format}`); return;
    }
    case "svg": {
      const blob = await exportSvgWrapper(asset);
      downloadBlob(blob, `${base}.svg`); return;
    }
  }
}
