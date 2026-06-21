// Specialized branding generators. Each asset_type has its own prompt.
// Rocket behaves like a branding specialist, not a general assistant.

export type AssetType =
  | "logo" | "brand_guidelines" | "color_system" | "font_system" | "brand_voice"
  | "graphic" | "icon" | "photo" | "template"
  | "launch_copy" | "product_hunt_copy" | "social_post" | "founder_bio"
  | "presentation" | "other";

export const IMAGE_ASSET_TYPES = new Set<AssetType>(["logo", "graphic", "icon", "photo"]);

export const ASSET_TITLES: Record<AssetType, string> = {
  logo: "Logo", brand_guidelines: "Brand Guidelines", color_system: "Color System",
  font_system: "Font System", brand_voice: "Brand Voice", graphic: "Graphic",
  icon: "Icon", photo: "Photo", template: "Template", launch_copy: "Launch Copy",
  product_hunt_copy: "Product Hunt Copy", social_post: "Social Post",
  founder_bio: "Founder Bio", presentation: "Presentation", other: "Asset",
};

export const ROCKET_PERSONA =
  "You are Rocket — an AI branding system for startups. You ONLY create startup branding assets: logos, brand systems, colors, typography, launch assets, startup positioning, marketing graphics. You never behave like a general chatbot. If a request is outside branding, politely redirect. Output ONLY the requested asset, no preamble.";

export interface BrandContext {
  productName?: string; url?: string; tagline?: string; industry?: string;
  audience?: string; tone?: string; colors?: string[]; fonts?: string[];
  description?: string; competitors?: string[]; logo?: string; favicon?: string;
  ogImage?: string; colorScheme?: string; screenshot?: string;
}

function ctxBlock(c: BrandContext, userPrompt: string): string {
  const lines: string[] = [];
  if (c.productName) lines.push(`Product: ${c.productName}`);
  if (c.url) lines.push(`URL: ${c.url}`);
  if (c.tagline) lines.push(`Tagline: ${c.tagline}`);
  if (c.industry) lines.push(`Industry: ${c.industry}`);
  if (c.audience) lines.push(`Audience: ${c.audience}`);
  if (c.tone) lines.push(`Tone: ${c.tone}`);
  if (c.description) lines.push(`Description: ${c.description}`);
  if (c.colors?.length) lines.push(`Brand colors: ${c.colors.join(", ")}`);
  if (c.fonts?.length) lines.push(`Brand fonts: ${c.fonts.join(", ")}`);
  if (c.colorScheme) lines.push(`Color scheme: ${c.colorScheme}`);
  if (c.logo) lines.push(`Existing logo URL (reference only): ${c.logo}`);
  if (c.favicon) lines.push(`Existing favicon URL (reference only): ${c.favicon}`);
  if (c.ogImage) lines.push(`OG image URL (reference only): ${c.ogImage}`);
  if (c.screenshot) lines.push(`Homepage screenshot URL (reference only): ${c.screenshot}`);
  if (c.competitors?.length) lines.push(`Competitors: ${c.competitors.join(", ")}`);
  lines.push("");
  lines.push(`User request: ${userPrompt}`);
  if (c.colors?.length || c.productName || c.logo || c.screenshot) {
    lines.push("");
    lines.push("CRITICAL: This is a REAL existing brand. Your job is to EVOLVE its existing identity, not invent a new one. Stay faithful to the scraped colors, fonts, logo motif, and visual language above. Do not invent unrelated colors, names, motifs, or vibes. Reference images may also be attached — match their style.");
  }
  return lines.join("\n");
}

export interface GenSpec {
  kind: "image" | "text";
  system: string;
  build: (c: BrandContext, userPrompt: string) => string;
  defaultCount?: number;
}

export const GENERATORS: Record<AssetType, GenSpec> = {
  logo: {
    kind: "image", defaultCount: 24,
    system: ROCKET_PERSONA + " You specialize in iconic, scalable startup LOGO MARKS — never poster designs, never text canvases.",
    build: (c, p) => {
      const hasRef = !!c.logo;
      return `${ctxBlock(c, p)}\n\nGenerate ONE distinct logo concept for this brand. Output ONLY a text-to-image prompt (no JSON, no preamble) following these rules:\n${hasRef ? `- A REFERENCE LOGO image of this brand IS PROVIDED. Your output prompt must instruct the image model to produce a CLOSE VARIATION of that reference: keep the same core motif/symbol, the same silhouette family, the same color palette, and the same overall style. Do NOT invent a new unrelated concept. Acceptable variations: alternate angle, monochrome version, simplified version, badge version, refined geometry.\n` : `- An iconic logo MARK or symbol — simple, geometric, vector-style, scalable as a favicon\n`}- No long text, no slogans, no UI screenshots, no photorealism\n- Solid white background, flat vector, 2-3 colors${c.colors?.length ? ` — use ONLY these exact brand colors: ${c.colors.slice(0,3).join(", ")}. Do not invent new colors.` : ""}${c.productName ? ` — the mark must clearly belong to "${c.productName}" and reflect its category/positioning above.` : ""}\n- End with: ", minimalist vector logo mark, flat design, centered on solid white background, no text, no typography, no letters, app-icon ready, high quality"`;
    },
  },
  graphic: {
    kind: "image", defaultCount: 24,
    system: ROCKET_PERSONA + " You design social graphics, hero banners, and marketing visuals.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nOutput ONLY a text-to-image prompt for a marketing graphic. Vivid; specify composition, mood, colors${c.colors?.length ? ` (use: ${c.colors.slice(0,4).join(", ")})` : ""}, style. End with ", modern startup marketing graphic, high quality, clean composition".`,
  },
  icon: {
    kind: "image", defaultCount: 24,
    system: ROCKET_PERSONA + " You design clean vector icons.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nOutput ONLY a text-to-image prompt for a single icon. Flat vector, geometric, 1-2 colors, centered on solid white background, app-icon ready, no text. End with ", vector icon, flat design, no text, high quality".`,
  },
  photo: {
    kind: "image", defaultCount: 24,
    system: ROCKET_PERSONA + " You produce on-brand product / lifestyle imagery.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nOutput ONLY a text-to-image prompt for one photograph. Photorealistic, cinematic lighting, on-brand. End with ", photorealistic, professional photography, high resolution".`,
  },
  color_system: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You design startup color systems.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn strict JSON (no markdown, no preamble):\n{\n  "name": "<palette name>",\n  "primary": "#RRGGBB",\n  "secondary": "#RRGGBB",\n  "accent": "#RRGGBB",\n  "neutral_dark": "#RRGGBB",\n  "neutral_light": "#RRGGBB",\n  "rationale": "<2-3 sentences>"\n}`,
  },
  font_system: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You design startup typography systems.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn strict JSON (no markdown, no preamble):\n{\n  "display_font": "<Google Font name>",\n  "body_font": "<Google Font name>",\n  "display_weight": <number>,\n  "body_weight": <number>,\n  "rationale": "<2-3 sentences>"\n}\nPrefer Google Fonts. Avoid Inter, Poppins.`,
  },
  brand_voice: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You define startup brand voices.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a tight Brand Voice doc as markdown:\n## Voice Pillars\n- 4-5 traits (1 line each)\n## Tone\n- 3-4 contexts (landing, product, social, support)\n## Do / Don't\n- 5 do, 5 don't (one line each)\n## Sample lines\n- 5 ready-to-paste headline examples`,
  },
  brand_guidelines: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You write startup brand guideline docs.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite complete Brand Guidelines as markdown: Mission, Positioning, Audience, Voice, Color System (with hex), Typography (font names + usage), Logo Usage, Imagery Direction, Examples.`,
  },
  launch_copy: {
    kind: "text", system: ROCKET_PERSONA + " You write founder-led launch copy.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReady-to-ship launch copy as markdown:\n## Headline\n## Subheadline\n## 3-bullet value prop\n## Call to action\n## Founder note (3 sentences)\nFounder-led, specific, no marketing fluff.`,
  },
  product_hunt_copy: {
    kind: "text", system: ROCKET_PERSONA + " You write Product Hunt launch copy.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nProduct Hunt copy as markdown:\n## Tagline (60 chars max)\n## Description (260 chars max)\n## Maker comment (founder-led, 4-6 sentences, ends with a question)\n## Topics (3-5 tags)`,
  },
  social_post: {
    kind: "text", system: ROCKET_PERSONA + " You write founder-style social posts.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite the post copy itself (no preamble, no JSON). Match the platform implied by the request (X, LinkedIn, Reddit). Founder voice. If a thread, number posts (1/, 2/...). Hooky first line.`,
  },
  founder_bio: {
    kind: "text", system: ROCKET_PERSONA + " You write founder bios.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn JSON (no markdown):\n{\n  "long": "<4-6 sentences>",\n  "short": "<2 sentences>",\n  "x_bio": "<160 char X bio>",\n  "linkedin_headline": "<220 chars max>"\n}`,
  },
  template: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA,
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a startup branding template as markdown. Tight, ready-to-paste.`,
  },
  presentation: {
    kind: "text", system: ROCKET_PERSONA + " You outline startup pitch decks.",
    build: (c, p) => `${ctxBlock(c, p)}\n\n10-slide pitch outline as markdown. Each: ## Slide N — <title>, then 3-5 bullets.`,
  },
  other: {
    kind: "text", system: ROCKET_PERSONA,
    build: (c, p) => `${ctxBlock(c, p)}\n\nGenerate the requested asset. If not a branding asset, respond: "Rocket only creates startup branding assets — try a logo, color system, brand voice, launch copy, or social post."`,
  },
};

export const CLASSIFIER_SYSTEM = `You classify a user request into ONE Rocket asset_type. Output strict JSON: {"asset_type": "<enum>", "count": <int 1-24>}.

Valid asset_type values:
- logo, graphic, icon, photo (visual)
- color_system, font_system, brand_voice, brand_guidelines (brand systems)
- launch_copy, product_hunt_copy, social_post, founder_bio (copy)
- template, presentation (compositions)
- other (ONLY for clearly non-branding requests like "write me a poem", "what's the weather". A bare URL or product name is NOT "other" — default to brand_guidelines.)

Routing hints:
- "logo", "mark" -> logo
- "brand template", "templates" -> template
- "components", "UI kit", "buttons", "cards", "inputs" -> graphic
- "icon set", "icon for X" -> icon
- "hero image", "banner", "social graphic", "ad" -> graphic
- "photo of", "lifestyle shot" -> photo
- "colors", "palette" -> color_system
- "fonts", "typography" -> font_system
- "voice", "tone" -> brand_voice
- "brand guidelines", "brand kit", "brand doc" -> brand_guidelines
- "PH copy", "product hunt" -> product_hunt_copy
- "launch copy", "landing copy" -> launch_copy
- "X post", "tweet", "thread", "LinkedIn post", "Reddit" -> social_post
- "founder bio", "about me" -> founder_bio
- "pitch deck", "slides" -> presentation
- bare URL only (e.g. "https://trylaunch.ai") or just a product name -> brand_guidelines

Count: how many variants. Generate a Looka-style gallery by default for every supported asset category. Defaults: logo=24, icon=24, graphic=24, photo=24, brand_guidelines=24, template=24, color_system=24, font_system=24, brand_voice=24, else 1. Parse explicit numbers ("5 logos" -> 5, "20 logos" -> 20). Cap at 24.

RESPOND WITH JSON ONLY.`;

export const REFUSAL_TEXT =
  "Rocket only creates startup branding assets. Try: a logo, color system, font system, brand voice, brand guidelines, launch copy, Product Hunt copy, a social post, an icon, or a hero graphic.";
