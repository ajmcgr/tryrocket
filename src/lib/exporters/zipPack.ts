// Bundle multiple assets (images + text) into one downloadable .zip.
import JSZip from "jszip";

export type ZipItem = {
  title: string;
  asset_type?: string;
  content?: string | null;
  image_url?: string | null;
};

const safe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "asset";

async function fetchBytes(url: string): Promise<{ bytes: ArrayBuffer; ext: string } | null> {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    const bytes = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "";
    const ext = ct.includes("jpeg") ? "jpg" : ct.includes("png") ? "png" : ct.includes("svg") ? "svg" : ct.includes("webp") ? "webp" : "png";
    return { bytes, ext };
  } catch { return null; }
}

export async function packAssetsZip(items: ZipItem[], filename = "rocket-pack.zip"): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Map<string, number>();
  const uniq = (name: string) => {
    const n = usedNames.get(name) || 0;
    usedNames.set(name, n + 1);
    return n === 0 ? name : `${name}-${n + 1}`;
  };

  // group folders by asset_type when there's a mix
  const types = new Set(items.map((i) => i.asset_type || "other"));
  const useFolders = types.size > 1;

  for (const it of items) {
    const folder = useFolders ? `${(it.asset_type || "other").replace(/_/g, "-")}/` : "";
    const base = uniq(safe(it.title));
    if (it.image_url) {
      const got = await fetchBytes(it.image_url);
      if (got) zip.file(`${folder}${base}.${got.ext}`, got.bytes);
    } else if (it.content) {
      zip.file(`${folder}${base}.md`, `# ${it.title}\n\n${it.content}\n`);
    }
  }

  zip.file("README.txt", `Rocket asset pack\nGenerated ${new Date().toISOString()}\nItems: ${items.length}\n`);

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}