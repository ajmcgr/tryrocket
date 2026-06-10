import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase = _sb as any;
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Save, ExternalLink, Loader2, Download, Rocket as RocketIcon, FileText, FileArchive, Cloud, ChevronDown, Wand2, Image as ImageIcon, Megaphone, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Group = { key: string; title: string; prefixes: string[] };
const GROUPS: Group[] = [
  { key: "positioning",     title: "Positioning",              prefixes: ["positioning_"] },
  { key: "audience",        title: "Audience",                 prefixes: ["audience_"] },
  { key: "founder",         title: "Founder Profile",          prefixes: ["founder_bio", "founder_tagline", "founder_x_bio", "founder_linkedin"] },
  { key: "design_concepts", title: "Logo & Visual Concepts",   prefixes: ["design_image_"] },
  { key: "design_brief",    title: "Visual Style Brief",       prefixes: ["design_style_", "design_color_", "design_typography"] },
  { key: "launch",          title: "Launch Copy",              prefixes: ["launch_", "founder_story"] },
  { key: "social",          title: "Social Content",           prefixes: ["social_"] },
  { key: "promote",         title: "Outreach & PR",            prefixes: ["promote_"] },
  { key: "strategy",        title: "Launch Strategy",          prefixes: ["strategy_"] },
  { key: "checklist",       title: "Launch Checklist",         prefixes: ["checklist_"] },
];

const WORKFLOW_META: Record<string, { label: string; Icon: any }> = {
  brand:   { label: "Brand It",   Icon: Wand2 },
  design:  { label: "Design It",  Icon: ImageIcon },
  launch:  { label: "Launch It",  Icon: RocketIcon },
  promote: { label: "Promote It", Icon: Megaphone },
};

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
  const [driveLoading, setDriveLoading] = useState(false);

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
      const d = data as any;
      setAssets((prev) => prev.map((x) => x.id === assetId ? {
        ...x,
        ...(d.content !== undefined ? { content: d.content } : {}),
        ...(d.image_url ? { image_url: d.image_url, image_prompt: d.image_prompt ?? x.image_prompt } : {}),
      } : x));
      toast({ title: "Regenerated", description: "1 credit used." });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setRegenId(null); }
  };

  const regenerateVariation = async (assetId: string) => {
    setRegenId(assetId);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-asset", { body: { asset_id: assetId, variation: true } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const d = data as any;
      setAssets((prev) => prev.map((x) => x.id === assetId ? {
        ...x,
        ...(d.image_url ? { image_url: d.image_url, image_prompt: d.image_prompt ?? x.image_prompt } : {}),
      } : x));
      toast({ title: "Variation generated", description: "1 credit used." });
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
    const md = buildCombinedMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug()}-rocket.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Markdown file downloaded." });
  };

  const slug = () =>
    rocket?.product_name?.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-]/g, "") || "rocket";

  const buildCombinedMarkdown = () => {
    let md = `# ${rocket.product_name}\n\n${rocket.product_url}\n\n`;
    GROUPS.forEach((g) => {
      const items = assets.filter((a) => g.prefixes.some((p) => a.asset_type.startsWith(p)));
      if (!items.length) return;
      md += `\n## ${g.title}\n\n`;
      items.forEach((a) => {
        md += `### ${a.title}\n\n${a.content}\n\n`;
        if (a.kind === "image" && a.image_url) md += `![${a.title}](${a.image_url})\n\n`;
        if (a.kind === "image" && a.image_prompt) md += `**Prompt:** ${a.image_prompt}\n\n`;
      });
    });
    return md;
  };

  const buildZipBlob = async () => {
    const zip = new JSZip();
    const root = zip.folder(`${slug()}-rocket`)!;
    root.file("README.md", buildCombinedMarkdown());
    for (const g of GROUPS) {
      const items = assets.filter((a) => g.prefixes.some((p) => a.asset_type.startsWith(p)));
      if (!items.length) continue;
      const folder = root.folder(g.key)!;
      for (const a of items) {
        const fname = (a.title || a.asset_type).replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9\-]/g, "") + ".md";
        folder.file(fname, `# ${a.title}\n\n${a.content}\n`);
        if (a.kind === "image" && a.image_url) {
          try {
            const res = await fetch(a.image_url);
            const buf = await res.arrayBuffer();
            folder.file(fname.replace(/\.md$/, ".png"), buf);
          } catch (e) {
            console.error("zip fetch image failed", a.image_url, e);
          }
        }
      }
    }
    return zip.generateAsync({ type: "blob" });
  };

  const exportZip = async () => {
    if (!rocket) return;
    try {
      const blob = await buildZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug()}-rocket.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "ZIP file downloaded." });
    } catch (e: any) {
      toast({ title: "ZIP export failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const getGoogleAccessToken = async (clientId: string): Promise<string> => {
    // Load Google Identity Services script once
    if (!(window as any).google?.accounts?.oauth2) {
      await new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("gis-script");
        if (existing) { existing.addEventListener("load", () => resolve()); return; }
        const s = document.createElement("script");
        s.id = "gis-script";
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true; s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
        document.head.appendChild(s);
      });
    }
    return new Promise<string>((resolve, reject) => {
      const tc = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (resp: any) => {
          if (resp?.error) reject(new Error(resp.error_description || resp.error));
          else resolve(resp.access_token);
        },
      });
      tc.requestAccessToken({ prompt: "" });
    });
  };

  const exportToDrive = async () => {
    if (!rocket) return;
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      toast({
        title: "Google Drive not configured",
        description: "Add VITE_GOOGLE_CLIENT_ID (a Google OAuth Web Client ID) to enable Drive upload.",
        variant: "destructive",
      });
      return;
    }
    setDriveLoading(true);
    try {
      const token = await getGoogleAccessToken(clientId);
      const blob = await buildZipBlob();
      const metadata = { name: `${slug()}-rocket.zip`, mimeType: "application/zip" };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", blob);
      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Drive upload failed (${res.status}): ${text}`);
      }
      const data = await res.json();
      toast({
        title: "Saved to Google Drive",
        description: data.webViewLink ? "Click to open in Drive." : "Upload complete.",
      });
      if (data.webViewLink) window.open(data.webViewLink, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({ title: "Drive upload failed", description: e?.message || String(e), variant: "destructive" });
    } finally { setDriveLoading(false); }
  };

  if (!rocket) return <div className="text-sm text-neutral-500">Loading…</div>;

  const tagline = assets.find((a) => a.asset_type === "positioning_tagline")?.content || "";
  const workflowKey: string = rocket.workflow || "brand";
  const wfMeta = WORKFLOW_META[workflowKey] || WORKFLOW_META.brand;

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link to="/projects" className="text-xs text-neutral-500 hover:text-neutral-900">← Projects</Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{rocket.product_name}</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              <wfMeta.Icon className="h-3 w-3" /> {wfMeta.label}
            </span>
          </div>
          <a href={rocket.product_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">{rocket.product_url} <ExternalLink className="h-3 w-3" /></a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                {driveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={exportMarkdown}>
                <FileText className="mr-2 h-4 w-4" /> Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportZip}>
                <FileArchive className="mr-2 h-4 w-4" /> ZIP (.zip)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToDrive} disabled={driveLoading}>
                <Cloud className="mr-2 h-4 w-4" /> Send to Google Drive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          const hasImages = items.some((a) => a.kind === "image");
          return (
            <section key={g.key}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{g.title}</h2>
                <button onClick={() => copyGroup(g.key)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
                  <Copy className="h-3.5 w-3.5" /> Copy section
                </button>
              </div>
              <div className={`mt-4 grid grid-cols-1 gap-4 ${hasImages ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                {items.map((a) => (
                  a.kind === "image" ? (
                    <ImageAssetCard key={a.id} asset={a} regenerating={regenId === a.id} onRegenerate={regenerate} onVariation={regenerateVariation} />
                  ) : (
                    <AssetCard key={a.id} asset={a} regenerating={regenId === a.id} onSave={save} onRegenerate={regenerate} onChange={(v) => setAssets((p) => p.map((x) => x.id === a.id ? { ...x, content: v } : x))} />
                  )
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const ImageAssetCard = ({ asset, regenerating, onRegenerate, onVariation }: any) => {
  const { toast } = useToast();
  const downloadPng = async () => {
    if (!asset.image_url) return;
    try {
      const res = await fetch(asset.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${asset.title.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    }
  };
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold tracking-tight">{asset.title}</h3>
      <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
        {asset.image_url ? (
          <img src={asset.image_url} alt={asset.title} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-neutral-400">
            No image — try Regenerate
          </div>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-700 whitespace-pre-wrap">{asset.content}</p>
      {asset.image_prompt && (
        <details className="mt-2 text-[11px] text-neutral-500">
          <summary className="cursor-pointer hover:text-neutral-700">View AI prompt</summary>
          <p className="mt-1 rounded-md bg-neutral-50 p-2 font-mono text-[11px] leading-relaxed text-neutral-700">{asset.image_prompt}</p>
        </details>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        <IconBtn onClick={() => onRegenerate(asset.id)} label="Regenerate" disabled={regenerating}>
          {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn onClick={() => onVariation(asset.id)} label="Generate variation" disabled={regenerating}>
          <Shuffle className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn onClick={downloadPng} label="Download PNG" disabled={!asset.image_url}>
          <Download className="h-3.5 w-3.5" />
        </IconBtn>
        {asset.image_prompt && (
          <IconBtn onClick={() => { navigator.clipboard.writeText(asset.image_prompt); toast({ title: "Prompt copied" }); }} label="Copy prompt">
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
        )}
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