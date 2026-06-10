import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Save, ExternalLink, Loader2 } from "lucide-react";

const GROUPS: { key: string; title: string; prefixes: string[] }[] = [
  { key: "positioning", title: "Positioning", prefixes: ["positioning_"] },
  { key: "audience", title: "Audience", prefixes: ["audience_"] },
  { key: "founder", title: "Founder Profile", prefixes: ["founder_"] },
  { key: "launch", title: "Launch Copy", prefixes: ["launch_"] },
  { key: "social", title: "Social Content", prefixes: ["social_"] },
  { key: "strategy", title: "Launch Strategy", prefixes: ["strategy_"] },
  { key: "checklist", title: "Launch Checklist", prefixes: ["checklist_"] },
];

const RocketDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [rocket, setRocket] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [regenId, setRegenId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [r, a] = await Promise.all([
        supabase.from("rockets").select("*").eq("id", id).maybeSingle(),
        supabase.from("rocket_assets").select("*").eq("rocket_id", id).order("created_at"),
      ]);
      setRocket(r.data);
      setAssets(a.data || []);
    })();
  }, [id]);

  const save = async (assetId: string, content: string) => {
    await supabase.from("rocket_assets").update({ content }).eq("id", assetId);
    toast({ title: "Saved" });
  };

  const regenerate = async (assetId: string) => {
    setRegenId(assetId);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-asset", { body: { asset_id: assetId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAssets((prev) => prev.map((x) => x.id === assetId ? { ...x, content: (data as any).content } : x));
      toast({ title: "Regenerated", description: "1 credit used." });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setRegenId(null); }
  };

  if (!rocket) return <div className="text-sm text-neutral-500">Loading…</div>;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs text-neutral-500 hover:text-neutral-900">← Dashboard</Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{rocket.product_name}</h1>
          <a href={rocket.product_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">{rocket.product_url} <ExternalLink className="h-3 w-3" /></a>
        </div>
        <a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Launch on TryLaunch.ai <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>

      <div className="mt-10 space-y-12">
        {GROUPS.map((g) => {
          const items = assets.filter((a) => g.prefixes.some((p) => a.asset_type.startsWith(p)));
          if (!items.length) return null;
          return (
            <section key={g.key}>
              <h2 className="text-xl font-semibold tracking-tight">{g.title}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((a) => (
                  <AssetCard key={a.id} asset={a} regenerating={regenId === a.id} onSave={save} onRegenerate={regenerate} onChange={(v) => setAssets((p) => p.map((x) => x.id === a.id ? { ...x, content: v } : x))} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const AssetCard = ({ asset, regenerating, onSave, onRegenerate, onChange }: any) => {
  const { toast } = useToast();
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{asset.title}</h3>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => { navigator.clipboard.writeText(asset.content); toast({ title: "Copied" }); }} label="Copy"><Copy className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn onClick={() => onSave(asset.id, asset.content)} label="Save"><Save className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn onClick={() => onRegenerate(asset.id)} label="Regenerate" disabled={regenerating}>
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </IconBtn>
        </div>
      </div>
      <textarea
        value={asset.content}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(12, Math.max(3, asset.content.split("\n").length + 1))}
        className="mt-3 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-neutral-800 outline-none ring-neutral-300 focus:bg-white focus:ring-2"
      />
    </div>
  );
};

const IconBtn = ({ children, label, ...props }: any) => (
  <button {...props} aria-label={label} className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50">{children}</button>
);

export default RocketDetail;