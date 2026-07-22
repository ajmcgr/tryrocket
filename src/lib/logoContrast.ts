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
 * Return the source image untouched. Background-keying was too aggressive and
 * ate real logo pixels, so we now trust the source PNG's alpha channel and let
 * the caller pick a light/dark tile that reads well.
 */
export async function transparentLogo(src: string): Promise<{ url: string; hasTransparency: boolean; image: HTMLImageElement }> {
  const img = await loadImage(src);
  return { url: src, hasTransparency: detectAlpha(img), image: img };
}

/**
 * Rasterize an image logo as a silhouette in `color`. If the source has no
 * meaningful alpha channel, returns the original URL — the caller should then
 * render onto a contrasting background rather than attempt an invalid recolor.
 */
export async function silhouetteImage(src: string, color: string): Promise<{ url: string; hasAlpha: boolean; image: HTMLImageElement }> {
  const img = await loadImage(src);
  const hasAlpha = detectAlpha(img);
  if (!hasAlpha) return { url: src, hasAlpha: false, image: img };
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = img.naturalWidth || img.width;
  sourceCanvas.height = img.naturalHeight || img.height;
  sourceCanvas.getContext("2d")!.drawImage(img, 0, 0);
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