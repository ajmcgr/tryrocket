import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { AssetGridSkeleton } from "@/components/Skeletons";
import { Logotype } from "@/components/Logotype";
import CanvasAssetPreview from "@/components/CanvasAssetPreview";
import { isCanvasAsset } from "@/lib/canvasAsset";
import { CollectionView, DesignSort, sortByOption } from "@/lib/designCollections";
import { matchesDesignQuery, rankDesignsByRelevance } from "@/lib/searchRelevance";

const supabase = _sb as any;

const TEMPLATE_STYLES = [
  "Modern", "Minimal", "Luxury", "Technology", "Startup", "AI", "Consumer", "Enterprise", "Fintech", "Healthcare", "Education",
] as const;

type TemplateStyle = "all" | typeof TEMPLATE_STYLES[number];

const matchesTemplateStyle = (design: any, style: TemplateStyle) => {
  if (style === "all") return true;
  const declaredStyle = String(
    design?.meta?.template_style || design?.meta?.templateStyle || design?.meta?.style || "",
  ).toLowerCase();
  const searchable = [design?.title, design?.prompt, design?.content, declaredStyle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const terms: Record<Exclude<TemplateStyle, "all">, string[]> = {
    Modern: ["modern", "contemporary"],
    Minimal: ["minimal", "clean", "simple"],
    Luxury: ["luxury", "premium", "elegant"],
    Technology: ["technology", "tech", "software", "digital"],
    Startup: ["startup", "saas", "founder"],
    AI: [" ai", "artificial intelligence", "machine learning"],
    Consumer: ["consumer", "retail", "lifestyle", "food", "beauty"],
    Enterprise: ["enterprise", "b2b", "business"],
    Fintech: ["fintech", "finance", "bank", "payment"],
    Healthcare: ["healthcare", "health", "medical", "wellness"],
    Education: ["education", "learning", "school", "academy"],
  };
  return terms[style].some((term) => searchable.includes(term));
};

const Templates = () => {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TemplateStyle>("all");
  const [view, setView] = useState<CollectionView>("card");
  const [sort, setSort] = useState<DesignSort>("date");

  const templateCreateHref = (design: any) => {
    const designType = String(design?.asset_type || "logo");
    const prompt = `Create a distinctive ${designType.replace(/_/g, " ")} inspired by the ${design?.title || "selected"} template. Adapt it for my brand without reusing its name or content.`;
    return `/create?${new URLSearchParams({ asset_type: designType, prompt }).toString()}`;
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_public_designs", { _limit: 240 });

      if (!cancelled) {
        if (error) {
          console.error(error);
          setDesigns([]);
        } else {
          setDesigns(data || []);
        }
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    const visible = designs.filter((design) => {
      if (!matchesTemplateStyle(design, filter)) return false;
      return matchesDesignQuery(design, q);
    });

    return q
      ? rankDesignsByRelevance(visible, q)
      : sortByOption(visible, sort, (design) => design.title, (design) => design.created_at);
  }, [designs, filter, query, sort]);

  const DesignPreview = ({ design }: { design: any }) => {
    const isLogotype = design?.editor_state?.kind === "logotype";
    const isCanvas = isCanvasAsset(design);
    const isImage = design.image_url && !isLogotype;

    return (
      <>
        {isImage ? (
          <img src={design.image_url} alt={design.title} className="h-full w-full object-cover" loading="lazy" />
        ) : isLogotype ? (
          <Logotype state={design.editor_state} fit="contain" />
        ) : isCanvas ? (
          <CanvasAssetPreview elements={design.editor_state} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-500">
            <div className="line-clamp-6 whitespace-pre-wrap">{(design.content || design.prompt || "").slice(0, 220)}</div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-neutral-500">Start with a public creative direction, then make it your own.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates…"
            className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-neutral-400 sm:w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setFilter("all")} className={`rounded-full border px-3 py-1 text-xs transition ${filter === "all" ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>All</button>
          {TEMPLATE_STYLES.map((style) => (
            <button key={style} onClick={() => setFilter(style)} className={`rounded-full border px-3 py-1 text-xs transition ${filter === style ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>
              {style}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1">
            <button onClick={() => setView("card")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${view === "card" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Card
            </button>
            <button onClick={() => setView("list")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${view === "list" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>

          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1">
            <button onClick={() => setSort("name")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${sort === "name" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
              <ArrowUpDown className="h-3.5 w-3.5" /> Name (A–Z)
            </button>
            <button onClick={() => setSort("date")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${sort === "date" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
              Date created
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <AssetGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-neutral-300 bg-gradient-to-b from-white to-neutral-50 p-16 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">No templates yet.</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
            Public designs will appear here once people share them.
          </p>
        </div>
      ) : view === "card" ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((design) => (
            <div key={design.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md">
              <Link to={`/editor?id=${design.id}`} target="_blank" rel="noopener noreferrer" className="block">
                <div className="aspect-square w-full overflow-hidden bg-neutral-50">
                  <DesignPreview design={design} />
                </div>
              </Link>
              <div className="border-t border-neutral-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">{design.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-neutral-500">by {design.creator_username || "Rocket creator"}</div>
                  </div>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-700" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] text-neutral-500">{(design.asset_type || "Design").replace(/_/g, " ")}</span>
                  <span className="shrink-0 text-[10px] text-neutral-400">{new Date(design.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={templateCreateHref(design)} className="inline-flex flex-1 items-center justify-center rounded-lg bg-brand px-2 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-hover">Use template</Link>
                  <Link to={`/editor?id=${design.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Preview</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {filtered.map((design) => (
            <div
              key={design.id}
              className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 transition hover:bg-neutral-50 last:border-b-0"
            >
              <Link to={`/editor?id=${design.id}`} target="_blank" rel="noopener noreferrer" className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                <DesignPreview design={design} />
              </Link>
              <Link to={`/editor?id=${design.id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">{design.title}</div>
                <div className="truncate text-xs text-neutral-500">
                  {(design.asset_type || "Design").replace(/_/g, " ")} · by {design.creator_username || "Rocket creator"}
                </div>
              </Link>
              <Link to={templateCreateHref(design)} className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Use</Link>
              <div className="shrink-0 text-xs text-neutral-400">{new Date(design.created_at).toLocaleDateString()}</div>
              <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;
