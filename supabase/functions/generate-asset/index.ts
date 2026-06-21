// redeploy: 2026-06-12
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { cors, geminiText, geminiImage, GeminiUnavailableError, hasGeminiKey } from "../_shared/gemini.ts";
import { GENERATORS, ASSET_TITLES, CLASSIFIER_SYSTEM, REFUSAL_TEXT, type AssetType, type BrandContext } from "../_shared/generators.ts";

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

async function classify(prompt: string): Promise<{ asset_type: AssetType; count: number }> {
  try {
    const out = await geminiText({ system: CLASSIFIER_SYSTEM, user: prompt, temperature: 0.1, json: true });
    const parsed = JSON.parse(out);
    const at = (parsed.asset_type || "other") as AssetType;
    if (!(at in GENERATORS)) return { asset_type: "other", count: 1 };
    const explicitCount = prompt.match(/\b(\d{1,2})\b\s*(?:options?|variations?|variants?|concepts?|logos?|icons?|photos?|graphics?|templates?|guidelines?|colors?|fonts?|voices?|components?)/i)?.[1];
    // Ignore the classifier's count — it under-counts. Always use defaultCount unless the user explicitly named a number.
    const fallback = GENERATORS[at].defaultCount || 1;
    const c = explicitCount
      ? Math.max(1, Math.min(24, parseInt(explicitCount)))
      : fallback;
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
    const explicitType = body.asset_type as AssetType | undefined;
    const providedCtx = body.brand_context as BrandContext | undefined;
    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...ch, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Classify
    const cls = explicitType
      ? { asset_type: explicitType, count: Math.max(1, Math.min(24, body.count || GENERATORS[explicitType].defaultCount || 1)) }
      : await classify(prompt);

    // Refuse non-branding
    if (cls.asset_type === "other") {
      const refusalAsset = {
        user_id: user.id, project_id,
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

    // Fetch visual references from the scraped brand (raster only — Gemini ignores SVG).
    async function fetchAsRef(u?: string | null): Promise<{ mimeType: string; data: string } | null> {
      if (!u) return null;
      try {
        const r = await fetch(u);
        if (!r.ok) return null;
        const ct = (r.headers.get("content-type") || "image/png").split(";")[0];
        if (ct.includes("svg")) return null;
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        return { mimeType: ct, data: btoa(bin) };
      } catch { return null; }
    }

    // Visual refs used for ALL image generation so the output evolves the existing brand.
    let logoRefs: { mimeType: string; data: string }[] | undefined;
    if (spec.kind === "image") {
      const candidates: (string | undefined)[] = [];
      if (cls.asset_type === "logo") {
        candidates.push(ctx.logo, ctx.favicon, ctx.ogImage, ctx.screenshot);
      } else {
        // Graphics/icons/photos: anchor to homepage screenshot + logo for visual language.
        candidates.push(ctx.screenshot, ctx.ogImage, ctx.logo);
      }
      const refs: { mimeType: string; data: string }[] = [];
      for (const u of candidates) {
        if (refs.length >= 2) break;
        const ref = await fetchAsRef(u);
        if (ref) refs.push(ref);
      }
      if (refs.length) logoRefs = refs;
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
          const base = await geminiText({ system: spec.system, user: spec.build(ctx, prompt), temperature: 0.9 });
          imgPrompt = `${base}\n\nVISUAL BRAND CONSTRAINTS (reference images are attached):\n- Match the visual language, color palette, and typographic feel of the attached reference(s).\n- This is for the EXISTING brand${ctx.productName ? ` "${ctx.productName}"` : ""}${ctx.colors?.length ? ` — use ONLY these brand colors: ${ctx.colors.slice(0,4).join(", ")}` : ""}.\n- Do not invent a new visual identity. Evolve the one shown.`;
        } else {
          imgPrompt = await geminiText({ system: spec.system, user: spec.build(ctx, prompt), temperature: 0.9 });
        }
        const png = await geminiImage(imgPrompt, logoRefs);
        const path = `${user.id}/${Date.now()}-${i}.png`;
        const { error: upErr } = await admin.storage.from("rocket-images").upload(path, png, { contentType: "image/png", upsert: false });
        if (upErr) throw new Error(`storage: ${upErr.message}`);
        const { data: pub } = admin.storage.from("rocket-images").getPublicUrl(path);
        const { data: asset } = await admin.from("assets").insert({
          user_id: user.id, project_id,
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
      try {
        const results = await mapLimit(count, 4, createImageVariant);
        for (const id of results) if (id) ids.push(id);
      } catch (e) {
        if (e instanceof GeminiUnavailableError) {
          return new Response(JSON.stringify({ error: "ai_provider_unavailable", message: "Rocket is busy right now. Please try again in a moment." }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
        }
        throw e;
      }
    } else {
      const results = await mapLimit(count, 6, async (i) => {
        const variantPrompt = count > 1 ? `${prompt}\n\nCreate variation ${i + 1} of ${count}. Make it meaningfully distinct in structure, angle, naming, and recommendations while staying on-brand.` : prompt;
        const content = await geminiText({ system: spec.system, user: spec.build(ctx, variantPrompt), temperature: 0.7 });
        const { data: asset } = await admin.from("assets").insert({
          user_id: user.id, project_id,
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

    // Charge credits
    await admin.from("user_usage").update({ credits_used: usage.credits_used + totalCost }).eq("user_id", user.id);
    await admin.from("credit_transactions").insert({
      user_id: user.id, asset_type: cls.asset_type,
      kind: "spent", credits: totalCost, meta: { count, asset_ids: ids },
    });

    return new Response(JSON.stringify({ asset_ids: ids, asset_type: cls.asset_type, count: ids.length, credits_charged: totalCost }), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiUnavailableError) {
      return new Response(JSON.stringify({ error: "ai_provider_unavailable", message: "Rocket is busy right now. Please try again in a moment.", details: e.bodyText.slice(0, 300) }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
  }
});
