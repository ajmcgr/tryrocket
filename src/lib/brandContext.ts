import { supabase as _sb } from "@/integrations/supabase/client";

const supabase = _sb as any;

export type BrandContext = Record<string, any>;

export async function getProjectBrandContext(projectId: string): Promise<BrandContext | null> {
  const { data } = await supabase
    .from("projects")
    .select("brand_context, source_url, name")
    .eq("id", projectId)
    .maybeSingle();
  if (!data) return null;
  return (
    data.brand_context ||
    (data.source_url ? { url: data.source_url, productName: data.name } : null)
  );
}

export async function setProjectBrandContext(projectId: string, ctx: BrandContext) {
  await supabase
    .from("projects")
    .update({ brand_context: ctx, source_url: ctx?.url || null })
    .eq("id", projectId);
}

export async function refreshBrandContext(projectId: string, url: string): Promise<BrandContext | null> {
  try {
    const { data } = await supabase.functions.invoke("scrape-url", { body: { url } });
    const ctx = (data as any)?.context || (data as any) || null;
    if (ctx) await setProjectBrandContext(projectId, ctx);
    return ctx;
  } catch {
    return null;
  }
}