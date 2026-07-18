// Bundle multiple assets (images + text) into one downloadable .zip.
import JSZip from "jszip";

export type ZipItem = {
  title: string;
  asset_type?: string;
  content?: string | null;
  image_url?: string | null;
};

export type ZipPackResult = {
  included: number;
  skipped: string[];
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

export async function packAssetsZip(items: ZipItem[], filename = "rocket-pack.zip"): Promise<ZipPackResult> {
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
  let included = 0;
  const skipped: string[] = [];

  for (const it of items) {
    const folder = useFolders ? `${(it.asset_type || "other").replace(/_/g, "-")}/` : "";
    const base = uniq(safe(it.title));
    if (it.image_url) {
      const got = await fetchBytes(it.image_url);
      if (got) {
        zip.file(`${folder}${base}.${got.ext}`, got.bytes);
        included += 1;
      } else {
        skipped.push(it.title || "Untitled design");
      }
    } else if (it.content) {
      zip.file(`${folder}${base}.txt`, `${it.title}\n\n${it.content}\n`);
      included += 1;
    } else {
      skipped.push(it.title || "Untitled design");
    }
  }

  if (!included) {
    throw new Error("No downloadable files were available for this kit. Add or regenerate a design, then try again.");
  }

  const readme = [
    "Rocket brand kit",
    `Generated ${new Date().toISOString()}`,
    `Included files: ${included}`,
    skipped.length ? `Could not include: ${skipped.join(", ")}` : "All selected designs were included.",
  ].join("\n");
  zip.file("README.txt", `${readme}\n`);

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  return { included, skipped };
}
