import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import AssetVisual, { hasVisualRenderer } from "@/components/visuals/AssetVisual";
import BrandContextStrip from "@/components/BrandContextStrip";
import { Maximize2, Minimize2 } from "lucide-react";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const supabase = _sb as any;

const SharedAsset = () => {
  const { token } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const togglePresent = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase.rpc("get_shared_asset", { _token: token });
      setAsset(data);
      setLoading(false);
    })();
  }, [token]);

  if (loading)
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  if (!asset)
    return <div className="p-10 text-center text-sm text-neutral-500">This share link is invalid or has been disabled.</div>;

  const visual = hasVisualRenderer(asset);
  const isPresentation = asset.asset_type === "presentation";
  const ctx = asset?.meta?.brand_context || {};
  const metaDesc = ctx.oneLiner || ctx.tagline || ctx.positioning || (asset.content ? String(asset.content).slice(0, 160) : "Made with Rocket");
  useDocumentMeta({
    title: `${asset.title} · ${ctx.productName || "Rocket"}`,
    description: metaDesc,
    image: asset.image_url || ctx.logo || ctx.screenshot || null,
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-semibold tracking-tight">Rocket</Link>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-xs uppercase tracking-wider text-neutral-500">{String(asset.asset_type || "").replace(/_/g, " ")}</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">{asset.title}</h1>

        {asset?.meta?.brand_context && (
          <div className="mt-6">
            <BrandContextStrip ctx={asset.meta.brand_context} compact />
          </div>
        )}

        {isPresentation && (
          <div className="mt-6">
            <button
              onClick={togglePresent}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
            >
              {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFs ? "Exit present" : "Present fullscreen"}
            </button>
          </div>
        )}

        <div ref={stageRef} className={`mt-8 ${isFs ? "grid h-screen w-screen place-items-center bg-black p-6" : ""}`}>
          {visual ? (
            <AssetVisual asset={asset} />
          ) : asset.image_url ? (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-center bg-neutral-50 p-8">
                <img src={asset.image_url} alt={asset.title} className="max-h-[640px] w-auto" />
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <pre className="whitespace-pre-wrap p-8 font-sans text-sm leading-relaxed text-neutral-800">{asset.content || ""}</pre>
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-neutral-400">
          Made with <Link to="/" className="underline">Rocket</Link>
        </p>
      </main>
    </div>
  );
};

export default SharedAsset;