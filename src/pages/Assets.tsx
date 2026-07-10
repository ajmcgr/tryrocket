import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, MoreHorizontal, Edit3, FolderPlus, Download, CheckSquare, Square, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { AssetGridSkeleton } from "@/components/Skeletons";
import { Logotype } from "@/components/Logotype";
import { packAssetsZip } from "@/lib/exporters/zipPack";
const supabase = _sb as any;

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logo", brand_guidelines: "Brand Guidelines", color_system: "Color System",
  font_system: "Font System", brand_voice: "Brand Voice", graphic: "Graphic",
  icon: "Icon", photo: "Photo", template: "Template", launch_copy: "Launch Copy",
  product_hunt_copy: "PH Copy", social_post: "Social Post", founder_bio: "Founder Bio",
  presentation: "Presentation", other: "Other",
};
const ALL_TYPES = Object.keys(ASSET_TYPE_LABELS);

const Assets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const highlight = (params.get("highlight") || "").split(",").filter(Boolean);
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [a, p] = await Promise.all([
      supabase.from("assets").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(200),
      supabase.from("projects").select("id,name").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    ]);
    const { data, error } = a;
    if (error) toast({ title: "Failed to load assets", description: error.message, variant: "destructive" });
    setAssets(data || []);
    setProjects(p.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    return assets.filter(a => {
      if (filter !== "all" && a.asset_type !== filter) return false;
      if (q && !((a.title || "").toLowerCase().includes(q.toLowerCase()) || (a.prompt || "").toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [assets, filter, q]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllVisible = () => setSelected(new Set(filtered.map((a) => a.id)));
  const clearSelection = () => setSelected(new Set());
  const downloadZip = async () => {
    const items = assets.filter((a) => selected.has(a.id));
    if (!items.length) return;
    setZipping(true);
    try {
      await packAssetsZip(items, `rocket-pack-${items.length}-assets.zip`);
      toast({ title: `Packed ${items.length} assets` });
    } catch (e: any) {
      toast({ title: "Pack failed", description: e?.message, variant: "destructive" });
    } finally { setZipping(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Move this asset to Trash?")) return;
    setAssets(prev => prev.filter(a => a.id !== id));
    await supabase.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Move ${ids.length} assets to Trash? Restore anytime from /trash.`)) return;
    setAssets(prev => prev.filter(a => !selected.has(a.id)));
    clearSelection();
    const { error } = await supabase.from("assets").update({ deleted_at: new Date().toISOString() }).in("id", ids);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); load(); return; }
    toast({ title: `Moved ${ids.length} to Trash` });
  };

  const bulkAssignToProject = async (projectId: string | null) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } = await supabase.from("assets").update({ project_id: projectId }).in("id", ids);
    if (error) { toast({ title: "Move failed", description: error.message, variant: "destructive" }); return; }
    setAssets(prev => prev.map(a => selected.has(a.id) ? { ...a, project_id: projectId } : a));
    toast({ title: projectId ? `Moved ${ids.length} assets to project` : `Removed ${ids.length} from project` });
    clearSelection();
  };

  const assignToProject = async (assetId: string, projectId: string | null) => {
    const { error } = await supabase.from("assets").update({ project_id: projectId }).eq("id", assetId);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, project_id: projectId } : a));
    toast({ title: projectId ? "Added to project" : "Removed from project" });
  };

  const createProjectAndAssign = async (assetId: string) => {
    const name = window.prompt("New project name");
    if (!name?.trim() || !user) return;
    const { ensureActiveWorkspaceId } = await import("@/lib/workspace");
    const workspace_id = await ensureActiveWorkspaceId();
    const { data, error } = await supabase.from("projects").insert({ user_id: user.id, workspace_id, name: name.trim() } as any).select().single();
    if (error || !data) { toast({ title: "Failed", description: error?.message, variant: "destructive" }); return; }
    setProjects(prev => [data, ...prev]);
    await assignToProject(assetId, data.id);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Assets</h1>
          <p className="mt-1 text-sm text-neutral-500">{assets.length} total · every generated asset is saved here.</p>
        </div>
        <Link to="/create" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> New Asset
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchRef}
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search assets…  ( / )"
            className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-neutral-400 sm:w-64"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setFilter("all")} className={`rounded-full border px-3 py-1 text-xs transition ${filter === "all" ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>All</button>
          {ALL_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`rounded-full border px-3 py-1 text-xs transition ${filter === t ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}>
              {ASSET_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => { setSelectMode((v) => !v); clearSelection(); }}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${selectMode ? "border-brand bg-brand/10 text-brand" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}
          >
            {selectMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />} {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-xs">
          <span className="font-medium text-neutral-700">{selected.size} selected</span>
          <button onClick={selectAllVisible} className="rounded-full border border-neutral-200 bg-white px-2 py-1 hover:bg-neutral-50">Select all visible</button>
          <button onClick={clearSelection} className="rounded-full border border-neutral-200 bg-white px-2 py-1 hover:bg-neutral-50">Clear</button>
          <div className="ml-auto" />
          <button
            onClick={downloadZip}
            disabled={!selected.size || zipping}
            className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {zipping ? "Packing…" : "Download .zip"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={!selected.size}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                <FolderPlus className="h-3.5 w-3.5" /> Move
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white">
              <DropdownMenuLabel className="text-[10px] uppercase text-neutral-500">Move {selected.size} to…</DropdownMenuLabel>
              {projects.length === 0 ? (
                <div className="px-2 py-2 text-xs text-neutral-500">No projects yet.</div>
              ) : projects.map(p => (
                <DropdownMenuItem key={p.id} onClick={() => bulkAssignToProject(p.id)} className="cursor-pointer focus:bg-neutral-100 focus:text-neutral-900">
                  {p.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => bulkAssignToProject(null)} className="cursor-pointer text-neutral-600 focus:bg-neutral-100 focus:text-neutral-900">Remove from project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={bulkDelete}
            disabled={!selected.size}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {loading ? (
        <AssetGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-neutral-300 bg-gradient-to-b from-white to-neutral-50 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Plus className="h-6 w-6" />
          </div>
          {assets.length === 0 ? (
            <>
              <h2 className="text-lg font-semibold text-neutral-900">Your library is empty</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                Every logotype, palette, brand voice, and deck you make with Rocket lands here — searchable, exportable, and re-editable.
              </p>
              <Link to="/create" className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
                <Plus className="h-3.5 w-3.5" /> Create your first asset
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-neutral-900">No matches</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">Try a different type, project, or clear the search to see everything.</p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map(a => {
            const isLogotype = a?.editor_state?.kind === "logotype";
            const isImage = a.image_url && !isLogotype;
            const isHighlighted = highlight.includes(a.id);
            const isSelected = selected.has(a.id);
            return (
              <div key={a.id} className={`group relative overflow-hidden rounded-2xl border bg-white transition hover:shadow-md ${isSelected ? "border-brand ring-2 ring-brand/40" : isHighlighted ? "border-brand ring-2 ring-brand/30" : "border-neutral-200"}`}>
                {selectMode && (
                  <button
                    onClick={(e) => { e.preventDefault(); toggleSelect(a.id); }}
                    className="absolute left-2 top-2 z-10 rounded-md bg-white/95 p-1 shadow-sm"
                    aria-label="Select"
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4 text-brand" /> : <Square className="h-4 w-4 text-neutral-500" />}
                  </button>
                )}
                {selectMode ? (
                  <button onClick={() => toggleSelect(a.id)} className="block w-full text-left">
                    <div className="aspect-square w-full overflow-hidden bg-neutral-50">
                      {isImage ? (
                        <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : isLogotype ? (
                        <Logotype state={a.editor_state} fit="contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-500">
                          <div className="line-clamp-6 whitespace-pre-wrap">{(a.content || a.prompt || "").slice(0, 200)}</div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-neutral-100 p-3">
                      <div className="truncate text-sm font-medium text-neutral-900">{a.title}</div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-neutral-500">{ASSET_TYPE_LABELS[a.asset_type] || a.asset_type}</span>
                        <span className="shrink-0 text-[10px] text-neutral-400">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>
                ) : (
                <Link to={`/assets/${a.id}`} className="block">
                  <div className="aspect-square w-full overflow-hidden bg-neutral-50">
                    {isImage ? (
                      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : isLogotype ? (
                      <Logotype state={a.editor_state} fit="contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-500">
                        <div className="line-clamp-6 whitespace-pre-wrap">{(a.content || a.prompt || "").slice(0, 200)}</div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-neutral-100 p-3">
                    <div className="truncate text-sm font-medium text-neutral-900">{a.title}</div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-neutral-500">{ASSET_TYPE_LABELS[a.asset_type] || a.asset_type}</span>
                      <span className="shrink-0 text-[10px] text-neutral-400">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute right-2 top-2 rounded-md bg-white/90 p-1 opacity-0 transition group-hover:opacity-100" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4 text-neutral-700" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    <DropdownMenuItem asChild className="cursor-pointer focus:bg-neutral-100 focus:text-neutral-900"><Link to={`/editor?id=${a.id}`}><Edit3 className="mr-2 h-4 w-4" /> Open in Editor</Link></DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer focus:bg-neutral-100 focus:text-neutral-900 data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900"><FolderPlus className="mr-2 h-4 w-4" /> {a.project_id ? "Move to project" : "Add to project"}</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-56 bg-white">
                          <DropdownMenuLabel className="text-[10px] uppercase text-neutral-500">Projects</DropdownMenuLabel>
                          {projects.length === 0 ? (
                            <div className="px-2 py-2 text-xs text-neutral-500">No projects yet.</div>
                          ) : projects.map(p => (
                            <DropdownMenuItem key={p.id} onClick={() => assignToProject(a.id, p.id)} className="cursor-pointer focus:bg-neutral-100 focus:text-neutral-900">
                              {p.name}{a.project_id === p.id ? " ✓" : ""}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => createProjectAndAssign(a.id)} className="cursor-pointer focus:bg-neutral-100 focus:text-neutral-900">+ New project…</DropdownMenuItem>
                          {a.project_id && (
                            <DropdownMenuItem onClick={() => assignToProject(a.id, null)} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">Remove from project</DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => del(a.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assets;
