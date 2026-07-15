export type DesignSort = "date" | "name";
export type CollectionView = "card" | "list";

export function sortByOption<T>(
  rows: T[],
  sort: DesignSort,
  getName: (row: T) => string | null | undefined,
  getDate: (row: T) => string | null | undefined,
) {
  const list = [...rows];
  if (sort === "name") {
    list.sort((a, b) => (getName(a) || "").localeCompare(getName(b) || "", undefined, { sensitivity: "base" }));
    return list;
  }
  list.sort((a, b) => +new Date(getDate(b) || 0) - +new Date(getDate(a) || 0));
  return list;
}

export function isUploadedImageDesign(asset: any) {
  if (!asset?.image_url) return false;
  const meta = asset?.meta || {};
  return (
    meta.uploaded === true ||
    meta.source === "upload" ||
    meta.origin === "upload" ||
    meta.kind === "upload" ||
    meta.upload_source === "user"
  );
}

export function getCreatorName(asset: any, profileMap?: Record<string, string>) {
  const fromMap = profileMap?.[asset.user_id];
  if (fromMap) return fromMap;
  const metaUsername = asset?.meta?.creator_username || asset?.meta?.username;
  if (metaUsername) return metaUsername;
  return asset?.user_id ? `@${String(asset.user_id).slice(0, 8)}` : "Unknown";
}
