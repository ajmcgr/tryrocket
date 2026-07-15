import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isBrandAsset, normalizeAssetType } from "@/lib/assetExperience";
import BrandCover from "@/components/brand/BrandCover";
import { ArrowRight, Plus, Sparkles } from "lucide-react";

const supabase = _sb as any;

type Category = { key: string; label: string; types: string[] };

const CATEGORIES: Category[] = [
  { key: "guidelines", label: "Guidelines", types: ["brand_guidelines"] },
  { key: "logos", label: "Logos", types: ["logo", "logotype", "wordmark"] }, // shown as "quick link" tile
  { key: "colors", label: "Colors", types: ["color_system"] },
  { key: "fonts", label: "Fonts", types: ["font_system", "typography_system"] },
  { key: "voice", label: "Brand voice", types: ["brand_voice", "tone_of_voice"] },
  { key: "positioning", label: "Positioning", types: ["positioning", "value_proposition", "messaging_framework"] },
  { key: "launch", label: "Launch copy", types: ["launch_copy", "product_hunt_copy", "ph_copy"] },
  { key: "social", label: "Social", types: ["social_post", "social_copy"] },
  { key: "bios", label: "Bios", types: ["founder_bio", "company_bio", "press_bio"] },
  { key: "website", label: "Website & email", types: ["website_copy", "email_copy"] },
];

export default function BrandHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("assets").select("id,title,asset_type,project_id,content,image_url,editor_state,created_at,meta").order("created_at", { ascending: false }).limit(400),
        supabase.from("projects").select("id,name").order("created_at", { ascending: false }).limit(50),
      ]);
      if (cancel) return;
      setAssets((a || []).filter(isBrandAsset));
      setProjects(p || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user]);

  const filtered = useMemo(() => {
    if (activeProject === "all") return assets;
    return assets.filter((a) => a.project_id === activeProject);
  }, [assets, activeProject]);

  const byCategory = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const c of CATEGORIES) map.set(c.key, []);
    for (const a of filtered) {
      const t = normalizeAssetType(a.asset_type);
      const cat = CATEGORIES.find((c) => c.types.includes(t));
      if (cat) map.get(cat.key)!.push(a);
    }
    return map;
  }, [filtered]);

  const openInProject = (a: any) => `/brand/${a.project_id}?asset=${a.id}`;
  const projectLink = (cat: Category) => {
    // Prefer a project that has assets in this category, otherwise the first project.
    const withHit = filtered.find((a) => cat.types.includes(normalizeAssetType(a.asset_type)));
    const pid = withHit?.project_id || (activeProject !== "all" ? activeProject : projects[0]?.id);
    return pid ? `/brand/${pid}?cat=${cat.types[0]}` : `/projects`;
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Brand Kit</div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Your brand, all in one place.</h1>
          <p className="mt-1 text-sm text-neutral-500">Guidelines, colors, fonts, voice and copy — organized by category.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeProject}
            onChange={(e) => setActiveProject(e.target.value)}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          >
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Link to="/create" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
            <Sparkles className="h-4 w-4" /> Create
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const items = byCategory.get(cat.key) || [];
          const isLogos = cat.key === "logos"; // logos live in Designs, not Brand — link there
          return (
            <Link
              key={cat.key}
              to={isLogos ? "/designs?type=logotype" : projectLink(cat)}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-50">
                {items.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">
                    <Plus className="h-8 w-8" />
                  </div>
                ) : items.length === 1 ? (
                  <BrandCover asset={items[0]} />
                ) : (
                  <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-neutral-100">
                    {items.slice(0, 4).map((a) => (
                      <div key={a.id} className="overflow-hidden bg-white">
                        <BrandCover asset={a} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900">{cat.label}</div>
                  <div className="mt-0.5 truncate text-[11px] text-neutral-500">
                    {items.length === 0 ? "None yet" : `${items.length} ${items.length === 1 ? "asset" : "assets"}`}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-900" />
              </div>
            </Link>
          );
        })}
      </div>

      {!loading && assets.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">Nothing in your brand kit yet</h2>
          <p className="mt-1 text-sm text-neutral-500">Ask Rocket to draft brand guidelines, voice, colors or launch copy.</p>
          <Link to="/create" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
            <Sparkles className="h-4 w-4" /> Create your first brand asset
          </Link>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Open a project workspace</div>
          <div className="flex flex-wrap gap-2">
            {projects.slice(0, 12).map((p) => (
              <Link key={p.id} to={`/brand/${p.id}`} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-neutral-400">
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
