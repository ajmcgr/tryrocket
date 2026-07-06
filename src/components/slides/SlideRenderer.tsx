import type { PresentationData } from "@/lib/assetSchemas";

type Slide = PresentationData["slides"][number];

/** Renders a single slide at 1920x1080 coordinates. */
export default function SlideRenderer({
  slide,
  index,
  total,
  brand,
}: {
  slide: Slide;
  index: number;
  total: number;
  brand?: { name?: string; primary?: string };
}) {
  const primary = brand?.primary || "#3B82F6";
  const layout = (slide.layout || "").toLowerCase();
  const isTitle = index === 0 || layout.includes("title") || layout.includes("cover");

  return (
    <div className="flex h-full w-full flex-col bg-white text-neutral-900">
      {/* Header */}
      {!isTitle && (
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
        {slide.big_number ? (
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
        ) : slide.quote ? (
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
      <div className="h-3 w-full" style={{ background: primary }} />
    </div>
  );
}