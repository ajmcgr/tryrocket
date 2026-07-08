// Parse generator output (markdown or JSON) into typed structures the
// visual renderers can consume. All parsers are defensive — partial or
// legacy content still returns something useful.

export type ColorSystem = {
  name?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  success?: string;
  warning?: string;
  danger?: string;
  neutral_dark?: string;
  neutral_light?: string;
  neutrals?: Record<string, string>;
  gradients?: { name?: string; from: string; to: string; angle?: number }[];
  light_mode?: Record<string, string>;
  dark_mode?: Record<string, string>;
  accessibility?: string;
  usage?: string;
  rationale?: string;
};

export type FontSystem = {
  display_font?: string;
  heading_font?: string;
  body_font?: string;
  mono_font?: string;
  display_weight?: number;
  heading_weight?: number;
  body_weight?: number;
  scale?: Record<string, { size_px: number; line_height: number; weight: number; tracking?: string }>;
  pair_rationale?: string;
  usage?: string;
  example_headline?: string;
  example_body?: string;
};

export type FounderBio = {
  x_bio?: string;
  linkedin_headline?: string;
  linkedin_about?: string;
  short?: string;
  medium?: string;
  long?: string;
  speaker_bio?: string;
  press_bio?: string;
};

export type BrandVoiceData = {
  overview?: string;
  pillars?: { name: string; description: string; why_it_fits?: string; example?: string }[];
  tone_by_context?: { context: string; guidance: string }[];
  do?: { phrase: string; why?: string }[];
  dont?: { phrase: string; why?: string }[];
  website_examples?: { label: string; copy: string }[];
  social_examples?: { platform: string; copy: string }[];
  launch_examples?: { label: string; copy: string }[];
  email_examples?: { subject: string; body: string }[];
};

export type BrandGuidelinesData = {
  brand_name?: string;
  overview?: string;
  mission?: string;
  vision?: string;
  positioning?: string;
  audience?: string;
  personas?: { name: string; role?: string; demographics?: string; goals?: string[]; pains?: string[]; triggers?: string[]; channels?: string[]; quote?: string }[];
  personality_traits?: { trait: string; description: string }[];
  values?: { name: string; description: string }[];
  voice?: { overview?: string; tone_shifts?: { context: string; guidance: string }[] };
  messaging?: { core_message?: string; value_prop?: string; pillars?: { name: string; proof: string }[]; reasons_to_believe?: string[] };
  taglines?: string[];
  elevator_pitch?: { one_sentence?: string; thirty_second?: string; two_minute?: string };
  do?: string[];
  dont?: string[];
  website_examples?: { hero?: { headline: string; subheadline: string }; feature?: { headline: string; body: string }; cta?: { headline: string; body: string } };
  social_examples?: { platform: string; copy: string }[];
  launch_examples?: { label: string; copy: string }[];
};

export type LaunchCopyData = {
  tagline?: string;
  one_liner?: string;
  short_description?: string;
  medium_description?: string;
  long_description?: string;
  hero?: { headline: string; subheadline: string; cta: string };
  cta_variations?: string[];
  launch_announcement?: string;
  seo?: { title: string; meta_description: string };
};

export type ProductHuntCopyData = {
  tagline?: string;
  short_description?: string;
  full_description?: string;
  first_comment?: string;
  maker_comment?: string;
  launch_tweet?: string;
  faq?: { q: string; a: string }[];
  community_responses?: { scenario: string; reply: string }[];
  topics?: string[];
};

export type SocialPostData =
  | { kind: "post"; platform: string; copy: string }
  | { kind: "library"; categories: { name: string; posts: { platform: string; copy: string }[] }[] };

export type PresentationData = {
  deck_type?: string;
  overview?: string;
  slides: {
    title: string;
    purpose?: string;
    bullets?: string[];
    layout?: string;
    visual_guidance?: string;
    notes?: string;
    big_number?: { value: string; label: string };
    quote?: { text: string; attribution?: string };
    /** Two-column body copy — used when layout is "two_column". */
    columns?: { heading?: string; body?: string; bullets?: string[] }[];
    /** Side-by-side comparison — used when layout is "comparison". */
    comparison?: {
      left: { heading: string; bullets?: string[]; body?: string };
      right: { heading: string; bullets?: string[]; body?: string };
    };
    /** Row of stat cards — used when layout is "stats". */
    stats?: { value: string; label: string; caption?: string }[];
    /** Ordered milestones — used when layout is "timeline". */
    timeline?: { label: string; body?: string }[];
    /** Numbered process steps — used when layout is "steps" or "process". */
    steps?: { title: string; body?: string }[];
  }[];
  layout_notes?: string;
};

export type TemplateLibraryData = {
  groups: { name: string; templates: { name: string; body: string; placeholders?: string[] }[] }[];
};

export type MarkdownSection = {
  level: number;
  title: string;
  body: string;
  children: MarkdownSection[];
};

export function tryJson<T = any>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // Strip ```json fences if present
  const fenced = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const body = fenced ? fenced[1] : s;
  try { return JSON.parse(body); } catch {}
  // Try to find first {...} block
  const m = body.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  // Attempt to repair truncated JSON (model hit token limit mid-output).
  const start = body.indexOf("{");
  if (start >= 0) {
    const repaired = repairTruncatedJson(body.slice(start));
    if (repaired) { try { return JSON.parse(repaired); } catch {} }
  }
  return null;
}

/** Best-effort repair for JSON truncated mid-stream: closes open strings, arrays, and objects. */
function repairTruncatedJson(s: string): string | null {
  let out = "";
  const stack: string[] = []; // '{', '[', or '"'
  let escape = false;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    out += c;
    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') { inString = false; stack.pop(); }
      continue;
    }
    if (c === '"') { inString = true; stack.push('"'); continue; }
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") {
      const open = c === "}" ? "{" : "[";
      if (stack[stack.length - 1] === open) stack.pop();
    }
  }
  if (inString) out += '"';
  // Trim trailing comma or partial key before closing
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ": null").replace(/,\s*([\}\]])/g, "$1");
  while (stack.length) {
    const top = stack.pop();
    if (top === "{") out += "}";
    else if (top === "[") out += "]";
  }
  return out;
}

/** Parse markdown into a nested tree of sections by heading level. */
export function parseMarkdownSections(md: string | null | undefined): MarkdownSection[] {
  if (!md) return [];
  const lines = String(md).split(/\r?\n/);
  const root: MarkdownSection = { level: 0, title: "", body: "", children: [] };
  const stack: MarkdownSection[] = [root];
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    stack[stack.length - 1].body += (stack[stack.length - 1].body ? "\n" : "") + buf.join("\n");
    buf = [];
  };
  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const title = h[2].trim();
      const node: MarkdownSection = { level, title, body: "", children: [] };
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else {
      buf.push(line);
    }
  }
  flush();
  return root.children;
}

export function findSection(sections: MarkdownSection[], match: RegExp | string): MarkdownSection | null {
  const re = typeof match === "string" ? new RegExp(match, "i") : match;
  for (const s of sections) {
    if (re.test(s.title)) return s;
    const child = findSection(s.children, re);
    if (child) return child;
  }
  return null;
}

export function flattenSections(sections: MarkdownSection[]): MarkdownSection[] {
  const out: MarkdownSection[] = [];
  const walk = (arr: MarkdownSection[]) => {
    for (const s of arr) { out.push(s); walk(s.children); }
  };
  walk(sections);
  return out;
}

/** WCAG relative-luminance contrast ratio. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  try {
    const a = lum(hexA), b = lum(hexB);
    const l1 = Math.max(a, b), l2 = Math.min(a, b);
    return (l1 + 0.05) / (l2 + 0.05);
  } catch { return 1; }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex?.replace("#", "");
  if (!h || h.length !== 6) return null;
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Markdown → safe HTML (small subset: headings, bullets, bold/italic/code, blockquotes, links). */
export function mdToHtml(md: string): string {
  if (!md) return "";
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const lines = String(md).split(/\r?\n/);
  const out: string[] = [];
  let inList = false, inQuote = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const closeQuote = () => { if (inQuote) { out.push("</blockquote>"); inQuote = false; } };
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-100 px-1 py-0.5 text-[0.85em] text-neutral-800">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand underline" target="_blank" rel="noreferrer">$1</a>');
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); closeQuote(); const lvl = Math.min(6, h[1].length + 1); out.push(`<h${lvl} class="mt-6 mb-2 font-semibold text-neutral-900">${inline(h[2])}</h${lvl}>`); continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      closeQuote();
      if (!inList) { out.push('<ul class="my-2 list-disc space-y-1 pl-6 text-neutral-800">'); inList = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      closeList();
      if (!inQuote) { out.push('<blockquote class="my-3 border-l-4 border-neutral-200 pl-4 italic text-neutral-700">'); inQuote = true; }
      out.push(`<p>${inline(line.replace(/^\s*>\s?/, ""))}</p>`);
      continue;
    }
    if (!line.trim()) { closeList(); closeQuote(); out.push(""); continue; }
    out.push(`<p class="my-2 leading-relaxed text-neutral-800">${inline(line)}</p>`);
  }
  closeList(); closeQuote();
  return out.join("\n");
}

/** Extract fenced code blocks (```lang ... ```) from markdown. */
export function extractCodeBlocks(md: string): { lang: string; content: string }[] {
  if (!md) return [];
  const blocks: { lang: string; content: string }[] = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) blocks.push({ lang: m[1] || "", content: m[2].trim() });
  return blocks;
}

/** Pull blockquote lines as a list of post-like items. */
export function extractBlockquotes(md: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  for (const line of String(md || "").split(/\r?\n/)) {
    if (/^\s*>\s?/.test(line)) cur.push(line.replace(/^\s*>\s?/, ""));
    else if (cur.length) { out.push(cur.join("\n").trim()); cur = []; }
  }
  if (cur.length) out.push(cur.join("\n").trim());
  return out;
}

/** Pull bullet items at the top of a section body. */
export function extractBullets(md: string): string[] {
  return String(md || "").split(/\r?\n/).filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, "").trim());
}