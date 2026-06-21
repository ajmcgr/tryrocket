import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Loader2, Sparkles, Wand2, Image as ImageIcon, Type, Palette, Megaphone, Rocket as RocketIcon, Wand, Paintbrush, Send, Radio } from "lucide-react";
import OutOfCreditsModal from "@/components/OutOfCreditsModal";
const supabase = _sb as any;

const ASSET_CHIPS: { id: string; label: string; Icon: any; example: string }[] = [
  { id: "logo", label: "Logo", Icon: Sparkles, example: "A logo for TryLaunch — clean SaaS, blue accent" },
  { id: "color_system", label: "Colors", Icon: Palette, example: "Color system for a developer-tools brand" },
  { id: "font_system", label: "Fonts", Icon: Type, example: "Font pairing for a modern fintech brand" },
  { id: "brand_voice", label: "Brand Voice", Icon: Wand2, example: "Brand voice for a friendly indie dev tool" },
  { id: "launch_copy", label: "Launch Copy", Icon: RocketIcon, example: "Landing page launch copy for trylaunch.ai" },
  { id: "product_hunt_copy", label: "PH Copy", Icon: RocketIcon, example: "Product Hunt copy for trylaunch.ai" },
  { id: "social_post", label: "Social Post", Icon: Megaphone, example: "X thread announcing trylaunch.ai launch" },
  { id: "graphic", label: "Graphic", Icon: ImageIcon, example: "Hero banner for a Mac productivity app" },
];

type WF = "auto" | "brand" | "design" | "launch" | "promote";
const WORKFLOWS: { id: WF; label: string; Icon: any; hint: string }[] = [
  { id: "auto", label: "Auto-detect", Icon: Wand, hint: "Rocket picks the specialist (1 asset)" },
  { id: "brand", label: "Brand It", Icon: Sparkles, hint: "Logo + colors + fonts + voice" },
  { id: "design", label: "Design It", Icon: Paintbrush, hint: "3 logo concepts + color system" },
  { id: "launch", label: "Launch It", Icon: Send, hint: "Launch copy + PH copy + social" },
  { id: "promote", label: "Promote It", Icon: Radio, hint: "3 social posts + founder bio" },
];
const WORKFLOW_PLAN: Record<Exclude<WF, "auto">, { asset_type: string; count?: number }[]> = {
  brand: [{ asset_type: "logo", count: 1 }, { asset_type: "color_system" }, { asset_type: "font_system" }, { asset_type: "brand_voice" }],
  design: [{ asset_type: "logo", count: 3 }, { asset_type: "color_system" }],
  launch: [{ asset_type: "launch_copy" }, { asset_type: "product_hunt_copy" }, { asset_type: "social_post" }],
  promote: [{ asset_type: "social_post" }, { asset_type: "social_post" }, { asset_type: "social_post" }, { asset_type: "founder_bio" }],
};

const SAMPLE_PROMPTS = [
  "A logo for trylaunch.ai",
  "Color system for raycast.com",
  "Product Hunt copy for typingmind.com",
  "Brand voice for an indie newsletter app",
];

// Specialized Design templates: pre-canned visual prompt scaffolds.
// Each chip prepends a vivid format-specific style header to the user's prompt
// and forces asset_type=graphic so the generator goes through image generation.
type DesignTemplate = {
  id: string;
  label: string;
  ratio: string;
  scaffold: (p: string) => string;
};
const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "hero",
    label: "Hero (16:9)",
    ratio: "1920x1080",
    scaffold: (p) => `Hero banner image, 16:9 widescreen (1920x1080), bold, modern, high-contrast, marketing-grade composition with clear focal point and editorial negative space. Subject: ${p}. Clean background, no text overlay.`,
  },
  {
    id: "og",
    label: "OG image (1200×630)",
    ratio: "1200x630",
    scaffold: (p) => `Open Graph social share image, 1200x630, eye-catching, brand-forward, centered composition optimized for link previews. Subject: ${p}. Crisp, no text overlay (text added separately).`,
  },
  {
    id: "yt",
    label: "YouTube thumbnail",
    ratio: "1280x720",
    scaffold: (p) => `YouTube thumbnail, 1280x720, ultra eye-catching, vibrant saturated colors, dramatic lighting, bold subject in left or center third, leaving space for thumbnail text. Subject: ${p}. No text overlay.`,
  },
];

const MESSAGES = [
  "Understanding your brand…",
  "Scraping context…",
  "Routing to specialist…",
  "Generating…",
  "Saving asset…",
];

const Generate = () => {
  const [params] = useSearchParams();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [assetType, setAssetType] = useState<string | null>(params.get("asset_type"));
  const [workflow, setWorkflow] = useState<WF>((params.get("workflow") as WF) || "auto");
  const [template, setTemplate] = useState<string | null>(null);
  const [count, setCount] = useState<number>(4);
  const projectId = params.get("project");
  const chatId = params.get("chat");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [outOfCredits, setOutOfCredits] = useState<{ needed?: number; remaining?: number } | null>(null);
  const [chatData, setChatData] = useState<any>(null);
  const [chatAssets, setChatAssets] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const nav = useNavigate();
  const autoRan = useRef(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  // Load chat + its assets when viewing an existing chat
  useEffect(() => {
    if (!chatId || !user) { setChatData(null); setChatAssets([]); return; }
    (async () => {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from("chats").select("*").eq("id", chatId).maybeSingle(),
        supabase.from("assets").select("id,title,asset_type,image_url,thumbnail_url,content").eq("chat_id", chatId).order("created_at", { ascending: true }),
      ]);
      setChatData(c);
      setChatAssets(a || []);
    })();
  }, [chatId, user]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    try {
      // Create a chat row for this submission
      const title = p.length > 60 ? p.slice(0, 57) + "…" : p;
      const { data: newChat, error: chatErr } = await supabase
        .from("chats")
        .insert({ user_id: user!.id, title, prompt: p })
        .select("id")
        .single();
      if (chatErr) throw new Error(chatErr.message);
      const newChatId: string = newChat.id;

      let effective: WF = workflow;
      // Auto-detect (client-side keyword classifier — fast, no extra round trip)
      if (workflow === "auto" && !assetType) {
        const t = p.toLowerCase();
        // URL-only (bare URL pasted) => full brand kit (Brand Analysis Mode, Canva-style)
        const urlOnly = /^\s*(https?:\/\/)?[\w-]+(\.[\w-]+)+\/?\s*$/i.test(p);
        if (urlOnly) effective = "brand";
        // URL + intent => hybrid: keep single-asset auto so the classifier picks (logo/graphic/etc)
        // but we'll still pre-scrape for context below.
        else if (/\b(brand it|full brand|brand kit|complete brand|whole brand)\b/.test(t)) effective = "brand";
        else if (/\b(design it|logo concepts?|brand visuals?|visual identity)\b/.test(t)) effective = "design";
        else if (/\b(launch it|launch kit|launch (copy|assets?|plan|checklist)|product hunt)\b/.test(t)) effective = "launch";
        else if (/\b(promote it|growth kit|social (kit|bundle)|x thread|distribution)\b/.test(t)) effective = "promote";
      }
      let allIds: string[] = [];
      let creditsErr: any = null;
      // Apply Design template scaffold if one was picked.
      const tpl = template ? DESIGN_TEMPLATES.find(t => t.id === template) : null;
      const effectivePrompt = tpl ? tpl.scaffold(p) : p;
      const effectiveAssetType = tpl ? "graphic" : (assetType || undefined);
      // Brand Analysis Mode: any URL in the prompt triggers a pre-scrape so EVERY downstream
      // asset (workflow fan-out or single auto) shares the same real brand context.
      let sharedCtx: any = null;
      const urlMatch = p.match(/(https?:\/\/[^\s]+|[\w-]+\.(?:com|ai|io|co|app|dev|net|org|xyz|so|gg|me)(?:\/\S*)?)/i);
      if (urlMatch) {
        const u = /^https?:\/\//i.test(urlMatch[1]) ? urlMatch[1] : "https://" + urlMatch[1];
        try {
          const { data: scraped } = await supabase.functions.invoke("scrape-url", { body: { url: u } });
          if (scraped && !scraped.error) sharedCtx = { ...scraped, url: u };
          else sharedCtx = { url: u };
        } catch { sharedCtx = { url: u }; }
      } else if (projectId) {
        // Reuse stored project brand context if no new URL was given
        try {
          const { data: proj } = await supabase.from("projects").select("brand_context,source_url").eq("id", projectId).maybeSingle();
          if (proj?.brand_context) sharedCtx = proj.brand_context;
        } catch { /* noop */ }
      }
      const isImageType = effectiveAssetType === "logo" || effectiveAssetType === "graphic";
      if (tpl || effective === "auto") {
        const { data, error } = await supabase.functions.invoke("generate-asset", {
          body: { prompt: effectivePrompt, asset_type: effectiveAssetType, count: isImageType && !tpl ? count : undefined, project_id: projectId || undefined, brand_context: sharedCtx || undefined },
        });
        if (error) throw new Error("Rocket is busy. Please try again.");
        const d: any = data;
        if (d?.error) {
          if (d.code === "no_credits") {
            setOutOfCredits({ needed: d.needed, remaining: d.remaining });
            return;
          }
          if (d.error === "ai_provider_unavailable") throw new Error(d.message);
          throw new Error(d.message || d.error);
        }
        if (d?.refused) { toast({ title: "Out of scope", description: d.message }); return; }
        allIds = d.asset_ids || [];
      } else {
        // Workflow fan-out: parallel generate-asset calls
        const plan = WORKFLOW_PLAN[effective as Exclude<WF, "auto">];
        const results = await Promise.all(plan.map(step =>
          supabase.functions.invoke("generate-asset", {
            body: { prompt: p, asset_type: step.asset_type, count: step.count, project_id: projectId || undefined, brand_context: sharedCtx || undefined },
          })
        ));
        for (const r of results) {
          const d: any = r.data;
          if (d?.error === "no_credits") { creditsErr = d; continue; }
          if (d?.asset_ids?.length) allIds.push(...d.asset_ids);
        }
      }
      // If we scraped a real brand and have a project, persist context to project for reuse
      if (sharedCtx && projectId && (sharedCtx.productName || sharedCtx.colors?.length)) {
        try {
          const { data: proj } = await supabase.from("projects").select("brand_context").eq("id", projectId).maybeSingle();
          if (!proj?.brand_context) {
            await supabase.from("projects").update({ brand_context: sharedCtx, source_url: sharedCtx.url || null }).eq("id", projectId);
          }
        } catch { /* noop */ }
      }
      if (allIds.length === 0 && creditsErr) {
        setOutOfCredits({ needed: creditsErr.needed, remaining: creditsErr.remaining });
        return;
      }
      if (allIds.length === 0) {
        throw new Error("No assets generated");
      }
      if (creditsErr) toast({ title: "Partial result", description: "Ran out of credits before finishing the workflow." });
      // Link generated assets to this chat
      await supabase.from("assets").update({ chat_id: newChatId }).in("id", allIds);
      window.dispatchEvent(new Event("chats:refresh"));
      setPrompt("");
      nav(`/create?chat=${newChatId}`);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRan.current) return;
    if (params.get("prompt") && user) { autoRan.current = true; submit(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isChatView = !!(chatId && chatData);
  return (
    <div className={`mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col px-6 py-12 ${isChatView ? "max-w-7xl" : "max-w-3xl items-center"}`}>
      {isChatView ? (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Left: chat panel */}
          <div className="flex h-[calc(100vh-8rem)] flex-col lg:sticky lg:top-20">
            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {chatData.prompt && (
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-brand px-4 py-2.5 text-sm text-brand-foreground">
                  {chatData.prompt}
                </div>
              )}
              <div className="mr-auto w-fit max-w-[85%] rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-800">
                {chatAssets.length > 0
                  ? `Found ${chatAssets.length} result${chatAssets.length === 1 ? "" : "s"}. See the results panel.`
                  : "No assets in this chat."}
              </div>
            </div>
            {/* Composer pinned to bottom */}
            <form onSubmit={submit} className="mt-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Rocket to create another asset..."
                  rows={2}
                  disabled={loading}
                  className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none placeholder:text-neutral-400 disabled:opacity-60"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                />
                <div className="flex items-center justify-end px-2 pb-1">
                  <button
                    type="submit"
                    disabled={!prompt.trim() || loading}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-neutral-400">Enter to send · Shift+Enter for newline</p>
            </form>
          </div>

          {/* Right: results panel */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold text-neutral-900">Results</h2>
              <span className="text-xs text-neutral-500">{chatAssets.length} asset{chatAssets.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {chatAssets.map((a) => (
                <Link
                  key={a.id}
                  to={`/assets/${a.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-sm"
                >
                  {a.image_url ? (
                    <div className="aspect-square w-full bg-neutral-50">
                      <img src={a.thumbnail_url || a.image_url} alt={a.title} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="line-clamp-6 whitespace-pre-wrap p-4 text-xs text-neutral-700">{a.content || ""}</div>
                  )}
                  <div className="border-t border-neutral-100 px-3 py-2">
                    <p className="truncate text-sm font-medium text-neutral-900">{a.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">{a.asset_type}</p>
                  </div>
                </Link>
              ))}
              {chatAssets.length === 0 && (
                <p className="col-span-full text-sm text-neutral-500">No assets in this chat.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Create an asset</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Describe what you need. Rocket routes to the right specialist and saves it as an asset.
        </p>
      </div>

      <form onSubmit={submit} className="w-full">
        <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A logo for trylaunch.ai"
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-xl px-3 py-2 text-base outline-none placeholder:text-neutral-400 disabled:opacity-60"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {workflow === "auto" && ASSET_CHIPS.slice(0, 6).map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setAssetType(assetType === c.id ? null : c.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${assetType === c.id ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
                >
                  <c.Icon className="h-3 w-3" /> {c.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>

      {workflow === "auto" && (assetType === "logo" || assetType === "graphic") && (
        <div className="mt-3 w-full">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Variations</div>
            <div className="text-xs text-neutral-500">{count} option{count === 1 ? "" : "s"} · {count * 10} credits</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[4, 8, 12, 16, 24].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setCount(n)}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition ${count === n ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 w-full">
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Workflow</div>
        <div className="flex flex-wrap gap-1.5">
          {WORKFLOWS.map((w) => (
            <button
              type="button"
              key={w.id}
              onClick={() => { setWorkflow(w.id); if (w.id !== "auto") setAssetType(null); if (w.id !== "design") setTemplate(null); }}
              title={w.hint}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${workflow === w.id ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
            >
              <w.Icon className="h-3 w-3" /> {w.label}
            </button>
          ))}
        </div>
        {workflow !== "auto" && (
          <p className="mt-1.5 text-xs text-neutral-500">{WORKFLOWS.find(w => w.id === workflow)?.hint}</p>
        )}
        {workflow === "design" && (
          <div className="mt-3">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Template (optional)</div>
            <div className="flex flex-wrap gap-1.5">
              {DESIGN_TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(template === t.id ? null : t.id)}
                  title={`${t.label} — ${t.ratio}`}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${template === t.id ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
                >
                  <ImageIcon className="h-3 w-3" /> {t.label}
                </button>
              ))}
            </div>
            {template && (
              <p className="mt-1.5 text-xs text-neutral-500">Generates a single image with the {DESIGN_TEMPLATES.find(t => t.id === template)?.ratio} template scaffold instead of the 3-concept logo fan-out.</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-neutral-500">{MESSAGES[msgIdx]}</div>
      ) : (
        <div className="mt-8 flex w-full flex-wrap justify-center gap-2">
          {SAMPLE_PROMPTS.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
        </div>
      )}

      <OutOfCreditsModal
        open={!!outOfCredits}
        onClose={() => setOutOfCredits(null)}
        needed={outOfCredits?.needed}
        remaining={outOfCredits?.remaining}
      />
    </div>
  );
};

export default Generate;
