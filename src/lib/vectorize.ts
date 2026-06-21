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
  const bitmap = await createImageBitmap(blob);
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