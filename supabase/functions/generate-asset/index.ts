// redeploy: 2026-07-01
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { cors, geminiText, geminiImage, GeminiUnavailableError, hasGeminiKey } from "../_shared/gemini.ts";
import { GENERATORS, ASSET_TITLES, CLASSIFIER_SYSTEM, REFUSAL_TEXT, type AssetType, type BrandContext } from "../_shared/generators.ts";
import { buildLogotypeVariants, pickLogotypeText } from "../_shared/logotype.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function extractUrl(text: string): string | null {
  const m = text.match(/(https?:\/\/[^\s]+|[\w-]+\.(?:com|ai|io|co|app|dev|net|org|xyz|so|gg|me)(?:\/\S*)?)/i);
  if (!m) return null;
  const u = m[1];
  return /^https?:\/\//i.test(u) ? u : "https://" + u;
}

async function mapLimit<T>(count: number, limit: number, task: (index: number) => Promise<T>): Promise<T[]> {
  const results = new Array<T>(count);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, count) }, async () => {
    while (true) {
      const index = next++;
      if (index >= count) break;
      results[index] = await task(index);
    }
  }));
  return results;
}

function requestedCount(prompt: string, fallback: number): number {
  const lower = prompt.toLowerCase();
  const wordCounts: Record<string, number> = {
    "a couple": 2, "couple": 2,
    "a few": 3, "few": 3, "several": 4, "handful": 5,
    "half a dozen": 6, "half dozen": 6,
    "a dozen": 12, "dozen": 12, "twelve": 12,
    "two dozen": 24, "lots": 12, "many": 12, "bunch": 12,
  };
  let explicitCount: number | null = null;
  for (const [word, n] of Object.entries(wordCounts)) {
    if (lower.includes(word)) { explicitCount = n; break; }
  }
  const digitMatch = prompt.match(/\b(\d{1,2})\b/);
  if (digitMatch) explicitCount = parseInt(digitMatch[1]);
  return explicitCount ? Math.max(1, Math.min(24, explicitCount)) : fallback;
}

function isLogotypeOnlyPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const wantsTextLogo = /\b(logotype|logotypes|wordmark|word\s*mark|word-mark|text[- ]?based\s+logo|text\s+logo|type[- ]?based\s+logo|typographic\s+logo|typography\s+logo|lettering|letters\s+only|name\s+only)\b/.test(lower);
  const saysTextNotLogo = /\b(text|type|typographic|typography|lettering|wordmark|logotype)\b[\s\S]{0,40}\b(not\s+(a\s+)?logo|no\s+(logo|icon|symbol|mark)|not\s+(an\s+)?icon|not\s+(a\s+)?symbol)\b/.test(lower)
    || /\b(not\s+(a\s+)?logo|no\s+(logo|icon|symbol|mark)|not\s+(an\s+)?icon|not\s+(a\s+)?symbol)\b[\s\S]{0,40}\b(text|type|typographic|typography|lettering|wordmark|logotype)\b/.test(lower);
  const wantsLogoMark = /\b(logo|logos|logo mark|logomark|brandmark|mark|symbol)\b/.test(lower);
  const wantsPictorial = /\b(icon|symbol|emblem|pictorial|illustration|graphic|mascot|badge|app\s*icon|favicon)\b/.test(lower);
  const wantsBothLogoAndLogotype = wantsTextLogo && wantsLogoMark && /\b(and|plus|with|along with|as well as|also|matching)\b/.test(lower);
  return (wantsTextLogo || saysTextNotLogo) && !wantsPictorial && !wantsBothLogoAndLogotype;
}

// Fan out graphic/icon/photo across distinct categories so a multi-variant gallery
// is a real PACK (hero, launch, pattern, illustration, social, etc.) instead of
// 24 versions of the same image. Only applied when count > 1; single-asset
// requests use the raw user prompt unchanged.
function augmentImagePrompt(assetType: AssetType, basePrompt: string, i: number, count: number): string {
  if (count <= 1) return basePrompt;
  const lower = basePrompt.toLowerCase();
  if (assetType === "graphic") {
    if (/(hero|launch|pattern|background|illustration|product showcase|social|banner|ad)/.test(lower)) return basePrompt;
    const categories = [
      "hero graphic for the website",
      "launch announcement graphic",
      "subtle abstract background pattern",
      "abstract illustration that conveys the product's value",
      "product showcase graphic featuring a UI mockup",
      "social-share graphic (1200x630) for Twitter/LinkedIn",
    ];
    const cat = categories[i % categories.length];
    return `${basePrompt}\n\nThis variant (${i + 1}/${count}) is specifically a ${cat}. Make it visually distinct from other variants while staying on-brand.`;
  }
  if (assetType === "icon") {
    const styles = [
      "outline (stroke) style icon",
      "filled (solid) style icon",
      "duotone icon using two brand colors",
      "rounded app-icon concept (rounded square background)",
    ];
    const style = styles[i % styles.length];
    return `${basePrompt}\n\nThis variant (${i + 1}/${count}) is a ${style}. Keep the icon family visually consistent across variants — same proportions, same stroke weight family, same level of detail — so they read as a single icon pack.`;
  }
  if (assetType === "photo") {
    if (i === 0) {
      return `${basePrompt}\n\nThis is variant 1 of ${count}: produce a "hero" reference photograph that defines the photography style guide for this brand — lock in the lighting (natural/studio/cinematic), composition (centered/rule-of-thirds/negative-space), color grading (warm/cool/desaturated/vibrant), and art direction. Subsequent variants will match this guide.`;
    }
    const subjects = [
      "product-in-use lifestyle shot",
      "founder/team portrait in workspace",
      "abstract texture or detail shot for backgrounds",
      "wide environmental hero shot",
      "candid customer/user moment",
      "close-up product detail",
    ];
    const subj = subjects[(i - 1) % subjects.length];
    return `${basePrompt}\n\nThis variant (${i + 1}/${count}) is a ${subj}. Match the lighting, composition, and color grading of the brand's photography style — consistent with a cohesive photo set.`;
  }
  return basePrompt;
}

async function classify(prompt: string): Promise<{ asset_type: AssetType; count: number }> {
  try {
    const out = await geminiText({ system: CLASSIFIER_SYSTEM, user: prompt, temperature: 0.1, json: true });
    const parsed = JSON.parse(out);
    const at = (parsed.asset_type || "other") as AssetType;
    if (!(at in GENERATORS)) return { asset_type: "other", count: 1 };
    // Parse any explicit count from the prompt — number-before-noun, number-after-noun,
    // or spelled-out words like "dozen", "a few", "couple". The classifier's own count
    // under-counts, so we ignore it.
    const fallback = GENERATORS[at].defaultCount || 1;
    const c = requestedCount(prompt, fallback);
    return { asset_type: at, count: c };
  } catch {
    return { asset_type: "other", count: 1 };
  }
}

async function scrapeUrl(url: string, supabaseUrl: string, anonKey: string, jwt: string): Promise<BrandContext> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/scrape-url`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return { url };
    const d = await res.json();
    if (d?.error) return { url };
    return {
      url,
      productName: d.productName,
      tagline: d.tagline,
      description: d.description,
      colors: d.colors,
      fonts: d.fonts,
      logo: d.logo,
      favicon: d.favicon,
      ogImage: d.ogImage,
      colorScheme: d.colorScheme,
      screenshot: d.screenshot,
    };
  } catch {
    return { url };
  }
}

Deno.serve(async (req) => {
  const ch = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: ch });
  try {
    if (!hasGeminiKey()) {
      return new Response(JSON.stringify({ error: "missing_environment_variable", variable: "GEMINI_API_KEY" }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
    }
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...ch, "Content-Type": "application/json" } });
    const jwt = auth.replace(/^Bearer\s+/i, "");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...ch, "Content-Type": "application/json" } });

    const body = await req.json();
    const prompt = (body.prompt || "").toString().trim();
    const project_id = body.project_id || null;
    const client_workspace_id = body.workspace_id || null;
    const explicitType = body.asset_type as AssetType | undefined;
    const providedCtx = body.brand_context as BrandContext | undefined;
    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...ch, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve workspace_id: prefer project's, then caller-provided, then the user's personal workspace.
    let workspace_id: string | null = null;
    if (project_id) {
      const { data: p } = await admin.from("projects").select("workspace_id").eq("id", project_id).maybeSingle();
      workspace_id = (p as any)?.workspace_id || null;
    }
    if (!workspace_id && client_workspace_id) workspace_id = client_workspace_id;
    if (!workspace_id) {
      const { data: ws } = await admin.from("workspaces").select("id").eq("owner_id", user.id).eq("is_personal", true).maybeSingle();
      workspace_id = (ws as any)?.id || null;
    }

    // Classify
    let cls = explicitType
      ? { asset_type: explicitType, count: Math.max(1, Math.min(24, body.count || GENERATORS[explicitType].defaultCount || 1)) }
      : await classify(prompt);
    const logotypeOnly = isLogotypeOnlyPrompt(prompt);
    if (logotypeOnly) {
      cls = {
        asset_type: "logo",
        count: Math.max(1, Math.min(24, body.count || requestedCount(prompt, GENERATORS.logo.defaultCount || 24))),
      };
    }

    // Refuse non-branding
    if (cls.asset_type === "other") {
      const refusalAsset = {
        user_id: user.id, workspace_id, project_id,
        asset_type: "other" as const,
        title: "Out of scope",
        content: REFUSAL_TEXT,
        prompt,
      };
      const { data: a } = await admin.from("assets").insert(refusalAsset).select().single();
      return new Response(JSON.stringify({ refused: true, message: REFUSAL_TEXT, asset_ids: a ? [a.id] : [] }), { headers: { ...ch, "Content-Type": "application/json" } });
    }

    // Detect URL & scrape
    const detectedUrl = extractUrl(prompt);
    let ctx: BrandContext = { url: detectedUrl || undefined };
    if (providedCtx && (providedCtx.url || providedCtx.productName || providedCtx.colors?.length)) {
      ctx = { ...providedCtx, url: providedCtx.url || detectedUrl || undefined };
    } else if (detectedUrl) {
      ctx = await scrapeUrl(detectedUrl, SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
    } else if (project_id) {
      // No URL in this prompt — reuse stored brand context from project (Brand Analysis Mode persistence)
      const { data: proj } = await admin.from("projects").select("brand_context,source_url").eq("id", project_id).maybeSingle();
      if (proj?.brand_context) ctx = { ...(proj.brand_context as BrandContext), url: (proj.brand_context as any).url || proj.source_url || undefined };
    }

    // Persist brand context to project if we scraped a real brand and the project has none yet
    if (project_id && (ctx.productName || ctx.colors?.length)) {
      const { data: proj } = await admin.from("projects").select("brand_context").eq("id", project_id).maybeSingle();
      if (!proj?.brand_context) {
        await admin.from("projects").update({ brand_context: ctx, source_url: ctx.url || null }).eq("id", project_id);
      }
    }

    // Credits check (text=1 each, image=10 each)
    const spec = GENERATORS[cls.asset_type];
    const count = cls.count;
    const costPer = spec.kind === "image" ? 10 : 1;
    const totalCost = costPer * count;
    const { data: usage } = await admin.from("user_usage").select("*").eq("user_id", user.id).maybeSingle();
    if (!usage) throw new Error("usage row missing");
    const remaining = (usage.monthly_limit + (usage.credits_extra || 0)) - usage.credits_used;
    if (remaining < totalCost) {
      return new Response(JSON.stringify({ error: "no_credits", code: "no_credits", needed: totalCost, remaining }), { status: 402, headers: { ...ch, "Content-Type": "application/json" } });
    }

    const title = cls.asset_type === "graphic" && /component|ui kit|buttons|cards|inputs/i.test(prompt) ? "Component" : ASSET_TITLES[cls.asset_type];
    const ids: string[] = [];

    // ─── Logotype-only fast path ──────────────────────────────────────────
    // If the user explicitly asks for a logotype / wordmark / text-based logo
    // (and NOT a pictorial mark/icon), skip Gemini image generation entirely
    // and return only editable text-based logotype variants. Free of charge.
    if (logotypeOnly) {
      try {
        const brandText = pickLogotypeText({
          prompt,
          productName: ctx.productName,
          url: ctx.url || detectedUrl,
        });
        if (!brandText) {
          return new Response(JSON.stringify({ error: "brand_name_required", message: "I need a brand name or URL to create a wordmark." }), { status: 400, headers: { ...ch, "Content-Type": "application/json" } });
        }
        const brandColor = ctx.colors?.[0];
        const variants = buildLogotypeVariants(brandText, count, brandColor, ctx.fonts || []);
        const rows = variants.map((state, i) => ({
          user_id: user.id,
          workspace_id,
          project_id,
          asset_type: "logo" as const,
          title: count > 1 ? `Logotype ${i + 1}` : "Logotype",
          prompt,
          source_url: detectedUrl,
          editor_state: state,
          meta: { brand_context: ctx, kind: "logotype", variant: i + 1, of: count },
        }));
        const { data: inserted } = await admin.from("assets").insert(rows).select("id");
        if (inserted) for (const row of inserted) ids.push(row.id);
      } catch (e) {
        console.error("logotype-only gen failed", e);
      }
      return new Response(JSON.stringify({ asset_ids: ids, asset_type: "logo", count: ids.length, credits_charged: 0 }), { headers: { ...ch, "Content-Type": "application/json" } });
    }
    // ──────────────────────────────────────────────────────────────────────

    // Fetch visual references from the scraped brand. Gemini only accepts raster
    // formats (jpg/png/webp), so SVG/ICO/AVIF get rasterized through wsrv.nl,
    // a free image proxy that converts arbitrary image URLs to PNG.
    async function fetchAsRef(u?: string | null): Promise<{ mimeType: string; data: string } | null> {
      if (!u) return null;
      const directThenProxy = async (url: string): Promise<Response | null> => {
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          const ct = (r.headers.get("content-type") || "").toLowerCase();
          // If it's a format Gemini can't consume directly (svg/ico/avif/heic),
          // re-fetch via wsrv.nl to rasterize to PNG.
          if (!ct || ct.includes("svg") || ct.includes("icon") || ct.includes("avif") || ct.includes("heic")) {
            const proxied = `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&output=png&w=1024&we`;
            const p = await fetch(proxied);
            return p.ok ? p : null;
          }
          return r;
        } catch { return null; }
      };
      try {
        const r = await directThenProxy(u);
        if (!r) return null;
        let ct = (r.headers.get("content-type") || "image/png").split(";")[0].toLowerCase();
        if (!/^image\/(png|jpeg|jpg|webp)$/.test(ct)) ct = "image/png";
        const buf = new Uint8Array(await r.arrayBuffer());
        if (buf.length === 0) return null;
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        return { mimeType: ct, data: btoa(bin) };
      } catch { return null; }
    }

    // Visual refs used for ALL image generation so the output evolves the existing brand.
    // For logos: always include the logo image first (rasterized if SVG) AND the
    // homepage screenshot so Gemini sees both the mark and its in-context palette.
    let logoRefs: { mimeType: string; data: string }[] | undefined;
    if (spec.kind === "image") {
      const candidates: (string | undefined)[] = [];
      if (cls.asset_type === "logo") {
        candidates.push(ctx.logo, ctx.screenshot, ctx.ogImage, ctx.favicon);
      } else {
        candidates.push(ctx.screenshot, ctx.ogImage, ctx.logo);
      }
      const refs: { mimeType: string; data: string }[] = [];
      for (const u of candidates) {
        if (refs.length >= 2) break;
        const ref = await fetchAsRef(u);
        if (ref) refs.push(ref);
      }
      if (refs.length) {
        logoRefs = refs;
        console.log(`[refs] attached ${refs.length} brand ref image(s) for ${cls.asset_type} (logo=${!!ctx.logo} screenshot=${!!ctx.screenshot} favicon=${!!ctx.favicon})`);
      } else {
        console.warn(`[refs] NO brand refs resolved for ${cls.asset_type} — ctx urls: logo=${ctx.logo} screenshot=${ctx.screenshot} favicon=${ctx.favicon} ogImage=${ctx.ogImage}`);
      }
    }

    if (spec.kind === "image") {
      // Generate N image variants in parallel
      const createImageVariant = async (i: number) => {
        let imgPrompt: string;
        if (cls.asset_type === "logo" && logoRefs) {
          // Skip the text-prompt rewrite step entirely. Feed a stable variation instruction + reference image directly.
          const variantHint = ["alternate angle", "monochrome (single brand color on white)", "simplified minimal version", "refined geometry, more polished", "badge / circle enclosure"][i % 5];
          imgPrompt = `Create a logo VARIATION of the brand shown in the attached reference image${ctx.productName ? ` ("${ctx.productName}")` : ""}.\n\nHARD RULES:\n- KEEP the same core motif/symbol from the reference (do not invent a new unrelated concept).\n- KEEP the same silhouette family, proportions, and overall style.\n- KEEP the exact brand colors${ctx.colors?.length ? `: ${ctx.colors.slice(0,3).join(", ")}` : " from the reference"}. No new colors.\n- This variant: ${variantHint}.\n- Solid white background, flat vector, app-icon ready, no text, no typography, no letters.\n- The result must look like it belongs to the SAME brand as the reference.`;
        } else if (logoRefs) {
          // Non-logo image with brand visual references attached — instruct Gemini to evolve, not invent.
          const variantPrompt = augmentImagePrompt(cls.asset_type, prompt, i, count);
          const base = await geminiText({ system: spec.system, user: spec.build(ctx, variantPrompt), temperature: 0.9 });
          imgPrompt = `${base}\n\nVISUAL BRAND CONSTRAINTS (reference images are attached):\n- Match the visual language, color palette, and typographic feel of the attached reference(s).\n- This is for the EXISTING brand${ctx.productName ? ` "${ctx.productName}"` : ""}${ctx.colors?.length ? ` — use ONLY these brand colors: ${ctx.colors.slice(0,4).join(", ")}` : ""}.\n- Do not invent a new visual identity. Evolve the one shown.`;
        } else {
          const variantPrompt = augmentImagePrompt(cls.asset_type, prompt, i, count);
          imgPrompt = await geminiText({ system: spec.system, user: spec.build(ctx, variantPrompt), temperature: 0.9 });
        }
        const png = await geminiImage(imgPrompt, logoRefs);
        const path = `${user.id}/${Date.now()}-${i}.png`;
        const { error: upErr } = await admin.storage.from("rocket-images").upload(path, png, { contentType: "image/png", upsert: false });
        if (upErr) throw new Error(`storage: ${upErr.message}`);
        const { data: pub } = admin.storage.from("rocket-images").getPublicUrl(path);
        const { data: asset } = await admin.from("assets").insert({
          user_id: user.id, workspace_id, project_id,
          asset_type: cls.asset_type,
          title: count > 1 ? `${title} ${i + 1}` : title,
          image_url: pub.publicUrl,
          thumbnail_url: pub.publicUrl,
          prompt,
          source_url: detectedUrl,
          meta: { brand_context: ctx, image_prompt: imgPrompt, variant: i + 1, of: count, used_logo_ref: !!logoRefs },
        }).select().single();
        return asset?.id;
      };
      // Per-variant failures must NOT abort the whole batch — users asked for many
      // variants and one Gemini hiccup shouldn't throw away the rest. We also retry
      // each failed slot up to 2 extra times so a flaky provider doesn't silently
      // halve the user's results.
      let lastUnavailable: GeminiUnavailableError | null = null;
      const safeVariant = async (i: number) => {
        const MAX_ATTEMPTS = 5;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try { return await createImageVariant(i); }
          catch (e) {
            if (e instanceof GeminiUnavailableError) lastUnavailable = e;
            console.error(`variant ${i} attempt ${attempt} failed: ${(e as Error).message}`);
            if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 800 * attempt));
          }
        }
        return undefined;
      };
      // Lower concurrency (2) — Gemini image rate-limits aggressively above this,
      // which is why users were getting ~6/10 instead of the full count.
      const results = await mapLimit(count, 2, safeVariant);
      for (const id of results) if (id) ids.push(id);
      // If literally every variant failed AND it was a provider outage, surface that.
      if (ids.length === 0 && lastUnavailable) {
        return new Response(JSON.stringify({ error: "ai_provider_unavailable", message: "Rocket is busy right now. Please try again in a moment." }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
      }

      // When generating logos, also generate matching logotype (text wordmark) variants.
      // These are free (no Gemini call) and editable in the client.
      if (cls.asset_type === "logo") {
        try {
          const brandText = pickLogotypeText({ prompt, productName: ctx.productName, url: ctx.url || detectedUrl });
          if (!brandText) throw new Error("brand name missing for logotype add-on");
          const brandColor = ctx.colors?.[0];
          const variants = buildLogotypeVariants(brandText, count, brandColor, ctx.fonts || []);
          const logotypeRows = variants.map((state, i) => ({
            user_id: user.id,
            workspace_id,
            project_id,
            asset_type: "logo" as const,
            title: count > 1 ? `Logotype ${i + 1}` : "Logotype",
            prompt,
            source_url: detectedUrl,
            editor_state: state,
            meta: { brand_context: ctx, kind: "logotype", variant: i + 1, of: count },
          }));
          const { data: inserted } = await admin.from("assets").insert(logotypeRows).select("id");
          if (inserted) for (const row of inserted) ids.push(row.id);
        } catch (e) {
          console.error("logotype gen failed", e);
        }
      }
    } else {
      const results = await mapLimit(count, 6, async (i) => {
        const variantPrompt = count > 1 ? `${prompt}\n\nCreate variation ${i + 1} of ${count}. Make it meaningfully distinct in structure, angle, naming, and recommendations while staying on-brand.` : prompt;
        const content = await geminiText({ system: spec.system, user: spec.build(ctx, variantPrompt), temperature: 0.7, json: !!spec.json });
        const { data: asset } = await admin.from("assets").insert({
          user_id: user.id, workspace_id, project_id,
          asset_type: cls.asset_type,
          title: count > 1 ? `${title} ${i + 1}` : title,
          content,
          prompt,
          source_url: detectedUrl,
          meta: { brand_context: ctx, variant: i + 1, of: count },
        }).select().single();
        return asset?.id;
      });
      for (const id of results) if (id) ids.push(id);
    }

    // Charge credits — only for what actually generated (excludes free logotypes
    // and any variants that failed mid-batch).
    const billableCount = spec.kind === "image"
      ? ids.filter((_id, idx) => idx < count).length // only the image variants, not logotypes appended after
      : ids.length;
    const actualCost = costPer * billableCount;
    if (actualCost > 0) {
      await admin.from("user_usage").update({ credits_used: usage.credits_used + actualCost }).eq("user_id", user.id);
      await admin.from("credit_transactions").insert({
        user_id: user.id, asset_type: cls.asset_type,
        kind: "spent", credits: actualCost, meta: { count: billableCount, requested: count, asset_ids: ids },
      });
    }

    return new Response(JSON.stringify({ asset_ids: ids, asset_type: cls.asset_type, count: ids.length, credits_charged: actualCost }), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiUnavailableError) {
      return new Response(JSON.stringify({ error: "ai_provider_unavailable", message: "Rocket is busy right now. Please try again in a moment.", details: e.bodyText.slice(0, 300) }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
  }
});
