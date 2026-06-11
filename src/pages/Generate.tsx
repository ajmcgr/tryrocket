import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Loader2, Plus, Sparkles, PanelLeftClose, PanelLeftOpen, CreditCard, Zap, ArrowRight, Paperclip, X, Copy, Save, RefreshCw, ExternalLink, Type, Bold, Palette, Wand2, ImageIcon, Rocket as RocketIcon, Megaphone, MoreHorizontal, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const supabase = _sb as any;
import { useCreditCosts, workflowCost } from "@/hooks/useCreditCosts";
import OutOfCreditsModal from "@/components/OutOfCreditsModal";

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

type WorkflowChoice = "auto" | "brand" | "design" | "launch" | "promote";
const WORKFLOW_CHIPS: { id: WorkflowChoice; label: string; Icon: any; hint: string }[] = [
  { id: "auto",    label: "Auto-detect", Icon: Sparkles,   hint: "Rocket picks the right workflow" },
  { id: "brand",   label: "Brand It",    Icon: Wand2,      hint: "Positioning, tagline, audience" },
  { id: "design",  label: "Design It",   Icon: ImageIcon,  hint: "Logos & visual concepts (uses extra credits)" },
  { id: "launch",  label: "Launch It",   Icon: RocketIcon, hint: "Launch copy, PH assets, checklist" },
  { id: "promote", label: "Promote It",  Icon: Megaphone,  hint: "X threads, LinkedIn, PR pitches" },
];

const Generate = () => {
  const [params] = useSearchParams();
  const [url, setUrl] = useState(params.get("url") ?? "");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowChoice>("auto");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const autoRan = useRef(false);
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [renaming, setRenaming] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<any | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; extra: number } | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState<{ needed?: number; remaining?: number } | null>(null);
  const { costFor } = useCreditCosts();
  const [result, setResult] = useState<null | {
    rocketId: string;
    productName: string;
    productUrl: string;
    asset: { id: string; title: string; content: string; imageUrl?: string | null; kind?: string };
    workflow?: string;
    designFailed?: boolean;
  }>(null);
  const [regen, setRegen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Canvas style state (mirrors core /editor text tools)
  const [fontSize, setFontSize] = useState(56);
  const [fontWeight, setFontWeight] = useState(700);
  const [textColor, setTextColor] = useState("#0A0A0A");
  const [bgColor, setBgColor] = useState("#F5F3EE");
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
    if (!user?.id) return;
    loadHistory();
    const onFocus = () => loadHistory();
    const onVisible = () => { if (document.visibilityState === "visible") loadHistory(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id, location.pathname]);

  const loadHistory = () => {
    if (!user?.id) return;
    supabase.from("rockets").select("id, product_name, product_url, created_at, pinned").eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data, error }: any) => {
        if (error) { console.error("loadHistory error", error); return; }
        setHistory(data || []);
      });
  };

  const togglePin = async (h: any) => {
    const next = !h.pinned;
    setHistory((prev) => [...prev.map((x) => (x.id === h.id ? { ...x, pinned: next } : x))]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.created_at < b.created_at ? 1 : -1)));
    const { error } = await supabase.from("rockets").update({ pinned: next }).eq("id", h.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); loadHistory(); }
  };

  const submitRename = async () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name) return;
    const id = renaming.id;
    setHistory((prev) => prev.map((x) => (x.id === id ? { ...x, product_name: name } : x)));
    if (result?.rocketId === id) setResult({ ...result, productName: name });
    setRenaming(null);
    const { error } = await supabase.from("rockets").update({ product_name: name }).eq("id", id);
    if (error) { toast({ title: "Rename failed", description: error.message, variant: "destructive" }); loadHistory(); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    setHistory((prev) => prev.filter((x) => x.id !== id));
    if (result?.rocketId === id) setResult(null);
    setDeleting(null);
    const { error } = await supabase.from("rockets").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); loadHistory(); }
    else toast({ title: "Deleted" });
  };

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

  const runGenerate = async (raw: string, imgs: string[] = [], wfOverride?: WorkflowChoice) => {
    const trimmed = raw.trim();
    if (!trimmed && imgs.length === 0) return;
    // Detect URL vs free text. Only prepend https:// for things that look like a domain.
    const looksLikeUrl =
      /^https?:\/\//i.test(trimmed) ||
      (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed) && !/\s/.test(trimmed));
    const normalized = looksLikeUrl
      ? (/^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed)
      : trimmed;
    setLoading(true);
    try {
      const wf = wfOverride ?? workflow;
      const { data, error } = await supabase.functions.invoke("generate-rocket", {
        body: { input: normalized || null, product_url: normalized || null, images: imgs, workflow: wf },
      });
      if (error) throw new Error("Rocket is busy right now. Please try again in a moment.");
      const d: any = data;
      if (d?.error) {
        if (d?.code === "no_credits" || d?.error === "insufficient_credits") {
          setOutOfCredits({ needed: d?.needed, remaining: d?.remaining });
          setLoading(false);
          return;
        }
        if (d?.error === "ai_provider_unavailable") {
          throw new Error(d.message || "Rocket is busy right now. Please try again in a moment.");
        }
        if (d?.error === "missing_environment_variable") {
          throw new Error(`Configuration error: ${d.variable} is not set. Please contact support.`);
        }
        throw new Error(d.message || d.error);
      }
      const rocketId = (data as any).rocket_id as string;
      await loadResult(rocketId);
      // Refresh sidebar history
      loadHistory();
      setLoading(false);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const loadResult = async (rocketId: string) => {
    const [r, a] = await Promise.all([
      supabase.from("rockets").select("id, product_name, product_url, workflow").eq("id", rocketId).maybeSingle(),
      supabase.from("rocket_assets").select("id, title, asset_type, content, kind, image_url, image_prompt").eq("rocket_id", rocketId),
    ]);
    const assets = (a.data || []) as any[];
    const wf = (r.data as any)?.workflow;
    const imageAssets = assets.filter((x) => x.kind === "image");
    const firstImage = imageAssets.find((x) => x.image_url);
    const designFailed = wf === "design" && imageAssets.length > 0 && !firstImage;
    const hero =
      firstImage ||
      assets.find((x) => x.asset_type === "positioning_tagline") ||
      assets.find((x) => x.asset_type === "positioning_value_prop") ||
      assets[0];
    if (!r.data || !hero) {
      toast({ title: "Could not load result", variant: "destructive" });
      return;
    }
    setResult({
      rocketId,
      productName: r.data.product_name,
      productUrl: r.data.product_url || "",
      asset: {
        id: hero.id,
        title: hero.title,
        content: hero.content || "",
        imageUrl: hero.image_url || null,
        kind: hero.kind || "text",
      },
      workflow: wf,
      designFailed,
    });
    if (designFailed) {
      toast({
        title: "Logo generation failed",
        description: "Try again in a moment — no credits were charged for the failed images.",
        variant: "destructive",
      });
    }
  };

  const updateAssetContent = (next: string) => {
    setResult((prev) => (prev ? { ...prev, asset: { ...prev.asset, content: next } } : prev));
  };

  const saveAsset = async () => {
    if (!result) return;
    setSaving(true);
    const { error } = await supabase.from("rocket_assets").update({ content: result.asset.content }).eq("id", result.asset.id);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
  };

  const regenAsset = async () => {
    if (!result) return;
    setRegen(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-asset", { body: { asset_id: result.asset.id } });
      if (error) throw new Error("Rocket is busy right now. Please try again in a moment.");
      const d: any = data;
      if (d?.error) {
        if (d?.code === "no_credits") {
          setOutOfCredits({ needed: d?.needed, remaining: d?.remaining });
          return;
        }
        if (d?.error === "ai_provider_unavailable") {
          throw new Error(d.message || "Rocket is busy right now. Please try again in a moment.");
        }
        throw new Error(d.message || d.error);
      }
      updateAssetContent((data as any).content || "");
      toast({ title: "Regenerated", description: `${(data as any).credits_charged ?? 1} credits used.` });
    } catch (e: any) {
      toast({ title: "Regenerate failed", description: e.message, variant: "destructive" });
    } finally {
      setRegen(false);
    }
  };

  const copyAsset = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.asset.content);
    toast({ title: "Copied" });
  };

  const openInEditor = () => {
    if (!result) return;
    // Seed /editor with the generated asset — image element for visual
    // assets, text element otherwise — plus matching canvas bg.
    const seed = result.asset.imageUrl
      ? [
          {
            id: Math.random().toString(36).slice(2, 9),
            kind: "image",
            x: 150, y: 100, w: 500, h: 400,
            visible: true, locked: false,
            src: result.asset.imageUrl,
          },
        ]
      : [
          {
            id: Math.random().toString(36).slice(2, 9),
            kind: "text",
            x: 120, y: 220, w: 720, h: 220,
            visible: true, locked: false,
            text: result.asset.content || result.productName,
            color: textColor,
            fontSize, fontWeight,
            fontFamily: "Inter, sans-serif",
          },
        ];
    try {
      localStorage.setItem("rocket.editor.v1", JSON.stringify(seed));
      localStorage.setItem("rocket.editor.bg.v1", result.asset.imageUrl ? "#ffffff" : bgColor);
    } catch {}
    nav("/editor");
  };

  const newAsset = () => {
    setResult(null);
    setUrl("");
    setImages([]);
    autoRan.current = false;
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
    <div className={`relative grid grid-cols-1 ${sidebarOpen ? (result ? "md:grid-cols-[260px_minmax(0,440px)_minmax(0,1fr)]" : "md:grid-cols-[260px_minmax(0,1fr)]") : (result ? "md:grid-cols-[minmax(0,440px)_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,1fr)]")} h-[calc(100vh-4rem)] transition-[grid-template-columns] duration-200`}>
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="absolute left-3 top-3 z-20 hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      {sidebarOpen && (
      <aside className="hidden md:flex md:flex-col border-r border-neutral-200 bg-white overflow-hidden">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Saved Chats</span>
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-3 pb-3 border-b border-neutral-200">
          <button onClick={newAsset} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {history.length === 0 ? (
            <p className="px-2 py-3 text-xs text-neutral-400">No chats yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {history.map((h) => {
                const isActive = result?.rocketId === h.id;
                return (
                  <li key={h.id} className="group relative">
                    <div className={`flex items-center gap-1 rounded-lg pr-1 transition ${isActive ? "bg-neutral-100" : "hover:bg-neutral-100"}`}>
                      <button
                        type="button"
                        onClick={() => loadResult(h.id)}
                        className={`flex-1 min-w-0 text-left truncate px-2 py-1.5 text-sm ${isActive ? "text-neutral-900" : "text-neutral-700"}`}
                      >
                        {h.pinned && <Pin className="inline h-3 w-3 mr-1 -mt-0.5 text-neutral-400" />}
                        {h.product_name || h.product_url}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label="Actions"
                            className="shrink-0 rounded p-1 text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-200 hover:text-neutral-700 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => togglePin(h)}>
                            {h.pinned ? (<><PinOff className="mr-2 h-4 w-4" /> Unpin</>) : (<><Pin className="mr-2 h-4 w-4" /> Pin</>)}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setRenameValue(h.product_name || ""); setRenaming(h); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleting(h)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                );
              })}
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

      <div className={`relative flex flex-col ${result ? "border-r border-neutral-200 bg-white" : ""}`}>
        <div className={`flex-1 flex flex-col items-center ${result ? "justify-start pt-12" : "justify-center"} px-6 py-16 text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Sparkles className="h-5 w-5 text-brand" />
          </div>
          <h1 className={`mt-6 font-semibold tracking-tight text-neutral-900 ${result ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
            {result ? "Refine or generate another" : "What brand do you want to build?"}
          </h1>
          {!result && (
            <p className="mt-3 max-w-xl text-base text-neutral-500">
              Rocket generates a complete brand system — brand guidelines, brand templates, logos, colors, fonts, brand voice, photos, components, graphics, icons, and launch copy — from your product URL in seconds.
            </p>
          )}

          {!loading && !result && (
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
              <p className="mt-1 text-xs text-neutral-500">{workflow === "design" ? "Generating visuals — this can take 60-90s." : "This takes ~30 seconds."}</p>
            </div>
          )}

          {result && !loading && (
            <div className="mt-8 w-full max-w-md text-left">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Just generated</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900 truncate">{result.productName}</p>
                {result.productUrl && (
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{result.productUrl}</p>
                )}
                <Link
                  to={`/rocket/${result.rocketId}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  View full brand kit <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <p className="mt-6 text-xs text-neutral-500">
                Edit the canvas on the right, or open it in the full editor for shapes, layers and more.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent px-6 pb-6 pt-4">
          <form onSubmit={submit} className={`mx-auto w-full ${result ? "max-w-md" : "max-w-2xl"}`}>
            {!result && (
              <div className="mb-3">
                <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  What do you need help with?
                  {usage && (
                    <span className="ml-2 normal-case tracking-normal text-neutral-400">
                      · {(usage.limit + usage.extra - usage.used).toLocaleString()} credits left
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {WORKFLOW_CHIPS.map((c) => {
                    const active = workflow === c.id;
                    const cost = c.id === "auto" ? null : workflowCost(c.id, costFor);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setWorkflow(c.id)}
                        title={c.hint}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"}`}
                      >
                        <c.Icon className="h-3.5 w-3.5" />
                        {c.label}
                        {cost ? (
                          <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/25 text-brand-foreground" : "bg-neutral-100 text-neutral-500"}`}>
                            {cost}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-center text-[10px] text-neutral-400">Number = credits used for this workflow.</p>
              </div>
            )}
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
                  placeholder="Paste your URL, describe your idea, or attach images..."
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

      {result && (
        <div className="hidden md:flex flex-col bg-neutral-100">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1">
              <Type className="h-3.5 w-3.5 text-neutral-500" />
              <input
                type="number"
                min={12}
                max={160}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value) || 12)}
                className="w-12 bg-transparent text-xs text-neutral-800 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setFontWeight((w) => (w >= 700 ? 400 : 700))}
              aria-label="Toggle bold"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 ${fontWeight >= 700 ? "bg-neutral-900 text-white hover:bg-neutral-900" : ""}`}
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <label className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600">
              Text
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-4 w-6 cursor-pointer rounded border border-neutral-200" />
            </label>
            <label className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600">
              <Palette className="h-3.5 w-3.5 text-neutral-500" /> BG
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-4 w-6 cursor-pointer rounded border border-neutral-200" />
            </label>

            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={copyAsset} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button type="button" onClick={saveAsset} disabled={saving} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </button>
              <button type="button" onClick={regenAsset} disabled={regen} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50">
                {regen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
              </button>
              <button
                type="button"
                onClick={openInEditor}
                className="ml-1 inline-flex h-7 items-center gap-1 rounded-md bg-neutral-900 px-2.5 text-xs font-medium text-white hover:bg-neutral-800"
              >
                Open in Editor <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">{result.asset.title}</span>
                <span>{result.productName}</span>
              </div>
              <div
                className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
                style={{ background: result.asset.imageUrl ? "#ffffff" : bgColor }}
              >
                {result.asset.imageUrl ? (
                  <div className="flex h-full w-full items-center justify-center p-8">
                    <img
                      src={result.asset.imageUrl}
                      alt={result.asset.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : result.designFailed ? (
                  <div className="flex h-full w-full items-center justify-center p-10 text-center">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Logo generation failed.</p>
                      <p className="mt-1 text-xs text-neutral-500">Try again in a moment — no credits were charged.</p>
                      <button
                        onClick={regenAsset}
                        className="mt-4 inline-flex items-center gap-1 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Try again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-10">
                    <textarea
                      value={result.asset.content}
                      onChange={(e) => updateAssetContent(e.target.value)}
                      spellCheck={false}
                      className="h-full w-full resize-none bg-transparent text-center leading-tight tracking-tight outline-none"
                      style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        fontWeight,
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-neutral-400">
                {result.asset.imageUrl
                  ? "Preview of your generated logo. Open in editor to reposition, resize, and add text."
                  : "Click the text to edit. Use the toolbar above for quick styling, or open in the full editor."}
              </p>
            </div>
          </div>
        </div>
      )}
      <OutOfCreditsModal
        open={!!outOfCredits}
        needed={outOfCredits?.needed}
        remaining={outOfCredits?.remaining}
        onClose={() => setOutOfCredits(null)}
      />
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitRename(); }}
            autoFocus
            placeholder="Name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={submitRename} disabled={!renameValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. "{deleting?.product_name || deleting?.product_url}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Generate;