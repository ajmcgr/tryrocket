import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
const supabase = _sb as any;

const ProjectDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [picking, setPicking] = useState(false);

  const load = async () => {
    if (!id || !user) return;
    const [p, a] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("assets").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    setProject(p.data); setAssets(a.data || []);
  };
  useEffect(() => { load(); }, [id, user]);

  const openPicker = async () => {
    const { data } = await supabase.from("assets").select("id, title, asset_type, image_url, content").eq("user_id", user!.id).is("project_id", null).order("created_at", { ascending: false }).limit(100);
    setAllAssets(data || []); setPicking(true);
  };

  const addAsset = async (assetId: string) => {
    await supabase.from("assets").update({ project_id: id }).eq("id", assetId);
    setPicking(false); load();
  };

  const removeAsset = async (assetId: string) => {
    if (!confirm("Remove from project?")) return;
    await supabase.from("assets").update({ project_id: null }).eq("id", assetId);
    load();
  };

  if (!project) return <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Projects</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
        <div className="flex gap-2">
          <Link to={`/projects/${id}/brand-kit`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><Sparkles className="h-4 w-4" /> Brand Kit</Link>
          <button onClick={openPicker} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><Plus className="h-4 w-4" /> Add asset</button>
          <Link to={`/create?project=${id}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-hover"><Plus className="h-4 w-4" /> New Asset</Link>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-sm text-neutral-500">No assets in this project yet.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map(a => (
            <div key={a.id} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <Link to={`/assets/${a.id}`}>
                <div className="aspect-square w-full bg-neutral-50">
                  {a.image_url ? <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" /> :
                    <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-500"><div className="line-clamp-6 whitespace-pre-wrap">{(a.content || "").slice(0, 200)}</div></div>}
                </div>
                <div className="border-t border-neutral-100 p-3">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">{a.asset_type}</div>
                </div>
              </Link>
              <button onClick={() => removeAsset(a.id)} className="absolute right-2 top-2 rounded-md bg-white/90 p-1 opacity-0 transition group-hover:opacity-100" title="Remove from project"><Trash2 className="h-4 w-4 text-red-600" /></button>
            </div>
          ))}
        </div>
      )}

      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setPicking(false)}>
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add existing asset</h2>
            {allAssets.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No unassigned assets.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {allAssets.map(a => (
                  <button key={a.id} onClick={() => addAsset(a.id)} className="overflow-hidden rounded-lg border border-neutral-200 text-left hover:border-brand">
                    <div className="aspect-square w-full bg-neutral-50">
                      {a.image_url ? <img src={a.image_url} alt="" className="h-full w-full object-cover" /> : <div className="p-2 text-[10px] text-neutral-500 line-clamp-5">{a.content || ""}</div>}
                    </div>
                    <div className="border-t border-neutral-100 p-2 text-xs truncate">{a.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
