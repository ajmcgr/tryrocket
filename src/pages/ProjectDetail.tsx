import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Sparkles, Trash2, Share2, Check, Paintbrush, Send, Radio, Wand2 } from "lucide-react";
const supabase = _sb as any;

type WF = "brand" | "design" | "launch" | "promote" | "other";
const WF_OF: Record<string, WF> = {
  logo: "brand", brand_guidelines: "brand", color_system: "brand", font_system: "brand", brand_voice: "brand",
  graphic: "design", icon: "design", photo: "design", template: "design",
  launch_copy: "launch", product_hunt_copy: "launch", presentation: "launch",
  social_post: "promote", founder_bio: "promote",
};
const WF_META: Record<WF, { label: string; Icon: any }> = {
  brand: { label: "Brand", Icon: Sparkles },
  design: { label: "Design", Icon: Paintbrush },
  launch: { label: "Launch", Icon: Send },
  promote: { label: "Promote", Icon: Radio },
  other: { label: "Other", Icon: Wand2 },
};
const wfOf = (t: string): WF => WF_OF[t] || "other";

const ProjectDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [picking, setPicking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [tab, setTab] = useState<"all" | WF>("all");
  const [showRun, setShowRun] = useState(false);

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

  const toggleShare = async () => {
    if (!project) return;
    setSharing(true);
    if (project.share_token) {
      await supabase.from("projects").update({ share_token: null }).eq("id", project.id);
      toast({ title: "Share link disabled" });
    } else {
      const token = crypto.randomUUID();
      await supabase.from("projects").update({ share_token: token }).eq("id", project.id);
      const url = `${window.location.origin}/share/project/${token}`;
      try { await navigator.clipboard.writeText(url); } catch {}
      toast({ title: "Public link created", description: "Copied to clipboard." });
    }
    await load();
    setSharing(false);
  };

  const copyShare = async () => {
    if (!project?.share_token) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/project/${project.share_token}`);
    toast({ title: "Share link copied" });
  };

  if (!project) return <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>;

  const counts: Record<WF, number> = { brand: 0, design: 0, launch: 0, promote: 0, other: 0 };
  for (const a of assets) counts[wfOf(a.asset_type)]++;
  const visible = tab === "all" ? assets : assets.filter(a => wfOf(a.asset_type) === tab);
  const tabs: ("all" | WF)[] = ["all", "brand", "design", "launch", "promote", "other"];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Projects</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
        <div className="flex gap-2">
          <Link to={`/projects/${id}/brand-kit`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><Sparkles className="h-4 w-4" /> Brand Kit</Link>
          <button onClick={toggleShare} disabled={sharing} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm ${project.share_token ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}><Share2 className="h-4 w-4" /> {project.share_token ? "Shared" : "Share"}</button>
          <button onClick={openPicker} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><Plus className="h-4 w-4" /> Add asset</button>
          <div className="relative">
            <button onClick={() => setShowRun(v => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-hover"><Plus className="h-4 w-4" /> Run workflow</button>
            {showRun && (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg" onMouseLeave={() => setShowRun(false)}>
                <Link to={`/create?project=${id}`} className="block px-3 py-2 text-sm hover:bg-neutral-50">Single asset…</Link>
                <div className="border-t border-neutral-100" />
                {(["brand", "design", "launch", "promote"] as WF[]).map(w => {
                  const M = WF_META[w];
                  return (
                    <Link key={w} to={`/create?project=${id}&workflow=${w}&prompt=${encodeURIComponent(project.name)}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50">
                      <M.Icon className="h-3.5 w-3.5" /> {M.label} It
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {project.share_token && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="flex-1 truncate font-mono text-emerald-900">{`${window.location.origin}/share/project/${project.share_token}`}</span>
          <button onClick={copyShare} className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs hover:bg-emerald-100">Copy</button>
        </div>
      )}

      {assets.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5 border-b border-neutral-200 pb-2">
          {tabs.map(t => {
            const count = t === "all" ? assets.length : counts[t as WF];
            if (t !== "all" && count === 0) return null;
            const label = t === "all" ? "All" : WF_META[t as WF].label;
            return (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-xs ${tab === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
                {label} <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-sm text-neutral-500">No assets in this project yet.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map(a => (
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
