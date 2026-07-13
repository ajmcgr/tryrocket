export type DesignFolder = {
  id: string;
  name: string;
  user_id?: string;
  workspace_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function getDesignFolderId(asset: any): string | null {
  const id = asset?.meta?.folder_id;
  return typeof id === "string" && id.trim() ? id : null;
}

export function withDesignFolderId(meta: any, folderId: string | null) {
  const next = { ...(meta || {}) } as Record<string, any>;
  if (folderId) next.folder_id = folderId;
  else delete next.folder_id;
  return Object.keys(next).length ? next : null;
}
