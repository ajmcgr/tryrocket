import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Folder, MoreHorizontal, Trash2, Pencil, Sparkles, ImageIcon, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectGridSkeleton } from "@/components/Skeletons";
const supabase = _sb as any;

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [latestImages, setLatestImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<any | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [coverPicker, setCoverPicker] = useState<any | null>(null);
  const [coverChoices, setCoverChoices] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: ps } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const list = ps || [];
    setProjects(list);
    if (list.length) {
      const { data: cs } = await supabase
        .from("assets")
        .select("project_id,image_url,thumbnail_url,created_at")
        .eq("user_id", user.id)
        .not("project_id", "is", null)
        .order("created_at", { ascending: false });
      const c: Record<string, number> = {};
      const latest: Record<string, string> = {};
      (cs || []).forEach((a: any) => {
        if (!a.project_id) return;
        c[a.project_id] = (c[a.project_id] || 0) + 1;
        const img = a.thumbnail_url || a.image_url;
        if (img && !latest[a.project_id]) latest[a.project_id] = img;
      });
      setCounts(c);
      setLatestImages(latest);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const { data, error } = await supabase.from("projects").insert({ user_id: user!.id, name }).select().single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setProjects(p => [data, ...p]);
    setCreating(false); setNewName("");
  };

  const rename = async () => {
    if (!renaming || !renameVal.trim()) return;
    const id = renaming.id; const name = renameVal.trim();
    setProjects(p => p.map(x => x.id === id ? { ...x, name } : x));
    setRenaming(null);
    await supabase.from("projects").update({ name }).eq("id", id);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this project? Assets inside will be uncategorized but not deleted.")) return;
    setProjects(p => p.filter(x => x.id !== id));
    await supabase.from("projects").delete().eq("id", id);
  };

  const openCoverPicker = async (project: any) => {
    setCoverPicker(project);
    setCoverChoices([]);
    const { data } = await supabase
      .from("assets")
      .select("id,title,image_url,thumbnail_url,created_at")
      .eq("project_id", project.id)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);
    setCoverChoices(data || []);
  };

  const setCover = async (url: string | null) => {
    if (!coverPicker) return;
    const id = coverPicker.id;
    setProjects(p => p.map(x => x.id === id ? { ...x, cover_url: url } : x));
    setCoverPicker(null);
    await supabase.from("projects").update({ cover_url: url }).eq("id", id);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">Group assets into projects.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/templates" className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 sm:py-2.5">
            Templates
          </Link>
          <Link to="/projects/new" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover sm:px-5 sm:py-2.5">
            <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">New Project (Guided)</span><span className="sm:hidden">Guided</span>
          </Link>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 sm:py-2.5">
            <Plus className="h-4 w-4" /> Blank
          </button>
        </div>
      </div>

      {loading ? (
        <ProjectGridSkeleton />
      ) : projects.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <Folder className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No projects yet. Create one to organize your assets.</p>
          <button onClick={() => setCreating(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand-hover">
            <Plus className="h-3.5 w-3.5" /> New Project
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md">
              <Link to={`/projects/${p.id}`} className="block">
                {(() => {
                  const cover = p.cover_url || latestImages[p.id];
                  return cover ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                      <img src={cover} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
                    </div>
                  ) : (
                    <div className="grid aspect-[16/9] w-full place-items-center bg-neutral-50">
                      <Folder className="h-8 w-8 text-neutral-300" />
                    </div>
                  );
                })()}
                <div className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-neutral-900">{p.name}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">{counts[p.id] || 0} assets · {new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-100"><MoreHorizontal className="h-4 w-4 text-neutral-600" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => { setRenameVal(p.name); setRenaming(p); }}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openCoverPicker(p)}><ImageIcon className="mr-2 h-4 w-4" /> Change cover</DropdownMenuItem>
                  {p.cover_url && (
                    <DropdownMenuItem onClick={async () => { setProjects(ps => ps.map(x => x.id === p.id ? { ...x, cover_url: null } : x)); await supabase.from("projects").update({ cover_url: null }).eq("id", p.id); }}><X className="mr-2 h-4 w-4" /> Reset cover</DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => del(p.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
          <Input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} placeholder="Project name" autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={create} disabled={!newName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename project</DialogTitle></DialogHeader>
          <Input value={renameVal} onChange={e => setRenameVal(e.target.value)} onKeyDown={e => e.key === "Enter" && rename()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={rename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!coverPicker} onOpenChange={(o) => !o && setCoverPicker(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Choose cover image</DialogTitle></DialogHeader>
          {coverChoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">No image assets in this project yet.</p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto py-2 sm:grid-cols-4">
              {coverChoices.map(a => {
                const url = a.image_url || a.thumbnail_url;
                const isActive = coverPicker?.cover_url === url;
                return (
                  <button key={a.id} onClick={() => setCover(url)} className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${isActive ? "border-brand" : "border-transparent hover:border-neutral-300"}`}>
                    <img src={a.thumbnail_url || a.image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
