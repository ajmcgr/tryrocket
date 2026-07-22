// Shared helpers for choosing the most legible logo variant for a given
// background, and for rasterizing image logos (with alpha) into black or
// white silhouettes so the correct variant is rendered automatically.

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = String(hex || "").trim().replace(/^#/, "");
  const s = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const m = /^([a-f0-9]{6})([a-f0-9]{2})?$/i.exec(s);
  if (!m) return { r: 10, g: 10, b: 10 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Relative luminance per WCAG (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function isDarkBg(hex: string): boolean {
  return luminance(hex) < 0.5;
}

/**
 * Pick the most legible logo fill for a background — always the ink or paper
 * that gives the strongest contrast. Never returns a low-contrast option.
 */
export function pickLogoColor(bg: string, opts?: { ink?: string; paper?: string }): string {
  const ink = opts?.ink || "#0A0A0A";
  const paper = opts?.paper || "#FFFFFF";
  return isDarkBg(bg) ? paper : ink;
}

/** Which named variant should render on the given background. */
export type LogoVariantKey = "black" | "white";
export function pickLogoVariant(bg: string): LogoVariantKey {
  return isDarkBg(bg) ? "white" : "black";
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load logo image"));
    img.src = src;
  });
  return img;
}

function detectAlpha(img: HTMLImageElement): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) transparent++;
      if (transparent > 20) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * If a raster logo ships with a solid near-white background (very common for
 * generated PNGs / JPEGs), punch that background out into real transparency so
 * the logo can sit cleanly on any color surface. Uses a flood-fill from the
 * four corners so only *background* whites are removed — internal white pixels
 * inside the mark itself are preserved.
 */
function keyOutBackground(img: HTMLImageElement): { canvas: HTMLCanvasElement; changed: boolean } {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = img.naturalWidth || img.width);
  const h = (canvas.height = img.naturalHeight || img.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const isBg = (i: number) => {
    // Near-white AND currently opaque.
    return data[i] >= 240 && data[i + 1] >= 240 && data[i + 2] >= 240 && data[i + 3] >= 240;
  };
  // Flood fill from every border pixel.
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = (y * w + x) * 4;
    if (data[idx + 3] === 0) return;
    if (!isBg(idx)) return;
    stack.push(x, y);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  let changed = false;
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const idx = (y * w + x) * 4;
    if (data[idx + 3] === 0) continue;
    if (!isBg(idx)) continue;
    data[idx + 3] = 0;
    changed = true;
    if (x > 0) stack.push(x - 1, y);
    if (x < w - 1) stack.push(x + 1, y);
    if (y > 0) stack.push(x, y - 1);
    if (y < h - 1) stack.push(x, y + 1);
  }
  if (changed) ctx.putImageData(image, 0, 0);
  return { canvas, changed };
}

/**
 * Return a transparent-background version of the source image, whether it
 * already had alpha or shipped with a solid white background. Falls back to
 * the original URL if nothing could be stripped (e.g. photographic logos).
 */
export async function transparentLogo(src: string): Promise<{ url: string; hasTransparency: boolean; image: HTMLImageElement }> {
  const img = await loadImage(src);
  if (detectAlpha(img)) return { url: src, hasTransparency: true, image: img };
  const { canvas, changed } = keyOutBackground(img);
  if (!changed) return { url: src, hasTransparency: false, image: img };
  return { url: canvas.toDataURL("image/png"), hasTransparency: true, image: img };
}

/**
 * Rasterize an image logo as a silhouette in `color`. If the source has no
 * meaningful alpha channel, returns the original URL — the caller should then
 * render onto a contrasting background rather than attempt an invalid recolor.
 */
export async function silhouetteImage(src: string, color: string): Promise<{ url: string; hasAlpha: boolean; image: HTMLImageElement }> {
  const img = await loadImage(src);
  // Start from a version with a proper alpha channel — either native or
  // background-keyed — so silhouettes work on solid-white PNGs too.
  let sourceCanvas: HTMLCanvasElement;
  let hasAlpha = detectAlpha(img);
  if (hasAlpha) {
    sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = img.naturalWidth || img.width;
    sourceCanvas.height = img.naturalHeight || img.height;
    sourceCanvas.getContext("2d")!.drawImage(img, 0, 0);
  } else {
    const keyed = keyOutBackground(img);
    if (!keyed.changed) return { url: src, hasAlpha: false, image: img };
    sourceCanvas = keyed.canvas;
    hasAlpha = true;
  }
  const out = document.createElement("canvas");
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  return { url: out.toDataURL("image/png"), hasAlpha: true, image: img };
}