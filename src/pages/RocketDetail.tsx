import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase = _sb as any;
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Save, ExternalLink, Loader2, Download, Rocket as RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GROUPS: { key: string; title: string; prefixes: string[] }[] = [
  { key: "positioning", title: "Positioning", prefixes: ["positioning_"] },
  { key: "audience", title: "Audience", prefixes: ["audience_"] },
  { key: "founder", title: "Founder Profile", prefixes: ["founder_"] },
  { key: "launch", title: "Launch Copy", prefixes: ["launch_"] },
  { key: "social", title: "Social Content", prefixes: ["social_"] },
  { key: "strategy", title: "Launch Strategy", prefixes: ["strategy_"] },
  { key: "checklist", title: "Launch Checklist", prefixes: ["checklist_"] },
];

const DIRECTORIES: { name: string; href: (name: string, url: string, tagline: string) => string }[] = [
  { name: "Product Hunt", href: (n, u) => `https://www.producthunt.com/posts/new?url=${encodeURIComponent(u)}&name=${encodeURIComponent(n)}` },
  { name: "G2", href: () => "https://www.g2.com/products/new" },
  { name: "There's An AI For That", href: () => "https://theresanaiforthat.com/submit/" },
  { name: "Hacker News (Show HN)", href: (n, u) => `https://news.ycombinator.com/submit?t=${encodeURIComponent(`Show HN: ${n}`)}&u=${encodeURIComponent(u)}` },
  { name: "Peerlist", href: () => "https://peerlist.io/projects/launch" },
  { name: "BetaList", href: () => "https://betalist.com/submit" },
  { name: "Uneed", href: () => "https://www.uneed.best/submit-a-tool" },
  { name: "Alternative.me", href: () => "https://alternative.me/submit/" },
  { name: "Indie Hackers", href: (n, u, t) => `https://www.indiehackers.com/new-post?title=${encodeURIComponent(`Launched: ${n} — ${t}`)}&body=${encodeURIComponent(`Just launched ${n}.\n\n${t}\n\n${u}`)}` },
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

  const copyGroup = (groupKey: string) => {
    const g = GROUPS.find((x) => x.key === groupKey);
    if (!g) return;
    const items = assets.filter((a) => g.prefixes.some((p) => a.asset_type.startsWith(p)));
    const text = items.map((a) => `## ${a.title}\n\n${a.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: `${g.title} copied` });
  };

  const exportMarkdown = () => {
    if (!rocket) return;
    let md = `# ${rocket.product_name}\n\n${rocket.product_url}\n\n`;
    GROUPS.forEach((g) => {
      const items = assets.filter((a) => g.prefixes.some((p) => a.asset_type.startsWith(p)));
      if (!items.length) return;
      md += `\n## ${g.title}\n\n`;
      items.forEach((a) => { md += `### ${a.title}\n\n${a.content}\n\n`; });
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rocket.product_name.replace(/\s+/g, "-").toLowerCase()}-rocket.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Markdown file downloaded." });
  };

  if (!rocket) return <div className="text-sm text-neutral-500">Loading…</div>;

  const tagline = assets.find((a) => a.asset_type === "positioning_tagline")?.content || "";

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link to="/projects" className="text-xs text-neutral-500 hover:text-neutral-900">← Projects</Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{rocket.product_name}</h1>
          <a href={rocket.product_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">{rocket.product_url} <ExternalLink className="h-3 w-3" /></a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-full" onClick={exportMarkdown}>
            <Download className="h-4 w-4" /> Export Markdown
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-full"><RocketIcon className="h-4 w-4" /> Launch to…</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Submit to a directory</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="https://trylaunch.ai" target="_blank" rel="noreferrer">
                  Launch <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {DIRECTORIES.map((d) => (
                <DropdownMenuItem key={d.name} asChild>
                  <a href={d.href(rocket.product_name, rocket.product_url, tagline)} target="_blank" rel="noreferrer">
                    {d.name} <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-10 space-y-12">
        {GROUPS.map((g) => {
          const items = assets.filter((a) => g.prefixes.some((p) => a.asset_type.startsWith(p)));
          if (!items.length) return null;
          return (
            <section key={g.key}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{g.title}</h2>
                <button onClick={() => copyGroup(g.key)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                  <Copy className="h-3.5 w-3.5" /> Copy section
                </button>
              </div>
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