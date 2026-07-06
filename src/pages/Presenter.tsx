import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { tryJson, type PresentationData } from "@/lib/assetSchemas";
import ScaledSlide, { SlideStage } from "@/components/slides/ScaledSlide";
import SlideRenderer from "@/components/slides/SlideRenderer";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Grid3x3, Maximize2, Minimize2, X,
} from "lucide-react";

const supabase = _sb as any;

export default function Presenter() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const slideParam = parseInt(params.get("slide") || "0", 10);

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gridOpen, setGridOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase.from("assets").select("*").eq("id", id).maybeSingle().then((r: any) => {
      setAsset(r.data); setLoading(false);
    });
  }, [id]);

  const data: PresentationData | null = useMemo(() => {
    const parsed = tryJson<PresentationData>(asset?.content || "");
    return parsed?.slides ? parsed : null;
  }, [asset]);

  const slides = data?.slides || [];
  const total = slides.length;
  const idx = Math.max(0, Math.min(total - 1, isNaN(slideParam) ? 0 : slideParam));

  const brand = useMemo(() => {
    const ctx = asset?.meta?.brand_context || {};
    return { name: ctx.productName || asset?.title, primary: ctx.colors?.[0] };
  }, [asset]);

  const setSlide = (n: number) => {
    const bounded = Math.max(0, Math.min(total - 1, n));
    const next = new URLSearchParams(params);
    next.set("slide", String(bounded));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (total > 0) {
      const t = slides[idx]?.title || "Presentation";
      document.title = `${idx + 1}/${total} — ${t}`;
    }
  }, [idx, total, slides]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); setSlide(idx + 1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); setSlide(idx - 1); }
      else if (e.key === "Home") { e.preventDefault(); setSlide(0); }
      else if (e.key === "End") { e.preventDefault(); setSlide(total - 1); }
      else if (e.key.toLowerCase() === "g") { setGridOpen((v) => !v); }
      else if (e.key === "f" || e.key === "F5") { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === "Escape") { if (gridOpen) setGridOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, total, gridOpen]);

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (loading) return <div className="grid min-h-screen place-items-center bg-neutral-950 text-sm text-neutral-400">Loading…</div>;
  if (!asset) return <div className="grid min-h-screen place-items-center bg-neutral-950 text-sm text-neutral-400">Presentation not found.</div>;
  if (!data) return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 p-10 text-center text-sm text-neutral-400">
      This asset didn't parse as a presentation.
      <Link to={`/assets/${asset.id}`} className="ml-2 text-brand underline">Back to asset</Link>
    </div>
  );

  const slide = slides[idx];

  return (
    <div ref={rootRef} className="relative min-h-screen bg-neutral-950">
      {/* Top bar */}
      {!isFullscreen && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3">
          <Link
            to={`/assets/${asset.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGridOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              title="Grid overview (G)"
            >
              <Grid3x3 className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isFullscreen ? "Exit" : "Present"}
            </button>
          </div>
        </div>
      )}

      {/* Stage */}
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center p-4 pt-16">
        <div className="w-full">
          <SlideStage className="rounded-2xl border border-white/10 bg-white shadow-2xl">
            <ScaledSlide>
              <SlideRenderer slide={slide} index={idx} total={total} brand={brand} />
            </ScaledSlide>
          </SlideStage>

          {/* Nav bar */}
          {!isFullscreen && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setSlide(idx - 1)}
                disabled={idx === 0}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="text-xs tabular-nums text-white/60">{idx + 1} / {total}</span>
              <button
                onClick={() => setSlide(idx + 1)}
                disabled={idx >= total - 1}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen overlay: black bg + slide only */}
      {isFullscreen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black">
          <div className="h-screen w-screen">
            <SlideStage className="h-full w-full">
              <ScaledSlide>
                <SlideRenderer slide={slide} index={idx} total={total} brand={brand} />
              </ScaledSlide>
            </SlideStage>
          </div>
        </div>
      )}

      {/* Grid overlay */}
      {gridOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-neutral-950/95 backdrop-blur">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-950/80 px-6 py-4">
            <div className="text-sm font-medium text-white">All slides · {total}</div>
            <button
              onClick={() => setGridOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3 lg:grid-cols-4">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => { setSlide(i); setGridOpen(false); }}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  i === idx ? "border-brand ring-2 ring-brand/40" : "border-white/10 hover:border-white/30"
                }`}
              >
                <SlideStage className="bg-white">
                  <ScaledSlide>
                    <SlideRenderer slide={s} index={i} total={total} brand={brand} />
                  </ScaledSlide>
                </SlideStage>
                <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 text-[11px] text-white/70">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="ml-2 truncate">{s.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}