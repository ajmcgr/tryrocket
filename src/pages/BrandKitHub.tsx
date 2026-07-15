import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import {
  ArrowLeft, Sparkles, Palette, Type, MessageSquare, Layers, Shapes, Image as ImageIcon,
  Twitter, Linkedin, Instagram, Hash, Rocket as RocketIcon, Megaphone, Newspaper, Plus, Check, Trash2, X,
} from "lucide-react";
const supabase = _sb as any;
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// A hub "item" maps a Looka-style asset slot to a generator entry-point.
// asset_type values reuse existing Rocket types where possible; new visual
// slots fall back to the generic "graphic" generator with a tailored prompt.
type Item = {
  key: string;
  label: string;
  Icon: any;
  asset_type: string;          // what we pass to /create
  match: (a: any) => boolean;  // detect existing assets in the project
  promptHint?: string;         // seed prompt for graphic-style slots
};
type Group = { id: string; label: string; description: string; items: Item[] };

const has = (types: string[]) => (a: any) => types.includes(a.asset_type);
const titleMatch = (re: RegExp, type = "graphic") => (a: any) =>
  a.asset_type === type && typeof a.title === "string" && re.test(a.title);

const GROUPS: Group[] = [
  {
    id: "brand", label: "Brand", description: "Your visual identity foundation.",
    items: [
      { key: "logos", label: "Logos", Icon: Sparkles, asset_type: "logo", match: has(["logo"]) },
      { key: "colors", label: "Colors", Icon: Palette, asset_type: "color_system", match: has(["color_system", "design_color_palette"]) },
      { key: "typography", label: "Typography", Icon: Type, asset_type: "font_system", match: has(["font_system", "design_typography"]) },
      { key: "voice", label: "Brand Voice", Icon: MessageSquare, asset_type: "brand_voice", match: has(["brand_voice"]) },
      { key: "components", label: "Components", Icon: Layers, asset_type: "graphic", match: titleMatch(/component/i), promptHint: "UI component set (buttons, cards, inputs) using the brand palette and typography" },
      { key: "icons", label: "Icons", Icon: Shapes, asset_type: "icon", match: has(["icon"]) },
      { key: "graphics", label: "Graphics", Icon: ImageIcon, asset_type: "graphic", match: has(["graphic"]) },
      { key: "design_system", label: "Design System", Icon: Layers, asset_type: "brand_guidelines", match: has(["brand_guidelines", "design_style_direction"]) },
    ],
  },
  {
    id: "social", label: "Social", description: "Profiles, posts and stories.",
    items: [
      { key: "x_profile", label: "X Profile", Icon: Twitter, asset_type: "graphic", match: titleMatch(/x profile|twitter profile/i), promptHint: "X (Twitter) profile picture, square 400x400 logo crop on brand background" },
      { key: "x_banner", label: "X Banner", Icon: Twitter, asset_type: "graphic", match: titleMatch(/x banner|twitter banner/i), promptHint: "X (Twitter) header banner 1500x500 with product name, tagline and brand visual" },
      { key: "li_banner", label: "LinkedIn Banner", Icon: Linkedin, asset_type: "graphic", match: titleMatch(/linkedin banner/i), promptHint: "LinkedIn banner 1584x396 with product tagline and brand visual" },
      { key: "li_posts", label: "LinkedIn Posts", Icon: Linkedin, asset_type: "graphic", match: titleMatch(/linkedin post/i), promptHint: "LinkedIn post graphic 1200x1200 featuring a key product message" },
      { key: "li_carousel", label: "LinkedIn Carousels", Icon: Linkedin, asset_type: "graphic", match: titleMatch(/linkedin carousel/i), promptHint: "LinkedIn carousel slide 1080x1350, slide 1 of a 5-slide story about the product" },
      { key: "ig_posts", label: "Instagram Posts", Icon: Instagram, asset_type: "graphic", match: titleMatch(/instagram post/i), promptHint: "Instagram post 1080x1080 with bold brand visual and one-line message" },
      { key: "ig_stories", label: "Instagram Stories", Icon: Instagram, asset_type: "graphic", match: titleMatch(/instagram story|ig story/i), promptHint: "Instagram story 1080x1920 vertical, brand-led product teaser" },
      { key: "threads", label: "Threads Assets", Icon: Hash, asset_type: "graphic", match: titleMatch(/threads/i), promptHint: "Threads post graphic 1080x1080 with brand-aligned visual" },
    ],
  },
  {
    id: "launch", label: "Launch", description: "Everything you need to ship.",
    items: [
      { key: "ph_assets", label: "Product Hunt Assets", Icon: RocketIcon, asset_type: "graphic", match: titleMatch(/product hunt/i), promptHint: "Product Hunt gallery image 1270x760, bold product hero with tagline" },
      { key: "launch_assets", label: "Launch Assets", Icon: RocketIcon, asset_type: "graphic", match: titleMatch(/launch (asset|graphic|hero)/i), promptHint: "Launch hero graphic announcing the product is live, brand-led" },
      { key: "appstore_screens", label: "App Store Screenshots", Icon: ImageIcon, asset_type: "graphic", match: titleMatch(/app store screenshot/i), promptHint: "App Store screenshot 1242x2688 with device mockup and feature headline" },
      { key: "appstore_preview", label: "App Store Preview", Icon: ImageIcon, asset_type: "graphic", match: titleMatch(/app store preview/i), promptHint: "App Store preview graphic, feature-first hero with device mockup" },
      { key: "waitlist", label: "Waitlist Assets", Icon: Megaphone, asset_type: "graphic", match: titleMatch(/waitlist/i), promptHint: "Waitlist landing graphic, brand-led, with 'Join the waitlist' CTA" },
      { key: "founder_announce", label: "Founder Announcement", Icon: Megaphone, asset_type: "graphic", match: titleMatch(/founder announcement/i), promptHint: "Founder announcement post graphic, photo-friendly layout with quote space" },
      { key: "changelog", label: "Changelog Graphics", Icon: Newspaper, asset_type: "graphic", match: titleMatch(/changelog/i), promptHint: "Changelog graphic 1200x630, version badge and headline" },
      { key: "launch_copy", label: "Launch Copy", Icon: RocketIcon, asset_type: "launch_copy", match: has(["launch_copy", "launch_submission", "launch_product_hunt", "product_hunt_copy"]) },
    ],
  },
  {
    id: "marketing", label: "Marketing", description: "Ads, newsletters and landing assets.",
    items: [
      { key: "meta_ads", label: "Meta Ads", Icon: Megaphone, asset_type: "graphic", match: titleMatch(/meta ad|facebook ad|instagram ad/i), promptHint: "Meta ad creative 1080x1080, single-message brand visual with strong CTA" },
      { key: "x_ads", label: "X Ads", Icon: Twitter, asset_type: "graphic", match: titleMatch(/x ad|twitter ad/i), promptHint: "X ad creative 1200x628, brand-led with one-line value prop" },
      { key: "display_ads", label: "Display Ads", Icon: Megaphone, asset_type: "graphic", match: titleMatch(/display ad|banner ad/i), promptHint: "Display banner ad 728x90 with brand mark and CTA" },
      { key: "newsletter", label: "Newsletter Graphics", Icon: Newspaper, asset_type: "graphic", match: titleMatch(/newsletter/i), promptHint: "Newsletter header graphic 1200x400 with brand visual" },
      { key: "sponsor", label: "Sponsor Graphics", Icon: Megaphone, asset_type: "graphic", match: titleMatch(/sponsor/i), promptHint: "Sponsorship slot graphic with brand mark and one-line pitch" },
      { key: "landing", label: "Landing Page Graphics", Icon: ImageIcon, asset_type: "graphic", match: titleMatch(/landing page|landing hero/i), promptHint: "Landing page hero illustration matching the brand system" },
    ],
  },
  {
    id: "pr", label: "PR", description: "Press kit, media and founder assets.",
    items: [
      { key: "press_kit", label: "Press Kit", Icon: Newspaper, asset_type: "brand_guidelines", match: titleMatch(/press kit/i, "brand_guidelines") },
      { key: "founder_bio", label: "Founder Bio", Icon: MessageSquare, asset_type: "founder_bio", match: has(["founder_bio", "founder_tagline", "founder_story", "founder_x_bio", "founder_linkedin"]) },
      { key: "media_assets", label: "Media Assets", Icon: ImageIcon, asset_type: "graphic", match: titleMatch(/media asset|press image/i), promptHint: "Press-ready media asset 1920x1080, brand-led hero composition" },
      { key: "product_shots", label: "Product Screenshots", Icon: ImageIcon, asset_type: "graphic", match: titleMatch(/product screenshot|product shot/i), promptHint: "Polished product screenshot composition with subtle brand backdrop" },
      { key: "media_page", label: "Media Page Assets", Icon: Newspaper, asset_type: "graphic", match: titleMatch(/media page/i), promptHint: "Media page hero and logo lockup, press-friendly layout" },
    ],
  },
];

const BrandKitHub = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>("brand");
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = (assetId: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(assetId) ? next.delete(assetId) : next.add(assetId);
    return next;
  });
  const clearSelection = () => setSelected(new Set());
  const bulkTrash = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Move ${ids.length} asset${ids.length === 1 ? "" : "s"} to Trash?`)) return;
    const { error } = await supabase.from("assets").update({ deleted_at: new Date().toISOString() }).in("id", ids);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Moved ${ids.length} to Trash` });
    setAssets(prev => prev.filter(a => !ids.includes(a.id)));
    clearSelection();
  };

  const reload = async () => {
    if (!id) return;
    const { data } = await supabase.from("assets").select("id,title,asset_type,image_url,thumbnail_url,content,created_at,editor_state").eq("project_id", id).order("created_at", { ascending: false });
    setAssets(data || []);
  };

  const deleteAsset = async (assetId: string, label: string) => {
    if (!confirm(`Delete ${label}? It will move to Trash.`)) return;
    const { error } = await supabase.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", assetId);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Moved to Trash" });
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [p, a] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("assets").select("id,title,asset_type,image_url,thumbnail_url,content,created_at").eq("project_id", id).order("created_at", { ascending: false }),
      ]);
      setProject(p.data); setAssets(a.data || []); setLoading(false);
    })();
  }, [id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of GROUPS) c[g.id] = g.items.reduce((n, it) => n + (assets.some(it.match) ? 1 : 0), 0);
    return c;
  }, [assets]);

  const generateHref = (it: Item) => {
    const seed = it.promptHint
      ? `${it.label} for ${project?.name || "my product"} — ${it.promptHint}`
      : `${it.label} for ${project?.name || "my product"}`;
    const qs = new URLSearchParams({ project: id || "", asset_type: it.asset_type, prompt: seed });
    return `/create?${qs.toString()}`;
  };

  if (loading) return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    </div>
  );
  if (!project) return <div className="p-10 text-center text-sm text-neutral-500">Project not found.</div>;

  const active = GROUPS.find(g => g.id === activeGroup)!;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> {project.name}
        </Link>
        <div className="flex gap-2">
          <Link to={`/create?project=${id}`} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">Generate any asset</Link>
        </div>
      </div>

      <header className="mt-4">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Edit Brand Kit</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{project.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Add, edit, or delete every brand kit asset in one place.</p>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
        {GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${activeGroup === g.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
          >
            {g.label} <span className="ml-1 opacity-60">{counts[g.id]}/{g.items.length}</span>
          </button>
        ))}
      </nav>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-medium">{active.label}</h2>
          <p className="text-sm text-neutral-500">{active.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {active.items.map(it => {
            const existing = assets.filter(it.match);
            const preview = existing.find(a => a.image_url) || existing[0];
            const done = existing.length > 0;
            const isSelected = preview ? selected.has(preview.id) : false;
            return (
              <div key={it.key} className={`group overflow-hidden rounded-2xl border bg-white ${isSelected ? "border-brand ring-2 ring-brand/40" : "border-neutral-200"}`}>
                <div className="relative aspect-square w-full bg-neutral-50">
                  {preview && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(preview.id); }}
                      className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border bg-white/95 transition ${isSelected ? "border-brand text-brand opacity-100" : "border-neutral-300 text-transparent opacity-0 group-hover:opacity-100"}`}
                      title={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  )}
                  {preview?.image_url ? (
                    <img src={preview.image_url} alt={preview.title} className="h-full w-full object-cover" />
                  ) : preview?.content ? (
                    <div className="line-clamp-8 whitespace-pre-wrap p-4 text-[11px] text-neutral-600">{preview.content.slice(0, 240)}</div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-300">
                      <it.Icon className="h-10 w-10" />
                    </div>
                  )}
                  {done && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-medium text-white">
                      <Check className="h-3 w-3" /> {existing.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-neutral-100 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <it.Icon className="h-3.5 w-3.5 text-neutral-500" /> {it.label}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {done && preview && (
                      <Link to={`/editor?id=${preview.id}`} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] hover:bg-neutral-50" target="_blank" rel="noopener noreferrer">Edit</Link>
                    )}
                    {done && preview && (
                      <button
                        onClick={() => deleteAsset(preview.id, it.label)}
                        className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                        title={`Delete ${it.label}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <Link to={generateHref(it)} className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-medium text-brand-foreground hover:bg-brand-hover">
                      <Plus className="h-3 w-3" /> {done ? "More" : "Generate"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-lg">
            <span className="pl-2 pr-1 text-sm font-medium">{selected.size} selected</span>
            <button onClick={bulkTrash} className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">Move to Trash</button>
            <button onClick={clearSelection} className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandKitHub;
