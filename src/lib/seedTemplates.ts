import type { LogotypeState } from "@/lib/logotype";

// Curated seed catalog rendered as logotype templates on /templates.
// These are visual starting points — clicking "Use template" opens /create
// with a matching prompt so the user generates their own asset.

type SeedInput = {
  name: string;
  style: string; // one of TEMPLATE_STYLES values
  font: string;
  weight: number;
  color: string;
  bg?: string;
  transform?: LogotypeState["transform"];
  letterSpacing?: number;
  tagline?: string;
};

const NAMES: { name: string; style: string; tagline?: string }[] = [
  // Startup / SaaS
  { name: "Northwind", style: "Startup", tagline: "Ship faster" },
  { name: "Loop", style: "Startup", tagline: "Work in cycles" },
  { name: "Kernel", style: "Startup", tagline: "The core layer" },
  { name: "Nova", style: "Startup", tagline: "Bright by default" },
  { name: "Foundry", style: "Startup", tagline: "Build the next thing" },
  { name: "Momentum", style: "Startup", tagline: "Keep shipping" },
  { name: "Signal", style: "Startup", tagline: "Cut through noise" },
  { name: "Anchor", style: "Startup", tagline: "Steady growth" },
  { name: "Rally", style: "Startup", tagline: "Move as one" },
  { name: "Vector", style: "Startup", tagline: "Direction and speed" },
  // AI
  { name: "Neuron", style: "AI", tagline: "Think in patterns" },
  { name: "Synapse", style: "AI", tagline: "Connected intelligence" },
  { name: "Cortex", style: "AI", tagline: "Model your world" },
  { name: "Prism AI", style: "AI", tagline: "Split the signal" },
  { name: "Lucid", style: "AI", tagline: "See it clearly" },
  { name: "Aegis", style: "AI", tagline: "Guarded intelligence" },
  { name: "Delphi", style: "AI", tagline: "Ask anything" },
  { name: "Muse", style: "AI", tagline: "Creativity, augmented" },
  { name: "Beacon", style: "AI", tagline: "Guided by data" },
  { name: "Oracle Lab", style: "AI", tagline: "Predict, then act" },
  // Fintech
  { name: "Ledger", style: "Fintech", tagline: "Money, made simple" },
  { name: "Vault", style: "Fintech", tagline: "Own your assets" },
  { name: "Mint & Co", style: "Fintech", tagline: "Fresh finance" },
  { name: "North Bank", style: "Fintech", tagline: "Banking, clarified" },
  { name: "Pivot", style: "Fintech", tagline: "Turn the corner" },
  { name: "Bloom Capital", style: "Fintech", tagline: "Grow with intent" },
  { name: "Coin", style: "Fintech", tagline: "One tap, done" },
  { name: "Threshold", style: "Fintech", tagline: "Cross the line" },
  { name: "Rise Pay", style: "Fintech", tagline: "Money that moves" },
  { name: "Beacon Bank", style: "Fintech", tagline: "Light the way" },
  // Healthcare
  { name: "Vital", style: "Healthcare", tagline: "Care that carries on" },
  { name: "Verdant Health", style: "Healthcare", tagline: "Grow well" },
  { name: "Halcyon", style: "Healthcare", tagline: "Calm, restored" },
  { name: "Meridian Care", style: "Healthcare", tagline: "Care in every line" },
  { name: "Ember Med", style: "Healthcare", tagline: "Warmth in medicine" },
  { name: "Kindred", style: "Healthcare", tagline: "Family-first care" },
  { name: "Tonic", style: "Healthcare", tagline: "Everyday wellness" },
  { name: "Pulse", style: "Healthcare", tagline: "Feel it move" },
  { name: "Solstice", style: "Healthcare", tagline: "Turn a corner" },
  { name: "Cove Health", style: "Healthcare", tagline: "A quieter kind of care" },
  // Education
  { name: "Atlas Academy", style: "Education", tagline: "Map your mind" },
  { name: "Scholar", style: "Education", tagline: "Study, smarter" },
  { name: "Lyceum", style: "Education", tagline: "Where curiosity meets craft" },
  { name: "Prism Learning", style: "Education", tagline: "Every angle counts" },
  { name: "Kindling", style: "Education", tagline: "Spark the next class" },
  { name: "Codex", style: "Education", tagline: "Knowledge, indexed" },
  { name: "Compass College", style: "Education", tagline: "Find your bearing" },
  { name: "Halo Learn", style: "Education", tagline: "Shine through the syllabus" },
  { name: "Journeyman", style: "Education", tagline: "Craft over time" },
  { name: "Northstar Ed", style: "Education", tagline: "Guided study" },
  // Consumer / Lifestyle
  { name: "Ember & Oak", style: "Consumer", tagline: "Warm goods, well made" },
  { name: "Field House", style: "Consumer", tagline: "Made for the outdoors" },
  { name: "Wild Honey", style: "Consumer", tagline: "Sweet, small batch" },
  { name: "Copper", style: "Consumer", tagline: "Timeless finish" },
  { name: "Sundry", style: "Consumer", tagline: "A little of everything" },
  { name: "Salt & Cedar", style: "Consumer", tagline: "Coastal essentials" },
  { name: "Marigold", style: "Consumer", tagline: "Golden, everyday" },
  { name: "Fern", style: "Consumer", tagline: "Quietly beautiful" },
  { name: "Thistle", style: "Consumer", tagline: "Small, sharp, rooted" },
  { name: "Meadowlark", style: "Consumer", tagline: "Songs from the hill" },
  // Enterprise / B2B
  { name: "Ironclad", style: "Enterprise", tagline: "Built to last" },
  { name: "Sentinel", style: "Enterprise", tagline: "Always watching" },
  { name: "Cascade", style: "Enterprise", tagline: "Flow at scale" },
  { name: "Bedrock", style: "Enterprise", tagline: "Foundation-first" },
  { name: "Meridian", style: "Enterprise", tagline: "The right line" },
  { name: "Axiom", style: "Enterprise", tagline: "Truth in software" },
  { name: "Prime OS", style: "Enterprise", tagline: "Run everything" },
  { name: "Fortress", style: "Enterprise", tagline: "Guarded by design" },
  { name: "Continuum", style: "Enterprise", tagline: "Never stops shipping" },
  { name: "Latitude", style: "Enterprise", tagline: "Wider by default" },
  // Modern / Minimal / Luxury / Technology (design-forward)
  { name: "Studio Mono", style: "Minimal", tagline: "Less, refined" },
  { name: "Grid", style: "Minimal", tagline: "Order matters" },
  { name: "Blank", style: "Minimal", tagline: "Start clean" },
  { name: "Line Studio", style: "Minimal", tagline: "A single stroke" },
  { name: "Neu", style: "Minimal", tagline: "The new nothing" },
  { name: "Silver Fox", style: "Luxury", tagline: "Quiet confidence" },
  { name: "Maison Onyx", style: "Luxury", tagline: "Crafted after hours" },
  { name: "Velvet", style: "Luxury", tagline: "Touch the difference" },
  { name: "Noir & Co", style: "Luxury", tagline: "In shadow, in style" },
  { name: "Atelier 07", style: "Luxury", tagline: "Made by hand" },
  { name: "Pixel Forge", style: "Technology", tagline: "Interfaces, sharpened" },
  { name: "Circuit", style: "Technology", tagline: "Electric ideas" },
  { name: "Portal", style: "Technology", tagline: "Move through it" },
  { name: "Chipset", style: "Technology", tagline: "Small parts, big work" },
  { name: "Lattice", style: "Technology", tagline: "Structure that scales" },
  { name: "Halcyon Labs", style: "Modern", tagline: "New calm" },
  { name: "Prism Studio", style: "Modern", tagline: "Every color counts" },
  { name: "Field Notes", style: "Modern", tagline: "From the road" },
  { name: "Common Ground", style: "Modern", tagline: "Built together" },
  { name: "Wildline", style: "Modern", tagline: "Break the grid" },
];

// Font x color combos tuned per aesthetic tone.
const PALETTES: { color: string; bg: string }[] = [
  { color: "#0A0A0A", bg: "#FFFFFF" },
  { color: "#FFFFFF", bg: "#0A0A0A" },
  { color: "#0F172A", bg: "#F5F1EA" },
  { color: "#1E293B", bg: "#E2E8F0" },
  { color: "#FFFFFF", bg: "#1676E3" },
  { color: "#0A0A0A", bg: "#FDE68A" },
  { color: "#FFFFFF", bg: "#0F766E" },
  { color: "#FFFFFF", bg: "#7C3AED" },
  { color: "#0A0A0A", bg: "#F4A261" },
  { color: "#FFFFFF", bg: "#B91C1C" },
  { color: "#111827", bg: "#F9FAFB" },
  { color: "#FEFAE0", bg: "#283618" },
];

const FONT_MOODS: Record<string, Array<{ font: string; weight: number; transform?: LogotypeState["transform"]; letterSpacing?: number }>> = {
  Startup: [
    { font: "Space Grotesk", weight: 700, letterSpacing: -0.03 },
    { font: "Geist", weight: 700, letterSpacing: -0.02 },
    { font: "Outfit", weight: 800, letterSpacing: -0.03 },
    { font: "Manrope", weight: 800, letterSpacing: -0.02 },
  ],
  AI: [
    { font: "JetBrains Mono", weight: 700, letterSpacing: -0.01 },
    { font: "IBM Plex Mono", weight: 600, transform: "lowercase" },
    { font: "Sora", weight: 700, letterSpacing: -0.03 },
    { font: "Onest", weight: 700, letterSpacing: -0.02 },
  ],
  Fintech: [
    { font: "DM Sans", weight: 700, letterSpacing: -0.02 },
    { font: "Hanken Grotesk", weight: 700, letterSpacing: -0.02 },
    { font: "Plus Jakarta Sans", weight: 700, letterSpacing: -0.02 },
    { font: "Manrope", weight: 700 },
  ],
  Healthcare: [
    { font: "Fraunces", weight: 600, letterSpacing: -0.02 },
    { font: "Spectral", weight: 600 },
    { font: "Figtree", weight: 600, letterSpacing: -0.02 },
    { font: "Crimson Pro", weight: 600 },
  ],
  Education: [
    { font: "Playfair Display", weight: 700 },
    { font: "Instrument Serif", weight: 400 },
    { font: "Fraunces", weight: 700, letterSpacing: -0.02 },
    { font: "DM Serif Display", weight: 400 },
  ],
  Consumer: [
    { font: "Bricolage Grotesque", weight: 700, letterSpacing: -0.02 },
    { font: "Syne", weight: 700 },
    { font: "DM Serif Display", weight: 400 },
    { font: "Fraunces", weight: 700 },
  ],
  Enterprise: [
    { font: "IBM Plex Sans", weight: 700, letterSpacing: -0.01, transform: "uppercase" },
    { font: "Space Grotesk", weight: 700, transform: "uppercase", letterSpacing: 0.02 },
    { font: "Geist", weight: 700 },
    { font: "Manrope", weight: 800 },
  ],
  Modern: [
    { font: "Space Grotesk", weight: 700, letterSpacing: -0.03 },
    { font: "Bricolage Grotesque", weight: 700, letterSpacing: -0.02 },
    { font: "Figtree", weight: 700 },
    { font: "Onest", weight: 700 },
  ],
  Minimal: [
    { font: "Geist", weight: 500, letterSpacing: -0.02, transform: "lowercase" },
    { font: "Space Grotesk", weight: 500, transform: "lowercase" },
    { font: "IBM Plex Sans", weight: 500, transform: "lowercase" },
    { font: "Hanken Grotesk", weight: 500 },
  ],
  Luxury: [
    { font: "Playfair Display", weight: 500, letterSpacing: 0.04, transform: "uppercase" },
    { font: "DM Serif Display", weight: 400, letterSpacing: 0.06, transform: "uppercase" },
    { font: "Fraunces", weight: 500, letterSpacing: 0.04, transform: "uppercase" },
    { font: "Instrument Serif", weight: 400, letterSpacing: 0.02 },
  ],
  Technology: [
    { font: "JetBrains Mono", weight: 700, letterSpacing: -0.01 },
    { font: "IBM Plex Mono", weight: 700, letterSpacing: -0.01 },
    { font: "Space Grotesk", weight: 700, letterSpacing: -0.03 },
    { font: "Sora", weight: 700 },
  ],
};

function makeSeed(input: SeedInput, index: number) {
  const editor_state: LogotypeState & { background?: string } = {
    kind: "logotype",
    text: input.name,
    font: input.font,
    weight: input.weight,
    color: input.color,
    letterSpacing: input.letterSpacing ?? -0.02,
    transform: input.transform ?? "none",
  };
  return {
    id: `seed-tpl-${index}`,
    title: input.name,
    asset_type: "logo",
    editor_state,
    background: input.bg ?? "#FFFFFF",
    prompt: `${input.name} — ${input.tagline || ""}`.trim(),
    creator_username: "Rocket Studio",
    created_at: new Date(Date.now() - index * 3600_000).toISOString(),
    meta: { template_style: input.style, seed: true, tagline: input.tagline },
    _seed: true as const,
  };
}

export function buildSeedTemplates() {
  const out: ReturnType<typeof makeSeed>[] = [];
  let i = 0;
  for (const { name, style, tagline } of NAMES) {
    const moods = FONT_MOODS[style] || FONT_MOODS.Modern;
    // Two variants per brand for ~200 templates from ~100 names.
    for (let v = 0; v < 2; v++) {
      const mood = moods[(v + i) % moods.length];
      const palette = PALETTES[(i * 3 + v * 5) % PALETTES.length];
      out.push(
        makeSeed(
          {
            name,
            style,
            tagline,
            font: mood.font,
            weight: mood.weight,
            transform: mood.transform,
            letterSpacing: mood.letterSpacing,
            color: palette.color,
            bg: palette.bg,
          },
          i * 10 + v,
        ),
      );
      i++;
    }
  }
  return out;
}

export const SEED_TEMPLATES = buildSeedTemplates();