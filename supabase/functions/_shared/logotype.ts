// Shared with frontend src/lib/logotype.ts — keep style cycle in sync.
export interface LogotypeState {
  kind: "logotype";
  text: string;
  font: string;
  weight: number;
  color: string;
  letterSpacing: number;
  transform: "none" | "uppercase" | "lowercase" | "capitalize";
}

const STYLES: Array<Partial<LogotypeState>> = [
  { font: "Space Grotesk", weight: 700, letterSpacing: -0.03, transform: "none" },
  { font: "Geist", weight: 600, letterSpacing: -0.02, transform: "lowercase" },
  { font: "Outfit", weight: 800, letterSpacing: -0.04, transform: "none" },
  { font: "Bricolage Grotesque", weight: 700, letterSpacing: -0.02, transform: "none" },
  { font: "Instrument Serif", weight: 400, letterSpacing: -0.02, transform: "none" },
  { font: "Fraunces", weight: 600, letterSpacing: -0.03, transform: "none" },
  { font: "DM Serif Display", weight: 400, letterSpacing: -0.02, transform: "none" },
  { font: "Manrope", weight: 800, letterSpacing: -0.04, transform: "uppercase" },
  { font: "Syne", weight: 700, letterSpacing: 0, transform: "none" },
  { font: "Plus Jakarta Sans", weight: 700, letterSpacing: -0.02, transform: "none" },
  { font: "IBM Plex Mono", weight: 500, letterSpacing: -0.04, transform: "lowercase" },
  { font: "JetBrains Mono", weight: 700, letterSpacing: -0.04, transform: "uppercase" },
  { font: "Hanken Grotesk", weight: 800, letterSpacing: -0.03, transform: "none" },
  { font: "Sora", weight: 700, letterSpacing: -0.02, transform: "none" },
  { font: "Figtree", weight: 700, letterSpacing: -0.02, transform: "lowercase" },
  { font: "Onest", weight: 700, letterSpacing: -0.03, transform: "none" },
  { font: "Playfair Display", weight: 700, letterSpacing: -0.01, transform: "none" },
  { font: "Spectral", weight: 600, letterSpacing: -0.01, transform: "none" },
  { font: "Crimson Pro", weight: 700, letterSpacing: -0.01, transform: "none" },
  { font: "Recursive", weight: 700, letterSpacing: -0.03, transform: "lowercase" },
];

export function buildLogotypeVariants(text: string, count: number, brandColor?: string): LogotypeState[] {
  const color = brandColor && /^#[0-9a-f]{3,8}$/i.test(brandColor) ? brandColor : "#0a0a0a";
  const out: LogotypeState[] = [];
  for (let i = 0; i < count; i++) {
    const s = STYLES[i % STYLES.length];
    out.push({
      kind: "logotype",
      text: text || "Brand",
      font: s.font || "Space Grotesk",
      weight: s.weight ?? 700,
      color,
      letterSpacing: s.letterSpacing ?? -0.02,
      transform: (s.transform as LogotypeState["transform"]) || "none",
    });
  }
  return out;
}

export function extractNameFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "").split(".")[0];
    if (!host) return undefined;
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch { return undefined; }
}