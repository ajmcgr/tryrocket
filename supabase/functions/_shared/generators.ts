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
    build: (c, p) => `${ctxBlock(c, p)}\n\nDesign a COMPLETE startup color system. Return strict JSON (no markdown, no preamble) with this exact shape:\n{\n  "name": "<palette name>",\n  "primary": "#RRGGBB",\n  "secondary": "#RRGGBB",\n  "accent": "#RRGGBB",\n  "success": "#RRGGBB",\n  "warning": "#RRGGBB",\n  "danger": "#RRGGBB",\n  "neutral_dark": "#RRGGBB",\n  "neutral_light": "#RRGGBB",\n  "neutrals": {\n    "50":  "#RRGGBB",\n    "100": "#RRGGBB",\n    "200": "#RRGGBB",\n    "300": "#RRGGBB",\n    "400": "#RRGGBB",\n    "500": "#RRGGBB",\n    "600": "#RRGGBB",\n    "700": "#RRGGBB",\n    "800": "#RRGGBB",\n    "900": "#RRGGBB"\n  },\n  "gradients": [\n    { "name": "<short name>", "from": "#RRGGBB", "to": "#RRGGBB", "angle": 135 },\n    { "name": "<short name>", "from": "#RRGGBB", "to": "#RRGGBB", "angle": 90 },\n    { "name": "<short name>", "from": "#RRGGBB", "to": "#RRGGBB", "angle": 45 }\n  ],\n  "light_mode": { "background": "#RRGGBB", "surface": "#RRGGBB", "text": "#RRGGBB", "muted_text": "#RRGGBB", "border": "#RRGGBB" },\n  "dark_mode":  { "background": "#RRGGBB", "surface": "#RRGGBB", "text": "#RRGGBB", "muted_text": "#RRGGBB", "border": "#RRGGBB" },\n  "accessibility": "<2-4 sentences on WCAG contrast ratios — call out which pairs pass AA/AAA and which to avoid>",\n  "usage": "<2-4 sentences on when to use primary vs secondary vs accent, and where to use success/warning/danger>",\n  "rationale": "<2-3 sentences on why this palette fits the brand>"\n}\nNeutrals must be a true 10-step scale from lightest (50) to darkest (900). Keep semantic colors (success/warning/danger) tasteful and on-brand, not generic stoplight green/yellow/red.`,
  },
  font_system: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You design startup typography systems.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nDesign a COMPLETE typography system. Return strict JSON (no markdown, no preamble):\n{\n  "display_font": "<Google Font name>",\n  "heading_font": "<Google Font name>",\n  "body_font": "<Google Font name>",\n  "mono_font": "<Google Font name>",\n  "display_weight": <number>,\n  "heading_weight": <number>,\n  "body_weight": <number>,\n  "scale": {\n    "h1":    { "size_px": 60, "line_height": 1.05, "weight": 700, "tracking": "-0.02em" },\n    "h2":    { "size_px": 48, "line_height": 1.1,  "weight": 700, "tracking": "-0.015em" },\n    "h3":    { "size_px": 36, "line_height": 1.15, "weight": 600, "tracking": "-0.01em" },\n    "h4":    { "size_px": 28, "line_height": 1.2,  "weight": 600, "tracking": "-0.005em" },\n    "h5":    { "size_px": 22, "line_height": 1.25, "weight": 600, "tracking": "0" },\n    "h6":    { "size_px": 18, "line_height": 1.3,  "weight": 600, "tracking": "0" },\n    "body":  { "size_px": 16, "line_height": 1.55, "weight": 400, "tracking": "0" },\n    "small": { "size_px": 13, "line_height": 1.45, "weight": 400, "tracking": "0" }\n  },\n  "pair_rationale": "<2-3 sentences on why these fonts pair well>",\n  "usage": "<2-3 sentences on where to use display vs heading vs body vs mono>",\n  "example_headline": "<a real on-brand example headline using the display font>",\n  "example_body": "<an on-brand 2-3 sentence body paragraph using the body font>"\n}\nUse Google Fonts. Avoid Inter and Poppins. Tune sizes to feel modern and confident — display headings should feel large.`,
  },
  brand_voice: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You define startup brand voices.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a COMPLETE Brand Voice + copywriting guide as rich markdown. Use this exact section order — no skipping, no summarizing:\n\n# Brand Voice\n\n## Voice Pillars\nFor EACH of 4 pillars, write a level-3 heading with the pillar name, then a 2-3 sentence "Description", a 1-2 sentence "Why it fits this brand", and a 1-2 sentence "Example usage" with a real on-brand sentence in quotes.\n\n## Tone Across Contexts\nA short paragraph for each: Landing page, Product UI, Social, Support, Sales.\n\n## What We Say\n8 ready-to-paste short phrases or sentence patterns (bullet list).\n\n## What We Don't Say\n8 phrases or patterns we avoid, each with a one-line "why".\n\n## Website Examples\n3 short paragraphs of on-brand website copy (hero, feature section, CTA).\n\n## Social Examples\n3 short on-brand social posts (label each as X or LinkedIn).\n\n## Launch Examples\n2 on-brand launch announcements (one short, one medium).\n\n## Email Examples\n2 short on-brand emails (subject + body) — one onboarding, one feature announcement.\n\nAll examples must use the real product name and positioning above. No placeholders like "[product]".`,
  },
  brand_guidelines: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA + " You write startup brand guideline docs.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a COMPLETE, agency-grade Brand Guidelines document in rich markdown. Include every section below with substantive content (no one-liners, no skipped sections). Use level-2 headings for each section in this exact order:\n\n# <Brand name> — Brand Guidelines\n\n## 1. Brand Overview\nWhat the company is, what it does, and where it sits in the market. 3-5 sentences.\n\n## 2. Mission\nOne crisp sentence + 2-3 sentences of unpacking.\n\n## 3. Vision\nOne sentence on the future state the brand is building toward + 2-3 sentences of unpacking.\n\n## 4. Positioning Statement\nClassic format: "For <audience>, <brand> is the <category> that <key benefit>, unlike <alternative>, we <differentiator>."\n\n## 5. Audience\n2-3 paragraphs describing the primary audience: who they are, what they care about, what they currently use, and the trigger that brings them to this brand.\n\n## 6. Customer Personas\nWrite 3 distinct personas. For each: ### <Name, role>, then bullets for Demographics, Goals, Pains, Triggers, Channels, Quote ("...").\n\n## 7. Brand Personality\n5-6 personality traits as a bulleted list, each with a one-line explanation.\n\n## 8. Brand Values\n4-5 values as bullets, each one short phrase + one sentence.\n\n## 9. Voice & Tone\n3-4 sentence overview of the voice. Then a "Tone shifts by context" subsection with 4 bullets: Landing, Product, Social, Support.\n\n## 10. Messaging Framework\nA "core message" paragraph, then bullets for: Primary value prop, 3 supporting pillars (with one-line proof for each), and a "Reasons to believe" bullet list.\n\n## 11. Tagline Options\n6 distinct taglines as a bulleted list, each ≤7 words.\n\n## 12. Elevator Pitch\n3 lengths: 1-sentence, 30-second (3-4 sentences), and 2-minute (a full short paragraph).\n\n## 13. Do's and Don'ts\nTwo subsections: ### Do (6 bullets) and ### Don't (6 bullets). One short rule per bullet.\n\n## 14. Website Messaging Examples\n3 short blocks: hero headline + subheadline, a feature section, and a closing CTA section.\n\n## 15. Social Messaging Examples\n3 example posts (label each as X / LinkedIn / Threads). Realistic, founder-led.\n\n## 16. Launch Messaging Examples\n2 launch announcements: a Product Hunt-style short version and a LinkedIn-style longer version.\n\nWrite as if shipping the actual brand book. Use the real product name, real positioning, and real colors/fonts from the context above wherever relevant. No placeholders.`,
  },
  launch_copy: {
    kind: "text", system: ROCKET_PERSONA + " You write founder-led launch copy.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a COMPLETE launch copy package as rich markdown. Include EVERY section below with on-brand, ready-to-ship copy — no placeholders, no fluff:\n\n# Launch Package\n\n## Tagline\nOne sharp tagline, ≤8 words.\n\n## One-liner\nOne sentence that explains the product to a stranger.\n\n## Short Description\n1-2 sentences (≤200 chars), good for app stores and previews.\n\n## Medium Description\n3-4 sentences, good for landing page intros.\n\n## Long Description\n2-3 paragraphs, good for press kits and About pages.\n\n## Website Hero\n### Headline\nOne killer headline.\n### Subheadline\n1-2 supporting sentences.\n### Primary CTA\nButton label (≤4 words).\n\n## CTA Variations\n5 button-label variations as a bulleted list.\n\n## Launch Announcement\nA full launch post (5-8 sentences), founder-led, specific, no fluff. Ready to post on LinkedIn or a blog.\n\n## SEO\n### Title\nMax 60 chars.\n### Meta description\nMax 155 chars.\n\nUse the real product name and positioning. Founder voice, specific, concrete.`,
  },
  product_hunt_copy: {
    kind: "text", system: ROCKET_PERSONA + " You write Product Hunt launch copy.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a COMPLETE Product Hunt launch package as rich markdown — every section, no skipping:\n\n# Product Hunt Launch\n\n## Tagline\n≤60 chars. Punchy.\n\n## Short Description\n≤260 chars. Hooky.\n\n## Full Description\n3-4 short paragraphs. What it is, who it's for, what's new, what's the magic moment. Use real product details.\n\n## First Comment\nThe pinned first comment on the PH thread. 5-8 sentences, founder voice, ends with a clear question to invite discussion.\n\n## Maker Comment\nA separate maker note (3-5 sentences) on why you built it.\n\n## Launch Tweet\nA single tweet (≤270 chars) to post the moment you go live. Include a clean CTA, no spammy emojis.\n\n## FAQ\n5 Q&A pairs covering pricing, alternatives, target user, how it works, and what's next.\n\n## Community Responses\n3 short reply templates: one for "this looks like X", one for "is there a free tier?", one for "congrats / supportive".\n\n## Topics\n3-5 PH topic tags as a bulleted list.\n\nUse the real product name, audience, and positioning above.`,
  },
  social_post: {
    kind: "text", system: ROCKET_PERSONA + " You write founder-style social posts.",
    build: (c, p) => {
      const wantsLibrary = /\b(library|content library|50|forty|fifty|pack|series|month|calendar|all categories|founder posts|growth posts|educational posts)\b/i.test(p);
      if (!wantsLibrary) {
        return `${ctxBlock(c, p)}\n\nWrite the post copy itself (no preamble, no JSON). Match the platform implied by the request (X, LinkedIn, Reddit, Threads). Founder voice. If a thread, number posts (1/, 2/...). Hooky first line, ends with a clear hook or question.`;
      }
      return `${ctxBlock(c, p)}\n\nWrite a COMPLETE founder social content library as rich markdown. Organize EXACTLY by these sections, each post as a fenced block with platform label:\n\n# Social Content Library\n\n## Launch Posts (10)\nFor each of 10 posts: ### Post N — <platform>\nthen the post copy in a > blockquote.\nMix X and LinkedIn.\n\n## Founder Posts (10)\n10 personal, founder-voice posts (building in public, lessons, behind-the-scenes). Mix X and LinkedIn. Same format.\n\n## Educational Posts (10)\n10 posts that teach a concept the target audience cares about. Mix X (often threads) and LinkedIn (long form). Same format.\n\n## Growth Posts (10)\n10 posts designed to drive signups, demos, or replies. Strong hooks, clear CTAs. Same format.\n\n## Announcement Posts (5)\n5 posts announcing a feature, milestone, or partnership. Same format.\n\n## Threads (5)\n5 X threads. Each ### Thread N — X, then numbered tweets (1/, 2/, 3/...) of 5-8 tweets each.\n\nEvery post must be on-brand, specific to the real product/audience above, and immediately postable. No placeholders.`;
    },
  },
  founder_bio: {
    kind: "text", system: ROCKET_PERSONA + " You write founder bios.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn strict JSON (no markdown, no preamble) with this shape — fill EVERY field with real, on-brand copy:\n{\n  "x_bio": "<≤160 char X bio>",\n  "linkedin_headline": "<≤220 char LinkedIn headline>",\n  "linkedin_about": "<3-5 short paragraphs for the LinkedIn About section, written in first person>",\n  "short": "<2 sentence bio>",\n  "medium": "<4-5 sentence bio>",\n  "long": "<6-8 sentence bio>",\n  "speaker_bio": "<3-4 sentence bio written in third person, suitable for a conference program>",\n  "press_bio": "<2-3 sentence bio written in third person, suitable for a press kit>"\n}`,
  },
  template: {
    kind: "text", defaultCount: 24, system: ROCKET_PERSONA,
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite a COMPLETE library of editable startup branding templates as rich markdown. Each template is a fenced \`\`\`text block of ready-to-paste copy with clearly editable {{placeholders}} for things the founder will customize (e.g. {{feature_name}}, {{benefit}}, {{date}}). Cover every section below in this order:\n\n# Template Library\n\n## Social\n### X Post\n### LinkedIn Post\n### LinkedIn Carousel (6 slides — one block per slide)\n### Instagram Post Caption\n### Instagram Story\n### Threads Post\n\n## Launch\n### Product Hunt Gallery Copy (tagline + 5 gallery slide captions)\n### Launch Graphic Copy (headline + subhead + CTA)\n### Waitlist Graphic Copy\n### Changelog Graphic Copy (version + headline + 3 bullets)\n\n## Marketing\n### Ad Copy (3 variants — short / medium / long)\n### Newsletter Banner Copy\n### Blog Banner Copy\n### Sponsorship Graphic Copy\n\nEvery template should be specific to the brand above, immediately editable, and short enough to actually use. Keep the {{placeholders}} obvious so the editor can swap them.`,
  },
  presentation: {
    kind: "text", system: ROCKET_PERSONA + " You outline startup pitch decks.",
    build: (c, p) => {
      const lp = p.toLowerCase();
      const deckType =
        /investor/.test(lp) ? "Investor Deck" :
        /product deck|product overview/.test(lp) ? "Product Deck" :
        /sales deck|sales pitch/.test(lp) ? "Sales Deck" :
        /media|press deck/.test(lp) ? "Media Deck" :
        "Pitch Deck";
      return `${ctxBlock(c, p)}\n\nWrite a COMPLETE ${deckType} system as rich markdown. Open with a one-paragraph overview of the deck's purpose and the recommended slide count. Then for EACH slide use this exact structure:\n\n## Slide N — <Slide title>\n**Purpose:** <one sentence>\n**Recommended content:**\n- <bullet>\n- <bullet>\n- <bullet>\n**Visual guidance:** <1-2 sentences on imagery, charts, layout direction>\n**Layout:** <one of: Title + subtitle, Two-column, Big number, Bullet list, Quote, Image-led, Chart-led, Team grid, Timeline, Closing>\n\nDeliver 12-14 slides appropriate for a ${deckType}. Tailor the slide titles to the real product, audience, and positioning above. End with a final "## Editable Layout Notes" section that explains how a founder can rearrange or swap slides for different audiences.`;
    },
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
