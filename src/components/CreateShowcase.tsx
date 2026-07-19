import { BookOpen, Star } from "lucide-react";
import logoAsset from "@/assets/showcase/logo.png";
import guidelinesAsset from "@/assets/showcase/guidelines.png";
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

const LogoContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Logos</Tag>
      <span className="font-mono text-[10px] text-neutral-400">SVG · PNG · PDF</span>
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
      <Meta>Logo marks & logotypes</Meta>
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
      <Meta>App icons, favicons & glyphs</Meta>
    </div>
  </div>
);

const BrandKitContent = () => (
  <div className="flex h-full flex-col p-7">
    <div className="flex items-center justify-between">
      <Tag>Brand Kits</Tag>
      <BookOpen className="h-4 w-4 text-neutral-400" />
    </div>
    <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">Logo · Colors · Typography · Templates</p>
    <div className="mt-3 flex-1 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-100">
      <img src={guidelinesAsset} alt="Brand kit spread" loading="lazy" width={928} height={1152} className="h-full w-full object-cover" />
    </div>
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <Meta>Everything in one place</Meta>
    </div>
  </div>
);

/* Ordered card definitions */
const CARDS: { id: string; minH: string; mobileH: string; render: () => React.ReactNode }[] = [
  { id: "logo", minH: "min-h-[320px]", mobileH: "min-h-[340px]", render: LogoContent },
  { id: "icons", minH: "min-h-[300px]", mobileH: "min-h-[340px]", render: IconsContent },
  { id: "brand-kit", minH: "min-h-[340px]", mobileH: "min-h-[360px]", render: BrandKitContent },
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
            Logos, icons, and brand kits — everything you need to launch with a clear identity.
          </p>
        </div>

        {/* Desktop / tablet: masonry via CSS columns */}
        <div className="mt-16 hidden sm:block">
          <div className="gap-6 sm:columns-2 lg:columns-3">
            {CARDS.map((c, i) => (
              <Card key={c.id} i={i} className={c.minH}>
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
