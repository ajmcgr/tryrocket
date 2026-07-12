import { supabase as _sb } from "@/integrations/supabase/client";

const supabase = _sb as any;

// Assets are grouped into "families" via meta.family_id / meta.parent_id.
// Legacy assets without family metadata fall back to grouping by asset_type
// within the same project.

export function assetFamilyId(asset: any): string {
  return asset?.meta?.family_id || asset?.meta?.parent_id || asset?.id;
}

export async function getSiblings(asset: any): Promise<any[]> {
  if (!asset?.project_id) return [];
  const familyId = assetFamilyId(asset);
  const { data } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", asset.project_id)
    .eq("asset_type", asset.asset_type)
    .order("created_at", { ascending: true });
  const rows = (data || []) as any[];
  const family = rows.filter(
    (r) =>
      r.id === familyId ||
      r?.meta?.family_id === familyId ||
      r?.meta?.parent_id === familyId ||
      r.id === asset.id,
  );
  return family.length ? family : rows;
}

export const ASSET_CATEGORIES = {
  brand: ["logo", "logotype", "color_system", "font_system", "brand_voice", "brand_guidelines"],
  social: ["social_post"],
  launch: ["launch_copy", "product_hunt_copy"],
  marketing: ["graphic", "icon", "photo", "template"],
  presentations: ["presentation"],
  press: ["founder_bio"],
} as const;

export type AssetCategory = keyof typeof ASSET_CATEGORIES | "other";

export function categoryOf(asset: any): AssetCategory {
  const explicit = asset?.meta?.category as AssetCategory | undefined;
  if (explicit && (explicit in ASSET_CATEGORIES || explicit === "other")) return explicit;
  const t = asset?.asset_type as string;
  for (const [cat, types] of Object.entries(ASSET_CATEGORIES)) {
    if ((types as readonly string[]).includes(t)) return cat as AssetCategory;
  }
  return "other";
}

export const CATEGORY_LABEL: Record<AssetCategory, string> = {
  brand: "Brand",
  social: "Social",
  launch: "Launch",
  marketing: "Marketing",
  presentations: "Presentations",
  press: "Press",
  other: "Other",
};