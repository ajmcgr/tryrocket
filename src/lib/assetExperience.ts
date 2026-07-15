// Central classifier: is this a Design (opens in graphic editor) or a Brand (opens in Brand workspace)?
export type AssetExperience = "design" | "brand";

const BRAND_TYPES = new Set<string>([
  "brand_guidelines",
  "color_system",
  "font_system",
  "typography_system",
  "brand_voice",
  "tone_of_voice",
  "messaging_framework",
  "positioning",
  "value_proposition",
  "launch_copy",
  "product_hunt_copy",
  "ph_copy",
  "social_post",
  "social_copy",
  "founder_bio",
  "company_bio",
  "press_bio",
  "website_copy",
  "email_copy",
  "brand_strategy",
  "audience_analysis",
  "copywriting_guide",
]);

const DESIGN_TYPES = new Set<string>([
  "logo",
  "logotype",
  "wordmark",
  "graphic",
  "icon",
  "icon_pack",
  "app_icon",
  "favicon",
  "photo",
  "image",
  "template",
  "social_graphic",
  "social_template",
  "social_image",
  "presentation",
  "slide",
  "banner",
  "ad_creative",
  "product_hunt_graphic",
  "launch_graphic",
  "website_graphic",
  "illustration",
  "visual_identity",
  "brand_template",
]);

export function normalizeAssetType(t?: string | null): string {
  return (t || "").toLowerCase().trim().replace(/\s+/g, "_");
}

export function getAssetExperience(asset: any): AssetExperience {
  const t = normalizeAssetType(asset?.asset_type);
  if (BRAND_TYPES.has(t)) return "brand";
  if (DESIGN_TYPES.has(t)) return "design";
  // Content-shape fallback: visual bits → design, text-only → brand
  if (asset?.image_url || asset?.editor_state || asset?.canvas_json) return "design";
  if (asset?.content || asset?.markdown) return "brand";
  return "design";
}

export function isBrandAsset(asset: any): boolean {
  return getAssetExperience(asset) === "brand";
}

export function isDesignAsset(asset: any): boolean {
  return getAssetExperience(asset) === "design";
}

export function assetHref(asset: any): string {
  if (!asset?.id) return "/assets";
  if (getAssetExperience(asset) === "brand") {
    const pid = asset.project_id ? `/${asset.project_id}` : "";
    return `/brands${pid}?asset=${asset.id}`;
  }
  return `/editor?id=${asset.id}`;
}

export function assetOpenLabel(asset: any): string {
  return getAssetExperience(asset) === "brand" ? "Open in Brand" : "Open in Editor";
}