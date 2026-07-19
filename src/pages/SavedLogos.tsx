import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logotype } from "@/components/Logotype";
import CanvasAssetPreview from "@/components/CanvasAssetPreview";
import { isCanvasAsset } from "@/lib/canvasAsset";
import { AssetGridSkeleton } from "@/components/Skeletons";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const supabase = _sb as any;
const LOGO_TYPES = ["logo", "logotype", "wordmark", "brandmark"] as const;

const SavedLogos = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("assets")
        .select("id,title,asset_type,image_url,thumbnail_url,editor_state,meta,prompt,created_at,updated_at")
        .eq("user_id", user.id)
        .in("asset_type", LOGO_TYPES as unknown as string[])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(240);
      if (!cancelled) {
        setItems(data || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Saved logos</h1>
          <p className="mt-1 text-sm text-neutral-600">Every logo concept you've generated.</p>
        </div>
        <Button asChild className="h-10">
          <Link to="/create">
            <Sparkles className="mr-1.5 h-4 w-4" /> New logo
          </Link>
        </Button>
      </div>

      {loading ? (
        <AssetGridSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm text-neutral-600">You haven't saved any logos yet.</p>
          <Button asChild className="mt-4">
            <Link to="/create">Create your first logo <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/editor?id=${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md"
            >
              <div className="flex aspect-square items-center justify-center bg-neutral-50 p-4">
                {a.editor_state?.kind === "logotype" ? (
                  <Logotype state={a.editor_state} fit="contain" />
                ) : isCanvasAsset(a) ? (
                  <CanvasAssetPreview elements={(a.editor_state as any) || []} />
                ) : a.image_url || a.thumbnail_url ? (
                  <img src={a.thumbnail_url || a.image_url} alt={a.title || "Logo"} className="max-h-full max-w-full object-contain" loading="lazy" />
                ) : (
                  <span className="text-xs text-neutral-400">No preview</span>
                )}
              </div>
              <div className="border-t border-neutral-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-neutral-900">{a.title || "Untitled logo"}</p>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  {new Date(a.updated_at || a.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedLogos;