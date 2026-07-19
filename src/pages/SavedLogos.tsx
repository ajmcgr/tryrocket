import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logotype } from "@/components/Logotype";
import CanvasAssetPreview from "@/components/CanvasAssetPreview";
import { isCanvasAsset } from "@/lib/canvasAsset";
import { AssetGridSkeleton } from "@/components/Skeletons";
import { Sparkles, ArrowRight, HeartOff, Globe, Lock, Pencil, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const supabase = _sb as any;
const LOGO_TYPES = ["logo", "logotype", "wordmark", "brandmark"] as const;

const SavedLogos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!cancelled) {
        setItems((data || []).filter((asset: any) => LOGO_TYPES.includes(String(asset?.asset_type || "").toLowerCase() as any) || Boolean(asset?.meta?.saved_at)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const updateItem = (id: string, patch: any) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const unfavourite = async (a: any) => {
    const meta = { ...(a.meta || {}) };
    delete meta.saved_at;
    const nextType = String(a.asset_type || "").toLowerCase();
    const isLogoType = ["logo", "logotype", "wordmark", "brandmark"].includes(nextType);
    await supabase.from("assets").update({ meta }).eq("id", a.id);
    if (isLogoType) updateItem(a.id, { meta });
    else setItems((prev) => prev.filter((x) => x.id !== a.id));
    toast({ title: "Removed from Saved" });
  };

  const togglePublic = async (a: any) => {
    const isPublic = !a?.meta?.public;
    const meta = { ...(a.meta || {}), public: isPublic };
    await supabase.from("assets").update({ meta }).eq("id", a.id);
    updateItem(a.id, { meta });
    toast({ title: isPublic ? "Made public" : "Made private" });
  };

  const edit = (a: any) => window.open(`/editor?id=${a.id}`, "_blank", "noopener,noreferrer");
  const remix = (a: any) => navigate(`/create?remix=${a.id}`);

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
            <div
              key={a.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => edit(a)}
                className="flex aspect-square w-full items-center justify-center bg-neutral-50 p-4"
                aria-label="Open in editor"
              >
                {a.editor_state?.kind === "logotype" ? (
                  <Logotype state={a.editor_state} fit="contain" />
                ) : isCanvasAsset(a) ? (
                  <CanvasAssetPreview elements={(a.editor_state as any) || []} />
                ) : a.image_url || a.thumbnail_url ? (
                  <img src={a.thumbnail_url || a.image_url} alt={a.title || "Logo"} className="max-h-full max-w-full object-contain" loading="lazy" />
                ) : (
                  <span className="text-xs text-neutral-400">No preview</span>
                )}
              </button>
              <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center opacity-0 transition group-hover:opacity-100">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-neutral-200 bg-white/95 px-1.5 py-1 shadow-sm backdrop-blur">
                  <button type="button" onClick={() => unfavourite(a)} title="Remove from Saved" className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100">
                    <HeartOff className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => togglePublic(a)} title={a?.meta?.public ? "Make private" : "Make public"} className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100">
                    {a?.meta?.public ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => edit(a)} title="Edit" className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => remix(a)} title="Remix" className="rounded-full p-1.5 text-neutral-600 hover:bg-neutral-100">
                    <Shuffle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="border-t border-neutral-100 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-neutral-900">{a.title || "Untitled logo"}</p>
                  {a?.meta?.public ? <Globe className="h-3 w-3 shrink-0 text-neutral-400" /> : null}
                </div>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  {new Date(a.updated_at || a.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedLogos;