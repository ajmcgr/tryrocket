import { Rocket, Mail, Quote, TrendingUp, Users, CheckCircle2, BookOpen, LayoutTemplate, Image as ImageIcon, Component, Shapes, Star, BarChart3 } from "lucide-react";
import logoAsset from "@/assets/showcase/logo.png";
import guidelinesAsset from "@/assets/showcase/guidelines.png";
import templatesAsset from "@/assets/showcase/templates.png";
import photosAsset from "@/assets/showcase/photos.png";
import graphicsAsset from "@/assets/showcase/graphics.png";
import iconsAsset from "@/assets/showcase/icons.png";

type CardProps = {
  i: number;
  className?: string;
  children: React.ReactNode;
};

const Card = ({ i, className = "", children }: CardProps) => (
  <article
    style={{ animationDelay: `${i * 70}ms` }}
    className={
      "group relative mb-6 break-inside-avoid animate-fade-in rounded-3xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ring-1 ring-neutral-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_20px_40px_-16px_rgba(15,23,42,0.18)] hover:ring-neutral-300/80 " +
      className
    }
  >
    {children}
  </article>
);

const MobileCard = ({ i, className = "", children }: CardProps) => (
  <article
    style={{ animationDelay: `${i * 70}ms` }}
    className={
      "relative shrink-0 snap-center w-[78vw] max-w-[340px] animate-fade-in rounded-3xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ring-1 ring-neutral-200/70 " +
      className
    }
  >
    {children}
  </article>
);

const Tag = ({ children, variant = "light" }: { children: React.ReactNode; variant?: "light" | "dark" }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
    variant === "dark"
      ? "bg-white/15 text-white/95 ring-1 ring-white/20 backdrop-blur-sm"
      : "bg-neutral-100 text-neutral-600"
  }`}>
    {children}
  </span>
);

const Meta = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">{children}</p>
);

/* ---------- Card content blocks (reused for desktop + mobile) ---------- */

const PositioningContent = () => (
  <div className="flex h-full flex-col justify-between p-8 sm:p-10">
    <div className="flex items-center justify-between">
      <Tag>Positioning</Tag>
      <span className="text-[10px] font-mono text-neutral-400">01 / 10</span>
    </div>
    <div className="mt-10">
      <p className="font-mono text-xs text-neutral-400">RecruitAI · One-liner</p>
      <h3 className="mt-3 font-serif text-3xl leading-[1.05] tracking-tight text-neutral-900 sm:text-[40px]">
        The AI CRM<br />for Recruiters.
      </h3>
      <div className="mt-8 flex items-center gap-2 border-t border-neutral-100 pt-5">
        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        <span className="text-xs text-neutral-500">Positioning Strategy</span>
      </div>
    </div>
  </div>
);

const TaglineContent = () => (
  <div className="flex h-full flex-col justify-between bg-gradient-to-br from-neutral-950 to-neutral-800 p-7 text-white">
    <Tag variant="dark">Tagline</Tag>
    <div>
      <h3 className="font-serif text-[34px] leading-[0.95] tracking-tight">
        Hire Faster.<br />
        <span className="italic text-indigo-300">Hire Smarter.</span>
      </h3>
      <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-neutral-300">Brand Messaging</p>
    </div>
  </div>
);

const ProductHuntContent = () => (
  <div className="flex h-full flex-col items-center justify-center p-7 text-center">
    <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 ring-1 ring-orange-200">
      <Rocket className="h-3.5 w-3.5 text-orange-500" />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600">Product Hunt</span>
    </div>
    <div className="mt-5 text-7xl font-black tracking-tighter text-neutral-900">#1</div>
    <p className="mt-1 text-sm font-semibold text-neutral-700">Product of the Day</p>
    <div className="mt-5 flex items-center gap-1 text-orange-500">
      {Array.from({ length: 5 }).map((_, k) => (
        <span key={k} className="text-base">▲</span>
      ))}
    </div>
    <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-neutral-400">Launch Assets</p>
  </div>
);

const FounderContent = () => (
  <div className="flex h-full flex-col p-7">
    <Tag>Founder Profile</Tag>
    <div className="mt-6 flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-lg font-bold text-white ring-4 ring-white">
        SK
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900">Sarah Kim</p>
        <p className="text-xs text-neutral-500">Founder, RecruitAI</p>
      </div>
    </div>
    <blockquote className="relative mt-6 pl-4">
      <Quote className="absolute -left-1 top-0 h-3 w-3 text-indigo-400" />
      <p className="font-serif text-xl leading-snug text-neutral-800">
        "Building the future of recruiting."
      </p>
    </blockquote>
    <div className="mt-auto pt-6">
      <Meta>Founder Branding</Meta>
    </div>
  </div>
);

const LinkedInContent = () => (
  <div className="flex h-full flex-col p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white">
          <Rocket className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-neutral-900">RecruitAI</p>
          <p className="text-[10px] text-neutral-500">2h · 🌎</p>
        </div>
      </div>
      <Tag>Social</Tag>
    </div>
    <h3 className="mt-5 font-serif text-2xl leading-tight tracking-tight text-neutral-900">
      We just launched.
    </h3>
    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
      After 9 months of building — RecruitAI is live. The AI copilot every recruiter has been waiting for.
    </p>
    <div className="mt-5 flex items-center gap-4 border-t border-neutral-100 pt-3 text-[11px] font-medium text-neutral-500">
      <span>👍 248</span>
      <span>💬 42</span>
      <span>↗ 18</span>
    </div>
  </div>
);

const LaunchStrategyContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Launch Strategy</Tag>
      <TrendingUp className="h-4 w-4 text-neutral-400" />
    </div>
    <h3 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-neutral-900">Launch Plan</h3>
    <ul className="mt-6 space-y-3">
      {[
        { w: "T-7", t: "Teaser campaign · waitlist" },
        { w: "T-1", t: "Founders' note · embargo lift" },
        { w: "Day 0", t: "Product Hunt · HN · X thread" },
        { w: "Day +3", t: "Press follow-up · case study" },
      ].map((row, k) => (
        <li key={k} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 inline-block min-w-[44px] rounded-md bg-indigo-50 px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold text-indigo-600">
            {row.w}
          </span>
          <span className="text-neutral-700">{row.t}</span>
        </li>
      ))}
    </ul>
    <div className="mt-6 border-t border-neutral-100 pt-4">
      <Meta>Go-To-Market</Meta>
    </div>
  </div>
);

const BrandNarrativeContent = () => (
  <div className="flex h-full flex-col justify-between bg-[radial-gradient(120%_120%_at_0%_0%,#eef2ff_0%,#ffffff_45%)] p-8 sm:p-10">
    <Tag>Brand Narrative</Tag>
    <div className="mt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-indigo-500">Manifesto</p>
      <h3 className="mt-4 font-serif text-[34px] leading-[1.05] tracking-tight text-neutral-900 sm:text-[44px]">
        Every recruiter<br />deserves an<br />
        <span className="italic text-indigo-600">AI copilot.</span>
      </h3>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-neutral-600">
        Recruiting is human work. We're here to give it back the time it deserves.
      </p>
    </div>
    <div className="mt-10 flex items-center justify-between border-t border-neutral-200/70 pt-5">
      <Meta>Brand Story</Meta>
      <span className="font-mono text-[10px] text-neutral-400">CH.01</span>
    </div>
  </div>
);

const AudienceContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Audience Analysis</Tag>
      <Users className="h-4 w-4 text-neutral-400" />
    </div>
    <h3 className="mt-5 font-serif text-2xl leading-tight tracking-tight text-neutral-900">
      Recruiters at SMBs
    </h3>
    <div className="mt-6 space-y-3">
      {[
        { l: "In-house TA leads", v: 62 },
        { l: "Agency recruiters", v: 28 },
        { l: "Founders hiring", v: 10 },
      ].map((b, k) => (
        <div key={k}>
          <div className="flex justify-between text-[11px] text-neutral-600">
            <span>{b.l}</span>
            <span className="font-mono font-semibold text-neutral-900">{b.v}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              style={{ width: `${b.v}%` }}
            />
          </div>
        </div>
      ))}
    </div>
    <div className="mt-6 border-t border-neutral-100 pt-4">
      <Meta>Target Audience</Meta>
    </div>
  </div>
);

const NewsletterContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-neutral-500" />
        <span className="text-[11px] font-medium text-neutral-500">hello@recruitai.com</span>
      </div>
      <Tag>Email</Tag>
    </div>
    <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-neutral-400">Subject</p>
    <h3 className="mt-2 font-serif text-3xl leading-tight tracking-tight text-neutral-900">
      Introducing<br />RecruitAI.
    </h3>
    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
      Hi friends — today we're opening the doors. Here's what you can do on day one →
    </p>
    <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[11px] font-semibold text-white">
      Read the letter
      <span aria-hidden>→</span>
    </div>
    <div className="mt-auto pt-6">
      <Meta>Launch Email</Meta>
    </div>
  </div>
);

const MessagingContent = () => (
  <div className="grid h-full grid-cols-1 gap-6 p-8 sm:grid-cols-[1fr_1px_1fr] sm:p-10">
    <div className="flex flex-col justify-between">
      <Tag>Messaging Framework</Tag>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">Core promise</p>
        <h3 className="mt-3 font-serif text-[34px] leading-[1.05] tracking-tight text-neutral-900 sm:text-[40px]">
          Faster hiring.<br />
          <span className="italic text-indigo-600">Less admin.</span>
        </h3>
      </div>
      <Meta>Messaging Framework</Meta>
    </div>
    <div className="hidden bg-neutral-100 sm:block" />
    <div className="grid grid-cols-1 gap-4">
      {[
        { k: "Pillar 01", t: "Time saved", d: "Cut sourcing time by 70%." },
        { k: "Pillar 02", t: "Better signal", d: "AI-ranked candidates, ready to interview." },
        { k: "Pillar 03", t: "Zero admin", d: "Notes, follow-ups, scheduling — automated." },
      ].map((p, k) => (
        <div key={k} className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">{p.k}</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{p.t}</p>
            <p className="text-xs text-neutral-600">{p.d}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LogoContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Logo</Tag>
      <span className="font-mono text-[10px] text-neutral-400">SVG · PNG</span>
    </div>
    <div className="mt-6 flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-neutral-100">
      <img src={logoAsset} alt="RecruitAI logo" loading="lazy" width={800} height={800} className="h-full w-full object-contain" />
    </div>
    <div className="mt-4 flex items-center gap-2">
      {["#0F172A", "#4F46E5", "#A5B4FC", "#F5F5F4"].map((c) => (
        <span
          key={c}
          className="h-5 w-5 rounded-full ring-1 ring-neutral-200"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <Meta>Visual Identity</Meta>
    </div>
  </div>
);

const GuidelinesContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Brand Guidelines</Tag>
      <BookOpen className="h-4 w-4 text-neutral-400" />
    </div>
    <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">Section 03 · Logo System</p>
    <div className="mt-3 flex-1 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-100">
      <img src={guidelinesAsset} alt="RecruitAI brand guidelines spread" loading="lazy" width={928} height={1152} className="h-full w-full object-cover" />
    </div>
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <Meta>Brand System</Meta>
    </div>
  </div>
);

const TemplatesContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Brand Templates</Tag>
      <LayoutTemplate className="h-4 w-4 text-neutral-400" />
    </div>
    <div className="mt-5 flex-1 overflow-hidden rounded-xl ring-1 ring-neutral-100">
      <img src={templatesAsset} alt="Branded social templates" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
    </div>
    <div className="mt-4">
      <Meta>Social · Pitch · Email</Meta>
    </div>
  </div>
);

const PhotosContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Photos</Tag>
      <ImageIcon className="h-4 w-4 text-neutral-400" />
    </div>
    <div className="mt-5 flex-1 overflow-hidden rounded-xl ring-1 ring-neutral-100">
      <img src={photosAsset} alt="Brand photography mood board" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
    </div>
    <div className="mt-4 flex items-center justify-between">
      <Meta>Art Direction</Meta>
      <span className="font-mono text-[10px] text-neutral-400">24 assets</span>
    </div>
  </div>
);

const ComponentsContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Components</Tag>
      <Component className="h-4 w-4 text-neutral-400" />
    </div>
    <h3 className="mt-5 font-serif text-2xl leading-tight tracking-tight text-neutral-900">UI building blocks.</h3>
    <div className="mt-6 space-y-3">
      <button className="flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white">
        Start free <span aria-hidden>→</span>
      </button>
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Live · 124 builders online
      </div>
      <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700 ring-1 ring-indigo-100">
        <span className="font-semibold">Tip ·</span> Drop your URL to start.
      </div>
    </div>
    <div className="mt-auto border-t border-neutral-100 pt-3">
      <Meta>Design System</Meta>
    </div>
  </div>
);

const GraphicsContent = () => (
  <div className="relative flex h-full flex-col justify-between overflow-hidden p-7 text-white">
    <img src={graphicsAsset} alt="Hero brand artwork" loading="lazy" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover" />
    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
    <div className="relative flex items-center justify-between">
      <Tag variant="dark">Graphics</Tag>
      <Shapes className="h-4 w-4 text-white/80" />
    </div>
    <div className="relative">
      <h3 className="font-serif text-[34px] leading-[0.95] tracking-tight drop-shadow-sm">
        Hero<br />artwork.
      </h3>
      <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-white/80">Editorial Illustration</p>
    </div>
  </div>
);

const IconsContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Icons</Tag>
      <Star className="h-4 w-4 text-neutral-400" />
    </div>
    <div className="mt-5 flex-1 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-100">
      <img src={iconsAsset} alt="Custom icon set" loading="lazy" width={1264} height={848} className="h-full w-full object-cover" />
    </div>
    <div className="mt-4">
      <Meta>32 glyphs · stroke 1.5</Meta>
    </div>
  </div>
);

const ChartsContent = () => {
  const bars = [38, 52, 44, 68, 60, 82, 74];
  return (
    <div className="flex h-full flex-col p-7">
      <div className="flex items-center justify-between">
        <Tag>Charts</Tag>
        <BarChart3 className="h-4 w-4 text-neutral-400" />
      </div>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-serif text-4xl font-semibold tracking-tight text-neutral-900">+184%</span>
        <span className="text-xs font-medium text-emerald-600">↑ WoW</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">Signups since launch</p>
      <div className="mt-6 flex h-24 items-end gap-2">
        {bars.map((h, k) => (
          <div key={k} className="flex-1 rounded-md bg-gradient-to-t from-indigo-500 to-violet-400" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-auto border-t border-neutral-100 pt-3">
        <Meta>Launch Metrics</Meta>
      </div>
    </div>
  );
};

/* Ordered card definitions */
const CARDS: { id: string; minH: string; mobileH: string; render: () => React.ReactNode }[] = [
  { id: "positioning", minH: "min-h-[380px]", mobileH: "min-h-[360px]", render: PositioningContent },
  { id: "tagline", minH: "min-h-[280px]", mobileH: "min-h-[300px]", render: TaglineContent },
  { id: "ph", minH: "min-h-[320px]", mobileH: "min-h-[320px]", render: ProductHuntContent },
  { id: "logo", minH: "min-h-[320px]", mobileH: "min-h-[340px]", render: LogoContent },
  { id: "guidelines", minH: "min-h-[340px]", mobileH: "min-h-[360px]", render: GuidelinesContent },
  { id: "templates", minH: "min-h-[340px]", mobileH: "min-h-[360px]", render: TemplatesContent },
  { id: "graphics", minH: "min-h-[340px]", mobileH: "min-h-[360px]", render: GraphicsContent },
  { id: "founder", minH: "min-h-[300px]", mobileH: "min-h-[320px]", render: FounderContent },
  { id: "photos", minH: "min-h-[340px]", mobileH: "min-h-[360px]", render: PhotosContent },
  { id: "linkedin", minH: "min-h-[280px]", mobileH: "min-h-[300px]", render: LinkedInContent },
  { id: "components", minH: "min-h-[320px]", mobileH: "min-h-[340px]", render: ComponentsContent },
  { id: "charts", minH: "min-h-[340px]", mobileH: "min-h-[360px]", render: ChartsContent },
  { id: "launch", minH: "min-h-[360px]", mobileH: "min-h-[360px]", render: LaunchStrategyContent },
  { id: "narrative", minH: "min-h-[420px]", mobileH: "min-h-[380px]", render: BrandNarrativeContent },
  { id: "audience", minH: "min-h-[300px]", mobileH: "min-h-[320px]", render: AudienceContent },
  { id: "newsletter", minH: "min-h-[320px]", mobileH: "min-h-[340px]", render: NewsletterContent },
  { id: "icons", minH: "min-h-[300px]", mobileH: "min-h-[340px]", render: IconsContent },
  { id: "messaging", minH: "min-h-[340px]", mobileH: "min-h-[400px]", render: MessagingContent },
];

const CreateShowcase = () => {
  return (
    <section id="create" className="relative overflow-hidden border-t border-neutral-200/60 bg-gradient-to-b from-white via-neutral-50/60 to-white">
      {/* Soft decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[420px] rounded-full bg-violet-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl">
            What can you create<br /> with <span className="italic">Rocket?</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-neutral-600">
            Everything you need to position, brand, and market your product.
          </p>
        </div>

        {/* Desktop / tablet: masonry via CSS columns */}
        <div className="mt-16 hidden sm:block">
          <div className="gap-6 sm:columns-2 lg:columns-3">
            {CARDS.map((c, i) => (
              <Card key={c.id} i={i} className={c.minH + (c.id === "narrative" || c.id === "messaging" ? " bg-white" : "")}>
                <div className="h-full">{c.render()}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile: snap carousel */}
        <div className="mt-12 sm:hidden">
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CARDS.map((c, i) => (
              <MobileCard key={c.id} i={i} className={c.mobileH}>
                <div className="h-full">{c.render()}</div>
              </MobileCard>
            ))}
            <div className="shrink-0 pr-2" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateShowcase;