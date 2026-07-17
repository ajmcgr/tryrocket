import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { assetHref, isBrandAsset, normalizeAssetType } from "@/lib/assetExperience";
import BrandCover from "@/components/brand/BrandCover";
import { ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";

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

const CORE_CATEGORY_KEYS = new Set(["logos", "colors", "fonts", "voice"]);

export default function BrandHub() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [allDesigns, setAllDesigns] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<string>(params.get("project") || "all");

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
      const loadedProjects = p || [];
      const all = a || [];
      setAllDesigns(all);
      setAssets(all.filter(isBrandAsset));
      setProjects(loadedProjects);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user]);

  useEffect(() => {
    const projectId = params.get("project");
    if (projectId) setActiveProject(projectId);
  }, [params]);

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

  const selectedStyle = useMemo(() => {
    const directionId = params.get("direction");
    if (directionId) return allDesigns.find((design) => design.id === directionId) || null;
    const relevantDesigns = activeProject === "all"
      ? allDesigns
      : allDesigns.filter((design) => design.project_id === activeProject);
    return relevantDesigns.find((design) => design.meta?.selected_as_direction) || null;
  }, [activeProject, allDesigns, params]);

  const createWithStyleHref = (assetType: string, prompt: string) => selectedStyle
    ? `/create?${new URLSearchParams({
      direction: selectedStyle.id,
      ...(selectedStyle.project_id ? { project: selectedStyle.project_id } : {}),
      asset_type: assetType,
      prompt,
    }).toString()}`
    : "/designs";

  const projectLink = (cat: Category) => {
    // Prefer a project that has assets in this category, otherwise the first project.
    const withHit = filtered.find((a) => cat.types.includes(normalizeAssetType(a.asset_type)));
    const pid = withHit?.project_id || (activeProject !== "all" ? activeProject : projects[0]?.id);
    return pid ? `/brands/${pid}?cat=${cat.types[0]}` : `/projects`;
  };
  const coreCategories = CATEGORIES.filter((category) => CORE_CATEGORY_KEYS.has(category.key));
  const supportingCategories = CATEGORIES.filter((category) => !CORE_CATEGORY_KEYS.has(category.key));
  const createOnBrandHref = selectedStyle
    ? createWithStyleHref("graphic", "Create a new design for our brand.")
    : "/create";

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your brand</h1>
          <p className="mt-1 text-sm text-neutral-500">The logo, colours, type and voice that keep every design consistent.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/trash"
            title="Trash"
            aria-label="Trash"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <Trash2 className="h-4 w-4" />
          </Link>
          <select
            value={activeProject}
            onChange={(e) => setActiveProject(e.target.value)}
            className="h-10 rounded-full border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
          >
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Link to={createOnBrandHref} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm hover:bg-brand-hover">
            <Sparkles className="h-4 w-4" /> Create on-brand
          </Link>
        </div>
      </div>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
        {selectedStyle ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Your style</p>
              <p className="truncate text-sm font-medium text-neutral-900">{selectedStyle.title || "Untitled design"}</p>
            </div>
            <Link to={assetHref(selectedStyle)} className="ml-1 shrink-0 text-sm font-medium text-neutral-600 hover:text-neutral-900">Change</Link>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Your style</p>
              <p className="text-sm text-neutral-600">Choose a design you like to guide future work.</p>
            </div>
            <Link to="/designs" className="ml-1 shrink-0 text-sm font-medium text-neutral-600 hover:text-neutral-900">Choose</Link>
          </div>
        )}
      </section>

      <div className="mt-8 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Core identity</h2>
          <p className="mt-1 text-sm text-neutral-500">The essentials every new design should follow.</p>
        </div>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {coreCategories.map((cat) => {
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
                    {items.length === 0 ? "Not chosen yet" : `${items.length} ${items.length === 1 ? "design" : "designs"}`}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-900" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 border-t border-neutral-200 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Supporting material</h2>
            <p className="mt-1 text-sm text-neutral-500">Guidance and launch work built from your core identity.</p>
          </div>
          <Link to="/designs" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">View all designs</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {supportingCategories.map((cat) => {
            const items = byCategory.get(cat.key) || [];
            return (
              <Link key={cat.key} to={projectLink(cat)} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400 hover:text-neutral-900">
                {cat.label}
                {items.length > 0 && <span className="text-xs text-neutral-400">{items.length}</span>}
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
              </Link>
            );
          })}
        </div>
      </section>

      {!loading && assets.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">Start your brand</h2>
          <p className="mt-1 text-sm text-neutral-500">Create a logo, then choose the colours, type and voice that fit it.</p>
          <Link to="/create" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
            <Sparkles className="h-4 w-4" /> Create your first design
          </Link>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Open a project workspace</div>
          <div className="flex flex-wrap gap-2">
            {projects.slice(0, 12).map((p) => (
              <Link key={p.id} to={`/brands/${p.id}`} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-neutral-400">
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
