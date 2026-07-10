import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Sparkles, Trash2, Share2, Check, Paintbrush, Send, Radio, Wand2, LayoutGrid, Download, Loader2, Zap, X } from "lucide-react";
import { AssetGridSkeleton } from "@/components/Skeletons";
import CollaboratorsModal, { loadCollaborators, type Collaborator } from "@/components/CollaboratorsModal";
import { Logotype } from "@/components/Logotype";
import { packAssetsZip } from "@/lib/exporters/zipPack";
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
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [zipping, setZipping] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<Record<string, "pending" | "running" | "done" | "error">>({});
  const [completePanelOpen, setCompletePanelOpen] = useState(false);

  const CORE_KIT: { type: string; label: string; prompt: (name: string, ctx: any) => string }[] = [
    { type: "logo", label: "Logotype", prompt: (n, c) => `A polished text-based logotype for ${n}${c?.url ? ` (${c.url})` : ""}. ${c?.tagline || c?.description || ""}` },
    { type: "color_system", label: "Color system", prompt: (n, c) => `A cohesive color system for ${n}. ${c?.description || c?.tagline || ""}` },
    { type: "font_system", label: "Font system", prompt: (n, c) => `A font pairing (heading + body) for ${n}. ${c?.tagline || ""}` },
    { type: "brand_voice", label: "Brand voice", prompt: (n, c) => `Brand voice and tone guidelines for ${n}. ${c?.description || ""}` },
    { type: "brand_guidelines", label: "Brand guidelines", prompt: (n, c) => `Brand guidelines overview for ${n}. ${c?.description || ""}` },
  ];

  const missingKit = () => {
    const have = new Set(assets.map((a: any) => a.asset_type));
    return CORE_KIT.filter(k => !have.has(k.type));
  };

  const completeBrandKit = async () => {
    if (!project || !user) return;
    const missing = missingKit();
    if (!missing.length) {
      toast({ title: "Brand kit is complete", description: "All core brand assets already exist." });
      return;
    }
    setCompleting(true);
    setCompletePanelOpen(true);
    const init: Record<string, "pending" | "running" | "done" | "error"> = {};
    missing.forEach(k => (init[k.type] = "pending"));
    setCompletionStatus(init);

    const name = project.name || "Brand";
    const ctx = project.brand_context || (project.source_url ? { url: project.source_url, productName: name } : null);

    await Promise.all(missing.map(async (k) => {
      setCompletionStatus(prev => ({ ...prev, [k.type]: "running" }));
      try {
        const { data } = await supabase.functions.invoke("generate-asset", {
          body: { prompt: k.prompt(name, ctx), asset_type: k.type, project_id: project.id, brand_context: ctx || undefined },
        });
        const d: any = data;
        if (d?.error === "no_credits" || d?.error || d?.refused) {
          setCompletionStatus(prev => ({ ...prev, [k.type]: "error" }));
          return;
        }
        setCompletionStatus(prev => ({ ...prev, [k.type]: "done" }));
      } catch {
        setCompletionStatus(prev => ({ ...prev, [k.type]: "error" }));
      }
    }));

    setCompleting(false);
    await load();
    toast({ title: "Brand kit updated", description: "Core assets generated. Review in the Brand Kit tab." });
  };

  useEffect(() => { if (id) setCollabs(loadCollaborators(id)); }, [id]);

  const downloadPack = async () => {
    if (!assets.length) return;
    setZipping(true);
    try {
      await packAssetsZip(
        assets.map((a: any) => ({
          title: a.title || "asset",
          asset_type: a.asset_type,
          image_url: a.image_url,
          content: a.content,
        })),
        `${(project?.name || "brand").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-pack.zip`,
      );
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || "Could not build ZIP.", variant: "destructive" });
    } finally {
      setZipping(false);
    }
  };

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

  if (!project) return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="h-8 w-1/3 animate-pulse rounded bg-neutral-100" />
      <AssetGridSkeleton />
    </div>
  );

  const counts: Record<WF, number> = { brand: 0, design: 0, launch: 0, promote: 0, other: 0 };
  for (const a of assets) counts[wfOf(a.asset_type)]++;
  const visible = tab === "all" ? assets : assets.filter(a => wfOf(a.asset_type) === tab);
  const tabs: ("all" | WF)[] = ["all", "brand", "design", "launch", "promote", "other"];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Projects</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Link to={`/projects/${id}/hub`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><LayoutGrid className="h-4 w-4" /> Brand Kit Hub</Link>
          <Link to={`/projects/${id}/brand-kit`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><Sparkles className="h-4 w-4" /> Brand Kit</Link>
          <button onClick={toggleShare} disabled={sharing} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm ${project.share_token ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}><Share2 className="h-4 w-4" /> {project.share_token ? "Shared" : "Share"}</button>
          <button onClick={() => setCollabOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
            <div className="flex -space-x-1.5">
              {(collabs.length ? collabs : [{ email: user?.email || "you" } as any]).slice(0, 3).map((c: any, i) => {
                const palette = ["bg-rose-200 text-rose-800","bg-amber-200 text-amber-800","bg-emerald-200 text-emerald-800","bg-sky-200 text-sky-800","bg-violet-200 text-violet-800"];
                const ch = (c.email || "?").charCodeAt(0) % palette.length;
                const letter = (c.email?.[0] || "?").toUpperCase();
                return <span key={i} className={`flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px] font-semibold ${palette[ch]}`}>{letter}</span>;
              })}
            </div>
            <span>{collabs.length ? `${collabs.length} collaborator${collabs.length === 1 ? "" : "s"}` : "Invite"}</span>
          </button>
          <button onClick={openPicker} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"><Plus className="h-4 w-4" /> Add asset</button>
          <button onClick={downloadPack} disabled={zipping || assets.length === 0} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50">
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download pack
          </button>
          {missingKit().length > 0 && (
            <button
              onClick={completeBrandKit}
              disabled={completing}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/15 disabled:opacity-50"
              title={`Generate ${missingKit().length} missing brand asset${missingKit().length === 1 ? "" : "s"}`}
            >
              {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Complete brand kit
              <span className="ml-1 rounded-full bg-brand/20 px-1.5 text-[10px]">{missingKit().length}</span>
            </button>
          )}
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
                  {a?.editor_state?.kind === "logotype" ? <Logotype state={a.editor_state} fit="contain" /> :
                    a.image_url ? <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" /> :
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

      {id && (
        <CollaboratorsModal
          open={collabOpen}
          onOpenChange={setCollabOpen}
          projectId={id}
          projectName={project.name}
          ownerEmail={user?.email || undefined}
          shareUrl={project.share_token ? `${window.location.origin}/share/project/${project.share_token}` : null}
          onChange={setCollabs}
        />
      )}

      {completePanelOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-medium"><Zap className="h-4 w-4 text-brand" /> Completing brand kit</div>
            <button onClick={() => setCompletePanelOpen(false)} className="rounded p-1 text-neutral-500 hover:bg-neutral-100"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="max-h-72 overflow-auto p-2">
            {Object.entries(completionStatus).map(([type, s]) => {
              const label = CORE_KIT.find(k => k.type === type)?.label || type;
              return (
                <div key={type} className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <span className="truncate text-neutral-700">{label}</span>
                  {s === "pending" && <span className="text-xs text-neutral-400">queued</span>}
                  {s === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
                  {s === "done" && <Check className="h-4 w-4 text-emerald-600" />}
                  {s === "error" && <span className="text-xs text-red-600">failed</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
