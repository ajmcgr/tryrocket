import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { logotypeToSvg } from "@/components/Logotype";
import { defaultLogotypeState, type LogotypeState } from "@/lib/logotype";
import { loadBrandMeta } from "@/lib/brandMeta";
import { brandLogotypeToPng, isBrandKitLogotypeAsset, logotypeStateFromAsset } from "@/lib/brandLogoAsset";

type BrandKitDownloadArgs = {
  supabase: any;
  projectId: string;
  project?: any;
};

export type BrandKitDownloadResult = {
  included: number;
  skipped: string[];
  filename: string;
};

const LOGO_TYPES = new Set(["logo", "logotype", "wordmark", "brandmark", "icon", "app_icon", "favicon", "graphic", "photo", "image"]);

const isMissingColumnError = (error: any, column: string) => {
  const message = String(error?.message || error?.details || "").toLowerCase();
  return message.includes(column.toLowerCase()) && (
    message.includes("column") || message.includes("schema cache") || message.includes("could not find")
  );
};

const safeFile = (s: string) =>
  String(s || "file").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80).toLowerCase() || "file";

const cleanHex = (value?: string | null, fallback = "#1676e3") => {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : fallback;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type = "image/png") =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")), type);
  });

async function canvasToJpgBlob(canvas: HTMLCanvasElement, background = "#ffffff") {
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);
  return canvasToBlob(flat, "image/jpeg");
}

async function canvasToPsdBlob(canvas: HTMLCanvasElement, layerName = "Logo"): Promise<Blob> {
  const { writePsd } = await import("ag-psd");
  const bg = document.createElement("canvas");
  bg.width = canvas.width;
  bg.height = canvas.height;
  const bgCtx = bg.getContext("2d")!;
  bgCtx.fillStyle = "#ffffff";
  bgCtx.fillRect(0, 0, bg.width, bg.height);
  const psd = {
    width: canvas.width,
    height: canvas.height,
    canvas,
    children: [
      { name: "Background", canvas: bg },
      { name: layerName, canvas, left: 0, top: 0, right: canvas.width, bottom: canvas.height },
    ],
  } as any;
  const buffer = writePsd(psd);
  return new Blob([buffer], { type: "image/vnd.adobe.photoshop" });
}

function canvasToEmbeddedSvg(canvas: HTMLCanvasElement, title: string): string {
  const dataUrl = canvas.toDataURL("image/png");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><title>${title}</title><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
}

async function urlToCanvas(url: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(url);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || 1024;
  c.height = img.naturalHeight || 1024;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

async function addAllFormatsFromCanvas(
  folder: JSZip,
  folderName: string,
  base: string,
  canvas: HTMLCanvasElement,
  add: (folder: JSZip, folderName: string, name: string, data: string | Blob | ArrayBuffer) => void,
  nativeSvg?: string,
) {
  add(folder, folderName, `${base}.png`, await canvasToBlob(canvas));
  try { add(folder, folderName, `${base}.jpg`, await canvasToJpgBlob(canvas)); } catch {}
  try { add(folder, folderName, `${base}.psd`, await canvasToPsdBlob(canvas, base)); } catch {}
  const svgMarkup = nativeSvg || canvasToEmbeddedSvg(canvas, base);
  const svgBlob = () => new Blob([svgMarkup], { type: "image/svg+xml" });
  add(folder, folderName, `${base}.figma.svg`, svgBlob());
  add(folder, folderName, `${base}.sketch.svg`, svgBlob());
  add(folder, folderName, `${base}.canva.svg`, svgBlob());
}

const triggerDownload = (blob: Blob, filename: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
};

async function fetchBytes(url: string): Promise<{ bytes: ArrayBuffer; ext: string } | null> {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    const bytes = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "";
    const fromPath = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(url)?.[1]?.toLowerCase();
    const ext = ct.includes("svg") ? "svg"
      : ct.includes("jpeg") ? "jpg"
      : ct.includes("webp") ? "webp"
      : ct.includes("png") ? "png"
      : fromPath && ["svg", "jpg", "jpeg", "webp", "png"].includes(fromPath) ? (fromPath === "jpeg" ? "jpg" : fromPath)
      : "png";
    return { bytes, ext };
  } catch {
    return null;
  }
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

async function buildImageVariantBlob(url: string, variant: "regular" | "inverse" | "black") {
  const img = await loadImage(url);
  const w = img.naturalWidth || 1024;
  const h = img.naturalHeight || 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  if (variant !== "regular") {
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = variant === "inverse" ? "#ffffff" : "#000000";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }
  return canvasToBlob(canvas);
}

const stateFromAsset = (asset: any, brandName: string): LogotypeState => {
  if (isBrandKitLogotypeAsset(asset)) return logotypeStateFromAsset(asset, brandName);
  return defaultLogotypeState(brandName || asset?.title || "Brand");
};

const addCanvasExports = async (folder: JSZip, base: string, canvas: HTMLCanvasElement) => {
  let count = 0;
  const png = await canvasToBlob(canvas);
  folder.file(`${base}.png`, png);
  count += 1;
  const pdf = new jsPDF({ orientation: canvas.width >= canvas.height ? "landscape" : "portrait", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const scale = Math.min(pageW / canvas.width, pageH / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h);
  folder.file(`${base}.pdf`, pdf.output("blob") as Blob);
  count += 1;
  return count;
};

function buildPaletteCanvas(brandName: string, palette: string[], paletteName: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 58px Inter, system-ui, sans-serif";
  ctx.fillText(`${brandName} Palette`, 80, 120);
  ctx.fillStyle = "#6b7280";
  ctx.font = "400 24px Inter, system-ui, sans-serif";
  ctx.fillText(paletteName || "Brand palette", 80, 165);
  const colors = palette.length ? palette : ["#1676e3", "#0a0a0a", "#ffffff", "#f4f4f5"];
  const sw = 240;
  const sh = 360;
  const gap = 28;
  colors.slice(0, 5).forEach((color, i) => {
    const x = 80 + i * (sw + gap);
    const y = 260;
    ctx.fillStyle = cleanHex(color, "#1676e3");
    ctx.fillRect(x, y, sw, sh);
    ctx.strokeStyle = "#e5e7eb";
    ctx.strokeRect(x, y, sw, sh);
    ctx.fillStyle = "#111827";
    ctx.font = "600 22px Inter, system-ui, sans-serif";
    ctx.fillText(`Color ${i + 1}`, x, y + sh + 44);
    ctx.fillStyle = "#6b7280";
    ctx.font = "500 18px Inter, system-ui, sans-serif";
    ctx.fillText(String(color).toUpperCase(), x, y + sh + 76);
  });
  return canvas;
}

function buildFontCanvas(brandName: string, font: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 58px Inter, system-ui, sans-serif";
  ctx.fillText(`${brandName} Fonts`, 80, 120);
  ctx.fillStyle = "#6b7280";
  ctx.font = "400 24px Inter, system-ui, sans-serif";
  ctx.fillText("Primary typography specimen", 80, 165);
  const family = font || "Inter";
  ctx.fillStyle = "#0a0a0a";
  ctx.font = `700 96px "${family}", Inter, system-ui, sans-serif`;
  ctx.fillText(family, 80, 330);
  ctx.font = `400 42px "${family}", Inter, system-ui, sans-serif`;
  ctx.fillText("Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj", 80, 450);
  ctx.fillText("0123456789 — The quick brown fox", 80, 530);
  ctx.fillStyle = "#6b7280";
  ctx.font = `400 26px "${family}", Inter, system-ui, sans-serif`;
  ctx.fillText("Use this face across wordmarks, headings, and brand-led layouts.", 80, 640);
  return canvas;
}

async function buildBrandBookCanvas(brandName: string, primary: any, palette: string[], font: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 56px Inter, system-ui, sans-serif";
  ctx.fillText(brandName, 80, 140);
  ctx.fillStyle = "#6b7280";
  ctx.font = "400 22px Inter, system-ui, sans-serif";
  ctx.fillText("Brand Book", 80, 180);
  ctx.fillText(`Generated by Rocket on ${new Date().toLocaleDateString()}`, 80, 214);

  let y = 305;
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("Logo/Icon Files", 80, y);
  y += 28;
  ctx.strokeStyle = "#e5e7eb";
  ctx.strokeRect(80, y, 500, 280);
  try {
    if (isBrandKitLogotypeAsset(primary)) {
      const dataUrl = await brandLogotypeToPng(primary, stateFromAsset(primary, brandName).color || "#0a0a0a", brandName, 3);
      const img = await loadImage(dataUrl);
      const scale = Math.min(420 / img.naturalWidth, 190 / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, 80 + (500 - dw) / 2, y + (280 - dh) / 2, dw, dh);
    } else if (primary?.image_url || primary?.thumbnail_url) {
      const img = await loadImage(primary.image_url || primary.thumbnail_url);
      const scale = Math.min(420 / img.naturalWidth, 210 / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, 80 + (500 - dw) / 2, y + (280 - dh) / 2, dw, dh);
    } else {
      throw new Error("No logo");
    }
  } catch {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "400 18px Inter, system-ui, sans-serif";
    ctx.fillText("No logo preview available.", 120, y + 150);
  }
  y += 350;

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("Palette", 80, y);
  y += 26;
  const colors = palette.length ? palette : ["#1676e3", "#0a0a0a", "#ffffff", "#f4f4f5"];
  colors.slice(0, 6).forEach((color, i) => {
    const x = 80 + i * 170;
    ctx.fillStyle = cleanHex(color, "#1676e3");
    ctx.fillRect(x, y, 140, 140);
    ctx.strokeStyle = "#e5e7eb";
    ctx.strokeRect(x, y, 140, 140);
    ctx.fillStyle = "#374151";
    ctx.font = "500 18px Inter, system-ui, sans-serif";
    ctx.fillText(String(color).toUpperCase(), x, y + 168);
  });
  y += 235;

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("Fonts", 80, y);
  y += 65;
  const family = font || "Inter";
  ctx.font = `600 64px "${family}", Inter, system-ui, sans-serif`;
  ctx.fillText(family, 80, y);
  ctx.fillStyle = "#6b7280";
  ctx.font = `400 22px "${family}", Inter, system-ui, sans-serif`;
  ctx.fillText("The quick brown fox jumps over the lazy dog.", 80, y + 46);
  y += 145;

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("Usage", 80, y);
  y += 38;
  ctx.fillStyle = "#374151";
  ctx.font = "400 20px Inter, system-ui, sans-serif";
  [
    "Maintain clear space around the logo/icon file.",
    "Use inverse variants on dark or photographic backgrounds.",
    "Keep palette, typography, and logo/icon usage consistent across exports.",
  ].forEach((rule, i) => ctx.fillText(`• ${rule}`, 80, y + i * 32));
  return canvas;
}

async function loadProject(supabase: any, projectId: string, project?: any) {
  if (project?.id && project?.name) return project;
  const selects = ["id,name,brand_color,tagline", "id,name,tagline", "id,name,brand_color", "id,name"];
  for (const select of selects) {
    const result = await supabase.from("projects").select(select).eq("id", projectId).maybeSingle();
    if (!result.error) return result.data || project || { id: projectId, name: "brand-kit" };
  }
  return project || { id: projectId, name: "brand-kit" };
}

async function loadAssets(supabase: any, projectId: string) {
  const select = "id,title,asset_type,image_url,thumbnail_url,content,editor_state,meta,created_at";
  let result = await supabase
    .from("assets")
    .select(select)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);
  if (result.error && isMissingColumnError(result.error, "deleted_at")) {
    result = await supabase
      .from("assets")
      .select(select)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(300);
  }
  return (result.data || []).filter(Boolean);
}

export async function downloadCompleteBrandKit({ supabase, projectId, project }: BrandKitDownloadArgs): Promise<BrandKitDownloadResult> {
  const [loadedProject, assets] = await Promise.all([
    loadProject(supabase, projectId, project),
    loadAssets(supabase, projectId),
  ]);
  const brandName = String(loadedProject?.name || "brand-kit");
  const filename = `${safeFile(brandName)}.zip`;
  const meta = loadBrandMeta(projectId);
  const brandColor = cleanHex(meta.brand_color || loadedProject?.brand_color, "#1676e3");
  const palette = meta.palette?.length ? meta.palette.map((c) => cleanHex(c, brandColor)) : [brandColor, "#0a0a0a", "#ffffff", "#f4f4f5"];
  const font = meta.font || "Inter";
  const zip = new JSZip();
  const skipped: string[] = [];
  let included = 0;
  const usedNames = new Map<string, number>();
  const uniq = (folder: string, name: string) => {
    const key = `${folder}/${name}`;
    const count = usedNames.get(key) || 0;
    usedNames.set(key, count + 1);
    return count === 0 ? name : `${name}-${count + 1}`;
  };
  const add = (folder: JSZip, folderName: string, name: string, data: string | Blob | ArrayBuffer) => {
    folder.file(uniq(folderName, name), data);
    included += 1;
  };

  const logoAssets = assets.filter((a: any) => LOGO_TYPES.has(String(a?.asset_type || "").toLowerCase()) || isBrandKitLogotypeAsset(a) || a?.image_url || a?.thumbnail_url);
  const primary = logoAssets.find((a: any) => isBrandKitLogotypeAsset(a)) || logoAssets.find((a: any) => a?.image_url || a?.thumbnail_url) || logoAssets[0];
  const logoFolder = zip.folder("Logo-Icon Files")!;

  for (const asset of logoAssets) {
    const base = safeFile(asset.title || asset.asset_type || "logo-icon-file");
    if (isBrandKitLogotypeAsset(asset)) {
      const state = stateFromAsset(asset, brandName);
      try {
        const dataUrl = await brandLogotypeToPng(asset, state.color || "#0a0a0a", brandName, 4);
        const canvas = await urlToCanvas(dataUrl);
        const nativeSvg = asset?.editor_state?.kind === "logotype" ? logotypeToSvg(state) : undefined;
        await addAllFormatsFromCanvas(logoFolder, "Logo-Icon Files", base, canvas, add, nativeSvg);
      } catch {
        skipped.push(asset.title || "Logotype");
      }
      continue;
    }
    const url = asset.image_url || asset.thumbnail_url;
    if (!url) continue;
    try {
      const canvas = await urlToCanvas(url);
      await addAllFormatsFromCanvas(logoFolder, "Logo-Icon Files", base, canvas, add);
    } catch {
      const got = await fetchBytes(url);
      if (got) add(logoFolder, "Logo-Icon Files", `${base}.${got.ext}`, got.bytes);
      else skipped.push(asset.title || "Logo/Icon file");
    }
  }

  if (isBrandKitLogotypeAsset(primary)) {
    const base = stateFromAsset(primary, brandName);
    const variants: Array<["regular" | "inverse" | "black", string]> = [["regular", base.color || "#0a0a0a"], ["inverse", "#ffffff"], ["black", "#000000"]];
    for (const [variant, color] of variants) {
      try {
        const dataUrl = await brandLogotypeToPng(primary, color, brandName, 4);
        const canvas = await urlToCanvas(dataUrl);
        const nativeSvg = primary?.editor_state?.kind === "logotype" ? logotypeToSvg({ ...base, color }) : undefined;
        await addAllFormatsFromCanvas(logoFolder, "Logo-Icon Files", `primary-logo-${variant}`, canvas, add, nativeSvg);
      } catch {
        skipped.push(`primary logo ${variant}`);
      }
    }
  } else if (primary?.image_url || primary?.thumbnail_url) {
    const url = primary.image_url || primary.thumbnail_url;
    for (const variant of ["regular", "inverse", "black"] as const) {
      try {
        const blob = await buildImageVariantBlob(url, variant);
        const canvas = await urlToCanvas(URL.createObjectURL(blob));
        await addAllFormatsFromCanvas(logoFolder, "Logo-Icon Files", `primary-logo-${variant}`, canvas, add);
      } catch {
        skipped.push(`primary logo ${variant}`);
      }
    }
  } else {
    add(logoFolder, "Logo-Icon Files", "README.txt", "No logo/icon files are saved in this brand kit yet.\n");
  }

  const filesFolder = zip.folder("Files")!;
  for (const asset of assets.filter((a: any) => !logoAssets.some((logo: any) => logo.id === a.id))) {
    const base = safeFile(asset.title || asset.asset_type || "asset");
    const url = asset.image_url || asset.thumbnail_url;
    if (url) {
      const got = await fetchBytes(url);
      if (got) add(filesFolder, "Files", `${base}.${got.ext}`, got.bytes);
      else skipped.push(asset.title || "File");
    } else if (asset.content) {
      add(filesFolder, "Files", `${base}.txt`, `${asset.title || "File"}\n\n${asset.content}\n`);
    }
  }

  const paletteFolder = zip.folder("Palette")!;
  add(paletteFolder, "Palette", "palette.txt", [
    `${brandName} · Palette`,
    meta.palette_key ? `Name: ${meta.palette_key}` : "Name: Brand palette",
    "",
    ...palette.map((color, index) => `${index + 1}. ${color.toUpperCase()}`),
    "",
  ].join("\n"));
  try { included += await addCanvasExports(paletteFolder, "palette", buildPaletteCanvas(brandName, palette, meta.palette_key || "Brand palette")); } catch { skipped.push("palette PNG/PDF"); }

  const fontsFolder = zip.folder("Fonts")!;
  add(fontsFolder, "Fonts", "fonts.txt", `${brandName} · Fonts\n\nPrimary: ${font}\nSource: Google Fonts (https://fonts.google.com/specimen/${encodeURIComponent(font.replace(/\s+/g, "+"))})\n`);
  try { included += await addCanvasExports(fontsFolder, "font-specimen", buildFontCanvas(brandName, font)); } catch { skipped.push("font specimen PNG/PDF"); }

  const brandBookFolder = zip.folder("Brand Book")!;
  add(brandBookFolder, "Brand Book", "brand-book.md", [
    `# ${brandName} — Brand Book`,
    "",
    `Generated by Rocket on ${new Date().toLocaleDateString()}.`,
    "",
    "## Logo/Icon Files",
    logoAssets.length ? `${logoAssets.length} logo/icon source file(s) included.` : "No logo/icon files saved yet.",
    "",
    "## Palette",
    ...palette.map((color) => `- ${color.toUpperCase()}`),
    "",
    "## Fonts",
    `- ${font}`,
    "",
    "## Usage",
    "- Maintain clear space around the logo/icon file.",
    "- Use inverse variants on dark or photographic backgrounds.",
    "- Keep palette, typography, and logo/icon usage consistent across exports.",
    "",
  ].join("\n"));
  try { included += await addCanvasExports(brandBookFolder, "brand-book", await buildBrandBookCanvas(brandName, primary, palette, font)); } catch { skipped.push("brand book PNG/PDF"); }

  zip.file("README.txt", [
    `${brandName} — Rocket Brand Kit`,
    `Generated ${new Date().toISOString()}`,
    "",
    "Contents:",
    "  /Logo-Icon Files  logo/icon files as PNG, JPG, PSD, and SVG (Figma/Sketch/Canva) + regular/inverse/black variants",
    "  /Palette          palette.txt, palette.png, palette.pdf",
    "  /Fonts            fonts.txt, font-specimen.png, font-specimen.pdf",
    "  /Brand Book       brand-book.md, brand-book.png, brand-book.pdf",
    "  /Files            additional project files when available",
    skipped.length ? "" : "",
    skipped.length ? `Skipped: ${skipped.join(", ")}` : "All available brand kit sections were packed.",
    "",
  ].filter(Boolean).join("\n"));
  included += 1;

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, filename);
  return { included, skipped, filename };
}