import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Download, Edit3, RefreshCw, Trash2 } from "lucide-react";
const supabase = _sb as any;

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

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from("assets").select("*").eq("id", id).maybeSingle();
      setAsset(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>;
  if (!asset) return <div className="p-10 text-center text-sm text-neutral-500">Asset not found.</div>;

  const isImage = !!asset.image_url;

  const copy = () => {
    navigator.clipboard.writeText(asset.content || "");
    toast({ title: "Copied" });
  };
  const del = async () => {
    if (!confirm("Delete this asset?")) return;
    await supabase.from("assets").delete().eq("id", asset.id);
    nav("/assets");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Assets
        </Link>
        <div className="flex items-center gap-2">
          <Link to={`/editor?id=${asset.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
            <Edit3 className="h-4 w-4" /> Open in Editor
          </Link>
          {isImage && (
            <a href={asset.image_url} download className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50">
              <Download className="h-4 w-4" /> Download
            </a>
          )}
          {!isImage && (
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50">
              <Copy className="h-4 w-4" /> Copy
            </button>
          )}
          <button onClick={del} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-neutral-500">{ASSET_TYPE_LABELS[asset.asset_type]}</div>
        <h1 className="mt-1 text-2xl font-semibold">{asset.title}</h1>
        {asset.prompt && <p className="mt-1 text-sm text-neutral-500">Prompt: {asset.prompt}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {isImage ? (
          <div className="flex items-center justify-center bg-neutral-50 p-8">
            <img src={asset.image_url} alt={asset.title} className="max-h-[640px] w-auto" />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap p-8 font-sans text-sm leading-relaxed text-neutral-800">{asset.content || ""}</pre>
        )}
      </div>
    </div>
  );
};

export default AssetDetail;
