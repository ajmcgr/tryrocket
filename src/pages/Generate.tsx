import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2 } from "lucide-react";

const MESSAGES = [
  "Analyzing product…",
  "Understanding positioning…",
  "Identifying audience…",
  "Writing launch assets…",
  "Preparing your Rocket…",
  "Almost ready…",
];

const Generate = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, [loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-rocket", { body: { product_url: normalized } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      nav(`/rocket/${(data as any).rocket_id}`);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Generate your brand</h1>
      <p className="mt-3 text-base text-neutral-600">Paste your product URL. We'll handle the rest.</p>
      <form onSubmit={submit} className="mx-auto mt-10 flex w-full flex-col gap-3 sm:flex-row">
        <input type="text" placeholder="https://myproduct.com" value={url} onChange={(e) => setUrl(e.target.value)} required disabled={loading} className="h-12 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-base outline-none ring-neutral-300 transition focus:ring-2" />
        <button type="submit" disabled={loading || !url} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground shadow-sm transition hover:bg-brand-hover disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generate Brand <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      {loading && (
        <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-8">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
          <p className="mt-4 text-sm font-medium text-neutral-700">{MESSAGES[msgIdx]}</p>
          <p className="mt-1 text-xs text-neutral-500">This takes ~30 seconds.</p>
        </div>
      )}
    </div>
  );
};

export default Generate;