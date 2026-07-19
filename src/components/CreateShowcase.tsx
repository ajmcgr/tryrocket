import { Link } from "react-router-dom";
import { Star, ArrowRight, Shapes, Sparkles, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/showcase/logo.png";
import guidelinesAsset from "@/assets/showcase/guidelines.png";
import iconsAsset from "@/assets/showcase/icons.png";

const ShowcaseCard = ({
  i,
  title,
  description,
  bullets,
  meta,
  ctaText,
  ctaLink,
  image,
  imageAlt,
  accent,
}: {
  i: number;
  title: string;
  description: string;
  bullets: string[];
  meta: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  imageAlt: string;
  accent: "blue" | "coral" | "violet";
}) => {
  const accents = {
    blue: "bg-blue-50/70 ring-blue-100",
    coral: "bg-orange-50/70 ring-orange-100",
    violet: "bg-violet-50/70 ring-violet-100",
  };
  const dotAccents = {
    blue: "bg-blue-500",
    coral: "bg-orange-500",
    violet: "bg-violet-500",
  };

  return (
    <article
      style={{ animationDelay: `${i * 100}ms` }}
      className="grid animate-fade-in grid-cols-1 gap-8 rounded-[2rem] bg-white p-6 ring-1 ring-neutral-200/70 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-12"
    >
      <div
        className={`order-first flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl ${accents[accent]} ring-1 ring-inset lg:aspect-[5/4]`}
      >
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="h-full w-full object-contain p-6 sm:p-10"
        />
      </div>

      <div>
        <h3 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          {title}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          {description}
        </p>
        <Button asChild className="mt-7">
          <Link to={ctaLink}>
            {ctaText} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <ul className="mt-7 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15px] text-neutral-700">
              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotAccents[accent]}`} />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-neutral-100 pt-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
            {meta}
          </p>
        </div>
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
    ctaText: "Generate logos",
    ctaLink: "/create",
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
    ctaText: "Generate icons",
    ctaLink: "/icons",
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
    ctaText: "Create brand kit",
    ctaLink: "/brands",
    image: guidelinesAsset,
    imageAlt: "Brand kit spread",
    accent: "violet" as const,
  },
];

const CreateShowcase = () => {
  return (
    <section id="create" className="overflow-hidden border-t border-neutral-200/60 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
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

        {/* Single column stack, logos leading */}
        <div className="mx-auto mt-16 flex max-w-5xl flex-col gap-8 sm:mt-20 sm:gap-10">
          {CARDS.map((c, i) => (
            <ShowcaseCard key={c.id} i={i} {...c} />
          ))}
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
