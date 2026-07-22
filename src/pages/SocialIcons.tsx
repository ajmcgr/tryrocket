import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Logotype, logotypeToPng } from "@/components/Logotype";
import { defaultLogotypeState, type LogotypeState } from "@/lib/logotype";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

const supabase = _sb as any;

type Shape = "circle" | "rounded" | "square";

type Variant = {
  key: string;
  label: string;
  shape: Shape;
  bg: string;
  fg: string;
  border?: boolean;
};

const buildVariants = (brandColor: string): Variant[] => [
  { key: "circle-brand", label: "Circle · Brand", shape: "circle", bg: brandColor, fg: "#FFFFFF" },
  { key: "circle-white", label: "Circle · Light", shape: "circle", bg: "#FFFFFF", fg: brandColor, border: true },
  { key: "circle-black", label: "Circle · Dark", shape: "circle", bg: "#0A0A0A", fg: "#FFFFFF" },
  { key: "rounded-brand", label: "Rounded · Brand", shape: "rounded", bg: brandColor, fg: "#FFFFFF" },
  { key: "rounded-white", label: "Rounded · Light", shape: "rounded", bg: "#FFFFFF", fg: brandColor, border: true },
  { key: "rounded-black", label: "Rounded · Dark", shape: "rounded", bg: "#0A0A0A", fg: "#FFFFFF" },
  { key: "square-brand", label: "Square · Brand", shape: "square", bg: brandColor, fg: "#FFFFFF" },
  { key: "square-white", label: "Square · Light", shape: "square", bg: "#FFFFFF", fg: brandColor, border: true },
];

const safeName = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "icon";

function shapeRadius(shape: Shape, size: number) {
  if (shape === "circle") return size / 2;
  if (shape === "rounded") return Math.round(size * 0.22);
  return 0;
}

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function renderIconPng(state: LogotypeState, v: Variant, size = 1024): Promise<Blob> {
  const logoUrl = await logotypeToPng({ ...state, color: v.fg }, 4);
  const img = await loadImage(logoUrl);
  return await composeIcon(img, v, size);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = src; });
  return img;
}

async function renderImageIconPng(src: string, v: Variant, size = 1024): Promise<Blob> {
  const img = await loadImage(src);
  return await composeIcon(img, v, size);
}

async function composeIcon(img: HTMLImageElement, v: Variant, size: number): Promise<Blob> {

  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = shapeRadius(v.shape, size);

  // shape path
  ctx.beginPath();
  if (v.shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else if (v.shape === "rounded") {
    const rr = r;
    ctx.moveTo(rr, 0);
    ctx.lineTo(size - rr, 0);
    ctx.quadraticCurveTo(size, 0, size, rr);
    ctx.lineTo(size, size - rr);
    ctx.quadraticCurveTo(size, size, size - rr, size);
    ctx.lineTo(rr, size);
    ctx.quadraticCurveTo(0, size, 0, size - rr);
    ctx.lineTo(0, rr);
    ctx.quadraticCurveTo(0, 0, rr, 0);
  } else {
    ctx.rect(0, 0, size, size);
  }
  ctx.closePath();
  ctx.fillStyle = v.bg;
  ctx.fill();

  // fit logo with padding
  const pad = Math.round(size * 0.18);
  const maxW = size - pad * 2;
  const maxH = size - pad * 2;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
}

export default function SocialIcons() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [logoAssets, setLogoAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: proj }, { data: assets }] = await Promise.all([
        supabase.from("projects").select("id,name,brand_color").eq("id", projectId).maybeSingle(),
        supabase
          .from("assets")
          .select("id,title,asset_type,editor_state,image_url,thumbnail_url,meta,created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (cancelled) return;
      setProject(proj || null);
      // Mirror the Brand Kit filter: only designs the user explicitly saved.
      const kit = (assets || []).filter((a: any) => Boolean(a?.meta?.saved_at));
      setLogoAssets(kit);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const brandColor = useMemo(() => {
    const c = String(project?.brand_color || "").trim();
    return /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#1676e3";
  }, [project]);

  const variants = useMemo(() => buildVariants(brandColor), [brandColor]);

  const { isPro, loading: subLoading } = useSubscription();
  const requirePro = () => {
    if (!subLoading && !isPro) {
      toast({
        title: "Upgrade to Pro to download",
        description: "Social icon downloads are available on the Pro plan.",
      });
      return true;
    }
    return false;
  };

  const stateForAsset = (asset: any): LogotypeState => {
    if (asset?.editor_state?.kind === "logotype") return asset.editor_state as LogotypeState;
    return defaultLogotypeState(asset?.title || project?.name || "Brand");
  };
  const imageSrcForAsset = (asset: any): string | null => {
    if (asset?.editor_state?.kind === "logotype") return null;
    return asset?.image_url || asset?.thumbnail_url || null;
  };
  const renderVariantForAsset = async (asset: any, v: Variant): Promise<Blob> => {
    const src = imageSrcForAsset(asset);
    if (src) return renderImageIconPng(src, v);
    return renderIconPng(stateForAsset(asset), v);
  };
  const assetLabel = (asset: any) =>
    asset?.title || (asset?.editor_state?.kind === "logotype" ? asset.editor_state.text : null) || project?.name || "Brand";

  const handleDownload = async (asset: any, v: Variant) => {
    if (requirePro()) return;
    const key = `${asset.id}:${v.key}`;
    setBusy(key);
    try {
      const blob = await renderVariantForAsset(asset, v);
      downloadBlob(blob, `${safeName(assetLabel(asset))}-social-${v.key}.png`);
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    if (requirePro()) return;
    setBusy("all");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const asset of logoAssets) {
        const folder = zip.folder(safeName(assetLabel(asset))) || zip;
        for (const v of variants) {
          const blob = await renderVariantForAsset(asset, v);
          folder.file(`${safeName(assetLabel(asset))}-social-${v.key}.png`, blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${safeName(project?.name || "brand")}-social-icons.zip`);
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Social Icons</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Download square profile icons sized for social media in every shape and color.
          </p>
        </div>
        {logoAssets.length > 0 ? (
          <button
            onClick={downloadAll}
            disabled={busy === "all"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover disabled:opacity-60"
          >
            {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download all
            {!subLoading && !isPro && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">PRO</span>
            )}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      ) : logoAssets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-sm text-neutral-600">No logo saved for this brand yet.</p>
          <Link
            to="/wizard"
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
          >
            Generate a logo
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {logoAssets.map((asset) => {
            const imgSrc = imageSrcForAsset(asset);
            const state = stateForAsset(asset);
            return (
              <section key={asset.id}>
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                  {assetLabel(asset)}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {variants.map((v) => {
                    const isDark = v.bg !== "#FFFFFF";
                    const radius = v.shape === "circle" ? "9999px" : v.shape === "rounded" ? "22%" : "0px";
                    const iconState: LogotypeState = { ...state, color: v.fg };
                    const bkey = `${asset.id}:${v.key}`;
                    return (
                      <div
                        key={v.key}
                        className={`relative overflow-hidden shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)] ${v.border ? "ring-1 ring-neutral-200" : ""}`}
                        style={{ backgroundColor: v.bg, borderRadius: radius, aspectRatio: "1 / 1" }}
                      >
                        <div className="flex h-full w-full items-center justify-center p-[18%]">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt=""
                              className="max-h-full max-w-full object-contain"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <Logotype state={iconState} fit="contain" />
                          )}
                        </div>
                        <div className="pointer-events-none absolute left-3 top-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isDark ? "bg-black/25 text-white" : "bg-neutral-100 text-neutral-700"}`}>
                            {v.label}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                          <button
                            onClick={() => handleDownload(asset, v)}
                            disabled={busy === bkey}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                              isDark ? "bg-white/95 text-neutral-900 hover:bg-white" : "bg-neutral-900 text-white hover:bg-neutral-800"
                            } disabled:opacity-60`}
                          >
                            {busy === bkey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            PNG
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}