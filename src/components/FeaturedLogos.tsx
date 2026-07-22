import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_SEED_TEMPLATES, getIconOnlyDataUrl } from "@/lib/seedIconTemplates";

// A hand-picked shortlist of the strongest icon templates — spans styles,
// colour moods, and typography so the grid reads as a real portfolio.
// Mix of icon-only marks and full logotypes for variety.
const FEATURED: { name: string; iconOnly?: boolean }[] = [
  { name: "Nova", iconOnly: true },
  { name: "Prism AI" },
  { name: "Aegis", iconOnly: true },
  { name: "Vault" },
  { name: "Bloom", iconOnly: true },
  { name: "MAISON NOIR" },
];

export default function FeaturedLogos() {
  const picks = FEATURED
    .map((f) => {
      const tpl = ICON_SEED_TEMPLATES.find((t) => t.title === f.name);
      if (!tpl) return null;
      const image_url = f.iconOnly ? getIconOnlyDataUrl(f.name) || tpl.image_url : tpl.image_url;
      return { ...tpl, image_url };
    })
    .filter(Boolean) as typeof ICON_SEED_TEMPLATES;

  return (
    <section className="border-t border-neutral-200/60 bg-neutral-50/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">Logos made with Rocket</h2>
          <p className="mt-4 text-lg text-neutral-600">
            A shortlist of our favourite marks — every one of them started as a single prompt.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {picks.map((tpl) => (
            <Link
              key={tpl.id}
              to="/templates"
              className="group flex flex-col items-center text-center"
            >
              <div
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl"
                style={{ backgroundColor: tpl.background }}
              >
                <img
                  src={tpl.image_url}
                  alt={tpl.title}
                  className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
              </div>
              <span className="mt-4 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                {tpl.meta?.template_style || "Logo"}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild>
            <Link to="/templates">
              Browse templates <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}