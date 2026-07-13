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

const supabase = _sb as any;

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logo",
  brand_guidelines: "Brand Guidelines",
  color_system: "Color System",
  font_system: "Font System",
  brand_voice: "Brand Voice",
  graphic: "Graphic",
  icon: "Icon",
  photo: "Photo",
  template: "Template",
  launch_copy: "Launch Copy",
  product_hunt_copy: "PH Copy",
  social_post: "Social Post",
  founder_bio: "Founder Bio",
  presentation: "Presentation",
  other: "Other",
};

const ALL_TYPES = Object.keys(ASSET_TYPE_LABELS);

const Templates = () => {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<CollectionView>("card");
  const [sort, setSort] = useState<DesignSort>("date");

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
    const q = query.trim().toLowerCase();
    const visible = designs.filter((design) => {
      if (filter !== "all" && design.asset_type !== filter) return false;
      if (!q) return true;
      return [design.title, design.prompt, design.creator_username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });

    return sortByOption(visible, sort, (design) => design.title, (design) => design.created_at);
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
          <p className="mt-1 text-sm text-neutral-500">Public designs shared by the Rocket community.</p>
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
          {ALL_TYPES.map((type) => (
            <button key={type} onClick={() => setFilter(type)} className={`rounded-full border px-3 py-1 text-xs transition ${filter === type ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>
              {ASSET_TYPE_LABELS[type]}
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
            <Link
              key={design.id}
              to={design.share_token ? `/share/asset/${design.share_token}` : "#"}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden bg-neutral-50">
                <DesignPreview design={design} />
              </div>
              <div className="border-t border-neutral-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">{design.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-neutral-500">by {design.creator_username || "Rocket creator"}</div>
                  </div>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-700" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] text-neutral-500">{ASSET_TYPE_LABELS[design.asset_type] || design.asset_type}</span>
                  <span className="shrink-0 text-[10px] text-neutral-400">{new Date(design.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {filtered.map((design) => (
            <Link
              key={design.id}
              to={design.share_token ? `/share/asset/${design.share_token}` : "#"}
              className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 transition hover:bg-neutral-50 last:border-b-0"
            >
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-neutral-50">
                <DesignPreview design={design} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">{design.title}</div>
                <div className="truncate text-xs text-neutral-500">
                  {(ASSET_TYPE_LABELS[design.asset_type] || design.asset_type)} · by {design.creator_username || "Rocket creator"}
                </div>
              </div>
              <div className="shrink-0 text-xs text-neutral-400">{new Date(design.created_at).toLocaleDateString()}</div>
              <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;
