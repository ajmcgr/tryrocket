import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Download, Edit3, History, Share2, Trash2, RotateCcw, Check, Wand2, Loader2, Pencil, X, Save } from "lucide-react";
const supabase = _sb as any;
import OutOfCreditsModal from "@/components/OutOfCreditsModal";
import ShareExportModal from "@/components/ShareExportModal";
import AddToProjectMenu from "@/components/AddToProjectMenu";

const VARIATION_PRESETS = ["Bolder", "More minimal", "Friendlier tone", "More technical", "Different color direction", "Tighter / shorter"];

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "Logo", brand_guidelines: "Brand Guidelines", color_system: "Color System",
  font_system: "Font System", brand_voice: "Brand Voice", graphic: "Graphic",
  icon: "Icon", photo: "Photo", template: "Template", launch_copy: "Launch Copy",
  product_hunt_copy: "Product Hunt Copy", social_post: "Social Post", founder_bio: "Founder Bio",
  presentation: "Presentation", other: "Other",
};

const AssetDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [varyOpen, setVaryOpen] = useState(false);
  const [tweak, setTweak] = useState("");
  const [varying, setVarying] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState<{ needed?: number; remaining?: number } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    if (!id) return;
    const [a, v] = await Promise.all([
      supabase.from("assets").select("*").eq("id", id).maybeSingle(),
      supabase.from("asset_versions").select("id, label, created_at").eq("asset_id", id).order("created_at", { ascending: false }),
    ]);
    setAsset(a.data); setVersions(v.data || []); setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>;
  if (!asset) return <div className="p-10 text-center text-sm text-neutral-500">Asset not found.</div>;

  const isImage = !!asset.image_url;

  const startEdit = () => {
    setDraftTitle(asset.title || "");
    setDraftContent(asset.content || "");
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveEdit = async () => {
    setSavingEdit(true);
    // snapshot current as a version before overwriting
    await supabase.from("asset_versions").insert({
      asset_id: asset.id, user_id: asset.user_id, label: "Auto-saved before edit",
      snapshot: { editor_state: asset.editor_state, content: asset.content, image_url: asset.image_url, title: asset.title },
    });
    const { error } = await supabase.from("assets").update({
      title: draftTitle.trim() || asset.title,
      content: draftContent,
    }).eq("id", asset.id);
    setSavingEdit(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
    setEditing(false);
    load();
  };

  const shareUrl = asset.share_token ? `${window.location.origin}/share/asset/${asset.share_token}` : null;

  const copy = () => { navigator.clipboard.writeText(asset.content || ""); toast({ title: "Copied" }); };
  const del = async () => {
    if (!confirm("Delete this asset?")) return;
    await supabase.from("assets").delete().eq("id", asset.id);
    nav("/assets");
  };

  const toggleShare = async () => {
    setSharing(true);
    if (asset.share_token) {
      await supabase.from("assets").update({ share_token: null }).eq("id", asset.id);
      toast({ title: "Share link disabled" });
    } else {
      const token = crypto.randomUUID();
      await supabase.from("assets").update({ share_token: token }).eq("id", asset.id);
    }
    await load();
    setSharing(false);
  };

  const createShareLink = async (): Promise<string | null> => {
    if (asset.share_token) return `${window.location.origin}/share/asset/${asset.share_token}`;
    const token = crypto.randomUUID();
    const { error } = await supabase.from("assets").update({ share_token: token }).eq("id", asset.id);
    if (error) return null;
    await load();
    return `${window.location.origin}/share/asset/${token}`;
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Share link copied" });
  };

  const restore = async (versionId: string) => {
    if (!confirm("Restore this version? Current state will be saved as a new version first.")) return;
    const { data: cur } = await supabase.from("assets").select("editor_state, content, image_url, title, user_id").eq("id", asset.id).maybeSingle();
    if (cur) {
      await supabase.from("asset_versions").insert({
        asset_id: asset.id, user_id: cur.user_id, label: "Auto-saved before restore",
        snapshot: { editor_state: cur.editor_state, content: cur.content, image_url: cur.image_url, title: cur.title },
      });
    }
    const { data: v } = await supabase.from("asset_versions").select("snapshot").eq("id", versionId).maybeSingle();
    if (v?.snapshot) {
      await supabase.from("assets").update({
        editor_state: v.snapshot.editor_state ?? null,
        content: v.snapshot.content ?? null,
        image_url: v.snapshot.image_url ?? null,
        title: v.snapshot.title ?? asset.title,
      }).eq("id", asset.id);
      toast({ title: "Version restored" });
      load();
    }
  };

  const generateVariation = async (preset?: string) => {
    const instruction = (preset || tweak).trim();
    if (!instruction) return;
    setVarying(true);
    try {
      const variationPrompt = `${asset.prompt || asset.title} — variation: ${instruction}`;
      const { data } = await supabase.functions.invoke("generate-asset", {
        body: { prompt: variationPrompt, asset_type: asset.asset_type, project_id: asset.project_id || undefined, count: 1 },
      });
      const d: any = data;
      if (d?.error === "no_credits") { setOutOfCredits({ needed: d.needed, remaining: d.remaining }); return; }
      if (d?.error) { toast({ title: "Failed", description: d.message || d.error, variant: "destructive" }); return; }
      const newId = d?.asset_ids?.[0];
      if (newId) { toast({ title: "Variation created" }); setVaryOpen(false); setTweak(""); nav(`/assets/${newId}`); }
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setVarying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Assets
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowVersions(v => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
            <History className="h-4 w-4" /> Versions {versions.length > 0 && <span className="rounded-full bg-neutral-100 px-1.5 text-[10px]">{versions.length}</span>}
          </button>
          <div className="relative">
            <button onClick={() => setVaryOpen(v => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
              <Wand2 className="h-4 w-4" /> Variation
            </button>
            {varyOpen && (
              <div className="absolute right-0 z-30 mt-1 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
                <div className="mb-2 text-xs font-medium text-neutral-700">Generate a variation</div>
                <div className="flex flex-wrap gap-1.5">
                  {VARIATION_PRESETS.map(p => (
                    <button key={p} disabled={varying} onClick={() => generateVariation(p)} className="rounded-full border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50">{p}</button>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <input value={tweak} onChange={e => setTweak(e.target.value)} placeholder="Custom tweak…" disabled={varying} className="flex-1 rounded-md border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-brand" />
                  <button onClick={() => generateVariation()} disabled={varying || !tweak.trim()} className="rounded-md bg-brand px-2 py-1 text-xs text-brand-foreground disabled:opacity-50">
                    {varying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Go"}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-neutral-500">Creates a new asset, original is preserved.</p>
              </div>
            )}
          </div>
          <button onClick={() => setShareOpen(true)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm ${asset.share_token ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}>
            <Share2 className="h-4 w-4" /> Share & export
          </button>
          <AddToProjectMenu assetId={asset.id} currentProjectId={asset.project_id} onChanged={(pid) => setAsset((a: any) => ({ ...a, project_id: pid }))} />
          {asset.share_token && (
            <button onClick={toggleShare} disabled={sharing} title="Disable public link" className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white p-2 text-xs text-neutral-500 hover:bg-neutral-50">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          )}
          <Link to={`/editor?id=${asset.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
            <Edit3 className="h-4 w-4" /> Open in Editor
          </Link>
          {isImage && (
            <a href={asset.image_url} download className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
              <Download className="h-4 w-4" />
            </a>
          )}
          {!isImage && (
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50">
              <Copy className="h-4 w-4" />
            </button>
          )}
          <button onClick={del} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="flex-1 truncate font-mono text-emerald-900">{shareUrl}</span>
          <button onClick={copyShare} className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs hover:bg-emerald-100">Copy</button>
        </div>
      )}

      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-neutral-500">{ASSET_TYPE_LABELS[asset.asset_type]}</div>
        <h1 className="mt-1 text-2xl font-semibold">{asset.title}</h1>
        {asset.prompt && <p className="mt-1 text-sm text-neutral-500">Prompt: {asset.prompt}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {isImage ? (
            <div className="flex items-center justify-center bg-neutral-50 p-8">
              <img src={asset.image_url} alt={asset.title} className="max-h-[640px] w-auto" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap p-8 font-sans text-sm leading-relaxed text-neutral-800">{asset.content || ""}</pre>
          )}
        </div>

        {showVersions && (
          <aside className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Version history</h3>
            </div>
            {versions.length === 0 ? (
              <p className="text-xs text-neutral-500">No saved versions yet. Use "Save version" in the editor to snapshot your work.</p>
            ) : (
              <ul className="space-y-2">
                {versions.map(v => (
                  <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{v.label || "Snapshot"}</div>
                      <div className="text-[10px] text-neutral-500">{new Date(v.created_at).toLocaleString()}</div>
                    </div>
                    <button onClick={() => restore(v.id)} title="Restore" className="rounded-md border border-neutral-200 p-1 hover:bg-neutral-50">
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>

      <OutOfCreditsModal open={!!outOfCredits} onClose={() => setOutOfCredits(null)} needed={outOfCredits?.needed} remaining={outOfCredits?.remaining} />
      <ShareExportModal open={shareOpen} onOpenChange={setShareOpen} asset={asset} onCreateShareLink={createShareLink} />
    </div>
  );
};

export default AssetDetail;
