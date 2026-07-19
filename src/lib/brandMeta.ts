// Local-only brand meta storage (font + palette) keyed by project id.
// The `projects` table has no `meta` column in this environment, so we
// persist explorer selections in localStorage as a durable fallback.

export type BrandMeta = {
  brand_color?: string;
  palette?: string[];
  palette_key?: string;
  font?: string;
};

const key = (projectId: string) => `rocket:brandmeta:${projectId}`;

export function loadBrandMeta(projectId?: string | null): BrandMeta {
  if (!projectId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key(projectId));
    return raw ? (JSON.parse(raw) as BrandMeta) : {};
  } catch {
    return {};
  }
}

export function saveBrandMeta(projectId: string, patch: BrandMeta): BrandMeta {
  const next = { ...loadBrandMeta(projectId), ...patch };
  try {
    window.localStorage.setItem(key(projectId), JSON.stringify(next));
  } catch {}
  return next;
}