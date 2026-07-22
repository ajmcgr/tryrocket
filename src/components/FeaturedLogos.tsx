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
  "Halcyon",
  "Pulse",
  "Ember & Oak",
  "Voltage",
  "Skyline OS",
  "MAISON NOIR",
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

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {picks.map((tpl) => (
            <Link
              key={tpl.id}
              to="/templates"
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: tpl.background }}>
                <img
                  src={tpl.image_url}
                  alt={tpl.title}
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
                <span className="truncate text-sm font-medium text-neutral-900">{tpl.title}</span>
                <span className="text-[11px] uppercase tracking-wide text-neutral-400">
                  {tpl.meta?.template_style || "Logo"}
                </span>
              </div>
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