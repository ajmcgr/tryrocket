import { BookOpen, Star, ArrowRight, Shapes, Sparkles, Palette } from "lucide-react";
import logoAsset from "@/assets/showcase/logo.png";
import guidelinesAsset from "@/assets/showcase/guidelines.png";
import iconsAsset from "@/assets/showcase/icons.png";

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
    {children}
  </span>
);

const ShowcaseCard = ({
  i,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  bullets,
  meta,
  image,
  imageAlt,
  accent,
}: {
  i: number;
  eyebrow: string;
  eyebrowIcon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  bullets: string[];
  meta: string;
  image: string;
  imageAlt: string;
  accent: "blue" | "coral" | "violet";
}) => {
  const accents = {
    blue: "from-blue-500/10 to-blue-600/5 ring-blue-100",
    coral: "from-orange-500/10 to-orange-600/5 ring-orange-100",
    violet: "from-violet-500/10 to-violet-600/5 ring-violet-100",
  };
  const dotAccents = {
    blue: "bg-blue-500",
    coral: "bg-orange-500",
    violet: "bg-violet-500",
  };

  return (
    <article
      style={{ animationDelay: `${i * 100}ms` }}
      className="group flex flex-col animate-fade-in rounded-[2rem] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.08)] ring-1 ring-neutral-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_24px_48px_-16px_rgba(15,23,42,0.18)] hover:ring-neutral-300/80 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <Tag>
          <EyebrowIcon className="h-3.5 w-3.5" />
          {eyebrow}
        </Tag>
      </div>

      <div
        className={`mt-6 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${accents[accent]} ring-1 ring-inset`}
      >
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02] sm:p-6"
        />
      </div>

      <div className="mt-6 sm:mt-8">
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          {description}
        </p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotAccents[accent]}`} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-neutral-100 pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
          {meta}
        </p>
      </div>
    </article>
  );
};

const CARDS = [
  {
    id: "logos",
    eyebrow: "Logos",
    eyebrowIcon: Shapes,
    title: "Logo marks & wordmarks",
    description:
      "Generate distinctive logo directions from a URL or a few words. Get a mark, matching logotype, color palette, and typography in one pass — then refine the winner in the editor.",
    bullets: [
      "SVG, PNG & PDF exports",
      "Transparent & inverse variants",
      "One-click color reskinning",
      "Works for SaaS, AI, mobile & consumer brands",
    ],
    meta: "Logo marks · Logotypes · Variants",
    image: logoAsset,
    imageAlt: "Generated logo directions",
    accent: "blue" as const,
  },
  {
    id: "icons",
    eyebrow: "Icons",
    eyebrowIcon: Sparkles,
    title: "App icons & glyphs",
    description:
      "Create crisp app icons, favicons, and custom glyph sets that match your logo system. Pick a style, generate a batch, and save the winners directly to your brand kit.",
    bullets: [
      "App store & favicon sizes",
      "Minimal, sticker, 3D & outline styles",
      "Scalable vector output",
      "Auto-matched to your brand palette",
    ],
    meta: "App icons · Favicons · Glyph sets",
    image: iconsAsset,
    imageAlt: "Custom icon set",
    accent: "coral" as const,
  },
  {
    id: "brand-kits",
    eyebrow: "Brand Kits",
    eyebrowIcon: Palette,
    title: "Complete brand kits",
    description:
      "Turn any logo into a full brand kit: canonical colors, typography, templates, and organized files. One project, one source of truth for every launch asset.",
    bullets: [
      "Canonical logo, colors & type",
      "Social templates & launch assets",
      "Password-protected share links",
      "Export the whole kit as a ZIP",
    ],
    meta: "Colors · Typography · Templates · Share",
    image: guidelinesAsset,
    imageAlt: "Brand kit spread",
    accent: "violet" as const,
  },
];

const CreateShowcase = () => {
  return (
    <section id="create" className="relative overflow-hidden border-t border-neutral-200/60 bg-gradient-to-b from-white via-neutral-50/60 to-white">
      {/* Soft decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[520px] rounded-full bg-violet-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            <Star className="h-3.5 w-3.5" />
            Your brand, from scratch
          </span>
          <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
            What can you create<br /> with <span className="italic">Rocket?</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Rocket is built around three core outputs: logos, icons, and brand kits. 
            Start with a logo direction, expand into matching icons, then wrap everything 
            into a shareable brand kit — all in one workspace.
          </p>
        </div>

        {/* Desktop / tablet: 3-column grid */}
        <div className="mt-18 hidden grid-cols-1 gap-6 sm:mt-20 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <ShowcaseCard key={c.id} i={i} {...c} />
          ))}
        </div>

        {/* Mobile: snap carousel */}
        <div className="mt-14 sm:hidden">
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CARDS.map((c, i) => (
              <div key={c.id} className="w-[86vw] max-w-[380px] shrink-0 snap-center">
                <ShowcaseCard i={i} {...c} />
              </div>
            ))}
            <div className="shrink-0 pr-2" aria-hidden />
          </div>
        </div>

        <div className="mt-16 flex justify-center sm:mt-20">
          <a
            href="/create"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover"
          >
            Start creating your logo
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CreateShowcase;
