import { supabase as _sb } from "@/integrations/supabase/client";

const supabase = _sb as any;

export type BrandContext = Record<string, any>;

export async function getProjectBrandContext(projectId: string): Promise<BrandContext | null> {
  const [{ data: project }, { data: designs }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", projectId).maybeSingle(),
    supabase.from("assets").select("meta").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100),
  ]);
  const contextDesign = (designs || []).find((design: any) => design?.meta?.brand_context || design?.meta?.brandContext);
  const context = contextDesign?.meta?.brand_context || contextDesign?.meta?.brandContext;
  if (context) return context;
  return project?.name ? { productName: project.name } : null;
}

export async function setProjectBrandContext(_projectId: string, ctx: BrandContext) {
  return ctx;
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
