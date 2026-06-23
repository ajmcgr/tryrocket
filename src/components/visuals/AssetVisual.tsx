import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  tryJson, parseMarkdownSections, findSection, flattenSections,
  mdToHtml, hexToRgb, rgbToHsl, contrastRatio,
  extractBlockquotes, extractBullets, extractCodeBlocks,
  type ColorSystem, type FontSystem, type FounderBio, type MarkdownSection,
} from "@/lib/assetSchemas";

/* ----------------------------- shared chrome ----------------------------- */
function Page({ label, title, children }: { label?: string; title?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {(label || title) && (
        <header className="border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
          {label && <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">{label}</div>}
          {title && <h2 className="mt-0.5 text-xl font-semibold text-neutral-900">{title}</h2>}
        </header>
      )}
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); }}
      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50"
    >
      {done ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} {done ? "Copied" : label}
    </button>
  );
}

/* ============================== COLOR SYSTEM ============================== */
function SwatchCard({ name, hex, role }: { name: string; hex: string; role?: string }) {
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
  const onWhite = contrastRatio(hex, "#FFFFFF");
  const onBlack = contrastRatio(hex, "#000000");
  const textHex = onWhite >= onBlack ? "#FFFFFF" : "#0A0A0A";
  const wcag = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "Fail");
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex h-32 items-end p-4" style={{ background: hex, color: textHex }}>
        <div>
          <div className="text-xs uppercase tracking-wider opacity-80">{role || name}</div>
          <div className="font-mono text-lg font-semibold">{hex.toUpperCase()}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 py-3 text-[11px] text-neutral-600">
        {rgb && <div>RGB <span className="font-mono text-neutral-900">{rgb.r}, {rgb.g}, {rgb.b}</span></div>}
        {hsl && <div>HSL <span className="font-mono text-neutral-900">{hsl.h}, {hsl.s}%, {hsl.l}%</span></div>}
        <div>On white <span className="font-mono text-neutral-900">{onWhite.toFixed(1)} {wcag(onWhite)}</span></div>
        <div>On black <span className="font-mono text-neutral-900">{onBlack.toFixed(1)} {wcag(onBlack)}</span></div>
      </div>
      <div className="flex justify-end border-t border-neutral-100 px-3 py-2"><CopyBtn text={hex.toUpperCase()} label="Hex" /></div>
    </div>
  );
}

function ColorSystemView({ data }: { data: ColorSystem }) {
  const primary = data.primary || data.accent || "#3B82F6";
  const sec = data.secondary || data.neutral_dark || "#0F172A";
  const acc = data.accent || primary;
  const light = data.light_mode || {};
  const dark = data.dark_mode || {};
  const roleSwatches: { name: string; hex?: string; role: string }[] = [
    { name: "Primary", hex: data.primary, role: "primary" },
    { name: "Secondary", hex: data.secondary, role: "secondary" },
    { name: "Accent", hex: data.accent, role: "accent" },
    { name: "Success", hex: data.success, role: "success" },
    { name: "Warning", hex: data.warning, role: "warning" },
    { name: "Danger", hex: data.danger, role: "danger" },
  ].filter(s => !!s.hex) as any;
  const neutrals = data.neutrals ? Object.entries(data.neutrals) : [];
  const grads = data.gradients || [];

  return (
    <div className="space-y-6">
      {data.name && <div className="text-sm text-neutral-500">Palette: <span className="font-medium text-neutral-800">{data.name}</span></div>}

      <Page label="Brand Colors" title="Role swatches">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {roleSwatches.map((s) => <SwatchCard key={s.role} name={s.name} hex={s.hex!} role={s.name} />)}
        </div>
      </Page>

      {neutrals.length > 0 && (
        <Page label="Neutrals" title="10-step neutral scale">
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${neutrals.length}, minmax(0, 1fr))` }}>
              {neutrals.map(([k, hex]) => {
                const onWhite = contrastRatio(hex, "#FFFFFF");
                const textHex = onWhite >= contrastRatio(hex, "#000000") ? "#FFFFFF" : "#0A0A0A";
                return (
                  <div key={k} className="flex h-24 flex-col justify-between p-2 text-[10px]" style={{ background: hex, color: textHex }}>
                    <span className="opacity-80">{k}</span>
                    <span className="font-mono">{hex.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Page>
      )}

      {grads.length > 0 && (
        <Page label="Gradients" title="Brand gradients">
          <div className="grid gap-3 md:grid-cols-3">
            {grads.map((g, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-neutral-200">
                <div className="h-28" style={{ background: `linear-gradient(${g.angle ?? 135}deg, ${g.from}, ${g.to})` }} />
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-medium text-neutral-800">{g.name || `Gradient ${i + 1}`}</span>
                  <span className="font-mono text-neutral-500">{g.from} → {g.to}</span>
                </div>
              </div>
            ))}
          </div>
        </Page>
      )}

      <Page label="Preview" title="UI examples">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500">Light mode</div>
            <div className="p-6" style={{ background: light.background || "#FFFFFF", color: light.text || "#0A0A0A" }}>
              <div className="text-xs" style={{ color: light.muted_text || "#737373" }}>Dashboard</div>
              <div className="mt-1 text-xl font-semibold">Welcome back</div>
              <div className="mt-3 inline-flex gap-2">
                <button className="rounded-full px-4 py-1.5 text-sm" style={{ background: primary, color: "#FFFFFF" }}>Primary</button>
                <button className="rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: light.border || "#E5E5E5", color: light.text || "#0A0A0A" }}>Secondary</button>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500">Dark mode</div>
            <div className="p-6" style={{ background: dark.background || sec, color: dark.text || "#FFFFFF" }}>
              <div className="text-xs" style={{ color: dark.muted_text || "#A3A3A3" }}>Dashboard</div>
              <div className="mt-1 text-xl font-semibold">Welcome back</div>
              <div className="mt-3 inline-flex gap-2">
                <button className="rounded-full px-4 py-1.5 text-sm" style={{ background: acc, color: "#0A0A0A" }}>Primary</button>
                <button className="rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: dark.border || "#262626", color: dark.text || "#FFFFFF" }}>Secondary</button>
              </div>
            </div>
          </div>
        </div>
      </Page>

      {(data.accessibility || data.usage || data.rationale) && (
        <Page label="Notes" title="Usage & accessibility">
          {data.usage && <p className="mb-2 text-sm leading-relaxed text-neutral-700"><strong>Usage.</strong> {data.usage}</p>}
          {data.accessibility && <p className="mb-2 text-sm leading-relaxed text-neutral-700"><strong>Accessibility.</strong> {data.accessibility}</p>}
          {data.rationale && <p className="text-sm leading-relaxed text-neutral-700"><strong>Rationale.</strong> {data.rationale}</p>}
        </Page>
      )}
    </div>
  );
}

/* =============================== FONT SYSTEM =============================== */
function ensureFontLink(families: string[]) {
  const id = "rocket-visual-fonts";
  const want = families.filter(Boolean).join("|");
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (el && el.dataset.families === want) return;
  if (!el) { el = document.createElement("link"); el.id = id; el.rel = "stylesheet"; document.head.appendChild(el); }
  el.dataset.families = want;
  const qs = families.filter(Boolean).map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`).join("&");
  el.href = `https://fonts.googleapis.com/css2?${qs}&display=swap`;
}

function FontSystemView({ data }: { data: FontSystem }) {
  const display = data.display_font || data.heading_font || "Playfair Display";
  const heading = data.heading_font || display;
  const body = data.body_font || "Inter";
  const mono = data.mono_font || "JetBrains Mono";
  useMemo(() => ensureFontLink([display, heading, body, mono]), [display, heading, body, mono]);

  const scale = data.scale || {};
  const sample = data.example_headline || "Make your product a brand.";
  const para = data.example_body || "A confident voice paired with timeless type. This specimen shows how the system holds up across weights, sizes, and line lengths in real product surfaces.";

  const rows: { key: string; label: string }[] = [
    { key: "h1", label: "Heading 1" }, { key: "h2", label: "Heading 2" }, { key: "h3", label: "Heading 3" },
    { key: "h4", label: "Heading 4" }, { key: "h5", label: "Heading 5" }, { key: "h6", label: "Heading 6" },
    { key: "body", label: "Body" }, { key: "small", label: "Small" },
  ];

  return (
    <div className="space-y-6">
      <Page label="Specimen" title="Typography system">
        <div className="rounded-xl bg-neutral-50 p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{display} · Display</div>
          <div className="mt-2" style={{ fontFamily: `'${display}', serif`, fontSize: 84, lineHeight: 1.02, letterSpacing: "-0.03em", fontWeight: data.display_weight || 700 }}>
            {sample}
          </div>
        </div>
      </Page>

      <Page label="Scale" title="Type scale">
        <div className="divide-y divide-neutral-100">
          {rows.map(({ key, label }) => {
            const s = scale[key]; if (!s) return null;
            const fontFam = key.startsWith("h") ? heading : body;
            return (
              <div key={key} className="grid grid-cols-[140px_1fr_auto] items-center gap-4 py-4">
                <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
                <div style={{ fontFamily: `'${fontFam}', sans-serif`, fontSize: s.size_px, lineHeight: s.line_height, letterSpacing: s.tracking, fontWeight: s.weight }} className="text-neutral-900">
                  {key === "body" || key === "small" ? para : "The quick brown fox jumps."}
                </div>
                <div className="font-mono text-[11px] text-neutral-500">{s.size_px}px · {s.weight} · {s.line_height}</div>
              </div>
            );
          })}
        </div>
      </Page>

      <div className="grid gap-4 md:grid-cols-3">
        <Page label="Heading" title={heading}>
          <div style={{ fontFamily: `'${heading}', sans-serif`, fontSize: 40, lineHeight: 1.1, fontWeight: data.heading_weight || 700 }} className="text-neutral-900">Aa Bb Cc</div>
          <div className="mt-2 text-xs text-neutral-500">Use for section headings, marketing pages.</div>
        </Page>
        <Page label="Body" title={body}>
          <div style={{ fontFamily: `'${body}', sans-serif`, fontSize: 18, lineHeight: 1.6, fontWeight: data.body_weight || 400 }} className="text-neutral-900">Aa Bb Cc 123</div>
          <div className="mt-2 text-xs text-neutral-500">Use for paragraphs, UI labels, captions.</div>
        </Page>
        <Page label="Mono" title={mono}>
          <div style={{ fontFamily: `'${mono}', monospace`, fontSize: 18 }} className="text-neutral-900">Aa Bb Cc 123</div>
          <div className="mt-2 text-xs text-neutral-500">Use for code, data, and technical UI.</div>
        </Page>
      </div>

      {(data.pair_rationale || data.usage) && (
        <Page label="Notes" title="Pairing & usage">
          {data.pair_rationale && <p className="mb-2 text-sm leading-relaxed text-neutral-700"><strong>Pairing.</strong> {data.pair_rationale}</p>}
          {data.usage && <p className="text-sm leading-relaxed text-neutral-700"><strong>Usage.</strong> {data.usage}</p>}
        </Page>
      )}
    </div>
  );
}

/* ============================ BRAND GUIDELINES ============================ */
function BrandGuidelinesView({ md }: { md: string }) {
  const sections = parseMarkdownSections(md);
  // Pages = top-level (## or # children). If only one h1 exists, use its children.
  const pages: MarkdownSection[] = sections.length === 1 && sections[0].children.length > 0 ? sections[0].children : sections;
  const [idx, setIdx] = useState(0);
  const page = pages[idx] || pages[0];

  return (
    <div className="space-y-4">
      {/* page thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-2">
        {pages.map((p, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`flex h-20 w-32 shrink-0 flex-col justify-between rounded-lg border p-2 text-left text-[10px] transition ${idx === i ? "border-brand bg-white shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
            <span className="text-neutral-400">Page {i + 1}</span>
            <span className="line-clamp-2 font-medium text-neutral-800">{p.title}</span>
          </button>
        ))}
      </div>

      {page && (
        <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <header className="border-b border-neutral-100 bg-gradient-to-br from-neutral-50 to-white px-10 py-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Page {idx + 1} of {pages.length}</div>
            <h2 className="mt-2 text-3xl font-semibold text-neutral-900">{page.title}</h2>
          </header>
          <div className="prose prose-neutral max-w-none px-10 py-8">
            <div dangerouslySetInnerHTML={{ __html: mdToHtml(page.body) }} />
            {page.children.map((child, ci) => (
              <section key={ci} className="mt-6">
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">{child.title}</h3>
                <div dangerouslySetInnerHTML={{ __html: mdToHtml(child.body) }} />
                {child.children.map((g, gi) => (
                  <div key={gi} className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
                    <h4 className="mb-1 text-sm font-semibold text-neutral-900">{g.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: mdToHtml(g.body) }} />
                  </div>
                ))}
              </section>
            ))}
          </div>
          <footer className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/60 px-10 py-3">
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-[11px] text-neutral-500">{page.title}</span>
            <button onClick={() => setIdx(Math.min(pages.length - 1, idx + 1))} disabled={idx >= pages.length - 1}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </footer>
        </article>
      )}
    </div>
  );
}

/* =============================== BRAND VOICE =============================== */
function BrandVoiceView({ md }: { md: string }) {
  const sections = parseMarkdownSections(md);
  const root = sections[0]?.children?.length ? sections[0].children : sections;
  const pillars = findSection(root, /pillars/i);
  const ctx = findSection(root, /tone across|tone shifts|contexts/i);
  const dos = findSection(root, /what we say|^do$|^do:/i);
  const donts = findSection(root, /what we don.?t say|don.?t/i);
  const website = findSection(root, /website/i);
  const social = findSection(root, /social/i);
  const launch = findSection(root, /launch/i);
  const email = findSection(root, /email/i);

  const example = (s: MarkdownSection | null) => s ? <div dangerouslySetInnerHTML={{ __html: mdToHtml(s.body + "\n" + s.children.map(c => `### ${c.title}\n${c.body}`).join("\n")) }} /> : null;

  return (
    <div className="space-y-6">
      {pillars && (
        <Page label="Voice" title={pillars.title}>
          <div className="grid gap-4 md:grid-cols-2">
            {pillars.children.map((p, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-brand">Pillar {i + 1}</div>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">{p.title}</h3>
                <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(p.body) }} />
              </div>
            ))}
          </div>
        </Page>
      )}
      {ctx && <Page label="Tone" title={ctx.title}><div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(ctx.body) }} /></Page>}
      <div className="grid gap-4 md:grid-cols-2">
        {dos && (
          <Page label="Do" title={dos.title}>
            <ul className="space-y-2 text-sm">
              {extractBullets(dos.body).map((b, i) => <li key={i} className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-900">✓ {b}</li>)}
            </ul>
          </Page>
        )}
        {donts && (
          <Page label="Don't" title={donts.title}>
            <ul className="space-y-2 text-sm">
              {extractBullets(donts.body).map((b, i) => <li key={i} className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-rose-900">✗ {b}</li>)}
            </ul>
          </Page>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {website && <Page label="Channel" title={website.title}>{example(website)}</Page>}
        {social && <Page label="Channel" title={social.title}>{example(social)}</Page>}
        {launch && <Page label="Channel" title={launch.title}>{example(launch)}</Page>}
        {email && <Page label="Channel" title={email.title}>{example(email)}</Page>}
      </div>
    </div>
  );
}

/* ============================ COPY BOARDS (cards) ============================ */
function CopyCardBoard({ md, accent = "Section" }: { md: string; accent?: string }) {
  const sections = parseMarkdownSections(md);
  const root = sections[0]?.children?.length ? sections[0].children : sections;

  const renderSection = (s: MarkdownSection): React.ReactNode => {
    if (s.children.length === 0) {
      const text = s.body.trim();
      return (
        <div className="group relative rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand">{accent}</div>
            <CopyBtn text={text} />
          </div>
          <h3 className="mt-1 text-base font-semibold text-neutral-900">{s.title}</h3>
          <div className="prose prose-sm mt-2 max-w-none text-neutral-800" dangerouslySetInnerHTML={{ __html: mdToHtml(text) }} />
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-brand">{accent}</div>
        <h3 className="mt-1 text-base font-semibold text-neutral-900">{s.title}</h3>
        {s.body.trim() && <div className="prose prose-sm mt-2 max-w-none text-neutral-800" dangerouslySetInnerHTML={{ __html: mdToHtml(s.body) }} />}
        <div className="mt-3 grid gap-3">
          {s.children.map((c, i) => (
            <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-900">{c.title}</h4>
                <CopyBtn text={c.body.trim()} />
              </div>
              <div className="prose prose-sm mt-1 max-w-none text-neutral-800" dangerouslySetInnerHTML={{ __html: mdToHtml(c.body) }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {root.map((s, i) => <div key={i}>{renderSection(s)}</div>)}
    </div>
  );
}

/* ============================== SOCIAL LIBRARY ============================== */
function SocialLibraryView({ md }: { md: string }) {
  const sections = parseMarkdownSections(md);
  const root = sections[0]?.children?.length ? sections[0].children : sections;

  return (
    <div className="space-y-6">
      {root.map((cat, i) => (
        <Page key={i} label="Category" title={cat.title}>
          <div className="grid gap-3 md:grid-cols-2">
            {cat.children.map((post, pi) => {
              const bq = extractBlockquotes(post.body)[0] || post.body.trim();
              const platform = (post.title.match(/—\s*([A-Za-z]+)/) || [])[1] || "Post";
              return (
                <div key={pi} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-[10px] text-white">{platform[0]?.toUpperCase()}</div>
                      <span className="text-[11px] uppercase tracking-wider text-neutral-500">{platform}</span>
                    </div>
                    <CopyBtn text={bq} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{bq}</p>
                </div>
              );
            })}
          </div>
        </Page>
      ))}
    </div>
  );
}

/* =============================== FOUNDER BIO =============================== */
function FounderBioView({ data }: { data: FounderBio }) {
  const cards: { label: string; title: string; text?: string; mono?: boolean }[] = [
    { label: "X / Twitter", title: "Bio (≤160)", text: data.x_bio, mono: true },
    { label: "LinkedIn", title: "Headline", text: data.linkedin_headline },
    { label: "LinkedIn", title: "About", text: data.linkedin_about },
    { label: "Bio", title: "Short", text: data.short },
    { label: "Bio", title: "Medium", text: data.medium },
    { label: "Bio", title: "Long", text: data.long },
    { label: "Speaking", title: "Speaker bio", text: data.speaker_bio },
    { label: "Press", title: "Press bio", text: data.press_bio },
  ].filter(c => !!c.text);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c, i) => (
        <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.18em] text-brand">{c.label}</div>
            <CopyBtn text={c.text!} />
          </div>
          <h3 className="mt-1 text-base font-semibold text-neutral-900">{c.title}</h3>
          <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 ${c.mono ? "font-mono" : ""}`}>{c.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================= PRESENTATION DECK ============================= */
function PresentationView({ md }: { md: string }) {
  const sections = parseMarkdownSections(md);
  const flat = flattenSections(sections);
  const slides = flat.filter((s) => /^slide\s+\d+/i.test(s.title) || /^##\s*Slide/.test(`## ${s.title}`));
  const list = slides.length ? slides : flat.filter((s) => s.level === 2);
  const [idx, setIdx] = useState(0);
  const slide = list[idx];
  if (!slide) return <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-sm text-neutral-500">No slides detected.</div>;

  const sub = (re: RegExp) => {
    const m = slide.body.match(re);
    return m ? m[1].trim() : "";
  };
  const purpose = sub(/\*\*Purpose:\*\*\s*([^\n]+)/i);
  const visual = sub(/\*\*Visual guidance:\*\*\s*([^\n]+)/i);
  const layout = sub(/\*\*Layout:\*\*\s*([^\n]+)/i);
  const bullets = extractBullets(slide.body);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-2">
        {list.map((s, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`flex h-24 w-40 shrink-0 flex-col justify-between rounded-lg border p-2 text-left transition ${idx === i ? "border-brand bg-white shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
            <span className="text-[10px] text-neutral-400">Slide {i + 1}</span>
            <span className="line-clamp-2 text-[11px] font-medium text-neutral-800">{s.title.replace(/^slide\s+\d+\s*—\s*/i, "")}</span>
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="grid aspect-[16/9] grid-rows-[auto_1fr_auto] bg-gradient-to-br from-white to-neutral-50">
          <div className="px-12 pt-10 text-[11px] uppercase tracking-[0.2em] text-neutral-400">Slide {idx + 1} / {list.length}{layout ? ` · ${layout}` : ""}</div>
          <div className="flex flex-col justify-center px-12">
            <h2 className="text-4xl font-semibold leading-tight text-neutral-900">{slide.title.replace(/^slide\s+\d+\s*—\s*/i, "")}</h2>
            {purpose && <p className="mt-3 max-w-2xl text-base text-neutral-600">{purpose}</p>}
            {bullets.length > 0 && (
              <ul className="mt-6 max-w-2xl space-y-2 text-base text-neutral-800">
                {bullets.map((b, i) => <li key={i} className="flex gap-2"><span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-brand" />{b}</li>)}
              </ul>
            )}
          </div>
          {visual && <div className="px-12 pb-8 text-xs italic text-neutral-500">Visual direction · {visual}</div>}
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/60 px-6 py-3">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40">
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="text-[11px] text-neutral-500">{idx + 1} of {list.length}</span>
          <button onClick={() => setIdx(Math.min(list.length - 1, idx + 1))} disabled={idx >= list.length - 1} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs disabled:opacity-40">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== TEMPLATE LIBRARY ============================== */
function TemplateLibraryView({ md }: { md: string }) {
  const sections = parseMarkdownSections(md);
  const root = sections[0]?.children?.length ? sections[0].children : sections;
  return (
    <div className="space-y-6">
      {root.map((group, gi) => (
        <Page key={gi} label="Group" title={group.title}>
          <div className="grid gap-3 md:grid-cols-2">
            {group.children.map((t, ti) => {
              const code = extractCodeBlocks(t.body)[0]?.content || t.body.trim();
              return (
                <div key={ti} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-900">{t.title}</h4>
                    <CopyBtn text={code} />
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 font-sans text-sm leading-relaxed text-neutral-800">{code}</pre>
                </div>
              );
            })}
          </div>
        </Page>
      ))}
    </div>
  );
}

/* =================================== ROUTER =================================== */
export default function AssetVisual({ asset }: { asset: any }) {
  const type = asset?.asset_type as string;
  const content: string = asset?.content || "";
  const json = useMemo(() => tryJson(content), [content]);

  if (type === "color_system" && json) return <ColorSystemView data={json} />;
  if (type === "font_system" && json) return <FontSystemView data={json} />;
  if (type === "founder_bio" && json) return <FounderBioView data={json} />;
  if (type === "brand_guidelines") return <BrandGuidelinesView md={content} />;
  if (type === "brand_voice") return <BrandVoiceView md={content} />;
  if (type === "launch_copy") return <CopyCardBoard md={content} accent="Launch" />;
  if (type === "product_hunt_copy") return <CopyCardBoard md={content} accent="Product Hunt" />;
  if (type === "social_post" && /^#\s+Social Content Library/i.test(content)) return <SocialLibraryView md={content} />;
  if (type === "presentation") return <PresentationView md={content} />;
  if (type === "template") return <TemplateLibraryView md={content} />;

  // Fallback: render markdown nicely (no raw pre tag).
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8">
      <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(content) }} />
    </div>
  );
}

export function hasVisualRenderer(asset: any): boolean {
  const t = asset?.asset_type;
  return [
    "color_system","font_system","founder_bio","brand_guidelines","brand_voice",
    "launch_copy","product_hunt_copy","social_post","presentation","template",
  ].includes(t);
}