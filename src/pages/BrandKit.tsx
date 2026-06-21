import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { ArrowLeft, Download, FileDown, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
const supabase = _sb as any;
import { Skeleton } from "@/components/ui/skeleton";

const HEX_RE = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi;
const FONT_RE = /(?:font[-\s]?family|typeface|heading|body)\s*[:\-—]?\s*["']?([A-Z][A-Za-z0-9 ]{2,30})["']?/g;

function uniq<T>(a: T[]) { return Array.from(new Set(a)); }

const BrandKit = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [p, a] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("assets").select("*").eq("project_id", id).order("created_at", { ascending: true }),
      ]);
      setProject(p.data); setAssets(a.data || []); setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <div className="mx-auto max-w-5xl space-y-4 p-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
      </div>
    </div>
  );
  if (!project) return <div className="p-10 text-center text-sm text-neutral-500">Project not found.</div>;

  const logos = assets.filter(a => a.asset_type === "logo" && a.image_url);
  const graphics = assets.filter(a => ["graphic", "icon", "photo"].includes(a.asset_type) && a.image_url);
  const colorTexts = assets.filter(a => ["color_system", "brand_guidelines", "design_color_palette"].includes(a.asset_type)).map(a => a.content || "").join("\n");
  const colors = uniq((colorTexts.match(HEX_RE) || []).map(c => c.toLowerCase())).slice(0, 12);
  const fontTexts = assets.filter(a => ["font_system", "brand_guidelines", "design_typography"].includes(a.asset_type)).map(a => a.content || "").join("\n");
  const fonts = uniq(Array.from(fontTexts.matchAll(FONT_RE)).map(m => m[1].trim())).filter(f => f.length > 2).slice(0, 6);
  const voice = assets.find(a => a.asset_type === "brand_voice")?.content;
  const guidelines = assets.find(a => a.asset_type === "brand_guidelines")?.content;
  const tagline = assets.find(a => a.asset_type === "other" && /tagline/i.test(a.title))?.content;

  const exportPng = async () => {
    if (!sheetRef.current) return;
    setExporting("png");
    try {
      const dataUrl = await toPng(sheetRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-brand-kit.png`;
      link.href = dataUrl;
      link.click();
    } finally { setExporting(null); }
  };

  const exportPdf = async () => {
    if (!sheetRef.current) return;
    setExporting("pdf");
    try {
      const dataUrl = await toPng(sheetRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => (img.onload = r));
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const ratio = pageW / img.width;
      const h = img.height * ratio;
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;
      // Slice into pages
      while (y < h) {
        if (y > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, -y, pageW, h);
        y += pageH;
      }
      pdf.save(`${project.name.replace(/\s+/g, "-").toLowerCase()}-brand-kit.pdf`);
    } finally { setExporting(null); }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> {project.name}
        </Link>
        <div className="flex items-center gap-2">
          <button disabled={!!exporting} onClick={exportPng} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50">
            {exporting === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PNG
          </button>
          <button disabled={!!exporting} onClick={exportPdf} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover disabled:opacity-50">
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} PDF
          </button>
        </div>
      </div>

      <div ref={sheetRef} className="space-y-10 rounded-3xl border border-neutral-200 bg-white p-10">
        <header className="border-b border-neutral-200 pb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Brand Kit</div>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight">{project.name}</h1>
          {tagline && <p className="mt-3 text-lg text-neutral-600">{tagline}</p>}
          {project.description && !tagline && <p className="mt-3 text-lg text-neutral-600">{project.description}</p>}
        </header>

        {logos.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Logos</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {logos.map(l => (
                <div key={l.id} className="flex aspect-square items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
                  <img src={l.image_url} alt={l.title} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          </section>
        )}

        {colors.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Colors</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {colors.map(c => (
                <div key={c} className="overflow-hidden rounded-xl border border-neutral-200">
                  <div className="h-20 w-full" style={{ backgroundColor: c }} />
                  <div className="border-t border-neutral-100 px-3 py-2 text-xs font-mono">{c.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {fonts.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Typography</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fonts.map(f => (
                <div key={f} className="rounded-2xl border border-neutral-200 p-5">
                  <div className="text-xs text-neutral-500">{f}</div>
                  <div className="mt-1 text-3xl" style={{ fontFamily: `'${f}', system-ui, sans-serif` }}>The quick brown fox</div>
                  <div className="mt-1 text-sm text-neutral-600" style={{ fontFamily: `'${f}', system-ui, sans-serif` }}>jumps over the lazy dog 0123456789</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {voice && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Voice</h2>
            <div className="whitespace-pre-wrap rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm leading-relaxed text-neutral-800">{voice}</div>
          </section>
        )}

        {guidelines && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Guidelines</h2>
            <div className="whitespace-pre-wrap rounded-2xl border border-neutral-200 p-6 text-sm leading-relaxed text-neutral-800">{guidelines}</div>
          </section>
        )}

        {graphics.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Graphics</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {graphics.map(g => (
                <div key={g.id} className="overflow-hidden rounded-2xl border border-neutral-200">
                  <div className="aspect-square w-full bg-neutral-50">
                    <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="border-t border-neutral-100 px-3 py-2 text-xs truncate">{g.title}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {logos.length === 0 && colors.length === 0 && fonts.length === 0 && !voice && !guidelines && (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
            Generate brand assets (logo, colors, fonts, voice) in this project to populate the kit.
          </div>
        )}

        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400">
          Generated with Rocket · tryrocket.ai
        </footer>
      </div>
    </div>
  );
};

export default BrandKit;