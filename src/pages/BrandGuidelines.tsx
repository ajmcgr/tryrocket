import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Logotype } from "@/components/Logotype";
import { defaultLogotypeState, LOGOTYPE_FONTS, loadGoogleFont, type LogotypeState } from "@/lib/logotype";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { loadBrandMeta } from "@/lib/brandMeta";
import { useSubscription } from "@/hooks/useSubscription";

const supabase = _sb as any;

function hexToRgb(hex: string) {
  const m = /^#?([a-f0-9]{6})$/i.exec(hex.trim());
  if (!m) return { r: 10, g: 10, b: 10 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount)));
  const to = (c: number) => c.toString(16).padStart(2, "0");
  return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
}

export default function BrandGuidelines() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPro, loading: subLoading } = useSubscription();
  const [project, setProject] = useState<any>(null);
  const [logoAsset, setLogoAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const requirePro = () => {
    if (!subLoading && !isPro) {
      toast({
        title: "Pro feature",
        description: "Brand Book downloads are available on the Pro plan. Upgrade to download PDF and PNG exports.",
      });
      navigate("/pricing");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: proj }, assetsRes] = await Promise.all([
        supabase.from("projects").select("id,name,tagline").eq("id", projectId).maybeSingle(),
        supabase
          .from("assets")
          .select("id,title,asset_type,editor_state,image_url,thumbnail_url,meta,created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (cancelled) return;
      setProject(proj || null);
      const all = (assetsRes?.data || []) as any[];
      // Match Brand Kit view: only assets the user explicitly saved into the kit.
      const saved = all.filter((a) => Boolean(a?.meta?.saved_at));
      const withState = saved.find((a: any) => a?.editor_state?.kind === "logotype");
      const withImage = saved.find((a: any) => a?.image_url || a?.thumbnail_url);
      setLogoAsset(withState || withImage || saved[0] || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => { LOGOTYPE_FONTS.forEach((f) => loadGoogleFont(f.family, f.weights)); }, []);

  const brandColor = useMemo(() => {
    const meta = loadBrandMeta(projectId);
    const c = String(meta.brand_color || "").trim();
    return /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#0A0A0A";
  }, [project, projectId]);

  const logoIsImage = !logoAsset?.editor_state && Boolean(logoAsset?.image_url || logoAsset?.thumbnail_url);
  const logoImageUrl = logoAsset?.image_url || logoAsset?.thumbnail_url;

  const baseState = useMemo<LogotypeState>(() => {
    if (logoAsset?.editor_state?.kind === "logotype") {
      return logoAsset.editor_state as LogotypeState;
    }
    return defaultLogotypeState(project?.name || "Brand");
  }, [logoAsset, project]);

  const isDark = luminance(brandColor) < 0.4;
  const onBrandText = isDark ? "#ffffff" : "#0A0A0A";

  const palette = useMemo(() => {
    return [
      { name: "Primary", hex: brandColor },
      { name: "Deep", hex: shade(brandColor, -40) },
      { name: "Soft", hex: shade(brandColor, 40) },
      { name: "Ink", hex: "#0A0A0A" },
      { name: "Paper", hex: "#F5F5F4" },
    ];
  }, [brandColor]);

  const currentFont = loadBrandMeta(projectId).font || baseState.font || "Inter";
  const fontMeta = LOGOTYPE_FONTS.find((f) => f.family.toLowerCase() === currentFont.toLowerCase());

  const download = async () => {
    if (requirePro()) return;
    if (!pageRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(pageRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      const safe = (project?.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.href = dataUrl;
      a.download = `${safe}-brand-guidelines.png`;
      a.click();
      toast({ title: "Brand guidelines downloaded" });
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (requirePro()) return;
    if (!pageRef.current) return;
    setBusyPdf(true);
    try {
      const dataUrl = await toPng(pageRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pageH);
      const safe = (project?.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      pdf.save(`${safe}-brand-guidelines.pdf`);
      toast({ title: "Brand guidelines PDF downloaded" });
    } catch (e: any) {
      toast({ title: "PDF export failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusyPdf(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Brand Book</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            A one-page brand book that pulls together your logo, colors, and typography.
          </p>
        </div>
        <button
          onClick={downloadPdf}
          disabled={busyPdf || loading || subLoading}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
        >
          {busyPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
          {!subLoading && !isPro && (
            <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Pro</span>
          )}
        </button>
        <button
          onClick={download}
          disabled={busy || loading || subLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PNG
          {!subLoading && !isPro && (
            <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Pro</span>
          )}
        </button>
      </div>

      {loading ? (
        <Skeleton className="aspect-[8.5/11] w-full rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
          <div
            ref={pageRef}
            className="mx-auto aspect-[8.5/11] w-full bg-white p-10"
            style={{ maxWidth: 900 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Brand Book</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{project?.name || "Brand"}</div>
                {project?.tagline ? (
                  <div className="mt-1 text-sm text-neutral-500">{project.tagline}</div>
                ) : null}
              </div>
              <div className="text-right text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                v1.0<br />
                {new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </div>
            </div>

            {/* Logo showcase */}
            <section className="mt-8">
              <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">Logo</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-200 bg-white px-6">
                  {logoIsImage ? (
                    <img src={logoImageUrl} alt="Logo" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <Logotype state={baseState} fit="contain" />
                  )}
                </div>
                <div className="flex h-40 items-center justify-center rounded-xl px-6" style={{ background: brandColor }}>
                  {logoIsImage ? (
                    <img src={logoImageUrl} alt="Logo" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <Logotype state={{ ...baseState, color: onBrandText }} fit="contain" />
                  )}
                </div>
              </div>
            </section>

            {/* Palette */}
            <section className="mt-8">
              <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">Color palette</div>
              <div className="grid grid-cols-5 gap-3">
                {palette.map((c) => (
                  <div key={c.name} className="overflow-hidden rounded-xl border border-neutral-200">
                    <div className="h-16 w-full" style={{ background: c.hex }} />
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] font-semibold text-neutral-900">{c.name}</div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Typography */}
            <section className="mt-8">
              <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">Typography</div>
              <div className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-baseline justify-between">
                  <div className="text-4xl tracking-tight text-neutral-900" style={{ fontFamily: `'${currentFont}', system-ui` }}>
                    {currentFont}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    {fontMeta?.category || "sans"}
                  </div>
                </div>
                <div className="mt-3 text-neutral-700" style={{ fontFamily: `'${currentFont}', system-ui` }}>
                  Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789
                </div>
                <div className="mt-3 text-sm text-neutral-500" style={{ fontFamily: `'${currentFont}', system-ui` }}>
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-4 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              <span>{project?.name || "Brand"} · Brand Book</span>
              <span>Made with Rocket</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}