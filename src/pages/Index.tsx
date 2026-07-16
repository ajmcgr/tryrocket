import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { ArrowRight, ArrowUp, Sparkles, Zap, Target, Rocket as RocketIcon, Megaphone, ListChecks, Check, Smartphone, Mail, Palette, ShoppingBag, Building2, Puzzle, Mic, BookOpen, Wrench, Lightbulb, Paperclip, X, BookMarked, LayoutTemplate, Shapes, Type as TypeIcon, Image as ImageIcon, Box, Sparkle, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CreateShowcase from "@/components/CreateShowcase";
import SenjaWidget from "@/components/SenjaWidget";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "What does Rocket actually generate?", a: "A complete brand system from a single URL or prompt: logos and logotypes, color palettes, typography, brand voice, launch copy, social posts, Product Hunt kits, email templates, and a full Brand Kit you can export or drop into any design." },
  { q: "How is Rocket organized?", a: "Projects hold your designs, assets, and uploads. Designs are editable canvas files. Assets are the Brand Kit — one canonical logo, palette, typeface, etc. per project. Templates give you a starting point in one click." },
  { q: "How does the Brand Kit work?", a: "Each project has one canonical item per category (logo, colors, typography, design system…). Swap or remove any item — Remove moves it to Trash and you can restore within 30 days. Pull extras from any other project via '+ New'." },
  { q: "Can I edit designs like Canva?", a: "Yes. Multi-select (Shift-click + marquee), drag-resize, color overlays for logos and images, image uploads with resize, layers on the right, and export to PNG/SVG/PDF/ZIP. Brand colors appear as one-click swatches in the toolbar." },
  { q: "How long does a generation take?", a: "About 30–60 seconds. /create keeps your full chat history per project — prompts and responses persist so you can scroll back and iterate." },
  { q: "Can I regenerate individual pieces?", a: "Yes. Every asset has Copy, Edit, and Regenerate. Regenerating a single asset costs 1 credit, and you can leave feedback to steer the next pass." },
  { q: "What's a credit?", a: "Credits power every generation. Text assets cost 1; images cost more. Free plan gets 100/month, Pro gets 3,000. Top up anytime — packs never expire." },
  { q: "Where can I launch from Rocket?", a: "We pre-fill submissions for Product Hunt, BetaList, There's An AI For That, Hacker News, Peerlist, Uneed, Alternative.me, G2, Indie Hackers, and one-click handoff to Launch." },
  { q: "Do you support sharing and exports?", a: "Yes. Every design has a share link that opens in the editor; projects share a full Brand Kit view. Export PNG, SVG, PDF, or a ZIP of your kit. Pro adds Markdown / PDF brand guidelines and password-protected share links." },
  { q: "Is there a free trial of Pro?", a: "7 days free on Pro, no card required to start on Free." },
  { q: "Can I cancel anytime?", a: "Yes, from Settings → Manage Billing. You'll keep access until the end of the period." },
];

const UseCaseVisual = ({ kind, accent }: { kind: string; accent: string }) => {
  if (kind === "saas") {
    return (
      <div className="absolute inset-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${accent}`} />
          <div className="h-2 w-20 rounded-full bg-neutral-200" />
          <div className="ml-auto flex gap-1.5">
            {[0, 1, 2].map((k) => <div key={k} className="h-1.5 w-1.5 rounded-full bg-neutral-300" />)}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2">
          <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200/70">
            {[60, 40, 80, 50].map((w, k) => <div key={k} className="h-1.5 rounded-full bg-neutral-200" style={{ width: `${w}%` }} />)}
          </div>
          <div className="col-span-2 flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200/70">
            <div className="h-2 w-24 rounded-full bg-neutral-200" />
            <div className={`h-16 rounded-lg bg-gradient-to-br ${accent} opacity-90`} />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-neutral-100" />
              <div className="h-8 flex-1 rounded-lg bg-neutral-100" />
              <div className="h-8 flex-1 rounded-lg bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "ai") {
    return (
      <div className="absolute inset-6 flex flex-col justify-end gap-2.5">
        <div className="self-start max-w-[70%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-xs text-neutral-700 ring-1 ring-neutral-200/70">
          Summarize my Q3 launch wins ✨
        </div>
        <div className={`self-end max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br ${accent} px-4 py-2.5 text-xs text-white shadow-sm`}>
          You shipped 4 features, gained 1,284 users, and trended #2 on Product Hunt.
        </div>
        <div className="self-start flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 ring-1 ring-neutral-200/70">
          {[0, 1, 2].map((k) => <span key={k} className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" style={{ animationDelay: `${k * 150}ms` }} />)}
        </div>
      </div>
    );
  }
  if (kind === "ecom") {
    return (
      <div className="absolute inset-6 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="flex flex-col rounded-xl bg-white p-2.5 ring-1 ring-neutral-200/70">
            <div className={`h-14 rounded-lg bg-gradient-to-br ${accent} opacity-${80 - k * 10}`} />
            <div className="mt-2 h-1.5 w-16 rounded-full bg-neutral-200" />
            <div className="mt-1.5 h-1.5 w-10 rounded-full bg-neutral-100" />
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="h-2 w-8 rounded-full bg-neutral-300" />
              <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${accent}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "mobile") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[88%] w-[46%] rounded-[2rem] bg-neutral-900 p-2 shadow-xl">
          <div className="flex h-full flex-col gap-2 rounded-[1.5rem] bg-white p-3">
            <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-neutral-900" />
            <div className={`mt-2 h-10 w-10 rounded-xl bg-gradient-to-br ${accent}`} />
            <div className="h-2 w-20 rounded-full bg-neutral-200" />
            <div className="h-1.5 w-16 rounded-full bg-neutral-100" />
            <div className={`mt-2 h-20 rounded-xl bg-gradient-to-br ${accent} opacity-90`} />
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-neutral-100" />
              <div className="h-1.5 w-3/4 rounded-full bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  // side
  return (
    <div className="absolute inset-6 grid grid-cols-3 gap-2.5">
      {["Idea", "Build", "Ship"].map((c, k) => (
        <div key={c} className="flex flex-col gap-2 rounded-xl bg-white p-2.5 ring-1 ring-neutral-200/70">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${accent}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{c}</span>
          </div>
          {Array.from({ length: 3 - (k === 2 ? 1 : 0) }).map((_, j) => (
            <div key={j} className="rounded-lg bg-neutral-50 p-2 ring-1 ring-neutral-100">
              <div className="h-1.5 w-14 rounded-full bg-neutral-200" />
              <div className="mt-1.5 h-1.5 w-10 rounded-full bg-neutral-100" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Index = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 8 * 1024 * 1024) continue;
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

  const CATEGORIES = [
    { label: "Brand Guidelines", slug: "brand-guidelines", Icon: BookMarked },
    { label: "Brand Templates", slug: "brand-templates", Icon: LayoutTemplate },
    { label: "Logos", slug: "logos", Icon: Shapes },
    { label: "Colors", slug: "colors", Icon: Palette },
    { label: "Fonts", slug: "fonts", Icon: TypeIcon },
    { label: "Brand voice", slug: "brand-voice", Icon: Mic },
    { label: "Photos", slug: "photos", Icon: ImageIcon },
    { label: "Components", slug: "components", Icon: Box },
    { label: "Graphics", slug: "graphics", Icon: Sparkle },
    { label: "Icons", slug: "icons", Icon: Puzzle },
    { label: "Launch Copy", slug: "launch-copy", Icon: Megaphone },
  ];

  const toggleCategory = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed && images.length === 0) return;
    let finalUrl = trimmed;
    if (trimmed && selected.length > 0) {
      const focus = selected.join(",");
      finalUrl = `${finalUrl.replace(/#focus=.*$/, "").trim()}#focus=${focus}`;
    }
    if (images.length > 0) {
      try { sessionStorage.setItem("gen_images", JSON.stringify(images)); } catch {}
    }
    const target = finalUrl ? `/create?url=${encodeURIComponent(finalUrl)}` : "/create";
    if (user) nav(target);
    else nav("/signup", { state: { from: target } });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[600px] w-[1200px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(59,130,246,0.30), rgba(59,130,246,0) 70%), radial-gradient(closest-side, rgba(120,140,255,0.20), rgba(120,140,255,0) 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <h1 className="mx-auto max-w-4xl text-4xl font-medium tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
            Make Your Product a Brand
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-normal leading-relaxed text-neutral-500 sm:text-xl">
            Generate your logo, palette, typography, and a full Brand Kit — then design social posts, launch copy, and marketing assets in the Rocket editor. All in one workspace.
          </p>
          <form onSubmit={onSubmit} className="mx-auto mt-10 w-full max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-100">
              {images.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-neutral-200">
                      <img src={src} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
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
                  aria-label="Attach images"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="Paste your URL, describe your idea, or attach images..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!url && images.length === 0}
                  aria-label="Generate brand"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-neutral-400">Enter to send · Shift+Enter for newline</p>
          </form>
          <div className="mx-auto mt-4 flex w-full max-w-2xl flex-wrap justify-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const isActive = selected.includes(cat.slug);
              const Icon = cat.Icon;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="mt-12">
            <SenjaWidget />
          </div>
        </div>
      </section>

      {/* What you can create */}
      <CreateShowcase />

      {/* Use Cases */}
      <section id="use-cases" className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">What can you brand with Rocket?</h2>
            <p className="mt-4 text-lg text-neutral-600">
              From indie side projects to full SaaS launches — Rocket brands them all.
            </p>
          </div>
          <div className="mt-14 space-y-6">
            {[
              {
                icon: Zap,
                accent: "from-indigo-500 to-indigo-700",
                tint: "from-indigo-50 to-white",
                title: "SaaS products",
                desc: "Launch your next software empire with a complete brand system — positioning, identity, and launch assets ready in minutes.",
                bullets: [
                  "Logo, colors & type that look investor-ready",
                  "Landing page copy + Product Hunt kit",
                  "Onboarding emails and lifecycle templates",
                ],
                visual: "saas",
              },
              {
                icon: Sparkles,
                accent: "from-violet-600 to-fuchsia-500",
                tint: "from-fuchsia-50 to-white",
                title: "AI tools",
                desc: "Stand out in a sea of GPT wrappers. Rocket gives your AI product a sharp positioning and a brand that feels native to 2026.",
                bullets: [
                  "Differentiated one-liner & taglines",
                  "Demo-ready hero copy and screenshots",
                  "X / LinkedIn launch threads written for you",
                ],
                visual: "ai",
              },
              {
                icon: ShoppingBag,
                accent: "from-rose-500 to-pink-500",
                tint: "from-rose-50 to-white",
                title: "E-commerce stores",
                desc: "Conversion-focused retail branding — from your logo and packaging palette to PDP copy that actually sells.",
                bullets: [
                  "Product page descriptions, FAQs, reviews",
                  "Ad creative templates for Meta & TikTok",
                  "Email flows: welcome, abandoned cart, win-back",
                ],
                visual: "ecom",
              },
              {
                icon: Smartphone,
                accent: "from-sky-400 to-blue-600",
                tint: "from-sky-50 to-white",
                title: "Mobile apps",
                desc: "App Store-ready branding. We generate your icon direction, screenshots, ASO copy, and the launch posts to back it.",
                bullets: [
                  "App Store / Play Store metadata",
                  "Screenshot frames + feature captions",
                  "Press kit for indie & startup reviewers",
                ],
                visual: "mobile",
              },
              {
                icon: Lightbulb,
                accent: "from-blue-600 to-indigo-800",
                tint: "from-blue-50 to-white",
                title: "Side projects",
                desc: "Turn weekend ideas into polished ventures. Rocket gives every side project the brand polish of a funded startup.",
                bullets: [
                  "Name + tagline + one-liner in seconds",
                  "Directory submissions auto-filled",
                  "Launch checklist you can ship over a weekend",
                ],
                visual: "side",
              },
            ].map((row, i) => {
              const reverse = i % 2 === 1;
              return (
                <div
                  key={row.title}
                  className="overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200/70 transition-shadow hover:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)]"
                >
                  <div className={`grid items-center gap-8 p-8 sm:p-12 md:grid-cols-2 md:gap-12 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                    <div>
                      <h3 className="text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl">{row.title}</h3>
                      <p className="mt-4 text-base leading-relaxed text-neutral-600">{row.desc}</p>
                      <Button asChild className="mt-7">
                        <Link to="/create">
                          Start free <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <ul className="mt-7 space-y-3">
                        {row.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2.5 text-sm text-neutral-700">
                            <span className="mt-0.5 text-brand">↳</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${row.tint} ring-1 ring-neutral-200/70`}>
                      <UseCaseVisual kind={row.visual} accent={row.accent} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">Simple, credit-based pricing</h2>
            <p className="mt-4 text-lg text-neutral-600">Start free. Upgrade when you're ready to ship.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Free</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-medium tracking-tight">$0</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">No credit card required.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["100 credits / month", "All output types", "Save & edit brands", "Limited project history"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                    <span className="text-neutral-700">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Everything you can create</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    "Brand Guidelines",
                    "Brand Templates",
                    "Logos",
                    "Colors",
                    "Fonts",
                    "Brand voice",
                    "Photos",
                    "Components",
                    "Graphics",
                    "Icons",
                    "Launch Copy",
                  ].map((item) => (
                    <span key={item} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to="/signup">Sign up free</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border border-neutral-200 bg-neutral-100 p-8 text-neutral-900">
              <div className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                7-day free trial
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Pro</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-medium tracking-tight">$20</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">For founders shipping fast.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "3,000 credits / month",
                  "Unlimited saved assets",
                  "Export tools",
                  "Priority generation",
                  "Full asset history",
                  "Early access to new generators",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Everything you can create</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    "Brand Guidelines",
                    "Brand Templates",
                    "Logos",
                    "Colors",
                    "Fonts",
                    "Brand voice",
                    "Photos",
                    "Components",
                    "Graphics",
                    "Icons",
                    "Launch Copy",
                  ].map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild className="mt-8 w-full">
                <Link to="/signup">Start free trial</Link>
              </Button>
            </div>
          </div>

          {/* Credit packs */}
          <div className="mt-14">
            <div className="text-center">
              <h2 className="text-3xl font-medium tracking-tight">Need more credits?</h2>
              <p className="mt-2 text-neutral-600">One-time credit packs. Never expire. Stack with your plan.</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { credits: "500", price: "$5", note: "Starter pack" },
                { credits: "1,500", price: "$10", note: "Most popular", highlight: true },
                { credits: "5,000", price: "$25", note: "Best value" },
              ].map((p) => (
                <div key={p.credits} className={`rounded-2xl border p-6 ${p.highlight ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"}`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{p.note}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-medium tracking-tight">{p.price}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-neutral-900">{p.credits} credits</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Frequently asked</h2>
            <p className="mt-3 text-neutral-600">Everything you wanted to know about Rocket.</p>
          </div>
          <Accordion type="single" collapsible className="mt-10 w-full space-y-4">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:border-brand/30 data-[state=open]:ring-1 data-[state=open]:ring-brand data-[state=open]:shadow-lg data-[state=open]:shadow-brand/5"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-base font-semibold text-neutral-900">{f.q}</AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-sm text-neutral-600 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand/10 bg-brand/5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-neutral-900">Still have questions?</p>
              <p className="text-sm text-neutral-500">We're here to help you build something great.</p>
            </div>
            <Button asChild>
              <a href="mailto:alex@tryrocket.ai">Contact Support</a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">Ready to launch?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            Create your first asset in under 60 seconds.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/signup">Sign up free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
