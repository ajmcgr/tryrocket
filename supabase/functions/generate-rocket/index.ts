import { createClient } from "npm:@supabase/supabase-js@2.45.0";

// ============================================================
// Inlined from _shared/workflows.ts to keep this function
// standalone / copy-paste deployable.
// ============================================================
type Workflow = "brand" | "design" | "launch" | "promote";
interface TextAssetSpec { asset_type: string; title: string }
interface WorkflowSpec {
  workflow: Workflow;
  label: string;
  text_assets: TextAssetSpec[];
  image_count: number;
  system: string;
  buildUserPrompt(ctx: { contextBlock: string; imagesAttachedNote: string }): string;
}
const BRAND: WorkflowSpec = {
  workflow: "brand", label: "Brand It", image_count: 0,
  text_assets: [
    { asset_type: "positioning_tagline", title: "Tagline" },
    { asset_type: "positioning_value_prop", title: "Value Proposition" },
    { asset_type: "positioning_elevator", title: "Elevator Pitch" },
    { asset_type: "positioning_audience", title: "Target Audience" },
    { asset_type: "positioning_category", title: "Product Category" },
    { asset_type: "positioning_differentiator", title: "Key Differentiator" },
    { asset_type: "audience_ideal_customer", title: "Ideal Customer" },
    { asset_type: "audience_pain_points", title: "Pain Points" },
    { asset_type: "audience_use_cases", title: "Use Cases" },
    { asset_type: "audience_messaging", title: "Messaging Angles" },
    { asset_type: "founder_bio", title: "Founder Bio" },
    { asset_type: "founder_tagline", title: "Founder Tagline" },
    { asset_type: "founder_x_bio", title: "X Bio" },
    { asset_type: "founder_linkedin", title: "LinkedIn Headline" },
  ],
  system: `You are Rocket, an AI brand co-pilot. Generate brand positioning, audience, and founder messaging. Output a single JSON object. Every value a tight, ready-to-paste non-empty string. Use "- " for bullet lines.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string: product_name, positioning_tagline, positioning_value_prop, positioning_elevator, positioning_audience, positioning_category, positioning_differentiator, audience_ideal_customer, audience_pain_points, audience_use_cases, audience_messaging, founder_bio, founder_tagline, founder_x_bio, founder_linkedin. Tone: confident, founder-led, specific. RESPOND WITH JSON ONLY.`;
  },
};
const DESIGN: WorkflowSpec = {
  workflow: "design", label: "Design It", image_count: 3,
  text_assets: [
    { asset_type: "design_style_direction", title: "Style Direction" },
    { asset_type: "design_color_palette", title: "Color Palette" },
    { asset_type: "design_typography", title: "Typography Notes" },
  ],
  system: `You are Rocket, an AI visual brand co-pilot. The user wants visual assets (logos / icons / brand visuals). Generate 3 distinct logo / visual concepts and a tight visual style brief. Every value a non-empty string. Image prompts MUST be ready to paste into a text-to-image model, describe a single image, be vivid, specify style, color, composition, and end with: ", clean white background, vector style, high quality, no text". Output a single JSON object only.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string:\n- product_name\n- design_style_direction\n- design_color_palette\n- design_typography\n- image_concept_1, image_concept_2, image_concept_3\n- image_prompt_1, image_prompt_2, image_prompt_3\n\nRESPOND WITH JSON ONLY.`;
  },
};
const LAUNCH: WorkflowSpec = {
  workflow: "launch", label: "Launch It", image_count: 0,
  text_assets: [
    { asset_type: "launch_submission", title: "Launch Submission" },
    { asset_type: "launch_product_hunt", title: "Product Hunt Copy" },
    { asset_type: "launch_directory", title: "Directory Submission" },
    { asset_type: "founder_story", title: "Founder Story" },
    { asset_type: "strategy_readiness", title: "Launch Readiness Score" },
    { asset_type: "strategy_channels", title: "Recommended Channels" },
    { asset_type: "strategy_communities", title: "Recommended Communities" },
    { asset_type: "strategy_content", title: "Content Ideas" },
    { asset_type: "checklist_pre", title: "Pre-Launch Checklist" },
    { asset_type: "checklist_day", title: "Launch Day Checklist" },
    { asset_type: "checklist_post", title: "Post-Launch Checklist" },
  ],
  system: `You are Rocket, an AI launch strategist. Generate ready-to-ship launch assets and a concrete launch plan. Output a single JSON object. Each value a non-empty, ready-to-paste string. Use "- " bullets for lists. For Launch Readiness Score, return a 0-100 number plus 1-2 sentence rationale.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string: product_name, launch_submission, launch_product_hunt, launch_directory, founder_story, strategy_readiness, strategy_channels, strategy_communities, strategy_content, checklist_pre, checklist_day, checklist_post. RESPOND WITH JSON ONLY.`;
  },
};
const PROMOTE: WorkflowSpec = {
  workflow: "promote", label: "Promote It", image_count: 0,
  text_assets: [
    { asset_type: "social_x_post", title: "X Post" },
    { asset_type: "social_x_thread", title: "X Thread" },
    { asset_type: "social_linkedin", title: "LinkedIn Post" },
    { asset_type: "social_reddit", title: "Reddit Post" },
    { asset_type: "social_newsletter", title: "Newsletter Announcement" },
    { asset_type: "promote_influencer_outreach", title: "Influencer Outreach DM" },
    { asset_type: "promote_pr_pitch", title: "PR Pitch Email" },
    { asset_type: "promote_creator_campaign", title: "Creator Campaign Brief" },
  ],
  system: `You are Rocket, an AI growth + PR co-pilot. Generate distribution copy and outreach assets that sound like a real founder, not a marketer. Output a single JSON object. Every value a non-empty, ready-to-paste string. For threads/posts write the actual post copy.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string: product_name, social_x_post, social_x_thread, social_linkedin, social_reddit, social_newsletter, promote_influencer_outreach, promote_pr_pitch, promote_creator_campaign. RESPOND WITH JSON ONLY.`;
  },
};
const WORKFLOWS: Record<Workflow, WorkflowSpec> = { brand: BRAND, design: DESIGN, launch: LAUNCH, promote: PROMOTE };
const CLASSIFIER_SYSTEM = `You classify a user's request into exactly one of four Rocket workflows. Output strict JSON: {"workflow": "brand" | "design" | "launch" | "promote"}.\n- "design" → user wants visual assets: logo, icon, hero image, social graphic, ad creative, thumbnail, screenshot, illustration, brand visuals.\n- "launch" → user wants launch copy / launch strategy / Product Hunt assets / launch checklist / founder story / submission copy.\n- "promote" → user wants distribution: X thread, LinkedIn post, Reddit post, influencer outreach, PR pitch, creator campaign.\n- "brand" → user wants brand identity / positioning / messaging / tagline / audience / value prop / elevator pitch, OR a full brand kit, OR the request is ambiguous and could be a complete brand.\nDefault to "brand" when uncertain. Respond with JSON only.`;

const ALLOWED_ORIGINS = ["https://tryrocket.ai", "http://localhost:5173", "http://localhost:3000"];
function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

const LOGO_URL = "https://id-preview--ec8b5822-131a-40d9-8a55-f90a28ced572.lovable.app/__l5e/assets-v1/d64d2310-23c4-4327-8624-7bd94b3b182e/rocket-logo-white.png";
const BRAND = { blue: "#3B82F6", ink: "#0A0A0A", text: "#1F2937", muted: "#6B7280", border: "#E5E7EB", bg: "#F9FAFB" };
type Template = "welcome"|"rocket_generated"|"trial_started"|"payment_succeeded"|"credits_purchased"|"auth_signup"|"auth_magiclink"|"auth_recovery"|"auth_invite"|"auth_email_change"|"auth_reauth";
function renderEmail({ preheader, title, bodyHtml, ctaLabel, ctaUrl }: { preheader?: string; title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }): string {
  const cta = ctaLabel && ctaUrl ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;"><tr><td align="left"><a href="${ctaUrl}" style="display:inline-block;background:${BRAND.blue};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9999px;font-family:Inter,Arial,sans-serif;">${ctaLabel}</a></td></tr></table>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${title}</title></head><body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Arial,sans-serif;color:${BRAND.text};">${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};padding:32px 12px;"><tr><td align="center"><table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;"><tr><td style="background:${BRAND.blue};padding:28px 32px;" align="left"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="vertical-align:middle;padding-right:10px;"><img src="${LOGO_URL}" width="28" height="28" alt="Rocket" style="display:block;border:0;outline:none;text-decoration:none;width:28px;height:28px;" /></td><td style="vertical-align:middle;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;font-family:Inter,Arial,sans-serif;">Rocket</td></tr></table></td></tr><tr><td style="padding:36px 32px 32px;"><h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:${BRAND.ink};font-family:Inter,Arial,sans-serif;">${title}</h1><div style="font-size:15px;line-height:1.65;color:${BRAND.text};font-family:Inter,Arial,sans-serif;">${bodyHtml}</div>${cta}</td></tr><tr><td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};background:#FAFAFA;"><div style="font-size:12px;color:${BRAND.muted};font-family:Inter,Arial,sans-serif;">You're getting this email from <a href="https://tryrocket.ai" style="color:${BRAND.blue};text-decoration:none;">Rocket</a> — the AI launch co-pilot for vibe coders.</div><div style="margin-top:10px;font-size:11px;color:${BRAND.muted};font-family:Inter,Arial,sans-serif;">© Rocket 2026 · Make your product a brand.</div></td></tr></table></td></tr></table></body></html>`;
}
function buildEmail(template: Template, data: any): { subject: string; html: string } {
  switch (template) {
    case "welcome": return { subject: "Welcome to Rocket 🚀", html: renderEmail({ preheader: "Your AI launch co-pilot is ready.", title: `Welcome to Rocket${data?.name ? `, ${data.name}` : ""}.`, bodyHtml: `<p>You're in. Rocket helps you brand your app with AI — drop in a product URL and we'll generate your full launch kit in under 60 seconds.</p><p>You start with <strong>500 free credits</strong>. No card required.</p>`, ctaLabel: "Generate your first Brand", ctaUrl: "https://tryrocket.ai/create" }) };
    case "rocket_generated": return { subject: `Your Brand for ${data?.product_name ?? "your product"} is ready`, html: renderEmail({ preheader: "Your launch kit is ready to review.", title: `Your Brand for ${data?.product_name ?? "your product"} is ready.`, bodyHtml: `<p>We've generated your complete launch kit — positioning, taglines, social copy, founder bio, Product Hunt assets, directory submissions, and a full launch checklist.</p><p>Review it, tweak anything you want, and ship.</p>`, ctaLabel: "Open your Brand", ctaUrl: `https://tryrocket.ai/rocket/${data?.rocket_id ?? ""}` }) };
    case "trial_started": return { subject: "Your Rocket Growth trial has started", html: renderEmail({ preheader: "7 days of Growth — on the house.", title: "Your 7-day Growth trial is live.", bodyHtml: `<p>You now have <strong>3,000 credits/month</strong>, priority generation, and exports unlocked.</p><p>If you cancel before day 7, you won't be charged.</p>`, ctaLabel: "Go to projects", ctaUrl: "https://tryrocket.ai/projects" }) };
    case "payment_succeeded": return { subject: "Payment received", html: renderEmail({ preheader: `Receipt for $${((data?.amount ?? 0) / 100).toFixed(2)}.`, title: "Payment received — thank you.", bodyHtml: `<p>We received your payment of <strong>$${((data?.amount ?? 0) / 100).toFixed(2)} ${(data?.currency ?? "usd").toUpperCase()}</strong>.</p><p>You can manage your subscription anytime from Settings.</p>`, ctaLabel: "Manage billing", ctaUrl: "https://tryrocket.ai/settings" }) };
    case "credits_purchased": return { subject: `${data?.credits ?? 0} Rocket Credits added`, html: renderEmail({ preheader: "Your credits are live.", title: `${data?.credits ?? 0} credits added to your account.`, bodyHtml: `<p>Your credit pack is on your account and ready to use.</p>`, ctaLabel: "Generate a Brand", ctaUrl: "https://tryrocket.ai/create" }) };
    case "auth_signup": return { subject: "Confirm your Rocket account", html: renderEmail({ preheader: "One click to verify your email.", title: "Confirm your email to launch Rocket.", bodyHtml: `<p>Welcome to Rocket — your AI launch co-pilot. Tap the button below to confirm your email and start generating brands.</p>`, ctaLabel: "Confirm email", ctaUrl: data?.confirmation_url }) };
    case "auth_magiclink": return { subject: "Your Rocket sign-in link", html: renderEmail({ preheader: "Tap to sign in to Rocket.", title: "Sign in to Rocket.", bodyHtml: `<p>Click the button below to sign in. This link expires shortly and can only be used once.</p>`, ctaLabel: "Sign in to Rocket", ctaUrl: data?.confirmation_url }) };
    case "auth_recovery": return { subject: "Reset your Rocket password", html: renderEmail({ preheader: "Set a new password for your Rocket account.", title: "Reset your password.", bodyHtml: `<p>We received a request to reset your Rocket password. Click below to set a new one. If you didn't request this, you can safely ignore this email.</p>`, ctaLabel: "Reset password", ctaUrl: data?.confirmation_url }) };
    case "auth_invite": return { subject: "You've been invited to Rocket", html: renderEmail({ preheader: "Accept your invite to join Rocket.", title: "You're invited to Rocket.", bodyHtml: `<p>You've been invited to join Rocket. Click below to accept and set up your account.</p>`, ctaLabel: "Accept invite", ctaUrl: data?.confirmation_url }) };
    case "auth_email_change": return { subject: "Confirm your new email", html: renderEmail({ preheader: "Verify your new Rocket email address.", title: "Confirm your new email address.", bodyHtml: `<p>Click below to confirm <strong>${data?.new_email ?? "your new email"}</strong> as the new email on your Rocket account.</p>`, ctaLabel: "Confirm new email", ctaUrl: data?.confirmation_url }) };
    case "auth_reauth": return { subject: `Your Rocket verification code: ${data?.token ?? ""}`, html: renderEmail({ preheader: "Use this code to verify it's you.", title: "Verify it's you.", bodyHtml: `<p>Enter this code in Rocket to continue:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:18px 0;">${data?.token ?? ""}</p><p>If you didn't request this, you can ignore this email.</p>` }) };
  }
}
async function sendBranded(resendKey: string, fromEmail: string, to: string, template: Template, data: any): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { subject, html } = buildEmail(template, data);
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: fromEmail, to: [to], subject, html }) });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: JSON.stringify(json) };
    return { ok: true, id: json.id };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}


const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image-preview";
function requireGeminiKey() {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  return GEMINI_API_KEY;
}

// ===== Gemini retry wrapper =====
class GeminiUnavailableError extends Error {
  status: number;
  bodyText: string;
  constructor(status: number, bodyText: string) {
    super(`Gemini ${status}: ${bodyText}`);
    this.status = status;
    this.bodyText = bodyText;
  }
}
const GEMINI_RETRYABLE = new Set([429, 500, 502, 503, 504]);
const GEMINI_BACKOFF_MS = [1000, 3000, 7000]; // up to 3 retries
async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt <= GEMINI_BACKOFF_MS.length; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (e) {
      lastStatus = 0;
      lastBody = (e as Error).message;
      if (attempt === GEMINI_BACKOFF_MS.length) throw new GeminiUnavailableError(0, lastBody);
      console.log(`Gemini network error, retry in ${GEMINI_BACKOFF_MS[attempt]}ms (attempt ${attempt + 1}/${GEMINI_BACKOFF_MS.length}): ${lastBody}`);
      await new Promise((r) => setTimeout(r, GEMINI_BACKOFF_MS[attempt]));
      continue;
    }
    if (res.ok) return res;
    lastStatus = res.status;
    lastBody = await res.text();
    if (!GEMINI_RETRYABLE.has(res.status) || attempt === GEMINI_BACKOFF_MS.length) break;
    console.log(`Gemini ${res.status}, retry in ${GEMINI_BACKOFF_MS[attempt]}ms (attempt ${attempt + 1}/${GEMINI_BACKOFF_MS.length})`);
    await new Promise((r) => setTimeout(r, GEMINI_BACKOFF_MS[attempt]));
  }
  if (GEMINI_RETRYABLE.has(lastStatus)) throw new GeminiUnavailableError(lastStatus, lastBody);
  throw new Error(`Gemini ${lastStatus}: ${lastBody}`);
}
function tryParseJsonLoose(raw: string): any {
  if (!raw) throw new Error("empty AI response");
  const stripped = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(stripped); } catch {}
  // Find outermost {...}
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = stripped.slice(first, last + 1);
    try { return JSON.parse(slice); } catch {}
    // Repair: strip trailing commas, control chars
    const repaired = slice
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    return JSON.parse(repaired);
  }
  throw new Error("no JSON object found in AI response");
}

async function geminiJSON<T = any>(opts: { system: string; user: string; images?: Array<{ mimeType: string; data: string }>; temperature?: number }): Promise<{ parsed: T; rawPreview: string }> {
  const key = requireGeminiKey();
  const parts: any[] = [{ text: opts.user }];
  for (const img of opts.images || []) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
  }
  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: opts.temperature ?? 0.7, responseMimeType: "application/json" },
      }),
    },
  );
  const data = await res.json();
  const finish = data?.candidates?.[0]?.finishReason;
  const raw = (data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "").trim();
  const rawPreview = raw.slice(0, 500);
  if (finish && finish !== "STOP" && finish !== "MAX_TOKENS") {
    // continue anyway
  }
  const parsed = tryParseJsonLoose(raw);
  return { parsed, rawPreview };
}

// Generate a single image via Gemini image model. Returns raw PNG bytes.
async function geminiImage(prompt: string): Promise<Uint8Array> {
  const key = requireGeminiKey();
  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    },
  );
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p?.inlineData || p?.inline_data;
    if (inline?.data) {
      const bin = atob(inline.data);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
  }
  throw new Error("no image in Gemini response");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";

async function fetchSite(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 RocketBot/1.0" }, redirect: "follow" });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);
  } catch (e) {
    console.error("fetch failed", e);
    return "";
  }
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function classifyWorkflow(opts: { text: string; hasImages: boolean }): Promise<Workflow> {
  try {
    const { parsed } = await geminiJSON<{ workflow: Workflow }>({
      system: CLASSIFIER_SYSTEM,
      user: `User request: """${opts.text || "(no text)"}"""\nImages attached: ${opts.hasImages ? "yes" : "no"}\nReturn JSON.`,
      temperature: 0.1,
    });
    const w = parsed?.workflow;
    if (w === "brand" || w === "design" || w === "launch" || w === "promote") return w;
    return "brand";
  } catch (e) {
    console.error("classifier failed, defaulting to brand", e);
    return "brand";
  }
}

Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  let step = "init";
  try {
    // 1. Env validation
    step = "env_check";
    const requiredEnv: Array<[string, string | undefined]> = [
      ["GEMINI_API_KEY", GEMINI_API_KEY],
      ["SUPABASE_URL", SUPABASE_URL],
      ["SUPABASE_ANON_KEY", SUPABASE_ANON_KEY],
      ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY],
    ];
    for (const [name, val] of requiredEnv) {
      if (!val) {
        console.error("missing env", name);
        return jsonResponse({ error: "missing_environment_variable", variable: name }, 500, corsHeaders);
      }
    }

    // 2. Auth
    step = "auth";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "unauthorized", details: "missing Authorization header" }, 401, corsHeaders);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr) console.error("auth error", authErr);
    const user = userData?.user;
    if (!user) return jsonResponse({ error: "unauthorized", details: authErr?.message ?? "no user" }, 401, corsHeaders);

    // 3. Body parsing
    step = "body_parse";
    let body: any = {};
    try { body = await req.json(); } catch (e) {
      return jsonResponse({ error: "invalid_body", details: (e as Error).message }, 400, corsHeaders);
    }
    console.log("generate-rocket body", { hasInput: !!body?.input, hasUrl: !!body?.product_url, imageCount: Array.isArray(body?.images) ? body.images.length : 0 });

    const rawInput: string = typeof body?.input === "string" && body.input.trim().length > 0
      ? body.input.trim()
      : (typeof body?.product_url === "string" ? body.product_url.trim() : "");
    const imagesRaw = body?.images;
    const imagesIn: string[] = Array.isArray(imagesRaw) ? imagesRaw.filter((s: any) => typeof s === "string") : [];
    if (!rawInput && imagesIn.length === 0) {
      return jsonResponse({ error: "invalid_input", details: "Provide a product URL, a free-text idea, or at least one image" }, 400, corsHeaders);
    }

    const isUrl = !!rawInput && isValidUrl(rawInput);
    const productUrl = isUrl ? rawInput : "";
    const freeText = isUrl ? "" : rawInput;

    // Workflow selection (explicit or auto-classified)
    const rawWorkflow: string = typeof body?.workflow === "string" ? body.workflow : "auto";
    let workflow: Workflow;
    if (rawWorkflow === "brand" || rawWorkflow === "design" || rawWorkflow === "launch" || rawWorkflow === "promote") {
      workflow = rawWorkflow;
    } else {
      step = "classify";
      workflow = await classifyWorkflow({ text: rawInput, hasImages: imagesIn.length > 0 });
    }
    const spec = WORKFLOWS[workflow];
    console.log("workflow selected", workflow);

    // Parse images
    const inlineImages: Array<{ mimeType: string; data: string }> = [];
    for (const src of imagesIn.slice(0, 6)) {
      const m = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!m) continue;
      if (m[2].length > 8 * 1024 * 1024) continue;
      inlineImages.push({ mimeType: m[1], data: m[2] });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4. User usage row — auto-create if missing
    step = "user_usage";
    let { data: usage, error: usageErr } = await admin.from("user_usage").select("*").eq("user_id", user.id).maybeSingle();
    if (usageErr) {
      console.error("usage select error", usageErr);
      return jsonResponse({ error: "database_select_failed", step, details: usageErr.message }, 500, corsHeaders);
    }
    if (!usage) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const { data: created, error: createErr } = await admin.from("user_usage").insert({
        user_id: user.id,
        plan: "free",
        monthly_limit: 100,
        credits_used: 0,
        credits_extra: 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }).select().single();
      if (createErr) {
        console.error("usage insert error", createErr);
        return jsonResponse({ error: "database_insert_failed", step: "user_usage_create", details: createErr.message }, 500, corsHeaders);
      }
      usage = created;
    }

    // 5. Credits — DB-driven per-asset costs
    step = "credits";
    const { data: costRows, error: costErr } = await admin.from("credit_costs").select("asset_type, credits");
    if (costErr) {
      console.error("credit_costs select failed", costErr);
      return jsonResponse({ error: "database_select_failed", step, details: costErr.message }, 500, corsHeaders);
    }
    const costMap = new Map<string, number>();
    for (const r of costRows || []) costMap.set(r.asset_type, r.credits);
    const textCostFor = (t: string) => costMap.get(t) ?? 1;
    const imageCostFor = (t: string) => costMap.get(t) ?? (costMap.get("logo_generation") ?? 25);
    const textCostTotal = spec.text_assets.reduce((s, a) => s + textCostFor(a.asset_type), 0);
    const imageCostTotal = Array.from({ length: spec.image_count }).reduce<number>((s, _, i) => s + imageCostFor(`design_image_${i + 1}`), 0);
    const estimatedCost = textCostTotal + imageCostTotal;
    const remaining = (usage.monthly_limit + (usage.credits_extra || 0)) - usage.credits_used;
    if (remaining < estimatedCost) {
      return jsonResponse({ error: "insufficient_credits", code: "no_credits", needed: estimatedCost, remaining }, 402, corsHeaders);
    }

    // 6. Optional scrape
    step = "scrape";
    const siteText = isUrl ? await fetchSite(productUrl) : "";

    // 7. AI prompt
    step = "ai_prompt";
    const system = spec.system;
    const contextBlock = isUrl
      ? `Product URL: ${productUrl}\n\nScraped page content:\n"""${siteText || "(no content fetched — infer from URL)"}"""`
      : freeText
        ? `Product idea (free text from user):\n"""${freeText}"""`
        : `(no URL or text — infer everything from the attached images)`;
    const imagesAttachedNote = inlineImages.length
      ? `The user attached ${inlineImages.length} reference image(s). Examine them carefully — they may include the product UI, logo, mockups, or brand inspiration.\n\n`
      : "";
    const user_prompt = spec.buildUserPrompt({ contextBlock, imagesAttachedNote });

    // 8. AI request + parse
    step = "ai_request";
    let parsed: any;
    let rawPreview = "";
    try {
      const result = await geminiJSON({ system, user: user_prompt, images: inlineImages, temperature: 0.7 });
      parsed = result.parsed;
      rawPreview = result.rawPreview;
    } catch (e) {
      console.error("ai_request_failed", e);
      return jsonResponse({ error: "ai_request_failed", step, details: (e as Error).message, raw_preview: rawPreview }, 500, corsHeaders);
    }
    if (!parsed || typeof parsed !== "object") {
      console.error("ai_response_parsing_failed", rawPreview);
      return jsonResponse({ error: "ai_response_parsing_failed", step: "ai_parse", details: "AI did not return a JSON object", raw_preview: rawPreview }, 500, corsHeaders);
    }

    // Derive product name fallback
    let product_name: string = (typeof parsed.product_name === "string" && parsed.product_name.trim()) || "";
    if (!product_name) {
      if (isUrl) {
        try { product_name = new URL(productUrl).hostname.replace(/^www\./, ""); } catch { product_name = "Untitled Brand"; }
      } else if (freeText) {
        product_name = freeText.slice(0, 60);
      } else {
        product_name = "Untitled Brand";
      }
    }

    // 9. Rocket insert
    step = "rocket_insert";
    const { data: rocket, error: rErr } = await admin
      .from("rockets")
      .insert({ user_id: user.id, product_url: productUrl || freeText || "", product_name, status: "ready", workflow })
      .select()
      .single();
    if (rErr) {
      console.error("rocket insert error", rErr);
      return jsonResponse({ error: "database_insert_failed", step, details: rErr.message }, 500, corsHeaders);
    }

    // 10. Assets insert
    step = "assets_insert";
    const textRows = spec.text_assets.map((a) => ({
      rocket_id: rocket.id,
      asset_type: a.asset_type,
      title: a.title,
      kind: "text",
      content: String(parsed[a.asset_type] ?? "").trim() || "(not generated — please regenerate)",
    }));
    const { error: aErr } = await admin.from("rocket_assets").insert(textRows);
    if (aErr) {
      console.error("assets insert error", aErr);
      return jsonResponse({ error: "database_insert_failed", step, details: aErr.message, rocket_id: rocket.id }, 500, corsHeaders);
    }

    // 10b. Image generation for design workflow
    let imagesGenerated = 0;
    let imageCreditsCharged = 0;
    if (spec.image_count > 0) {
      step = "image_gen";
      const imagePromises = Array.from({ length: spec.image_count }, async (_, idx) => {
        const i = idx + 1;
        const prompt = String(parsed[`image_prompt_${i}`] ?? "").trim();
        const concept = String(parsed[`image_concept_${i}`] ?? "").trim() || `Concept ${i}`;
        if (!prompt) return { ok: false as const, idx: i, error: "no prompt" };
        try {
          const png = await geminiImage(prompt);
          const path = `${user.id}/${rocket.id}/concept-${i}-${Date.now()}.png`;
          const { error: upErr } = await admin.storage.from("rocket-images").upload(path, png, {
            contentType: "image/png",
            upsert: false,
          });
          if (upErr) throw new Error(`storage upload: ${upErr.message}`);
          const { data: pub } = admin.storage.from("rocket-images").getPublicUrl(path);
          return { ok: true as const, idx: i, url: pub.publicUrl, prompt, concept };
        } catch (e) {
          console.error(`image ${i} failed`, e);
          return { ok: false as const, idx: i, error: (e as Error).message, prompt, concept };
        }
      });
      const results = await Promise.all(imagePromises);
      const imageRows = results.map((r) => ({
        rocket_id: rocket.id,
        asset_type: `design_image_${r.idx}`,
        title: `Logo Concept ${r.idx}`,
        kind: "image",
        content: r.ok ? r.concept : `(image generation failed: ${(r as any).error}) — try Regenerate`,
        image_url: r.ok ? r.url : null,
        image_prompt: (r as any).prompt || null,
      }));
      const { error: imgErr } = await admin.from("rocket_assets").insert(imageRows);
      if (imgErr) console.error("image assets insert error", imgErr);
      imagesGenerated = results.filter((r) => r.ok).length;
      imageCreditsCharged = results
        .filter((r) => r.ok)
        .reduce((s, r) => s + imageCostFor(`design_image_${(r as any).idx}`), 0);
    }

    // 11. Decrement credits (charge only for what we actually produced)
    step = "credits_decrement";
    const totalCharged = textCostTotal + imageCreditsCharged;
    const { error: decErr } = await admin.from("user_usage").update({ credits_used: usage.credits_used + totalCharged }).eq("user_id", user.id);
    if (decErr) console.error("credits decrement failed (non-fatal)", decErr);
    // Log transactions: one row per text bundle + one row per image
    const txnRows: any[] = [];
    if (textCostTotal > 0) {
      txnRows.push({
        user_id: user.id, rocket_id: rocket.id, workflow,
        asset_type: `workflow_${workflow}_text`, kind: "spent", credits: textCostTotal,
        meta: { asset_types: spec.text_assets.map((a) => a.asset_type) },
      });
    }
    if (imageCreditsCharged > 0) {
      txnRows.push({
        user_id: user.id, rocket_id: rocket.id, workflow,
        asset_type: "design_image", kind: "spent", credits: imageCreditsCharged,
        meta: { images_generated: imagesGenerated },
      });
    }
    if (txnRows.length) {
      const { error: txErr } = await admin.from("credit_transactions").insert(txnRows);
      if (txErr) console.error("credit_transactions insert failed (non-fatal)", txErr);
    }

    // 12. Side-effect email
    if (RESEND_API_KEY && user.email) {
      sendBranded(RESEND_API_KEY, FROM_EMAIL, user.email, "rocket_generated", {
        product_name, rocket_id: rocket.id,
      }).catch((e) => console.error("email send failed", e));
    }

    return jsonResponse({ rocket_id: rocket.id, workflow, images_generated: imagesGenerated, credits_charged: totalCharged }, 200, corsHeaders);
  } catch (e) {
    console.error("server_error at step", step, e);
    return jsonResponse({ error: "server_error", step, details: (e as Error).message }, 500, corsHeaders);
  }
});
