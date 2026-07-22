import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Logotype } from "@/components/Logotype";
import {
  defaultLogotypeState,
  LOGOTYPE_FONTS,
  loadGoogleFont,
  type LogotypeState,
} from "@/lib/logotype";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { loadBrandMeta, saveBrandMeta, type BrandMeta } from "@/lib/brandMeta";

const supabase = _sb as any;

type Filter = "all" | "sans" | "serif" | "display" | "mono";

export default function FontExplorer() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [logoAsset, setLogoAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [brandMeta, setBrandMeta] = useState<BrandMeta>({});

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: proj }, { data: assets }] = await Promise.all([
        supabase.from("projects").select("id,name").eq("id", projectId).maybeSingle(),
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
      setBrandMeta(loadBrandMeta(projectId));
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

  const brandColor = useMemo(() => {
    const c = String(brandMeta.brand_color || "").trim();
    return /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#0A0A0A";
  }, [brandMeta]);

  useEffect(() => {
    // Pre-load all fonts we might render.
    LOGOTYPE_FONTS.forEach((f) => loadGoogleFont(f.family, f.weights));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? LOGOTYPE_FONTS : LOGOTYPE_FONTS.filter((f) => f.category === filter)),
    [filter],
  );

  const projectFont = String(brandMeta.font || "").toLowerCase();
  const currentFont = projectFont || (baseState.font || "").toLowerCase();

  const applyFont = async (family: string) => {
    if (!projectId) return;
    setApplyingKey(family);
    const next = saveBrandMeta(projectId, { font: family });
    setBrandMeta(next);
    // Update every logotype asset in this project so Logo/Icon Files, Brand Book,
    // and Social Icons all reflect the new typeface.
    try {
      const { data: allAssets } = await supabase
        .from("assets")
        .select("id,editor_state,asset_type")
        .eq("project_id", projectId);
      const updates: { id: string; editor_state: any }[] = [];
      for (const a of allAssets || []) {
        const state = a?.editor_state;
        if (!state) continue;
        if (state.kind === "logotype") {
          updates.push({ id: a.id, editor_state: { ...state, font: family } });
        } else if (Array.isArray(state)) {
          // Canvas asset: update every text element's fontFamily.
          let touched = false;
          const next = state.map((el: any) => {
            if (el && el.kind === "text") {
              touched = true;
              return { ...el, fontFamily: family };
            }
            return el;
          });
          if (touched) updates.push({ id: a.id, editor_state: next });
        }
      }
      await Promise.all(
        updates.map((u) =>
          supabase.from("assets").update({ editor_state: u.editor_state }).eq("id", u.id),
        ),
      );
      if (logoAsset?.id) {
        const nextState: LogotypeState = { ...baseState, font: family };
        setLogoAsset((prev: any) => (prev ? { ...prev, editor_state: nextState } : prev));
      }
    } catch {}
    setApplyingKey(null);
    toast({ title: `${family} applied` });
    try { window.dispatchEvent(new CustomEvent("rocket:notify", { detail: { kind: "logo_updated", projectId } })); } catch {}
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "sans", label: "Sans" },
    { key: "serif", label: "Serif" },
    { key: "display", label: "Display" },
    { key: "mono", label: "Mono" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Font Explorer</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Try your logo across curated typefaces. Apply one to update your logo.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => {
            const state: LogotypeState = { ...baseState, font: f.family, color: brandColor };
            const isCurrent = currentFont === f.family.toLowerCase();
            return (
              <div
                key={f.family}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)]"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-white px-8">
                  <Logotype state={state} fit="contain" />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">{f.family}</div>
                    <div className="text-[11px] uppercase tracking-wide text-neutral-500">{f.category}</div>
                  </div>
                  <button
                    onClick={() => applyFont(f.family)}
                    disabled={applyingKey === f.family}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      isCurrent
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {applyingKey === f.family ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isCurrent ? (
                      <><Check className="h-3.5 w-3.5" /> Applied</>
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