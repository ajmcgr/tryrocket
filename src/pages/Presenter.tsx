import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { tryJson, type PresentationData } from "@/lib/assetSchemas";
import ScaledSlide, { SlideStage } from "@/components/slides/ScaledSlide";
import SlideRenderer from "@/components/slides/SlideRenderer";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Grid3x3, Maximize2, Minimize2, X,
  Download, StickyNote, Loader2, GripVertical,
} from "lucide-react";
import { exportAsset } from "@/lib/exporters";
import { toast } from "@/hooks/use-toast";

const supabase = _sb as any;

export default function Presenter() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const slideParam = parseInt(params.get("slide") || "0", 10);

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gridOpen, setGridOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);
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

  const persistSlides = async (nextSlides: PresentationData["slides"]) => {
    if (!asset || !data) return;
    setSavingOrder(true);
    const nextContent = JSON.stringify({ ...data, slides: nextSlides }, null, 2);
    const optimistic = { ...asset, content: nextContent };
    setAsset(optimistic);
    const { error } = await supabase.from("assets").update({ content: nextContent }).eq("id", asset.id);
    setSavingOrder(false);
    if (error) toast({ title: "Could not save order", description: error.message, variant: "destructive" });
  };

  const reorder = async (from: number, to: number) => {
    if (from === to || !data) return;
    const copy = slides.slice();
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m);
    await persistSlides(copy);
    // Keep currently-viewed slide stable when it moves.
    if (idx === from) setSlide(to);
    else if (from < idx && to >= idx) setSlide(idx - 1);
    else if (from > idx && to <= idx) setSlide(idx + 1);
  };

  const doExport = async (format: "pdf" | "pptx") => {
    if (!asset) return;
    setExporting(format);
    try {
      await exportAsset({ id: asset.id, title: asset.title, content: asset.content, asset_type: asset.asset_type }, format);
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setExporting(null);
    }
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
      else if (e.key.toLowerCase() === "n") { setNotesOpen((v) => !v); }
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
  const noteBullets = slide?.bullets || [];

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
            {savingOrder && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving order…
              </span>
            )}
            <button
              onClick={() => setNotesOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                notesOpen ? "border-brand/50 bg-brand/15 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
              title="Notes (N)"
            >
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </button>
            <button
              onClick={() => setGridOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              title="Grid overview (G)"
            >
              <Grid3x3 className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => doExport("pdf")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
              title="Export PDF"
            >
              {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
            </button>
            <button
              onClick={() => doExport("pptx")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
              title="Export PPTX"
            >
              {exporting === "pptx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PPTX
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
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col items-center justify-center p-4 pt-16">
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

          {/* Notes panel */}
          {!isFullscreen && notesOpen && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/85">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-widest text-white/50">Presenter notes · Slide {idx + 1}</div>
                <div className="text-[11px] text-white/40">Press N to toggle</div>
              </div>
              <div className="text-base font-medium text-white">{slide?.title}</div>
              {slide?.purpose && <p className="mt-2 text-sm text-white/70">{slide.purpose}</p>}
              {noteBullets.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-white/75">
                  {noteBullets.map((b, i) => (
                    <li key={i} className="flex gap-2"><span className="text-white/40">•</span><span>{b}</span></li>
                  ))}
                </ul>
              )}
              {slide?.visual_guidance && (
                <div className="mt-3 border-t border-white/10 pt-3 text-xs italic text-white/50">
                  Visual direction · {slide.visual_guidance}
                </div>
              )}
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
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-white">All slides · {total}</div>
              <div className="text-[11px] text-white/50">Drag cards to reorder</div>
              {savingOrder && <Loader2 className="h-3 w-3 animate-spin text-white/50" />}
            </div>
            <button
              onClick={() => setGridOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3 lg:grid-cols-4">
            {slides.map((s, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); }}
                onDragEnd={() => setDragIdx(null)}
                className={`group relative overflow-hidden rounded-xl border text-left transition ${
                  i === idx ? "border-brand ring-2 ring-brand/40" : "border-white/10 hover:border-white/30"
                } ${dragIdx === i ? "opacity-50" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => { setSlide(i); setGridOpen(false); }}
                  className="block w-full text-left"
                >
                  <SlideStage className="bg-white">
                    <ScaledSlide>
                      <SlideRenderer slide={s} index={i} total={total} brand={brand} />
                    </ScaledSlide>
                  </SlideStage>
                  <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 text-[11px] text-white/70">
                    <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="ml-2 truncate">{s.title}</span>
                  </div>
                </button>
                <div
                  className="absolute left-2 top-2 cursor-grab rounded-md bg-black/60 p-1 text-white/70 opacity-0 backdrop-blur transition group-hover:opacity-100"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}