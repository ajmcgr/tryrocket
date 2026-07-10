import type { PresentationData } from "@/lib/assetSchemas";

type Slide = PresentationData["slides"][number];

export type SlideTheme = { bg?: string; fg?: string; accent?: string; sectionText?: string };

export const SLIDE_THEMES: Record<string, SlideTheme & { label: string }> = {
  default: { label: "Default", bg: "#ffffff", fg: "#0A0A0A" },
  ink:     { label: "Ink",     bg: "#0B0B0F", fg: "#F5F5F7", accent: "#8B5CF6", sectionText: "#fff" },
  sunset:  { label: "Sunset",  bg: "#FFF7ED", fg: "#1F2937", accent: "#EA580C" },
  sage:    { label: "Sage",    bg: "#F0FDF4", fg: "#1F2937", accent: "#16A34A" },
  slate:   { label: "Slate",   bg: "#F8FAFC", fg: "#0F172A", accent: "#334155" },
};

function detectLayout(slide: Slide, index: number): string {
  const l = (slide.layout || "").toLowerCase();
  if (slide.big_number) return "big_number";
  if (slide.quote) return "quote";
  if (slide.comparison) return "comparison";
  if (slide.stats?.length) return "stats";
  if (slide.timeline?.length) return "timeline";
  if (slide.steps?.length) return "steps";
  if (slide.columns?.length) return "two_column";
  if (index === 0 || l.includes("title") || l.includes("cover")) return "title";
  if (l.includes("section") || l.includes("divider")) return "section";
  if (l.includes("comparison") || l.includes("versus") || l.includes("vs")) return "comparison";
  if (l.includes("stat")) return "stats";
  if (l.includes("timeline")) return "timeline";
  if (l.includes("step") || l.includes("process")) return "steps";
  if (l.includes("two_col") || l.includes("two-col") || l.includes("split")) return "two_column";
  return "bullets";
}

/** Renders a single slide at 1920x1080 coordinates. */
export default function SlideRenderer({
  slide,
  index,
  total,
  brand,
  theme,
}: {
  slide: Slide;
  index: number;
  total: number;
  brand?: { name?: string; primary?: string };
  theme?: SlideTheme;
}) {
  const primary = theme?.accent || brand?.primary || "#3B82F6";
  const bg = theme?.bg || "#ffffff";
  const fg = theme?.fg || "#0A0A0A";
  const kind = detectLayout(slide, index);
  const isTitle = kind === "title";
  const isSection = kind === "section";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: bg, color: fg }}>
      {/* Header */}
      {!isTitle && !isSection && (
        <div className="flex items-center justify-between px-24 pt-14">
          <div className="slide-kicker" style={{ color: primary }}>
            {brand?.name || "Presentation"}
          </div>
          <div className="slide-page rounded-full border border-neutral-200 bg-white px-5 py-2 text-neutral-500">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col justify-center px-24 py-10">
        {kind === "big_number" && slide.big_number ? (
          <div className="flex items-center gap-16">
            <div
              className="font-bold tracking-tight"
              style={{ fontSize: 260, lineHeight: 1, color: primary }}
            >
              {slide.big_number.value}
            </div>
            <div className="max-w-[900px]">
              <div className="slide-title">{slide.title}</div>
              <div className="slide-body-lg mt-6 text-neutral-600">{slide.big_number.label}</div>
            </div>
          </div>
        ) : kind === "quote" && slide.quote ? (
          <div className="max-w-[1400px]">
            <div
              className="font-serif italic"
              style={{ fontSize: 92, lineHeight: 1.1, color: "#0A0A0A" }}
            >
              "{slide.quote.text}"
            </div>
            {slide.quote.attribution && (
              <div className="slide-subtitle mt-10 text-neutral-500">— {slide.quote.attribution}</div>
            )}
          </div>
        ) : isTitle ? (
          <div className="max-w-[1500px]">
            {brand?.name && (
              <div className="slide-kicker mb-8" style={{ color: primary }}>
                {brand.name}
              </div>
            )}
            <h1 className="slide-title-lg font-semibold tracking-tight">{slide.title}</h1>
            {slide.purpose && (
              <p className="slide-subtitle mt-10 max-w-[1200px] text-neutral-600">{slide.purpose}</p>
            )}
          </div>
        ) : isSection ? (
          <div
            className="flex h-full w-full flex-col items-start justify-center px-24 -mx-24 -my-10"
            style={{ background: primary, color: "#fff" }}
          >
            <div className="slide-kicker mb-8 text-white/70">
              Section {String(index + 1).padStart(2, "0")}
            </div>
            <h2 className="slide-title-lg font-semibold tracking-tight">{slide.title}</h2>
            {slide.purpose && (
              <p className="slide-subtitle mt-10 max-w-[1300px] text-white/85">{slide.purpose}</p>
            )}
          </div>
        ) : kind === "comparison" && slide.comparison ? (
          <div className="w-full">
            <h2 className="slide-title mb-10 font-semibold">{slide.title}</h2>
            <div className="grid grid-cols-2 gap-12">
              {(["left", "right"] as const).map((side) => {
                const col = slide.comparison![side];
                const accent = side === "left" ? "#0A0A0A" : primary;
                return (
                  <div
                    key={side}
                    className="rounded-3xl border-2 p-14"
                    style={{ borderColor: accent }}
                  >
                    <div className="slide-kicker mb-6" style={{ color: accent }}>
                      {side === "left" ? "Option A" : "Option B"}
                    </div>
                    <div className="slide-subtitle font-semibold">{col.heading}</div>
                    {col.body && (
                      <p className="slide-body mt-6 text-neutral-600">{col.body}</p>
                    )}
                    {col.bullets?.length ? (
                      <ul className="mt-8 space-y-4">
                        {col.bullets.slice(0, 5).map((b, i) => (
                          <li key={i} className="flex items-start gap-4">
                            <span
                              className="mt-3 inline-block h-3 w-3 shrink-0 rounded-full"
                              style={{ background: accent }}
                            />
                            <span className="slide-body text-neutral-800">{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : kind === "stats" && slide.stats?.length ? (
          <div className="w-full">
            <h2 className="slide-title mb-4 font-semibold">{slide.title}</h2>
            {slide.purpose && (
              <p className="slide-body-lg mb-12 max-w-[1300px] text-neutral-600">{slide.purpose}</p>
            )}
            <div
              className="grid gap-8"
              style={{ gridTemplateColumns: `repeat(${Math.min(slide.stats.length, 3)}, minmax(0,1fr))` }}
            >
              {slide.stats.slice(0, 3).map((s, i) => (
                <div key={i} className="rounded-3xl bg-neutral-50 p-14">
                  <div
                    className="font-bold tracking-tight"
                    style={{ fontSize: 160, lineHeight: 1, color: primary }}
                  >
                    {s.value}
                  </div>
                  <div className="slide-subtitle mt-6 font-semibold text-neutral-900">
                    {s.label}
                  </div>
                  {s.caption && (
                    <div className="slide-caption mt-4 text-neutral-500">{s.caption}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : kind === "timeline" && slide.timeline?.length ? (
          <div className="w-full">
            <h2 className="slide-title mb-14 font-semibold">{slide.title}</h2>
            <div className="relative">
              <div
                className="absolute left-0 right-0 top-8 h-1"
                style={{ background: primary, opacity: 0.25 }}
              />
              <div
                className="grid gap-8"
                style={{ gridTemplateColumns: `repeat(${Math.min(slide.timeline.length, 4)}, minmax(0,1fr))` }}
              >
                {slide.timeline.slice(0, 4).map((m, i) => (
                  <div key={i} className="relative pt-20">
                    <span
                      className="absolute left-0 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
                      style={{ background: primary, fontSize: 18, fontWeight: 700 }}
                    >
                      {i + 1}
                    </span>
                    <div className="slide-subtitle font-semibold text-neutral-900">
                      {m.label}
                    </div>
                    {m.body && (
                      <p className="slide-body mt-4 text-neutral-600">{m.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : kind === "steps" && slide.steps?.length ? (
          <div className="w-full">
            <h2 className="slide-title mb-12 font-semibold">{slide.title}</h2>
            <div className="space-y-8">
              {slide.steps.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-start gap-8">
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl font-bold text-white"
                    style={{ background: primary, fontSize: 56 }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="slide-subtitle font-semibold text-neutral-900">
                      {s.title}
                    </div>
                    {s.body && (
                      <p className="slide-body mt-3 max-w-[1400px] text-neutral-600">{s.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : kind === "two_column" && slide.columns?.length ? (
          <div className="w-full">
            <h2 className="slide-title mb-10 font-semibold">{slide.title}</h2>
            <div
              className="grid gap-12"
              style={{ gridTemplateColumns: `repeat(${Math.min(slide.columns.length, 2)}, minmax(0,1fr))` }}
            >
              {slide.columns.slice(0, 2).map((c, i) => (
                <div key={i}>
                  {c.heading && (
                    <div className="slide-subtitle mb-6 font-semibold" style={{ color: primary }}>
                      {c.heading}
                    </div>
                  )}
                  {c.body && (
                    <p className="slide-body max-w-[900px] text-neutral-700">{c.body}</p>
                  )}
                  {c.bullets?.length ? (
                    <ul className="mt-6 space-y-4">
                      {c.bullets.slice(0, 5).map((b, j) => (
                        <li key={j} className="flex items-start gap-4">
                          <span
                            className="mt-3 inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ background: primary }}
                          />
                          <span className="slide-body text-neutral-800">{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-[1500px]">
            <h2 className="slide-title font-semibold">{slide.title}</h2>
            {slide.purpose && (
              <p className="slide-body-lg mt-8 max-w-[1200px] text-neutral-600">{slide.purpose}</p>
            )}
            {slide.bullets?.length ? (
              <ul className="mt-14 space-y-6">
                {slide.bullets.slice(0, 5).map((b, i) => (
                  <li key={i} className="flex items-start gap-6">
                    <span
                      className="mt-4 inline-block h-4 w-4 shrink-0 rounded-full"
                      style={{ background: primary }}
                    />
                    <span className="slide-body-lg text-neutral-800">{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer accent */}
      {!isSection && <div className="h-3 w-full" style={{ background: primary }} />}
    </div>
  );
}