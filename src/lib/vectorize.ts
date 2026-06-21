// Browser-side raster → SVG vectorization via potrace-wasm.
// Returns an SVG string. Lazy-loads the wasm module on first use.

let initPromise: Promise<typeof import("esm-potrace-wasm")> | null = null;
async function load() {
  if (!initPromise) {
    initPromise = import("esm-potrace-wasm").then(async (mod) => {
      await mod.init();
      return mod;
    });
  }
  return initPromise;
}

export type VectorizeOptions = {
  // Number of color levels. 2 = pure black/white tracing; higher = posterized color.
  posterizeLevel?: number;
  // Drop specks smaller than this many pixels.
  turdsize?: number;
  // Smoothness — 1 is round, 0 is sharp corners.
  alphamax?: number;
};

export async function imageUrlToSvg(url: string, opts: VectorizeOptions = {}): Promise<string> {
  const { potrace } = await load();
  // Fetch as blob to bypass CORS taint on canvas (image may be on a different origin).
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const blob = await res.blob();
  const source = await createImageBitmap(blob);
  // Downscale large images and snap dimensions to even numbers — potrace-wasm
  // throws "offset is out of bounds" on very large or odd-sized inputs.
  const MAX = 1024;
  const scale = Math.min(1, MAX / Math.max(source.width, source.height));
  const w = Math.max(2, Math.floor((source.width * scale) / 2) * 2);
  const h = Math.max(2, Math.floor((source.height * scale) / 2) * 2);
  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(w, h)
    : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = (canvas as any).getContext("2d");
  // Flatten transparency onto white so potrace has a defined background.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  const bitmap = await createImageBitmap(canvas as any);
  const svg = await potrace(bitmap, {
    turdsize: opts.turdsize ?? 2,
    turnpolicy: 4,
    alphamax: opts.alphamax ?? 1,
    opticurve: 1,
    opttolerance: 0.2,
    pathonly: false,
    extractcolors: true,
    posterizelevel: opts.posterizeLevel ?? 2,
    posterizationalgorithm: 0,
  });
  return svg as unknown as string;
}

export function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}