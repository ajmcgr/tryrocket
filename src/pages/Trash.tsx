import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Trash2, ArrowLeft } from "lucide-react";
const supabase = _sb as any;

const Trash = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [a, p] = await Promise.all([
      supabase.from("assets").select("id,title,asset_type,image_url,deleted_at").eq("user_id", user.id).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(200),
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/designs" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Assets</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Trash</h1>
      <p className="mt-1 text-sm text-neutral-500">Deleted items live here for 30 days before being purged automatically.</p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-800">Projects <span className="text-neutral-400">({projects.length})</span></h2>
        {loading ? <div className="mt-3 text-xs text-neutral-400">Loading…</div> : projects.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-500">Nothing here.</div>
        ) : (
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
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-800">Assets <span className="text-neutral-400">({assets.length})</span></h2>
        {loading ? <div className="mt-3 text-xs text-neutral-400">Loading…</div> : assets.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-sm text-neutral-500">Nothing here.</div>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {assets.map(a => (
              <li key={a.id} className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  {a.image_url && <img src={a.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900">{a.title}</div>
                  <div className="text-[11px] text-neutral-500">{String(a.asset_type || "").replace(/_/g, " ")}</div>
                  <div className="mt-0.5 text-[10px] text-neutral-400">Deleted {new Date(a.deleted_at).toLocaleString()}</div>
                </div>
                <button onClick={() => restoreAsset(a.id)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs hover:bg-neutral-50"><RotateCcw className="h-3 w-3" /> Restore</button>
                <button onClick={() => purgeAsset(a.id)} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete forever</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Trash;