import { supabase as _sb } from "@/integrations/supabase/client";
import { ensureActiveWorkspaceId } from "@/lib/workspace";

const supabase = _sb as any;

export type BrandableAsset = {
  id: string;
  title?: string | null;
  project_id?: string | null;
  user_id?: string | null;
  meta?: any;
};

/** Attach an asset to an existing brand kit (project). Returns projectId. */
export async function addAssetToBrand(assetId: string, projectId: string): Promise<string> {
  const { error } = await supabase.from("assets").update({ project_id: projectId }).eq("id", assetId);
  if (error) throw error;
  return projectId;
}

/**
 * Create a new brand kit from a saved asset:
 * 1) Create a project (using asset title or fallback)
 * 2) Assign the asset to that project
 * Returns the new projectId.
 */
export async function createBrandFromAsset(
  asset: BrandableAsset,
  opts: { userId: string; name?: string } = { userId: "" },
): Promise<string> {
  const workspace_id = await ensureActiveWorkspaceId();
  const name = (opts.name || asset.title || "Untitled brand").toString().trim() || "Untitled brand";
  const row: any = { user_id: opts.userId, name };
  if (workspace_id) row.workspace_id = workspace_id;
  const { data, error } = await supabase.from("projects").insert(row).select("id").single();
  if (error || !data) throw error || new Error("Failed to create brand");
  await addAssetToBrand(asset.id, data.id);
  return data.id as string;
}

/** Fetch brand kits (projects) for the current user & active workspace. */
export async function listBrandKits(userId: string): Promise<Array<{ id: string; name: string }>> {
  const workspace_id = await ensureActiveWorkspaceId();
  let q = supabase.from("projects").select("id,name,created_at").eq("user_id", userId);
  if (workspace_id) q = q.eq("workspace_id", workspace_id);
  const { data } = await q.order("created_at", { ascending: false }).limit(100);
  return (data || []) as Array<{ id: string; name: string }>;
}