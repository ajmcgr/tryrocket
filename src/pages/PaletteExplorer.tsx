import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Logotype } from "@/components/Logotype";
import { defaultLogotypeState, type LogotypeState } from "@/lib/logotype";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ProjectNavigation from "@/components/ProjectNavigation";

const supabase = _sb as any;

type Palette = {
  key: string;
  name: string;
  colors: [string, string, string, string]; // bg, logo/fg, accent1, accent2
};

const PALETTES: Palette[] = [
  { key: "ink",       name: "Ink",       colors: ["#0A0A0A", "#FFFFFF", "#3B82F6", "#F59E0B"] },
  { key: "paper",     name: "Paper",     colors: ["#FFFFFF", "#0A0A0A", "#2563EB", "#EA580C"] },
  { key: "cobalt",    name: "Cobalt",    colors: ["#1E3A8A", "#FFFFFF", "#38BDF8", "#F472B6"] },
  { key: "forest",    name: "Forest",    colors: ["#064E3B", "#FFFFFF", "#34D399", "#FBBF24"] },
  { key: "amber",     name: "Amber",     colors: ["#78350F", "#FFF7ED", "#F59E0B", "#EF4444"] },
  { key: "rose",      name: "Rose",      colors: ["#881337", "#FFF1F2", "#FB7185", "#F472B6"] },
  { key: "violet",    name: "Violet",    colors: ["#4C1D95", "#FFFFFF", "#A78BFA", "#F0ABFC"] },
  { key: "sand",      name: "Sand",      colors: ["#F5F1EA", "#111827", "#B45309", "#065F46"] },
  { key: "mint",      name: "Mint",      colors: ["#ECFDF5", "#064E3B", "#10B981", "#0EA5E9"] },
  { key: "sky",       name: "Sky",       colors: ["#EFF6FF", "#0C4A6E", "#0EA5E9", "#F97316"] },
  { key: "coal",      name: "Coal",      colors: ["#111827", "#F9FAFB", "#F59E0B", "#22D3EE"] },
  { key: "lilac",     name: "Lilac",     colors: ["#F5F3FF", "#3B0764", "#8B5CF6", "#EC4899"] },
  { key: "espresso",  name: "Espresso",  colors: ["#3F2A1D", "#FBEEDF", "#D97706", "#84CC16"] },
  { key: "arctic",    name: "Arctic",    colors: ["#F8FAFC", "#0F172A", "#1E293B", "#0EA5E9"] },
  { key: "sunset",    name: "Sunset",    colors: ["#7C2D12", "#FFEDD5", "#F97316", "#DB2777"] },
  { key: "matcha",    name: "Matcha",    colors: ["#F0FDF4", "#14532D", "#65A30D", "#F59E0B"] },
];

export default function PaletteExplorer() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [logoAsset, setLogoAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: proj }, { data: assets }] = await Promise.all([
        supabase.from("projects").select("id,name,brand_color").eq("id", projectId).maybeSingle(),
        supabase
          .from("assets")
          .select("id,title,asset_type,editor_state,created_at")
          .eq("project_id", projectId)
          .in("asset_type", ["logo", "logotype", "wordmark"])
          .order("created_at", { ascending: true })
          .limit(20),
      ]);
      if (cancelled) return;
      setProject(proj || null);
      const withState = (assets || []).find((a: any) => a.editor_state?.kind === "logotype");
      setLogoAsset(withState || (assets || [])[0] || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const baseState = useMemo<LogotypeState>(() => {
    if (logoAsset?.editor_state?.kind === "logotype") return logoAsset.editor_state as LogotypeState;
    return defaultLogotypeState(project?.name || "Brand");
  }, [logoAsset, project]);

  const applyPalette = async (p: Palette) => {
    if (!projectId) return;
    setApplyingKey(p.key);
    const brand = p.colors[2] || p.colors[1];
    const { error } = await supabase.from("projects").update({ brand_color: brand }).eq("id", projectId);
    setApplyingKey(null);
    if (error) {
      toast({ title: "Failed to apply", description: error.message, variant: "destructive" });
      return;
    }
    setProject((prev: any) => (prev ? { ...prev, brand_color: brand } : prev));
    toast({ title: `${p.name} palette applied`, description: `Brand color set to ${brand}.` });
    try { window.dispatchEvent(new CustomEvent("rocket:notify", { detail: { kind: "brand_updated", projectId } })); } catch {}
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        {projectId ? (
          <Link
            to={`/projects/${projectId}/hub`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50"
            aria-label="Back to brand kit"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        ) : null}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Palette Explorer</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Try your logo in a range of curated palettes. Apply one to set it as your brand color.
          </p>
        </div>
      </div>

      {projectId ? (
        <div className="mb-6">
          <ProjectNavigation projectId={projectId} active="downloads" />
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTES.map((p) => {
            const [bg, fg, accent, accent2] = p.colors;
            const isCurrent = (project?.brand_color || "").toLowerCase() === accent.toLowerCase();
            const state: LogotypeState = { ...baseState, color: fg };
            return (
              <div
                key={p.key}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)]"
              >
                <div className="flex aspect-[4/3] items-center justify-center px-8" style={{ backgroundColor: bg }}>
                  <Logotype state={state} fit="contain" />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-900">{p.name}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {p.colors.map((c) => (
                        <span
                          key={c}
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => applyPalette(p)}
                    disabled={applyingKey === p.key}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      isCurrent
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {applyingKey === p.key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isCurrent ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Applied
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}