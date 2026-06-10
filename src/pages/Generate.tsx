import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Plus, Settings as SettingsIcon, History } from "lucide-react";
const supabase = _sb as any;

const MESSAGES = [
  "Analyzing product…",
  "Understanding positioning…",
  "Identifying audience…",
  "Writing launch assets…",
  "Preparing your Brand…",
  "Almost ready…",
];

const SAMPLE_PROMPTS = [
  { emoji: "🤖", label: "AI writing assistant", url: "https://typingmind.com" },
  { emoji: "📨", label: "Indie newsletter platform", url: "https://buttondown.com" },
  { emoji: "🎨", label: "Design tool for founders", url: "https://tldraw.com" },
  { emoji: "📊", label: "Analytics for SaaS", url: "https://plausible.io" },
  { emoji: "🛠️", label: "Developer productivity app", url: "https://raycast.com" },
  { emoji: "🛒", label: "E-commerce side project", url: "https://gumroad.com" },
  { emoji: "🎙️", label: "Podcast / creator tool", url: "https://riverside.fm" },
  { emoji: "📱", label: "Mobile habit tracker", url: "https://streaksapp.com" },
];

const Generate = () => {
  const [params] = useSearchParams();
  const [url, setUrl] = useState(params.get("url") ?? "");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const { toast } = useToast();
  const nav = useNavigate();
  const autoRan = useRef(false);
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("rockets").select("id, product_name, product_url, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }: any) => setHistory(data || []));
  }, [user]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, [loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runGenerate(url);
  };

  const runGenerate = async (raw: string) => {
    let normalized = raw.trim();
    if (!normalized) return;
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

  useEffect(() => {
    const incoming = params.get("url");
    if (incoming && !autoRan.current) {
      autoRan.current = true;
      runGenerate(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex md:flex-col rounded-2xl border border-neutral-200 bg-white p-3 min-h-[600px]">
        <Link to="/create" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> New Brand
        </Link>
        <div className="mt-5 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
          <History className="h-3 w-3" /> History
        </div>
        <div className="mt-2 flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <p className="px-2 py-3 text-xs text-neutral-400">No brands yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {history.map((h) => (
                <li key={h.id}>
                  <Link to={`/rocket/${h.id}`} className="block truncate rounded-lg px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100">
                    {h.product_name || h.product_url}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link to="/settings" className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
          <SettingsIcon className="h-4 w-4" /> Settings
        </Link>
      </aside>

      <div className="py-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Generate your brand</h1>
        <form onSubmit={submit} className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="https://myproduct.com" value={url} onChange={(e) => setUrl(e.target.value)} required disabled={loading} className="h-12 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-base outline-none ring-neutral-300 transition focus:ring-2" />
          <button type="submit" disabled={loading || !url} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground shadow-sm transition hover:bg-brand-hover disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generate Brand <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        {loading && (
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
            <p className="mt-4 text-sm font-medium text-neutral-700">{MESSAGES[msgIdx]}</p>
            <p className="mt-1 text-xs text-neutral-500">This takes ~30 seconds.</p>
          </div>
        )}
        {!loading && (
          <div className="mx-auto mt-12 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Need inspiration? Try a sample
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setUrl(p.url)}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-neutral-900"
                >
                  <span aria-hidden>{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generate;