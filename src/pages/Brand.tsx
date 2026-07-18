import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BrandContextStrip from "@/components/BrandContextStrip";
import VariationStrip from "@/components/studio/VariationStrip";
import RightInspector from "@/components/studio/RightInspector";
import BrandDocument from "@/components/brand/BrandDocument";
import BrandCategoryNav from "@/components/brand/BrandCategoryNav";
import ProjectNavigation from "@/components/ProjectNavigation";
import { getProjectBrandContext, refreshBrandContext } from "@/lib/brandContext";
import { getActiveWorkspaceIdSync } from "@/lib/workspace";
import { handleAiError } from "@/lib/aiErrors";
import { isBrandAsset } from "@/lib/assetExperience";

const supabase = _sb as any;

function inferBrandAssetType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/(color|palette)/.test(p)) return "color_system";
  if (/(font|typograph)/.test(p)) return "font_system";
  if (/(voice|tone)/.test(p)) return "brand_voice";
  if (/(guideline|brand book)/.test(p)) return "brand_guidelines";
  if (/(product hunt|ph launch)/.test(p)) return "product_hunt_copy";
  if (/(launch copy|announcement)/.test(p)) return "launch_copy";
  if (/(tweet|thread|linkedin|social)/.test(p)) return "social_post";
  if (/(founder bio|bio)/.test(p)) return "founder_bio";
  if (/(positioning|value prop)/.test(p)) return "positioning";
  return "brand_guidelines";
}

export default function Brand() {
  const { id: projectId } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  // No project selected → send user to the cross-project Brand hub
  if (!projectId) return <Navigate to="/brands" replace />;

  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [ctx, setCtx] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const brandAssets = useMemo(() => assets.filter(isBrandAsset), [assets]);
  const activeId = params.get("asset") || undefined;
  const activeCategory = params.get("cat") || null;
  const searchQ = params.get("q") || "";
  const filteredAssets = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return brandAssets.filter((a) => {
      if (activeCategory && a.asset_type !== activeCategory) return false;
      if (!q) return true;
      return (
        (a.title || "").toLowerCase().includes(q) ||
        (a.content || "").toLowerCase().includes(q)
      );
    });
  }, [brandAssets, activeCategory, searchQ]);
  const active = useMemo(
    () => filteredAssets.find((a) => a.id === activeId) || filteredAssets[0] || null,
    [filteredAssets, activeId],
  );

  const variations = useMemo(() => {
    if (!active) return [] as any[];
    return brandAssets.filter((a) => a.asset_type === active.asset_type);
  }, [brandAssets, active]);

  const selectCategory = (type: string | null) => {
    const next = new URLSearchParams(params);
    if (type) next.set("cat", type);
    else next.delete("cat");
    next.delete("asset");
    setParams(next, { replace: true });
  };

  const setSearch = (q: string) => {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    next.delete("asset");
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    if (!projectId || !user) return;
    const [p, a, c] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase
        .from("assets")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      getProjectBrandContext(projectId),
    ]);
    setProject(p.data);
    setAssets(a.data || []);
    setCtx(c);
  }, [projectId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectAsset = (a: any) => {
    const next = new URLSearchParams(params);
    next.set("asset", a.id);
    setParams(next, { replace: true });
  };

  const handleRefreshCtx = async () => {
    if (!ctx?.url || !projectId) return;
    setRefreshing(true);
    const next = await refreshBrandContext(projectId, ctx.url);
    if (next) setCtx(next);
    setRefreshing(false);
  };

  const handleSend = async (prompt: string) => {
    if (!projectId) return;
    setBusy(true);
    try {
      const asset_type = inferBrandAssetType(prompt);
      const { data, error } = await supabase.functions.invoke("generate-asset", {
        body: {
          prompt,
          asset_type,
          project_id: projectId,
          brand_context: ctx || undefined,
          workspace_id: getActiveWorkspaceIdSync() ?? undefined,
        },
      });
      const d: any = data;
      const aiErr = handleAiError(d, error, toast);
      if (aiErr) throw new Error(aiErr.message);
      if (d?.refused) throw new Error(d.message || "Refused");
      window.dispatchEvent(new Event("credits:refresh"));
      await load();
      const newId = d?.asset_ids?.[0];
      if (newId) {
        const next = new URLSearchParams(params);
        next.set("asset", newId);
        setParams(next, { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVariation = async () => {
    if (!active) return;
    await handleSend(
      `Create another variation of "${active.title || active.asset_type}", keep the same creative direction.`,
    );
  };

  const handleDuplicate = async () => {
    if (!active || !projectId) return;
    const { data, error } = await supabase
      .from("assets")
      .insert({
        user_id: user!.id,
        project_id: projectId,
        asset_type: active.asset_type,
        title: `${active.title || active.asset_type} (copy)`,
        prompt: active.prompt,
        content: active.content,
        image_url: active.image_url,
        editor_state: active.editor_state,
        source_url: active.source_url,
        meta: {
          ...(active.meta || {}),
          parent_id: active.id,
          family_id: active.meta?.family_id || active.id,
        },
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Duplicate failed", description: error.message, variant: "destructive" });
      return;
    }
    await load();
    const next = new URLSearchParams(params);
    next.set("asset", (data as any).id);
    setParams(next, { replace: true });
  };

  // Brand documents export as copyable plain text.
  const handleExport = async () => {
    if (!active) return;
    const text = String(active.content || "").trim();
    if (!text) {
      toast({ title: "Nothing to export", description: "This brand asset has no text content yet." });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: `${active.title || active.asset_type} is ready to paste anywhere.` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (!project) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden bg-neutral-50">
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-neutral-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to={`/projects/${projectId}`}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Project
            </Link>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Brand Workspace
              </div>
              <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
            </div>
          </div>
        </div>
        <ProjectNavigation projectId={projectId} active="brand" />
        <div className="space-y-6 px-6 py-6">
          {ctx && (
            <BrandContextStrip ctx={ctx} onRefresh={handleRefreshCtx} refreshing={refreshing} />
          )}
          {brandAssets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Brand</div>
              <h2 className="mt-1 text-lg font-semibold">No brand assets yet</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Brand guidelines, voice, colors, fonts, launch copy and bios will live here.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {[
                  { label: "Brand guidelines", prompt: `Draft brand guidelines for ${project.name}.` },
                  { label: "Brand voice", prompt: `Define the brand voice and tone for ${project.name}.` },
                  { label: "Color system", prompt: `Design a color system (primary, secondary, accent, neutrals) for ${project.name}.` },
                  { label: "Font system", prompt: `Recommend a typography system for ${project.name}.` },
                  { label: "Positioning", prompt: `Write a positioning statement for ${project.name}.` },
                  { label: "Launch copy", prompt: `Write launch announcement copy for ${project.name}.` },
                  { label: "Product Hunt", prompt: `Write a Product Hunt launch post for ${project.name}.` },
                  { label: "Founder bio", prompt: `Write a founder bio for ${project.name}.` },
                ].map((s) => (
                  <button
                    key={s.label}
                    disabled={busy}
                    onClick={() => void handleSend(s.prompt)}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-3">
                <input
                  value={searchQ}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brand…"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-neutral-400"
                />
                <BrandCategoryNav
                  assets={brandAssets}
                  activeType={activeCategory}
                  onSelect={selectCategory}
                />
              </div>
              <div className="space-y-6">
                <BrandDocument
                  asset={active}
                  onSaved={load}
                  onVariation={active ? handleVariation : undefined}
                  onDuplicate={active ? handleDuplicate : undefined}
                  onExport={active ? handleExport : undefined}
                />
                <VariationStrip
                  variations={variations}
                  activeId={active?.id}
                  onSelect={selectAsset}
                  onCreate={active ? handleVariation : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <RightInspector asset={active} />
    </div>
  );
}
