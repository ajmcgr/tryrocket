// Curated Google Fonts that read as startup-branding wordmarks.
// Avoid Inter/Poppins per design rules.
export const LOGOTYPE_FONTS: { family: string; category: "sans" | "serif" | "mono" | "display"; weights: number[] }[] = [
  { family: "Space Grotesk", category: "sans", weights: [400, 500, 600, 700] },
  { family: "DM Sans", category: "sans", weights: [400, 500, 700] },
  { family: "Outfit", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Manrope", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Plus Jakarta Sans", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Sora", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Figtree", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Bricolage Grotesque", category: "display", weights: [400, 500, 600, 700, 800] },
  { family: "Onest", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Hanken Grotesk", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Geist", category: "sans", weights: [400, 500, 600, 700, 800] },
  { family: "Instrument Serif", category: "serif", weights: [400] },
  { family: "Fraunces", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "DM Serif Display", category: "serif", weights: [400] },
  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "Spectral", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "Crimson Pro", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "Syne", category: "display", weights: [400, 500, 600, 700, 800] },
  { family: "IBM Plex Sans", category: "sans", weights: [400, 500, 600, 700] },
  { family: "IBM Plex Mono", category: "mono", weights: [400, 500, 600, 700] },
  { family: "JetBrains Mono", category: "mono", weights: [400, 500, 600, 700, 800] },
  { family: "Recursive", category: "sans", weights: [400, 500, 600, 700, 800] },
];

export interface LogotypeState {
  kind: "logotype";
  text: string;
  font: string;
  weight: number;
  color: string;
  letterSpacing: number; // em
  transform: "none" | "uppercase" | "lowercase" | "capitalize";
}

export function isLogotype(asset: any): boolean {
  return asset?.editor_state?.kind === "logotype";
}

const loaded = new Set<string>();

/** Dynamically inject a Google Fonts <link> for the requested family+weights. */
export function loadGoogleFont(family: string, weights: number[] = [400, 600, 700]): void {
  if (typeof document === "undefined") return;
  const key = `${family}:${weights.join(",")}`;
  if (loaded.has(key)) return;
  loaded.add(key);
  const id = `gf-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const fam = family.replace(/\s+/g, "+");
  link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights.join(";")}&display=swap`;
  document.head.appendChild(link);
}

export function defaultLogotypeState(text: string, color = "#0a0a0a"): LogotypeState {
  return {
    kind: "logotype",
    text: text || "Brand",
    font: "Space Grotesk",
    weight: 700,
    color,
    letterSpacing: -0.02,
    transform: "none",
  };
}

/** Build N varied logotype editor_state objects for a brand name. */
export function buildLogotypeVariants(text: string, count: number, brandColor?: string): LogotypeState[] {
  const color = brandColor && /^#[0-9a-f]{3,8}$/i.test(brandColor) ? brandColor : "#0a0a0a";
  // Cycle font + style combos for variety.
  const styles: Array<Partial<LogotypeState>> = [
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
  const out: LogotypeState[] = [];
  for (let i = 0; i < count; i++) {
    const s = styles[i % styles.length];
    out.push({
      kind: "logotype",
      text: text || "Brand",
      font: s.font || "Space Grotesk",
      weight: s.weight ?? 700,
      color,
      letterSpacing: s.letterSpacing ?? -0.02,
      transform: s.transform || "none",
    });
  }
  return out;
}