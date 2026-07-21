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
  // Brand Intelligence Layer (from scrape-url + Gemini analysis)
  category?: string; product?: string; targetCustomer?: string;
  audienceSegments?: string[]; positioning?: string; keywords?: string[];
  valueProps?: string[]; voice?: { tone?: string; traits?: string[]; notToBe?: string[] };
  selected_direction?: {
    id?: string; title?: string; asset_type?: string; image_url?: string; prompt?: string;
  };
}

function ctxBlock(c: BrandContext, userPrompt: string): string {
  const lines: string[] = [];
  if (c.productName) lines.push(`Product: ${c.productName}`);
  if (c.url) lines.push(`URL: ${c.url}`);
  if (c.tagline) lines.push(`Tagline: ${c.tagline}`);
  if (c.industry) lines.push(`Industry: ${c.industry}`);
  if (c.category) lines.push(`Category: ${c.category}`);
  if (c.product) lines.push(`What it does: ${c.product}`);
  if (c.positioning) lines.push(`Positioning: ${c.positioning}`);
  if (c.targetCustomer) lines.push(`Target customer: ${c.targetCustomer}`);
  if (c.audienceSegments?.length) lines.push(`Audience segments: ${c.audienceSegments.join(", ")}`);
  if (c.audience) lines.push(`Audience: ${c.audience}`);
  if (c.tone) lines.push(`Tone: ${c.tone}`);
  if (c.voice?.tone) lines.push(`Voice tone: ${c.voice.tone}`);
  if (c.voice?.traits?.length) lines.push(`Voice traits: ${c.voice.traits.join(", ")}`);
  if (c.voice?.notToBe?.length) lines.push(`Voice — not to be: ${c.voice.notToBe.join(", ")}`);
  if (c.valueProps?.length) lines.push(`Value props: ${c.valueProps.join(" | ")}`);
  if (c.keywords?.length) lines.push(`Keywords: ${c.keywords.join(", ")}`);
  if (c.description) lines.push(`Description: ${c.description}`);
  if (c.colors?.length) lines.push(`Brand colors: ${c.colors.join(", ")}`);
  if (c.fonts?.length) lines.push(`Brand fonts: ${c.fonts.join(", ")}`);
  if (c.colorScheme) lines.push(`Color scheme: ${c.colorScheme}`);
  if (c.logo) lines.push(`Existing logo URL (reference only): ${c.logo}`);
  if (c.favicon) lines.push(`Existing favicon URL (reference only): ${c.favicon}`);
  if (c.ogImage) lines.push(`OG image URL (reference only): ${c.ogImage}`);
  if (c.screenshot) lines.push(`Homepage screenshot URL (reference only): ${c.screenshot}`);
  if (c.selected_direction?.title) {
    lines.push(`Selected brand direction: ${c.selected_direction.title}${c.selected_direction.asset_type ? ` (${c.selected_direction.asset_type})` : ""}`);
  }
  if (c.selected_direction?.prompt) lines.push(`Selected direction brief: ${c.selected_direction.prompt.slice(0, 500)}`);
  if (c.competitors?.length) lines.push(`Competitors: ${c.competitors.join(", ")}`);
  lines.push("");
  lines.push(`User request: ${userPrompt}`);
  if (c.colors?.length || c.productName || c.logo || c.screenshot || c.selected_direction) {
    lines.push("");
    lines.push("CRITICAL: This is a REAL existing brand. Your job is to EVOLVE its existing identity, not invent a new one. Stay faithful to the scraped colors, fonts, logo motif, and visual language above. When a selected brand direction is present, treat it as the approved source of truth: preserve its distinctive visual choices and tone while creating a new original design. Do not invent unrelated colors, names, motifs, or vibes. Reference images may also be attached — match their style.");
  }
  return lines.join("\n");
}

export interface GenSpec {
  kind: "image" | "text";
  system: string;
  build: (c: BrandContext, userPrompt: string) => string;
  defaultCount?: number;
  json?: boolean;
}

export const GENERATORS: Record<AssetType, GenSpec> = {
  logo: {
    kind: "image", defaultCount: 24,
    system: ROCKET_PERSONA + " You specialize in iconic, scalable startup LOGO MARKS in the style of Linear, Vercel, Stripe, Notion, Framer and Cursor — never poster designs, never text canvases, never AI clipart, never illustrations.",
    build: (c, p) => {
      const hasRef = !!c.logo;
      return `${ctxBlock(c, p)}\n\nGenerate ONE distinct, production-ready logo concept for a modern startup. Output ONLY a text-to-image prompt (no JSON, no preamble) following these rules:\n${hasRef ? `- A REFERENCE LOGO image of this brand IS PROVIDED. Produce a CLOSE VARIATION: same core motif, same silhouette family, same palette, same overall style. Acceptable variations: alternate angle, monochrome, simplified, badge, refined geometry.\n` : `- An ICONIC, DISTINCTIVE mark or monogram — one clear idea, memorable at 16x16, geometrically constructed on a grid, balanced negative space, at most 2-3 shapes.\n`}- HARD BANS: no AI clipart, no illustrations, no cartoon characters, no gradients-on-gradients, no drop shadows, no 3D renders, no glossy plastic, no photorealism, no long text, no slogans, no taglines, no UI screenshots, no low-contrast pastel-on-white, no generic swooshes or ribbons, no globes/handshakes/lightbulbs cliches.\n- STYLE: flat vector, crisp geometry, thick consistent stroke weights, strong figure/ground contrast, scalable, favicon-ready — inspired by the visual language of Linear, Vercel, Stripe, Notion, Framer, Cursor, Arc.\n- COLOR: solid white background, 1-3 colors max${c.colors?.length ? `, use ONLY these exact brand colors: ${c.colors.slice(0,3).join(", ")}. Do not invent new colors.` : ", one confident primary color with high contrast against white."}${c.productName ? ` The mark must clearly belong to "${c.productName}" and reflect its category and positioning above.` : ""}\n- End with: ", minimalist vector logo mark, flat geometric design, precise construction, modern startup identity, centered on solid white background, generous padding, no text, no typography, no letters, no watermark, app-icon ready, ultra clean, high quality"`;
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
    kind: "text", json: true, defaultCount: 24, system: ROCKET_PERSONA + " You design startup color systems.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nDesign a COMPLETE startup color system. Return strict JSON (no markdown, no preamble) with this exact shape:\n{\n  "name": "<palette name>",\n  "primary": "#RRGGBB",\n  "secondary": "#RRGGBB",\n  "accent": "#RRGGBB",\n  "success": "#RRGGBB",\n  "warning": "#RRGGBB",\n  "danger": "#RRGGBB",\n  "neutral_dark": "#RRGGBB",\n  "neutral_light": "#RRGGBB",\n  "neutrals": {\n    "50":  "#RRGGBB",\n    "100": "#RRGGBB",\n    "200": "#RRGGBB",\n    "300": "#RRGGBB",\n    "400": "#RRGGBB",\n    "500": "#RRGGBB",\n    "600": "#RRGGBB",\n    "700": "#RRGGBB",\n    "800": "#RRGGBB",\n    "900": "#RRGGBB"\n  },\n  "gradients": [\n    { "name": "<short name>", "from": "#RRGGBB", "to": "#RRGGBB", "angle": 135 },\n    { "name": "<short name>", "from": "#RRGGBB", "to": "#RRGGBB", "angle": 90 },\n    { "name": "<short name>", "from": "#RRGGBB", "to": "#RRGGBB", "angle": 45 }\n  ],\n  "light_mode": { "background": "#RRGGBB", "surface": "#RRGGBB", "text": "#RRGGBB", "muted_text": "#RRGGBB", "border": "#RRGGBB" },\n  "dark_mode":  { "background": "#RRGGBB", "surface": "#RRGGBB", "text": "#RRGGBB", "muted_text": "#RRGGBB", "border": "#RRGGBB" },\n  "accessibility": "<2-4 sentences on WCAG contrast ratios — call out which pairs pass AA/AAA and which to avoid>",\n  "usage": "<2-4 sentences on when to use primary vs secondary vs accent, and where to use success/warning/danger>",\n  "rationale": "<2-3 sentences on why this palette fits the brand>"\n}\nNeutrals must be a true 10-step scale from lightest (50) to darkest (900). Keep semantic colors (success/warning/danger) tasteful and on-brand, not generic stoplight green/yellow/red.`,
  },
  font_system: {
    kind: "text", json: true, defaultCount: 24, system: ROCKET_PERSONA + " You design startup typography systems.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nDesign a COMPLETE typography system. Return strict JSON (no markdown, no preamble):\n{\n  "display_font": "<Google Font name>",\n  "heading_font": "<Google Font name>",\n  "body_font": "<Google Font name>",\n  "mono_font": "<Google Font name>",\n  "display_weight": <number>,\n  "heading_weight": <number>,\n  "body_weight": <number>,\n  "scale": {\n    "h1":    { "size_px": 60, "line_height": 1.05, "weight": 700, "tracking": "-0.02em" },\n    "h2":    { "size_px": 48, "line_height": 1.1,  "weight": 700, "tracking": "-0.015em" },\n    "h3":    { "size_px": 36, "line_height": 1.15, "weight": 600, "tracking": "-0.01em" },\n    "h4":    { "size_px": 28, "line_height": 1.2,  "weight": 600, "tracking": "-0.005em" },\n    "h5":    { "size_px": 22, "line_height": 1.25, "weight": 600, "tracking": "0" },\n    "h6":    { "size_px": 18, "line_height": 1.3,  "weight": 600, "tracking": "0" },\n    "body":  { "size_px": 16, "line_height": 1.55, "weight": 400, "tracking": "0" },\n    "small": { "size_px": 13, "line_height": 1.45, "weight": 400, "tracking": "0" }\n  },\n  "pair_rationale": "<2-3 sentences on why these fonts pair well>",\n  "usage": "<2-3 sentences on where to use display vs heading vs body vs mono>",\n  "example_headline": "<a real on-brand example headline using the display font>",\n  "example_body": "<an on-brand 2-3 sentence body paragraph using the body font>"\n}\nUse Google Fonts. Avoid Inter and Poppins. Tune sizes to feel modern and confident — display headings should feel large.`,
  },
  brand_voice: {
    kind: "text", json: true, defaultCount: 24, system: ROCKET_PERSONA + " You define startup brand voices.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nDefine a Brand Voice. Return STRICT JSON ONLY (no markdown, no code fences, no preamble). Keep every field concise — 1-2 sentences max where prose is asked. Shape:\n{\n  "overview": "<2 sentences>",\n  "pillars": [ { "name": "<pillar>", "description": "<1-2 sentences>", "example": "<one short example sentence>" } ],\n  "tone_by_context": [\n    { "context": "Landing page", "guidance": "<1-2 sentences>" },\n    { "context": "Product UI",   "guidance": "<1-2 sentences>" },\n    { "context": "Social",       "guidance": "<1-2 sentences>" },\n    { "context": "Support",      "guidance": "<1-2 sentences>" }\n  ],\n  "do":   [ { "phrase": "<short>", "why": "<≤8 words>" } ],\n  "dont": [ { "phrase": "<short>", "why": "<≤8 words>" } ],\n  "website_examples": [ { "label": "Hero", "copy": "..." }, { "label": "Feature", "copy": "..." }, { "label": "CTA", "copy": "..." } ],\n  "social_examples":  [ { "platform": "X", "copy": "..." }, { "platform": "LinkedIn", "copy": "..." } ],\n  "launch_examples":  [ { "label": "Short",  "copy": "..." }, { "label": "Medium", "copy": "..." } ]\n}\nExactly 4 pillars, 6 dos, 6 don'ts. Use the real product name from the context.`,
  },
  brand_guidelines: {
    kind: "text", json: true, defaultCount: 24, system: ROCKET_PERSONA + " You write startup brand guideline docs.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nWrite COMPLETE agency-grade Brand Guidelines. Return STRICT JSON ONLY (no markdown, no preamble). Fill every field with substantive, on-brand copy — no placeholders, no skipped sections. Shape:\n{\n  "brand_name": "<brand>",\n  "overview":  "<3-5 sentences>",\n  "mission":   "<1 sentence + 2-3 sentence unpack>",\n  "vision":    "<1 sentence + 2-3 sentence unpack>",\n  "positioning": "For <audience>, <brand> is the <category> that <key benefit>, unlike <alternative>, we <differentiator>.",\n  "audience":  "<2-3 paragraphs>",\n  "personas":  [ { "name": "<name>", "role": "<role>", "demographics": "<...>", "goals": ["..."], "pains": ["..."], "triggers": ["..."], "channels": ["..."], "quote": "..." } ],\n  "personality_traits": [ { "trait": "<word>", "description": "<one line>" } ],\n  "values":             [ { "name": "<short phrase>", "description": "<one sentence>" } ],\n  "voice": { "overview": "<3-4 sentences>", "tone_shifts": [ { "context": "Landing",  "guidance": "..." }, { "context": "Product", "guidance": "..." }, { "context": "Social", "guidance": "..." }, { "context": "Support", "guidance": "..." } ] },\n  "messaging": { "core_message": "<paragraph>", "value_prop": "<sentence>", "pillars": [ { "name": "<pillar>", "proof": "<one line>" } ], "reasons_to_believe": ["..."] },\n  "taglines":     ["...","...","...","...","...","..."],\n  "elevator_pitch": { "one_sentence": "...", "thirty_second": "<3-4 sentences>", "two_minute": "<one short paragraph>" },\n  "do":   ["...","...","...","...","...","..."],\n  "dont": ["...","...","...","...","...","..."],\n  "website_examples": { "hero": { "headline": "...", "subheadline": "..." }, "feature": { "headline": "...", "body": "..." }, "cta": { "headline": "...", "body": "..." } },\n  "social_examples": [ { "platform": "X",        "copy": "..." }, { "platform": "LinkedIn", "copy": "..." }, { "platform": "Threads",  "copy": "..." } ],\n  "launch_examples": [ { "label": "Product Hunt short",  "copy": "..." }, { "label": "LinkedIn long",     "copy": "..." } ]\n}\nProvide exactly 3 personas, 5-6 personality traits, 4-5 values, 3 messaging pillars, 6 taglines, 6 dos, 6 don'ts.`,
  },
  launch_copy: {
    kind: "text", json: true, system: ROCKET_PERSONA + " You write founder-led launch copy.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn STRICT JSON ONLY (no markdown, no preamble) for a complete launch copy package. Fill every field with real, on-brand, ready-to-ship copy:\n{\n  "tagline":             "<≤8 words>",\n  "one_liner":           "<1 sentence>",\n  "short_description":   "<1-2 sentences, ≤200 chars>",\n  "medium_description":  "<3-4 sentences>",\n  "long_description":    "<2-3 paragraphs as plain text, separated by \\n\\n>",\n  "hero": { "headline": "...", "subheadline": "<1-2 sentences>", "cta": "<≤4 words>" },\n  "cta_variations":      ["...","...","...","...","..."],\n  "launch_announcement": "<5-8 sentence founder-led post as plain text>",\n  "seo": { "title": "<≤60 chars>", "meta_description": "<≤155 chars>" }\n}`,
  },
  product_hunt_copy: {
    kind: "text", json: true, system: ROCKET_PERSONA + " You write Product Hunt launch copy.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn STRICT JSON ONLY (no markdown, no preamble) for a complete Product Hunt launch package:\n{\n  "tagline":             "<≤60 chars>",\n  "short_description":   "<≤260 chars>",\n  "full_description":    "<3-4 short paragraphs as plain text, separated by \\n\\n>",\n  "first_comment":       "<5-8 sentence pinned first comment, ends with a question>",\n  "maker_comment":       "<3-5 sentence maker note>",\n  "launch_tweet":        "<single tweet, ≤270 chars>",\n  "faq":                 [ { "q": "...", "a": "..." } ],\n  "community_responses": [ { "scenario": "This looks like X", "reply": "..." }, { "scenario": "Is there a free tier?", "reply": "..." }, { "scenario": "Congrats / supportive", "reply": "..." } ],\n  "topics":              ["...","...","...","...","..."]\n}\nGive exactly 5 FAQ pairs and 3-5 topics.`,
  },
  social_post: {
    kind: "text", json: true, system: ROCKET_PERSONA + " You write founder-style social posts.",
    build: (c, p) => {
      const wantsLibrary = /\b(library|content library|50|forty|fifty|pack|series|month|calendar|all categories|founder posts|growth posts|educational posts)\b/i.test(p);
      if (!wantsLibrary) {
        return `${ctxBlock(c, p)}\n\nReturn STRICT JSON ONLY (no markdown, no preamble):\n{ "kind": "post", "platform": "<X|LinkedIn|Reddit|Threads>", "copy": "<the post copy. Plain text. If a thread, number posts 1/, 2/, ...>" }`;
      }
      return `${ctxBlock(c, p)}\n\nReturn STRICT JSON ONLY (no markdown, no preamble) for a complete founder social content library:\n{\n  "kind": "library",\n  "categories": [\n    { "name": "Launch",        "posts": [ { "platform": "X|LinkedIn", "copy": "..." } ] },\n    { "name": "Founder",       "posts": [ { "platform": "X|LinkedIn", "copy": "..." } ] },\n    { "name": "Educational",   "posts": [ { "platform": "X|LinkedIn", "copy": "..." } ] },\n    { "name": "Growth",        "posts": [ { "platform": "X|LinkedIn", "copy": "..." } ] },\n    { "name": "Announcement",  "posts": [ { "platform": "X|LinkedIn", "copy": "..." } ] },\n    { "name": "Threads",       "posts": [ { "platform": "X", "copy": "<numbered thread: 1/ ... 2/ ... 3/ ...>" } ] }\n  ]\n}\nProvide 10 Launch, 10 Founder, 10 Educational, 10 Growth, 5 Announcement, 5 Threads. Every post is real, specific, and immediately postable.`;
    },
  },
  founder_bio: {
    kind: "text", json: true, system: ROCKET_PERSONA + " You write founder bios.",
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn strict JSON (no markdown, no preamble) with this shape — fill EVERY field with real, on-brand copy:\n{\n  "x_bio": "<≤160 char X bio>",\n  "linkedin_headline": "<≤220 char LinkedIn headline>",\n  "linkedin_about": "<3-5 short paragraphs for the LinkedIn About section, written in first person>",\n  "short": "<2 sentence bio>",\n  "medium": "<4-5 sentence bio>",\n  "long": "<6-8 sentence bio>",\n  "speaker_bio": "<3-4 sentence bio written in third person, suitable for a conference program>",\n  "press_bio": "<2-3 sentence bio written in third person, suitable for a press kit>"\n}`,
  },
  template: {
    kind: "text", json: true, defaultCount: 24, system: ROCKET_PERSONA,
    build: (c, p) => `${ctxBlock(c, p)}\n\nReturn STRICT JSON ONLY (no markdown, no preamble) for an editable branding template library. Use {{placeholders}} for editable fields (e.g. {{feature_name}}). Shape:\n{\n  "groups": [\n    { "name": "Social",    "templates": [ { "name": "X Post",          "body": "..." }, { "name": "LinkedIn Post", "body": "..." }, { "name": "LinkedIn Carousel", "body": "Slide 1: ...\\nSlide 2: ..." }, { "name": "Instagram Caption", "body": "..." }, { "name": "Instagram Story", "body": "..." }, { "name": "Threads Post", "body": "..." } ] },\n    { "name": "Launch",    "templates": [ { "name": "Product Hunt Gallery", "body": "Tagline: ...\\nSlide 1: ..." }, { "name": "Launch Graphic", "body": "Headline: ...\\nSubhead: ...\\nCTA: ..." }, { "name": "Waitlist Graphic", "body": "..." }, { "name": "Changelog Graphic", "body": "Version: ...\\nHeadline: ...\\n- ...\\n- ...\\n- ..." } ] },\n    { "name": "Marketing", "templates": [ { "name": "Ad Copy (short)", "body": "..." }, { "name": "Ad Copy (medium)", "body": "..." }, { "name": "Ad Copy (long)", "body": "..." }, { "name": "Newsletter Banner", "body": "..." }, { "name": "Blog Banner", "body": "..." }, { "name": "Sponsorship Graphic", "body": "..." } ] }\n  ]\n}\nEvery template uses the real product name above, plus {{placeholders}} for fields the founder customizes.`,
  },
  presentation: {
    kind: "text", json: true, system: ROCKET_PERSONA + " You outline startup pitch decks.",
    build: (c, p) => {
      const lp = p.toLowerCase();
      const deckType =
        /investor/.test(lp) ? "Investor Deck" :
        /product deck|product overview/.test(lp) ? "Product Deck" :
        /sales deck|sales pitch/.test(lp) ? "Sales Deck" :
        /media|press deck/.test(lp) ? "Media Deck" :
        "Pitch Deck";
      return `${ctxBlock(c, p)}\n\nReturn STRICT JSON ONLY (no markdown, no preamble) for a complete ${deckType}:\n{\n  "deck_type": "${deckType}",\n  "overview":  "<one paragraph on the deck's purpose>",\n  "slides": [\n    { "title": "...", "purpose": "<1 sentence>", "bullets": ["...","...","..."], "layout": "<Title + subtitle | Two-column | Big number | Bullet list | Quote | Image-led | Chart-led | Team grid | Timeline | Closing>", "visual_guidance": "<1-2 sentences>", "big_number"?: { "value": "...", "label": "..." }, "quote"?: { "text": "...", "attribution": "..." } }\n  ],\n  "layout_notes": "<paragraph: how a founder swaps slides per audience>"\n}\nDeliver 12-14 slides for a ${deckType}, tailored to the real product/audience above.`;
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
