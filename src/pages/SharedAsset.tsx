import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase = _sb as any;
import { Skeleton } from "@/components/ui/skeleton";

const SharedAsset = () => {
  const { token } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data } = await supabase.rpc("get_shared_asset", { _token: token });
      setAsset(data);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return (
    <div className="mx-auto max-w-3xl space-y-4 p-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
  if (!asset) return <div className="p-10 text-center text-sm text-neutral-500">This share link is invalid or has been disabled.</div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-semibold tracking-tight">Rocket</Link>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-xs uppercase tracking-wider text-neutral-500">{asset.asset_type}</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{asset.title}</h1>
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {asset.image_url ? (
            <div className="flex items-center justify-center bg-neutral-50 p-8">
              <img src={asset.image_url} alt={asset.title} className="max-h-[640px] w-auto" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap p-8 font-sans text-sm leading-relaxed text-neutral-800">{asset.content || ""}</pre>
          )}
        </div>
        <p className="mt-8 text-center text-xs text-neutral-400">
          Shared with <Link to="/" className="underline">Rocket</Link>
        </p>
      </main>
    </div>
  );
};

export default SharedAsset;
