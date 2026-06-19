import { Link } from "react-router-dom";
import { TEMPLATES } from "@/data/templates";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const Templates = () => (
  <div className="mx-auto max-w-6xl px-6 py-10">
    <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
      <ArrowLeft className="h-4 w-4" /> Projects
    </Link>
    <div className="mt-4 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Start from a template</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">Hand-tuned brand starters with palette, fonts, audience, and voice already set. Fork one to skip the blank page.</p>
      </div>
      <Link to="/projects/new" className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline">Start blank instead →</Link>
    </div>

    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map(t => (
        <Link
          key={t.id}
          to={`/projects/new?template=${t.id}`}
          className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-sm"
        >
          <div className="relative h-40 w-full overflow-hidden" style={{ background: t.colors[0] }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-2xl font-semibold tracking-tight"
                style={{ color: t.colors[3] || "#fff", fontFamily: `${t.fonts[0]}, ui-sans-serif, system-ui` }}
              >
                {t.sampleName}
              </div>
            </div>
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {t.colors.slice(0, 5).map(c => (
                <span key={c} className="h-5 w-5 rounded-full border border-white/30" style={{ background: c }} />
              ))}
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
              {t.category}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold tracking-tight">{t.name}</h3>
              <ArrowRight className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900" />
            </div>
            <p className="mt-1 text-xs text-neutral-500">{t.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-neutral-500">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5">{t.audience}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5">{t.tone}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5">{t.fonts[0]} / {t.fonts[1]}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>

    <div className="mt-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-8 text-center">
      <Sparkles className="mx-auto h-5 w-5 text-neutral-400" />
      <p className="mt-2 text-sm text-neutral-600">Want a custom template for your industry?</p>
      <Link to="/projects/new" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover">
        Start from scratch <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

export default Templates;