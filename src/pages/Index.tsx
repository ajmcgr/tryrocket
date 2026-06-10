import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, ArrowUp, Sparkles, Zap, Target, Rocket as RocketIcon, Megaphone, ListChecks, Check, Smartphone, Mail, Palette, ShoppingBag, Building2, Puzzle, Mic, BookOpen, Wrench, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "What does Rocket actually generate?", a: "A complete launch kit from a single URL: positioning, taglines, value props, audience, founder bio, X/LinkedIn posts, Product Hunt copy, directory submissions, launch strategy, and a full launch checklist." },
  { q: "What types of brand assets are included?", a: "Every Rocket comes with a full Brand Kit: Guidelines, Brand Templates, Logos, Colors, Fonts, Brand voice, Photos, Components, Graphics, Icons, and Charts — all organized and ready to export." },
  { q: "How long does it take?", a: "About 30–60 seconds. You'll see a live progress UI, then land on your editable Rocket." },
  { q: "Can I edit and regenerate sections?", a: "Yes. Every section has Copy, Edit, and Regenerate. Regenerating a single asset costs 1 credit." },
  { q: "What's a credit?", a: "One full Rocket = 1 credit. Free plan gets 500 credits/month. Growth gets 3,000. You can also top up with credit packs." },
  { q: "Where can I launch from Rocket?", a: "We pre-fill submissions for Product Hunt, BetaList, There's An AI For That, Hacker News, Peerlist, Uneed, Alternative.me, G2, Indie Hackers, and one-click handoff to Launch." },
  { q: "Do you support custom domains / branding?", a: "Yes — Growth plan exports as Markdown and PDF with your brand colors." },
  { q: "Is there a free trial of Growth?", a: "7 days free, no card required on the Free plan to start." },
  { q: "Can I cancel anytime?", a: "Yes, from Settings → Manage Billing. You'll keep access until the end of the period." },
];

const Index = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const CATEGORIES = [
    { label: "Brand Guidelines", slug: "brand-guidelines" },
    { label: "Brand Templates", slug: "brand-templates" },
    { label: "Logos", slug: "logos" },
    { label: "Colors", slug: "colors" },
    { label: "Fonts", slug: "fonts" },
    { label: "Brand voice", slug: "brand-voice" },
    { label: "Photos", slug: "photos" },
    { label: "Components", slug: "components" },
    { label: "Graphics", slug: "graphics" },
    { label: "Icons", slug: "icons" },
    { label: "Charts", slug: "charts" },
    { label: "Launch Copy", slug: "launch-copy" },
  ];

  const toggleCategory = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-sm text-neutral-500">Loading…</div>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    let finalUrl = trimmed;
    if (selected.length > 0) {
      const focus = selected.join(",");
      finalUrl = `${finalUrl.replace(/#focus=.*$/, "").trim()}#focus=${focus}`;
    }
    const target = `/create?url=${encodeURIComponent(finalUrl)}`;
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            AI Branding for Vibe Coders
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
            Make Your Product a Brand
          </h1>
          <p className="mx-auto mt-10 max-w-2xl text-base text-neutral-600">
            Paste your URL or describe your idea.
          </p>
          <form onSubmit={onSubmit} className="mx-auto mt-6 w-full max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-100">
              <input
                type="text"
                required
                placeholder="Paste your URL or describe your idea..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
              />
              <button
                type="submit"
                disabled={!url}
                aria-label="Generate brand"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-neutral-400">Enter to send · Shift+Enter for newline</p>
          </form>
          <div className="mx-auto mt-4 flex w-full max-w-2xl flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = selected.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                    isActive
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* What you can create */}
      <section id="create" className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">What can you create with Rocket?</h2>
            <p className="mt-4 text-lg text-neutral-600">
              A complete Brand Kit, generated for you in seconds.
            </p>
          </div>
          <div className="mt-14 grid auto-rows-[160px] grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {/* Brand Guidelines — large feature */}
            <div className="group col-span-2 row-span-2 flex flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Brand Guidelines</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">The definitive source of truth for your brand's visual identity.</p>
            </div>

            {/* Brand Templates — wide */}
            <div className="col-span-2 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg shadow-rose-100 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <ListChecks className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Brand Templates</h3>
            </div>

            {/* Logos */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 p-6 text-center text-white shadow-lg shadow-cyan-50 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <RocketIcon className="mb-2 h-8 w-8" />
              <span className="text-sm font-bold">Logos</span>
            </div>

            {/* Colors */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 p-6 text-center text-white shadow-lg shadow-amber-50 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <Palette className="mb-2 h-8 w-8" />
              <span className="text-sm font-bold">Colors</span>
            </div>

            {/* Brand Voice — wide */}
            <div className="col-span-2 flex items-center justify-between rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg shadow-purple-100 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <div>
                <h3 className="text-lg font-bold">Brand voice</h3>
                <p className="mt-1 text-xs text-white/70">Messaging that resonates.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Megaphone className="h-6 w-6" />
              </div>
            </div>

            {/* Fonts — large */}
            <div className="group col-span-2 row-span-2 flex flex-col rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-600 p-8 text-white shadow-lg shadow-emerald-100 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <div className="mb-4 font-serif text-6xl font-black opacity-20 transition-opacity group-hover:opacity-40">Aa</div>
              <div className="mt-auto">
                <h3 className="text-2xl font-bold tracking-tight">Fonts</h3>
                <p className="mt-2 text-sm text-white/80">Curated font pairings for every medium.</p>
              </div>
            </div>

            {/* Photos */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-500 p-6 text-center text-white shadow-lg shadow-sky-50 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <Sparkles className="mb-2 h-8 w-8" />
              <span className="text-sm font-bold">Photos</span>
            </div>

            {/* Components */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 text-center text-white shadow-lg shadow-slate-200 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <Puzzle className="mb-2 h-8 w-8 text-indigo-400" />
              <span className="text-sm font-bold">Components</span>
            </div>

            {/* Graphics — wide */}
            <div className="col-span-2 flex items-center justify-center gap-4 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-purple-700 p-6 text-white shadow-lg shadow-fuchsia-100 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <Zap className="h-8 w-8" />
              <h3 className="text-lg font-bold">Graphics</h3>
            </div>

            {/* Icons */}
            <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-100 p-6 text-center text-neutral-800 transition-all duration-300 hover:-translate-y-1 hover:bg-neutral-200">
              <Wrench className="mb-2 h-8 w-8 text-indigo-500" />
              <span className="text-sm font-bold">Icons</span>
            </div>

            {/* Charts */}
            <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-center text-white shadow-lg shadow-indigo-100 transition-all duration-300 hover:-translate-y-1 hover:brightness-110">
              <ListChecks className="mb-2 h-8 w-8" />
              <span className="text-sm font-bold">Charts</span>
            </div>

            {/* Launch Copy — extra wide footer */}
            <div className="col-span-2 flex items-center justify-between rounded-3xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-6 text-white shadow-xl shadow-orange-100 transition-all duration-300 hover:-translate-y-1 hover:brightness-110 lg:col-span-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Launch Copy</h3>
              </div>
              <span className="hidden rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md sm:inline">Ready to convert</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">What can you brand with Rocket?</h2>
            <p className="mt-4 text-lg text-neutral-600">
              From indie side projects to full SaaS launches — Rocket brands them all.
            </p>
          </div>
          <div className="mt-14 grid auto-rows-[160px] grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {/* Feature: SaaS products */}
            <div className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200">
              <div className="relative flex h-full flex-col justify-between p-8 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold tracking-tight">SaaS products</h3>
                  <p className="mt-2 max-w-xs text-indigo-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Launch your next software empire with a complete brand system.
                  </p>
                </div>
              </div>
            </div>

            {/* AI tools */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-400 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <Sparkles className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">AI tools</span>
              </div>
            </div>

            {/* Mobile apps */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <Smartphone className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Mobile apps</span>
              </div>
            </div>

            {/* Newsletters */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-tr from-orange-400 to-amber-600 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <Mail className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Newsletters</span>
              </div>
            </div>

            {/* Creator brands */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-bl from-emerald-400 to-teal-600 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <Palette className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Creator brands</span>
              </div>
            </div>

            {/* E-commerce - wide */}
            <div className="group relative col-span-2 cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full items-center justify-between p-7 text-white">
                <div>
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">E-commerce stores</h3>
                  <p className="text-sm text-rose-100">Conversion-focused retail branding.</p>
                </div>
                <div className="rounded-full bg-white/20 p-4 transition-transform group-hover:scale-110">
                  <ShoppingBag className="h-7 w-7" />
                </div>
              </div>
            </div>

            {/* Agencies */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-slate-900 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <Building2 className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Agencies</span>
              </div>
            </div>

            {/* Chrome extensions */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-300 to-yellow-500 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-slate-900">
                <Puzzle className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Extensions</span>
              </div>
            </div>

            {/* Podcasts */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-red-700 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <Mic className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Podcasts</span>
              </div>
            </div>

            {/* Courses */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <BookOpen className="mb-3 h-8 w-8 opacity-90" />
                <span className="font-bold tracking-tight">Courses</span>
              </div>
            </div>

            {/* Dev tools */}
            <div className="group relative cursor-pointer overflow-hidden rounded-3xl bg-slate-100 transition-all duration-500 hover:-translate-y-1 hover:bg-slate-200 hover:shadow-xl">
              <div className="relative flex h-full flex-col items-center justify-center p-6 text-center text-slate-700">
                <Wrench className="mb-3 h-8 w-8 opacity-70" />
                <span className="font-bold tracking-tight">Dev tools</span>
              </div>
            </div>

            {/* Side projects - wide */}
            <div className="group relative col-span-2 cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-800 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative flex h-full items-center justify-between p-7 text-white">
                <div>
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">Side projects</h3>
                  <p className="text-sm text-blue-100">Turn weekend ideas into polished ventures.</p>
                </div>
                <div className="rounded-full bg-white/20 p-4 transition-transform group-hover:rotate-12">
                  <Lightbulb className="h-7 w-7" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to launch</h2>
            <p className="mt-4 text-lg text-neutral-600">
              Drop in your product URL. Rocket generates the positioning, copy, and launch plan in seconds.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { emoji: "🎯", title: "Positioning", desc: "Taglines, value props, elevator pitch, target audience — locked in." },
              { emoji: "📣", title: "Launch Copy", desc: "Product Hunt, directories, X threads, LinkedIn, newsletters." },
              { emoji: "✅", title: "Launch Strategy", desc: "Channels, communities, content ideas, and a full launch checklist." },
              { emoji: "✨", title: "Founder Profile", desc: "X bio, LinkedIn headline, founder tagline — ready to paste." },
              { emoji: "⚡", title: "Instant Generation", desc: "One URL in. A complete launch kit out. Edit and regenerate any section." },
              { emoji: "🚀", title: "Launch on Launch", desc: "Ship your brand straight to Launch when you're ready to go live." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md">
                <div className="text-3xl leading-none" aria-hidden>{emoji}</div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, credit-based pricing</h2>
            <p className="mt-4 text-lg text-neutral-600">Start free. Upgrade when you're ready to ship.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Free</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">$0</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">No credit card required.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["500 Rocket Credits / month", "All output types", "Save & edit brands"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                    <span className="text-neutral-700">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-2">
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
                  "Charts",
                  "Launch Copy",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-xs text-neutral-700">
                    <Check className="h-3 w-3 shrink-0 text-brand" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to="/signup">Sign up free</Link>
              </Button>
            </div>

            {/* Growth */}
            <div className="relative rounded-2xl border border-neutral-200 bg-neutral-100 p-8 text-neutral-900">
              <div className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                7-day free trial
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Growth</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">$20</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">For founders shipping fast.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "3,000 Rocket Credits / month",
                  "Unlimited saved brands",
                  "Export tools",
                  "Priority generation",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-2">
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
                  "Charts",
                  "Launch Copy",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/60 px-3 py-2 text-xs text-neutral-700">
                    <Check className="h-3 w-3 shrink-0 text-brand" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-8 w-full">
                <Link to="/signup">Start free trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked</h2>
            <p className="mt-3 text-neutral-600">Everything you wanted to know about Rocket.</p>
          </div>
          <Accordion type="single" collapsible className="mt-10 w-full space-y-4">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:border-brand/30 data-[state=open]:ring-1 data-[state=open]:ring-brand data-[state=open]:shadow-lg data-[state=open]:shadow-brand/5"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-lg font-semibold text-neutral-900">{f.q}</AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-neutral-600 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand/10 bg-brand/5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-neutral-900">Still have questions?</p>
              <p className="text-sm text-neutral-500">We're here to help you build something great.</p>
            </div>
            <Button asChild className="rounded-full">
              <a href="mailto:alex@tryrocket.ai">Contact Support</a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready to launch?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            Generate your first brand in under 60 seconds.
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