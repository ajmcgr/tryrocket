import { createClient } from "npm:@supabase/supabase-js@2.45.0";

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

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image-preview";
function requireGeminiKey() {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  return GEMINI_API_KEY;
}

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
const GEMINI_BACKOFF_MS = [1000, 3000, 7000];
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
async function geminiText(opts: { system: string; user: string; temperature?: number }): Promise<string> {
  const key = requireGeminiKey();
  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.user }] }],
        generationConfig: { temperature: opts.temperature ?? 0.7 },
      }),
    },
  );
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "").trim();
}

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

Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({
        error: "missing_environment_variable",
        variable: "GEMINI_API_KEY",
        step: "environment_check",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { asset_id, instruction, variation } = await req.json();
    if (!asset_id) return new Response(JSON.stringify({ error: "asset_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: usage } = await admin.from("user_usage").select("*").eq("user_id", user.id).maybeSingle();
    if (!usage) throw new Error("usage row missing");
    const remaining = (usage.monthly_limit + (usage.credits_extra || 0)) - usage.credits_used;

    const { data: asset } = await admin.from("rocket_assets").select("*, rockets!inner(*)").eq("id", asset_id).maybeSingle();
    if (!asset) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (asset.rockets.user_id !== user.id) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // DB-driven cost lookup
    const { data: costRow } = await admin.from("credit_costs").select("credits").eq("asset_type", asset.asset_type).maybeSingle();
    const fallbackKey = asset.kind === "image" ? (variation ? "logo_variation" : "image_regeneration") : asset.asset_type;
    const { data: fbRow } = costRow ? { data: costRow } : await admin.from("credit_costs").select("credits").eq("asset_type", fallbackKey).maybeSingle();
    const cost = (costRow?.credits ?? fbRow?.credits ?? (asset.kind === "image" ? 10 : 1)) as number;
    if (remaining < cost) {
      return new Response(JSON.stringify({ error: "Out of credits", code: "no_credits", needed: cost, remaining }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== Image asset regeneration =====
    if (asset.kind === "image") {
      const basePrompt = (instruction && String(instruction).trim()) || asset.image_prompt || "";
      if (!basePrompt) {
        return new Response(JSON.stringify({ error: "no_prompt", details: "This image has no prompt — provide an instruction." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const finalPrompt = variation
        ? `${basePrompt} — alternative variation: different composition, same style and palette.`
        : basePrompt;
      try {
        const png = await geminiImage(finalPrompt);
        const path = `${user.id}/${asset.rocket_id}/${asset.asset_type}-${Date.now()}.png`;
        const { error: upErr } = await admin.storage.from("rocket-images").upload(path, png, { contentType: "image/png", upsert: false });
        if (upErr) throw new Error(`storage upload: ${upErr.message}`);
        const { data: pub } = admin.storage.from("rocket-images").getPublicUrl(path);
        await admin.from("rocket_assets").update({ image_url: pub.publicUrl, image_prompt: finalPrompt }).eq("id", asset_id);
        await admin.from("user_usage").update({ credits_used: usage.credits_used + cost }).eq("user_id", user.id);
        await admin.from("credit_transactions").insert({
          user_id: user.id, rocket_id: asset.rocket_id, asset_type: asset.asset_type,
          kind: "spent", credits: cost, meta: { regenerate: true, variation: !!variation },
        });
        return new Response(JSON.stringify({ image_url: pub.publicUrl, image_prompt: finalPrompt, credits_charged: cost }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        if (e instanceof GeminiUnavailableError) {
          return new Response(JSON.stringify({
            error: "ai_provider_unavailable",
            provider: "gemini",
            message: "Rocket is busy right now. Please try again in a moment.",
            details: `Gemini returned ${e.status} ${e.bodyText}`.slice(0, 500),
            step: "ai_generation",
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: "image_generation_failed", details: (e as Error).message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ===== Text asset regeneration (existing path) =====
    const sys = "You are Rocket, an AI launch co-pilot. Rewrite the requested launch asset. Be specific, confident, ready-to-paste. Output ONLY the new content, no preamble.";
    const usr = `Product: ${asset.rockets.product_name || asset.rockets.product_url}\nURL: ${asset.rockets.product_url}\nAsset: ${asset.title}\nCurrent content:\n"""${asset.content}"""\n\n${instruction ? `User instruction: ${instruction}` : "Generate a fresh, improved alternative."}`;

    const newContent = await geminiText({ system: sys, user: usr, temperature: 0.8 });

    await admin.from("rocket_assets").update({ content: newContent }).eq("id", asset_id);
    await admin.from("user_usage").update({ credits_used: usage.credits_used + cost }).eq("user_id", user.id);
    await admin.from("credit_transactions").insert({
      user_id: user.id, rocket_id: asset.rocket_id, asset_type: asset.asset_type,
      kind: "spent", credits: cost, meta: { regenerate: true },
    });

    return new Response(JSON.stringify({ content: newContent, credits_charged: cost }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiUnavailableError) {
      return new Response(JSON.stringify({
        error: "ai_provider_unavailable",
        provider: "gemini",
        message: "Rocket is busy right now. Please try again in a moment.",
        details: `Gemini returned ${e.status} ${e.bodyText}`.slice(0, 500),
        step: "ai_generation",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});// redeploy
