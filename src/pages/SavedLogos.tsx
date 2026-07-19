import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logotype } from "@/components/Logotype";
import CanvasAssetPreview from "@/components/CanvasAssetPreview";
import { isCanvasAsset } from "@/lib/canvasAsset";
import { AssetGridSkeleton } from "@/components/Skeletons";
import BrandFromAssetMenu from "@/components/BrandFromAssetMenu";
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  StarOff,
  Globe,
  Lock,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CollectionView, DesignSort, sortByOption } from "@/lib/designCollections";
import { matchesDesignQuery, rankDesignsByRelevance } from "@/lib/searchRelevance";

const supabase = _sb as any;
const LOGO_TYPES = ["logo", "logotype", "wordmark", "brandmark"] as const;

const SAVED_STYLES = [
  "Modern", "Minimal", "Luxury", "Technology", "Startup", "AI", "Consumer", "Enterprise", "Fintech", "Healthcare", "Education",
] as const;

type SavedStyle = "all" | typeof SAVED_STYLES[number];

const matchesSavedStyle = (asset: any, style: SavedStyle) => {
  if (style === "all") return true;
  const declaredStyle = String(
    asset?.meta?.template_style || asset?.meta?.templateStyle || asset?.meta?.style || "",
  ).toLowerCase();
  const searchable = [asset?.title, asset?.prompt, asset?.content, declaredStyle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const terms: Record<Exclude<SavedStyle, "all">, string[]> = {
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

const SavedLogos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SavedStyle>("all");
  const [view, setView] = useState<CollectionView>("card");
  const [sort, setSort] = useState<DesignSort>("date");
  const [visibleCount, setVisibleCount] = useState(60);

  useEffect(() => { setVisibleCount(60); }, [filter, query, view, sort]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { ensureActiveWorkspaceId } = await import("@/lib/workspace");
      const ws = await ensureActiveWorkspaceId();
      let q = supabase
        .from("assets")
        .select("id,title,asset_type,image_url,thumbnail_url,editor_state,meta,prompt,created_at,updated_at")
        .eq("user_id", user.id);
      if (ws) q = q.eq("workspace_id", ws);
      const { data } = await q.is("deleted_at", null).order("created_at", { ascending: false }).limit(200);
      if (!cancelled) {
        // Only items the user has explicitly saved (via Save button or by opening/editing in /editor).
        setItems((data || []).filter((asset: any) => Boolean(asset?.meta?.saved_at)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const visible = items.filter((asset) => {
      if (!matchesSavedStyle(asset, filter)) return false;
      return matchesDesignQuery(asset, q);
    });
    return q
      ? rankDesignsByRelevance(visible, q)
      : sortByOption(visible, sort, (asset) => asset.title, (asset) => asset.created_at);
  }, [items, filter, query, sort]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = filtered.length > visibleItems.length;

  const updateItem = (id: string, patch: any) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const unfavourite = async (a: any) => {
    const meta = { ...(a.meta || {}) };
    delete meta.saved_at;
    await supabase.from("assets").update({ meta }).eq("id", a.id);
    setItems((prev) => prev.filter((x) => x.id !== a.id));
    toast({ title: "Removed from Saved" });
  };

  const togglePublic = async (a: any) => {
    const isPublic = !a?.meta?.public;
    const meta = { ...(a.meta || {}), public: isPublic };
    await supabase.from("assets").update({ meta }).eq("id", a.id);
    updateItem(a.id, { meta });
    toast({ title: isPublic ? "Made public" : "Made private" });
  };

  const edit = (a: any) => window.open(`/editor?id=${a.id}`, "_blank", "noopener,noreferrer");
  const remix = (a: any) => navigate(`/create?remix=${a.id}`);

  const DesignPreview = ({ asset }: { asset: any }) => {
    const isLogotype = asset?.editor_state?.kind === "logotype";
    const isCanvas = isCanvasAsset(asset);
    const isImage = (asset.image_url || asset.thumbnail_url) && !isLogotype;

    return (
      <div className="h-full w-full" style={{ background: asset?.meta?.background || undefined }}>
        {isImage ? (
          <img src={asset.thumbnail_url || asset.image_url} alt={asset.title || "Logo"} className="h-full w-full object-contain" loading="lazy" />
        ) : isLogotype ? (
          <Logotype state={asset.editor_state} fit="contain" />
        ) : isCanvas ? (
          <CanvasAssetPreview elements={(asset.editor_state as any) || []} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-500">
            <span className="line-clamp-6 whitespace-pre-wrap">{(asset.prompt || "").slice(0, 220)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Saved Designs</h1>
          <p className="mt-1 text-sm text-neutral-500">Every logo or icon concept you've generated or saved.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved logos…"
            className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-neutral-400 sm:w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setFilter("all")} className={`rounded-full border px-3 py-1 text-xs transition ${filter === "all" ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>All</button>
          {SAVED_STYLES.map((style) => (
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
        <div className="mt-6">
          <AssetGridSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-neutral-300 bg-gradient-to-b from-white to-neutral-50 p-16 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">No saved logos yet.</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
            Generate logos in the Wizard or Logo Designer and save them here.
          </p>
          <Button asChild className="mt-4">
            <a href="/create">Create your first logo</a>
          </Button>
        </div>
      ) : view === "card" ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleItems.map((a) => (
            <div
              key={a.id}
              onClick={() => edit(a)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
            >
              <div className="flex aspect-square w-full items-center justify-center bg-neutral-50 p-4">
                <DesignPreview asset={a} />
              </div>
              <div className="border-t border-neutral-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{a.title || "Untitled logo"}</p>
                    <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                      {new Date(a.updated_at || a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {a?.meta?.public ? <Globe className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" /> : null}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={(e) => { e.stopPropagation(); edit(a); }} className="inline-flex flex-1 items-center justify-center rounded-lg bg-brand px-2 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-hover">Edit</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); remix(a); }} title="Remix" className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                    <Shuffle className="h-3.5 w-3.5" />
                  </button>
                  <BrandFromAssetMenu asset={a} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); void togglePublic(a); }} title={a?.meta?.public ? "Make private" : "Make public"} className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                    {a?.meta?.public ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); void unfavourite(a); }} title="Remove from Saved" className="inline-flex items-center justify-center rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                    <StarOff className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {visibleItems.map((a) => (
            <div
              key={a.id}
              onClick={() => edit(a)}
              className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 transition hover:bg-neutral-50 last:border-b-0"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                <DesignPreview asset={a} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">{a.title || "Untitled logo"}</div>
                <div className="truncate text-xs text-neutral-500">
                  {(a.asset_type || "Design").replace(/_/g, " ")} · {new Date(a.updated_at || a.created_at).toLocaleDateString()}
                </div>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); edit(a); }} className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Edit</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); remix(a); }} title="Remix" className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                <Shuffle className="h-3.5 w-3.5" />
              </button>
              <BrandFromAssetMenu asset={a} className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50" />
              <button type="button" onClick={(e) => { e.stopPropagation(); void togglePublic(a); }} title={a?.meta?.public ? "Make private" : "Make public"} className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                {a?.meta?.public ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); void unfavourite(a); }} title="Remove from Saved" className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                <StarOff className="h-3.5 w-3.5" />
              </button>
              <div className="shrink-0 text-xs text-neutral-400">{new Date(a.updated_at || a.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
      {!loading && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + 60)}
            className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Load more ({filtered.length - visibleItems.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedLogos;
