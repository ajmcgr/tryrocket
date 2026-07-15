import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Trash2, ArrowLeft, Search, LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { AssetGridSkeleton } from "@/components/Skeletons";
import { Logotype } from "@/components/Logotype";
import CanvasAssetPreview from "@/components/CanvasAssetPreview";
import { isCanvasAsset } from "@/lib/canvasAsset";
import { CollectionView, DesignSort, sortByOption } from "@/lib/designCollections";
const supabase = _sb as any;

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logo",
  graphic: "Graphic",
  icon: "Icon",
  photo: "Photo",
  template: "Template",
  presentation: "Presentation",
  other: "Other",
};

const Trash = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<CollectionView>("card");
  const [sort, setSort] = useState<DesignSort>("date");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [a, p] = await Promise.all([
      supabase.from("assets").select("*").eq("user_id", user.id).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
      supabase.from("projects").select("id,name,description,deleted_at").eq("user_id", user.id).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
    ]);
    setAssets(a.data || []); setProjects(p.data || []); setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const restoreAsset = async (id: string) => {
    const { error } = await supabase.from("assets").update({ deleted_at: null }).eq("id", id);
    if (error) return toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    setAssets((prev) => prev.filter(x => x.id !== id));
    toast({ title: "Asset restored" });
  };
  const purgeAsset = async (id: string) => {
    if (!confirm("Permanently delete this asset? This can't be undone.")) return;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setAssets((prev) => prev.filter(x => x.id !== id));
  };
  const restoreProject = async (id: string) => {
    const { error } = await supabase.from("projects").update({ deleted_at: null }).eq("id", id);
    if (error) return toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    setProjects((prev) => prev.filter(x => x.id !== id));
    toast({ title: "Project restored" });
  };
  const purgeProject = async (id: string) => {
    if (!confirm("Permanently delete this project? Its assets stay in Trash unless deleted separately.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setProjects((prev) => prev.filter(x => x.id !== id));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = assets.filter((a) => {
      if (filter !== "all" && a.asset_type !== filter) return false;
      if (!q) return true;
      return [a.title, a.asset_type].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
    return sortByOption(visible, sort, (a) => a.title, (a) => a.deleted_at || a.created_at);
  }, [assets, filter, query, sort]);

  const AssetPreview = ({ a }: { a: any }) => {
    const isLogotype = a?.editor_state?.kind === "logotype";
    const isCanvas = isCanvasAsset(a);
    const isImage = a.image_url && !isLogotype;
    return isImage ? (
      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
    ) : isLogotype ? (
      <Logotype state={a.editor_state} fit="contain" />
    ) : isCanvas ? (
      <CanvasAssetPreview elements={a.editor_state} className="h-full w-full" />
    ) : (
      <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-500">
        <div className="line-clamp-6 whitespace-pre-wrap">{(a.content || "").slice(0, 220) || "No preview"}</div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/designs" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Back to Designs</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Trash</h1>
          <p className="mt-1 text-sm text-neutral-500">Deleted items live here for 30 days before being purged automatically.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search trash…"
            className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-neutral-400 sm:w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setFilter("all")} className={`rounded-full border px-3 py-1 text-xs transition ${filter === "all" ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>All</button>
          {Object.keys(ASSET_TYPE_LABELS).map((type) => (
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
              Date deleted
            </button>
          </div>
        </div>
      </div>

      {projects.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-800">Projects <span className="text-neutral-400">({projects.length})</span></h2>
          <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {projects.map(p => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900">{p.name}</div>
                  {p.description && <div className="truncate text-xs text-neutral-500">{p.description}</div>}
                  <div className="mt-0.5 text-[10px] text-neutral-400">Deleted {new Date(p.deleted_at).toLocaleString()}</div>
                </div>
                <button onClick={() => restoreProject(p.id)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs hover:bg-neutral-50"><RotateCcw className="h-3 w-3" /> Restore</button>
                <button onClick={() => purgeProject(p.id)} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete forever</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-neutral-300 bg-gradient-to-b from-white to-neutral-50 p-16 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">Trash is empty.</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
            Designs you delete will appear here for 30 days.
          </p>
        </div>
      ) : view === "card" ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a) => (
            <div key={a.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md">
              <div className="aspect-square w-full overflow-hidden bg-neutral-50">
                <AssetPreview a={a} />
              </div>
              <div className="border-t border-neutral-100 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900">{a.title || "Untitled"}</div>
                  <div className="mt-0.5 truncate text-[11px] text-neutral-500">
                    {ASSET_TYPE_LABELS[a.asset_type] || a.asset_type} · deleted {new Date(a.deleted_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button onClick={() => restoreAsset(a.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] hover:bg-neutral-50"><RotateCcw className="h-3 w-3" /> Restore</button>
                  <button onClick={() => purgeAsset(a.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0">
              <div className="h-14 w-14 overflow-hidden rounded-lg bg-neutral-50">
                <AssetPreview a={a} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">{a.title || "Untitled"}</div>
                <div className="truncate text-xs text-neutral-500">
                  {(ASSET_TYPE_LABELS[a.asset_type] || a.asset_type)} · deleted {new Date(a.deleted_at).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => restoreAsset(a.id)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs hover:bg-neutral-50"><RotateCcw className="h-3 w-3" /> Restore</button>
              <button onClick={() => purgeAsset(a.id)} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete forever</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;