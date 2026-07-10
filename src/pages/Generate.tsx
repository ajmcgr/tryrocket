import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Loader2, Sparkles, Wand2, Image as ImageIcon, Type, Palette, Megaphone, Rocket as RocketIcon, Wand, Paintbrush, Send, Radio, FileText, LayoutTemplate, Camera, Layers, Shapes } from "lucide-react";
import OutOfCreditsModal from "@/components/OutOfCreditsModal";
import { Logotype } from "@/components/Logotype";
import { tryJson, type ColorSystem, type FontSystem, type BrandVoiceData, type BrandGuidelinesData, type LaunchCopyData, type ProductHuntCopyData, type SocialPostData, type FounderBio, type PresentationData, type TemplateLibraryData } from "@/lib/assetSchemas";
import { buildLogotypeVariants, pickLogotypeText } from "@/lib/logotype";
import BrandContextStrip from "@/components/BrandContextStrip";
import AssetVisual, { hasVisualRenderer } from "@/components/visuals/AssetVisual";
import { handleAiError } from "@/lib/aiErrors";
import { track } from "@/lib/analytics";

const supabase = _sb as any;

function withResolvedLogotypeText(asset: any) {
  const state = asset?.editor_state;
  if (state?.kind !== "logotype") return state;
  const current = String(state.text || "").trim();
  const isGeneric = /^(brand|logo|logotype|wordmark|text logo)$/i.test(current);
  if (!isGeneric) return state;
  const ctx = asset?.meta?.brand_context || {};
  const resolved = pickLogotypeText({
    prompt: asset?.prompt,
    productName: ctx.productName,
    url: ctx.url || asset?.source_url,
  });
  return resolved ? { ...state, text: resolved, color: state.color || ctx.colors?.[0] } : state;
}

function AssetCardThumb({ asset }: { asset: any }) {
  const at = asset.asset_type as string;
  if (asset?.editor_state?.kind === "logotype") {
    return <Logotype state={withResolvedLogotypeText(asset)} fit="contain" />;
  }
  if (at === "color_system") {
    const c = tryJson<ColorSystem>(asset.content || "");
    const swatches = [c?.primary, c?.secondary, c?.accent, c?.success, c?.warning, c?.danger].filter(Boolean) as string[];
    if (swatches.length) {
      return (
        <div className="grid aspect-square w-full grid-cols-2 grid-rows-2 overflow-hidden">
          {swatches.slice(0, 4).map((hex, i) => (
            <div key={i} className="flex items-end justify-start p-2" style={{ backgroundColor: hex }}>
              <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[9px] uppercase text-neutral-800">{hex}</span>
            </div>
          ))}
        </div>
      );
    }
  }
  if (at === "font_system") {
    const f = tryJson<FontSystem>(asset.content || "");
    const heading = f?.display_font || f?.heading_font || "Georgia";
    const body = f?.body_font || "system-ui";
    return (
      <div className="flex aspect-square w-full flex-col justify-center gap-2 bg-gradient-to-br from-neutral-50 to-neutral-100 p-5">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400">Aa</div>
        <div className="text-3xl leading-tight text-neutral-900" style={{ fontFamily: `'${heading}', serif` }}>{heading}</div>
        <div className="mt-1 text-xs text-neutral-600" style={{ fontFamily: `'${body}', system-ui, sans-serif` }}>The quick brown fox · {body}</div>
      </div>
    );
  }
  if (at === "brand_voice") {
    const v = tryJson<BrandVoiceData>(asset.content || "");
    const pillars = v?.pillars?.slice(0, 3) || [];
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-brand/5 to-neutral-50 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">Voice</div>
        {pillars.length ? (
          <div className="space-y-1.5">
            {pillars.map((p, i) => (
              <div key={i} className="rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-neutral-800">{p.name}</div>
            ))}
          </div>
        ) : (
          <div className="text-sm italic text-neutral-600 line-clamp-4">{v?.overview || "Brand voice"}</div>
        )}
        <div className="text-[9px] uppercase tracking-wider text-neutral-400">Tone · Pillars · Do/Don't</div>
      </div>
    );
  }
  if (at === "brand_guidelines") {
    const g = tryJson<BrandGuidelinesData>(asset.content || "");
    const tagline = g?.taglines?.[0] || g?.elevator_pitch?.one_sentence;
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-neutral-900 to-neutral-700 p-4 text-white">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Brand Book</div>
        <div className="space-y-1">
          <div className="text-lg font-semibold leading-tight line-clamp-2">{g?.brand_name || asset.title}</div>
          {tagline && <div className="text-[11px] italic text-white/70 line-clamp-3">"{tagline}"</div>}
        </div>
        <div className="flex gap-1 text-[9px] uppercase tracking-wider text-white/50">
          {g?.mission && <span>Mission</span>}
          {g?.vision && <span>· Vision</span>}
          {g?.values?.length ? <span>· Values</span> : null}
        </div>
      </div>
    );
  }
  if (at === "launch_copy") {
    const l = tryJson<LaunchCopyData>(asset.content || "");
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-brand/10 via-white to-neutral-50 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">Launch Copy</div>
        <div className="space-y-1.5">
          {l?.hero?.headline && <div className="text-base font-semibold leading-tight text-neutral-900 line-clamp-2">{l.hero.headline}</div>}
          {l?.hero?.subheadline && <div className="text-[11px] text-neutral-600 line-clamp-2">{l.hero.subheadline}</div>}
          {!l?.hero?.headline && l?.tagline && <div className="text-base font-semibold text-neutral-900 line-clamp-3">{l.tagline}</div>}
        </div>
        {l?.hero?.cta && <div className="inline-flex w-fit rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium text-brand-foreground">{l.hero.cta}</div>}
      </div>
    );
  }
  if (at === "product_hunt_copy") {
    const p = tryJson<ProductHuntCopyData>(asset.content || "");
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">P</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">Product Hunt</div>
        </div>
        <div className="space-y-1">
          {p?.tagline && <div className="text-sm font-semibold leading-tight text-neutral-900 line-clamp-2">{p.tagline}</div>}
          {p?.short_description && <div className="text-[11px] text-neutral-600 line-clamp-3">{p.short_description}</div>}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-neutral-400">Tagline · Comment · FAQ</div>
      </div>
    );
  }
  if (at === "social_post") {
    const s = tryJson<SocialPostData>(asset.content || "");
    const post = s && "kind" in s && s.kind === "post" ? s : null;
    const lib = s && "kind" in s && s.kind === "library" ? s : null;
    const sample = post?.copy || lib?.categories?.[0]?.posts?.[0]?.copy;
    const platform = post?.platform || lib?.categories?.[0]?.posts?.[0]?.platform || "Social";
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-white p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{platform}</div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[11px] leading-snug text-neutral-800 line-clamp-6">
          {sample || "Social post"}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-neutral-400">Post</div>
      </div>
    );
  }
  if (at === "founder_bio") {
    const b = tryJson<FounderBio>(asset.content || "");
    const sample = b?.short || b?.x_bio || b?.linkedin_headline || b?.medium;
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-neutral-50 to-white p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Founder Bio</div>
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-brand to-brand/60" />
          <div className="text-[11px] leading-snug text-neutral-700 line-clamp-5">{sample || "Bio"}</div>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-neutral-400">X · LinkedIn · Press</div>
      </div>
    );
  }
  if (at === "presentation") {
    const d = tryJson<PresentationData>(asset.content || "");
    const slides = d?.slides?.slice(0, 3) || [];
    return (
      <div className="flex aspect-square w-full flex-col justify-center gap-2 bg-neutral-100 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Deck · {d?.slides?.length || 0} slides</div>
        <div className="space-y-1.5">
          {slides.map((s, i) => (
            <div key={i} className="flex aspect-[16/9] w-full items-center justify-center rounded border border-neutral-200 bg-white px-2 text-center">
              <div className="text-[9px] font-medium text-neutral-700 line-clamp-2">{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (at === "template") {
    const t = tryJson<TemplateLibraryData>(asset.content || "");
    const groups = t?.groups?.slice(0, 3) || [];
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-neutral-50 to-white p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Templates</div>
        <div className="space-y-1">
          {groups.map((g, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-neutral-100 px-2 py-1 text-[10px] text-neutral-700">
              <span className="truncate font-medium">{g.name}</span>
              <span className="text-neutral-400">{g.templates?.length || 0}</span>
            </div>
          ))}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-neutral-400">Library</div>
      </div>
    );
  }
  // Generic text-asset fallback with a snippet from content
  const snippet = (asset.content || "").replace(/[{}\[\]"`#*_]/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  if (snippet) {
    return (
      <div className="flex aspect-square w-full flex-col justify-between bg-gradient-to-br from-neutral-50 to-white p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{at.replace(/_/g, " ")}</div>
        <div className="text-[11px] leading-snug text-neutral-700 line-clamp-6">{snippet}</div>
      </div>
    );
  }
  return (
    <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 text-center">
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{at.replace(/_/g, " ")}</span>
    </div>
  );
}

const ASSET_CHIPS: { id: string; label: string; Icon: any; example: string; assetType?: string; promptPrefix?: string }[] = [
  { id: "brand_guidelines", label: "Brand Guidelines", Icon: FileText, example: "Brand guidelines for TryLaunch" },
  { id: "template", label: "Brand Templates", Icon: LayoutTemplate, example: "Brand templates for a developer-tools startup" },
  { id: "logo", label: "Logos", Icon: Sparkles, example: "A logo for TryLaunch — clean SaaS, blue accent" },
  { id: "color_system", label: "Colors", Icon: Palette, example: "Color system for a developer-tools brand" },
  { id: "font_system", label: "Fonts", Icon: Type, example: "Font pairing for a modern fintech brand" },
  { id: "brand_voice", label: "Brand Voice", Icon: Wand2, example: "Brand voice for a friendly indie dev tool" },
  { id: "photo", label: "Photos", Icon: Camera, example: "Product photos for a Mac productivity app" },
  { id: "components", label: "Components", Icon: Layers, assetType: "graphic", promptPrefix: "UI component set with buttons, cards, inputs, navigation, and states. ", example: "UI component set for a fintech dashboard" },
  { id: "graphic", label: "Graphics", Icon: ImageIcon, example: "Hero banner for a Mac productivity app" },
  { id: "icon", label: "Icons", Icon: Shapes, example: "Icon set for a developer-tools startup" },
  { id: "launch_copy", label: "Launch Copy", Icon: RocketIcon, example: "Landing page launch copy for trylaunch.ai" },
  { id: "product_hunt_copy", label: "PH Copy", Icon: RocketIcon, example: "Product Hunt copy for trylaunch.ai" },
  { id: "social_post", label: "Social Post", Icon: Megaphone, example: "X thread announcing trylaunch.ai launch" },
];

type WF = "auto" | "brand" | "design" | "launch" | "promote";
const WORKFLOWS: { id: WF; label: string; Icon: any; hint: string }[] = [
  { id: "auto", label: "Auto-detect", Icon: Wand, hint: "Rocket picks the specialist and generates a full option gallery" },
  { id: "brand", label: "Brand It", Icon: Sparkles, hint: "Full galleries for logos, colors, fonts, and voice" },
  { id: "design", label: "Design It", Icon: Paintbrush, hint: "Full logo gallery + color system gallery" },
  { id: "launch", label: "Launch It", Icon: Send, hint: "Launch copy + PH copy + social" },
  { id: "promote", label: "Promote It", Icon: Radio, hint: "3 social posts + founder bio" },
];
const WORKFLOW_PLAN: Record<Exclude<WF, "auto">, { asset_type: string; count?: number }[]> = {
  brand: [{ asset_type: "logo" }, { asset_type: "color_system" }, { asset_type: "font_system" }, { asset_type: "brand_voice" }],
  design: [{ asset_type: "logo" }, { asset_type: "color_system" }],
  launch: [{ asset_type: "launch_copy" }, { asset_type: "product_hunt_copy" }, { asset_type: "social_post" }],
  promote: [{ asset_type: "social_post" }, { asset_type: "social_post" }, { asset_type: "social_post" }, { asset_type: "founder_bio" }],
};

const SAMPLE_PROMPTS = [
  "A logo for trylaunch.ai",
  "Color system for raycast.com",
  "Product Hunt copy for typingmind.com",
  "Brand voice for an indie newsletter app",
];

function isLogotypeOnlyPrompt(text: string) {
  const lower = text.toLowerCase();
  const wantsTextLogo = /\b(logotype|logotypes|wordmark|word\s*mark|word-mark|text[- ]?based\s+logo|text\s+logo|type[- ]?based\s+logo|typographic\s+logo|typography\s+logo|lettering|letters\s+only|name\s+only)\b/.test(lower);
  const saysTextNotLogo = /\b(text|type|typographic|typography|lettering|wordmark|logotype)\b[\s\S]{0,40}\b(not\s+(a\s+)?logo|no\s+(logo|icon|symbol|mark)|not\s+(an\s+)?icon|not\s+(a\s+)?symbol)\b/.test(lower)
    || /\b(not\s+(a\s+)?logo|no\s+(logo|icon|symbol|mark)|not\s+(an\s+)?icon|not\s+(a\s+)?symbol)\b[\s\S]{0,40}\b(text|type|typographic|typography|lettering|wordmark|logotype)\b/.test(lower);
  const wantsPictorial = /\b(icon|symbol|emblem|pictorial|illustration|graphic|mascot|badge|app\s*icon|favicon)\b/.test(lower);
  return (wantsTextLogo || saysTextNotLogo) && !wantsPictorial;
}

function requestedCount(text: string, fallback = 6) {
  const lower = text.toLowerCase();
  const words: Record<string, number> = { "a couple": 2, couple: 2, "a few": 3, few: 3, several: 4, handful: 5, "half a dozen": 6, "half dozen": 6, "a dozen": 12, dozen: 12, twelve: 12, "two dozen": 24 };
  for (const [word, n] of Object.entries(words)) if (lower.includes(word)) return n;
  const digit = text.match(/\b(\d{1,2})\b/);
  return digit ? Math.max(1, Math.min(24, Number(digit[1]))) : fallback;
}

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
  "Creating your assets…",
  "Generating…",
  "Saving asset…",
];

function formatPromptTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  if (isYesterday) return `Yesterday · ${time}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = d.toLocaleDateString([], sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
  return `${date} · ${time}`;
}

const Generate = () => {
  const [params] = useSearchParams();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [assetType, setAssetType] = useState<string | null>(params.get("asset_type"));
  const [workflow, setWorkflow] = useState<WF>((params.get("workflow") as WF) || "auto");
  const [template, setTemplate] = useState<string | null>(null);
  const [count, setCount] = useState<number>(24);
  const projectId = params.get("project");
  const chatId = params.get("chat");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [outOfCredits, setOutOfCredits] = useState<{ needed?: number; remaining?: number } | null>(null);
  const [chatData, setChatData] = useState<any>(null);
  const [chatAssets, setChatAssets] = useState<any[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<{ text: string; at: string } | null>(null);
  const [pendingPrompts, setPendingPrompts] = useState<{ text: string; at: string }[]>([]);
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
        supabase.from("assets").select("id,title,asset_type,image_url,thumbnail_url,content,prompt,editor_state,meta,source_url,created_at").eq("chat_id", chatId).order("created_at", { ascending: true }),
      ]);
      setChatData(c);
      setChatAssets(a || []);
      setPendingPrompts([]);
    })();
  }, [chatId, user]);

  // Brand Intelligence: derive the active brand context so the user can see what
  // Rocket knows about their brand before generating more assets.
  const [projectBrandCtx, setProjectBrandCtx] = useState<any>(null);
  useEffect(() => {
    if (!projectId) { setProjectBrandCtx(null); return; }
    (async () => {
      const { data: proj } = await supabase.from("projects").select("brand_context,source_url,name").eq("id", projectId).maybeSingle();
      setProjectBrandCtx(proj?.brand_context || (proj?.source_url ? { url: proj.source_url, productName: proj.name } : null));
    })();
  }, [projectId]);
  const activeBrandCtx: any = (() => {
    if (projectBrandCtx) return projectBrandCtx;
    const withCtx = [...chatAssets].reverse().find((a) => a?.meta?.brand_context && (a.meta.brand_context.productName || a.meta.brand_context.url));
    return withCtx?.meta?.brand_context || null;
  })();

  // (brand-context "analyzed" badge is now handled inside <BrandContextStrip />)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    const nowIso = new Date().toISOString();
    setPendingPrompt({ text: p, at: nowIso });
    if (chatId) setPendingPrompts((prev) => [...prev, { text: p, at: nowIso }]);
    try {
      // Reuse the current chat when inside one; otherwise create a new chat row.
      let newChatId: string;
      if (chatId) {
        newChatId = chatId;
      } else {
        const title = p.length > 60 ? p.slice(0, 57) + "…" : p;
        const { ensureActiveWorkspaceId } = await import("@/lib/workspace");
        const workspace_id = await ensureActiveWorkspaceId();
        const { data: newChat, error: chatErr } = await supabase
          .from("chats")
          .insert({ user_id: user!.id, workspace_id, title, prompt: p } as any)
          .select("id")
          .single();
        if (chatErr) throw new Error(chatErr.message);
        newChatId = newChat.id;
      }

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
      const selectedChip = assetType ? ASSET_CHIPS.find(c => c.id === assetType) : null;
      const chipPrompt = selectedChip?.promptPrefix ? `${selectedChip.promptPrefix}${p}` : p;
      const effectivePrompt = tpl ? tpl.scaffold(p) : chipPrompt;
      const effectiveAssetType = tpl ? "graphic" : (selectedChip?.assetType || assetType || undefined);
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
      if (!sharedCtx && chatAssets.length) {
        const recentWithContext = [...chatAssets].reverse().find((asset) => {
          const ctx = asset?.meta?.brand_context;
          return ctx && (ctx.productName || ctx.url || ctx.colors?.length || ctx.logo || asset.source_url);
        });
        if (recentWithContext) {
          sharedCtx = {
            ...(recentWithContext.meta?.brand_context || {}),
            url: recentWithContext.meta?.brand_context?.url || recentWithContext.source_url || undefined,
          };
        }
      }
      if (!tpl && isLogotypeOnlyPrompt(p)) {
        const priorPromptText = [p, chatData?.prompt, ...[...chatAssets].reverse().map((asset) => asset.prompt)].filter(Boolean).join("\n");
        const brandText = pickLogotypeText({
          prompt: priorPromptText,
          productName: sharedCtx?.productName,
          url: sharedCtx?.url,
        });
        if (!brandText) {
          throw new Error("I need a brand name or URL to create a wordmark.");
        }
        const variants = buildLogotypeVariants(brandText, requestedCount(p, 6), sharedCtx?.colors?.[0], sharedCtx?.fonts || []);
        const { ensureActiveWorkspaceId: _e2 } = await import("@/lib/workspace");
        const _wid = await _e2();
        const rows = variants.map((state, i) => ({
          user_id: user!.id,
          workspace_id: _wid,
          project_id: projectId || null,
          asset_type: "logo",
          title: variants.length > 1 ? `Logotype ${i + 1}` : "Logotype",
          prompt: p,
          source_url: sharedCtx?.url || null,
          editor_state: state,
          meta: { brand_context: sharedCtx, kind: "logotype", variant: i + 1, of: variants.length },
        }));
        const { data, error } = await supabase.from("assets").insert(rows as any).select("id");
        if (error) throw new Error(error.message);
        allIds = (data || []).map((row: any) => row.id);
      } else if (tpl || effective === "auto") {
        const { data, error } = await supabase.functions.invoke("generate-asset", {
          body: { prompt: effectivePrompt, asset_type: effectiveAssetType, count: effectiveAssetType && !tpl ? count : undefined, project_id: projectId || undefined, brand_context: sharedCtx || undefined, workspace_id: (await import("@/lib/workspace")).getActiveWorkspaceIdSync() ?? undefined },
        });
        const d: any = data;
        const aiErr = handleAiError(d, error, toast);
        if (aiErr?.kind === "no_credits") {
          setOutOfCredits({ needed: aiErr.needed, remaining: aiErr.remaining });
          return;
        }
        if (aiErr) return;
        if (d?.refused) { toast({ title: "Out of scope", description: d.message }); return; }
        allIds = d.asset_ids || [];
      } else {
        // Workflow fan-out: parallel generate-asset calls
        const plan = WORKFLOW_PLAN[effective as Exclude<WF, "auto">];
        const { getActiveWorkspaceIdSync } = await import("@/lib/workspace");
        const _wsid = getActiveWorkspaceIdSync() || undefined;
        const results = await Promise.all(plan.map(step =>
          supabase.functions.invoke("generate-asset", {
            body: { prompt: p, asset_type: step.asset_type, count: step.count, project_id: projectId || undefined, brand_context: sharedCtx || undefined, workspace_id: _wsid },
          })
        ));
        for (const r of results) {
          const d: any = r.data;
          if (d?.error === "no_credits") { creditsErr = d; continue; }
          if (d?.error === "rate_limit" || d?.error === "ai_provider_unavailable") {
            handleAiError(d, null, toast);
            continue;
          }
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
      await supabase.from("assets").update({ chat_id: newChatId, prompt: p }).in("id", allIds);
      window.dispatchEvent(new Event("chats:refresh"));
      window.dispatchEvent(new Event("credits:refresh"));
      track("asset_generated", {
        count: allIds.length,
        workflow: effective,
        asset_type: effectiveAssetType || undefined,
        has_context: !!sharedCtx,
      });
      setPrompt("");
      if (chatId) {
        // Already in this chat — refresh assets in place so the new prompt appears in history.
        const { data: a } = await supabase
          .from("assets")
            .select("id,title,asset_type,image_url,thumbnail_url,content,prompt,editor_state,meta,source_url,created_at")
          .eq("chat_id", newChatId)
          .order("created_at", { ascending: true });
        setChatAssets(a || []);
        setPendingPrompts([]);
        setPendingPrompt(null);
      } else {
        nav(`/create?chat=${newChatId}`);
      }
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

  const isChatView = !!(chatId && chatData) || (loading && !!pendingPrompt);
  // Build the ordered list of user prompts in this chat: start with chat.prompt,
  // then append unique prompts from assets in creation order, then any pending prompts
  // currently being generated. Falls back to the live pendingPrompt if there's no chat yet.
  const promptHistory: { text: string; at: string | null }[] = (() => {
    const list: { text: string; at: string | null }[] = [];
    const push = (s?: string | null, at?: string | null) => {
      const v = (s || "").trim();
      if (!v) return;
      if (list[list.length - 1]?.text === v) return;
      list.push({ text: v, at: at || null });
    };
    push(chatData?.prompt, chatData?.created_at);
    for (const a of chatAssets) push(a.prompt, a.created_at);
    for (const p of pendingPrompts) push(p.text, p.at);
    if (list.length === 0 && pendingPrompt) push(pendingPrompt.text, pendingPrompt.at);
    return list;
  })();
  return (
    <div className={`flex min-h-[calc(100vh-4rem)] w-full flex-col ${isChatView ? "px-6 py-6" : "mx-auto max-w-3xl items-center px-6 py-12"}`}>
      {isChatView ? (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Left: chat panel */}
          <div className="flex h-[calc(100vh-8rem)] flex-col lg:sticky lg:top-20">
            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {promptHistory.map((p, i) => {
                const isLast = i === promptHistory.length - 1;
                const matchCount = chatAssets.filter((a) => (a.prompt || "").trim() === p.text).length;
                const showLoading = isLast && loading;
                const replyText = showLoading
                  ? MESSAGES[msgIdx]
                  : matchCount > 0
                    ? `Found ${matchCount} result${matchCount === 1 ? "" : "s"}. See the results panel.`
                    : isLast && chatAssets.length === 0
                      ? "No assets yet."
                      : "Done. See the results panel.";
                return (
                  <div key={i} className="space-y-3">
                    {/* User bubble — right */}
                    <div className="flex w-full flex-col items-end gap-1">
                      <div className="max-w-[85%] rounded-2xl bg-brand px-4 py-3 text-sm text-brand-foreground">
                        {p.text}
                      </div>
                      {p.at && (
                        <span className="px-2 text-[10px] text-neutral-400">
                          {formatPromptTime(p.at)}
                        </span>
                      )}
                    </div>
                    {/* Assistant bubble — left */}
                    <div className="flex w-full flex-col items-start gap-1">
                      <div className="flex max-w-[85%] items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-800">
                        {showLoading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-neutral-500" />}
                        <span>{replyText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            {activeBrandCtx && (
              <div className="mb-4">
                <BrandContextStrip ctx={activeBrandCtx} />
              </div>
            )}
            {(() => {
              const latest = [...chatAssets].reverse().find(
                (a) => !a.image_url && (a.editor_state?.kind === "logotype" || hasVisualRenderer(a))
              );
              if (!latest) return null;
              return (
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Latest deliverable</div>
                    <Link to={`/assets/${latest.id}`} className="text-[11px] text-neutral-500 hover:text-neutral-900">
                      Open →
                    </Link>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4">
                    <AssetVisual asset={latest} />
                  </div>
                </div>
              );
            })()}
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
                    <AssetCardThumb asset={a} />
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
          <div className="flex items-start gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A logo for trylaunch.ai"
              rows={3}
              disabled={loading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none placeholder:text-neutral-400 disabled:opacity-60"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-2 pb-1 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {workflow === "auto" && ASSET_CHIPS.map((c) => (
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
          </div>
        </div>
      </form>

      {workflow === "auto" && assetType && (
        <div className="mt-3 w-full">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Variations</div>
            <div className="text-xs text-neutral-500">{count} option{count === 1 ? "" : "s"}</div>
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
