import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ICON_SEED_TEMPLATES } from "@/lib/seedIconTemplates";

// A hand-picked shortlist of the strongest icon templates — spans styles,
// colour moods, and typography so the grid reads as a real portfolio.
const FEATURED_NAMES = [
  "Nova",
  "Prism AI",
  "Aegis",
  "Vault",
  "Bloom",
  "Meridian",
];

export default function FeaturedLogos() {
  const picks = FEATURED_NAMES
    .map((n) => ICON_SEED_TEMPLATES.find((t) => t.title === n))
    .filter(Boolean) as typeof ICON_SEED_TEMPLATES;

  return (
    <section className="border-t border-neutral-200/60 bg-neutral-50/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
            Featured logos
          </div>
          <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">Logos made with Rocket</h2>
          <p className="mt-4 text-lg text-neutral-600">
            A shortlist of our favourite marks — every one of them started as a single prompt.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {picks.map((tpl) => (
            <Link
              key={tpl.id}
              to="/templates"
              className="group flex flex-col items-center text-center"
            >
              <div
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl"
                style={{ backgroundColor: tpl.background }}
              >
                <img
                  src={tpl.image_url}
                  alt={tpl.title}
                  className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <span className="mt-3 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                {tpl.meta?.template_style || "Logo"}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/templates"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Browse 250+ templates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}