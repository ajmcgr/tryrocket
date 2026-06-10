import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Loader2, Plus, Sparkles, PanelLeftClose, PanelLeftOpen, CreditCard, Zap, ArrowRight, Paperclip, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  { label: "Brand an AI writing assistant", url: "https://typingmind.com" },
  { label: "Brand an indie newsletter platform", url: "https://buttondown.com" },
  { label: "Brand a developer productivity app", url: "https://raycast.com" },
];

const Generate = () => {
  const [params] = useSearchParams();
  const [url, setUrl] = useState(params.get("url") ?? "");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const nav = useNavigate();
  const autoRan = useRef(false);
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number; extra: number } | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("gen_sidebar_open") !== "0";
  });

  const toggleSidebar = () => {
    setSidebarOpen((v) => {
      const next = !v;
      try { localStorage.setItem("gen_sidebar_open", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  // Hydrate images from sessionStorage (passed from homepage form)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gen_images");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) setImages(arr);
        sessionStorage.removeItem("gen_images");
      }
    } catch {}
  }, []);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 8 * 1024 * 1024) {
        toast({ title: "Image too large", description: `${f.name} exceeds 8MB.`, variant: "destructive" });
        continue;
      }
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(f);
      });
      next.push(dataUrl);
    }
    setImages((prev) => [...prev, ...next].slice(0, 6));
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("rockets").select("id, product_name, product_url, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }: any) => setHistory(data || []));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_usage").select("monthly_limit, credits_used, credits_extra").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => data && setUsage({ used: data.credits_used, limit: data.monthly_limit, extra: data.credits_extra || 0 }));
  }, [user]);

  const buyPack = async (product: string) => {
    setBuying(product);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", { body: { product } });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
      setBuying(null);
    }
  };

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, [loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runGenerate(url, images);
  };

  const runGenerate = async (raw: string, imgs: string[] = []) => {
    let normalized = raw.trim();
    if (!normalized && imgs.length === 0) return;
    if (normalized && !/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-rocket", {
        body: { product_url: normalized || null, images: imgs },
      });
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
    let pendingImgs: string[] = [];
    try {
      const raw = sessionStorage.getItem("gen_images");
      if (raw) pendingImgs = JSON.parse(raw) || [];
    } catch {}
    if ((incoming || pendingImgs.length) && !autoRan.current) {
      autoRan.current = true;
      runGenerate(incoming || "", pendingImgs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative grid grid-cols-1 ${sidebarOpen ? "md:grid-cols-[260px_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,1fr)]"} h-[calc(100vh-4rem)] transition-[grid-template-columns] duration-200`}>
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="absolute left-3 top-3 z-20 hidden md:inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" /> Show panel
        </button>
      )}
      {sidebarOpen && (
      <aside className="hidden md:flex md:flex-col border-r border-neutral-200 bg-white overflow-hidden">
        <div className="p-3">
          <Link to="/create" className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            <Plus className="h-4 w-4" /> New Brand Asset
          </Link>
        </div>
        <div className="px-4 pt-2 pb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Saved Brand Assets</span>
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {history.length === 0 ? (
            <p className="px-2 py-3 text-xs text-neutral-400">No Brand Assets yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {history.map((h) => (
                <li key={h.id}>
                  <Link to={`/rocket/${h.id}`} className="block truncate rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
                    {h.product_name || h.product_url}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 border-t border-neutral-200">
          <Popover>
            <PopoverTrigger className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <Sparkles className="h-4 w-4" /> Buy credits
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-[300px] rounded-2xl border border-neutral-200 bg-white p-0 shadow-xl">
              <div className="px-4 pt-3 pb-3 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-900">
                  {usage ? (usage.limit + usage.extra - usage.used).toLocaleString() : "—"} credits left
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">One-time top-up, never expires</p>
              </div>
              <div className="py-1">
                {[
                  { id: "pack_500", label: "500 credits", price: "$5" },
                  { id: "pack_1500", label: "1,500 credits", price: "$10", highlight: true },
                  { id: "pack_5000", label: "5,000 credits", price: "$25" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => buyPack(p.id)}
                    disabled={!!buying}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition ${p.highlight ? "bg-brand/10 text-brand hover:bg-brand/15" : "text-neutral-800 hover:bg-neutral-50"}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {buying === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className={`h-4 w-4 ${p.highlight ? "text-brand" : "text-neutral-500"}`} />}
                      <span className="font-medium">{p.label}</span>
                    </span>
                    <span className={p.highlight ? "text-brand" : "text-neutral-500"}>{p.price}</span>
                  </button>
                ))}
              </div>
              <Link to="/pricing" className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50">
                <span>Or upgrade your plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
      )}

      <div className="relative flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Sparkles className="h-5 w-5 text-brand" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            What brand do you want to build?
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-500">
            Rocket generates a complete brand kit — logos, colors, fonts, voice, and launch copy — from your product URL in seconds.
          </p>

          {!loading && (
            <div className="mt-10 w-full max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Try an example</p>
              <div className="mt-4 flex flex-col items-center gap-2.5">
                {SAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setUrl(p.url)}
                    className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-10 flex flex-col items-center">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              <p className="mt-4 text-sm font-medium text-neutral-700">{MESSAGES[msgIdx]}</p>
              <p className="mt-1 text-xs text-neutral-500">This takes ~30 seconds.</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent px-6 pb-6 pt-4">
          <form onSubmit={submit} className="mx-auto w-full max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-100">
              {images.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-neutral-200">
                      <img src={src} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                        disabled={loading}
                        className="absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                        aria-label="Remove image"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  aria-label="Attach images"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="Paste your product URL or attach images"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || (!url && images.length === 0)}
                  aria-label="Generate brand"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-neutral-400">Enter to send · Shift+Enter for newline</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Generate;