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
async function geminiText(opts: { system: string; user: string; temperature?: number }): Promise<string> {
  const key = requireGeminiKey();
  const res = await fetch(
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
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "").trim();
}

async function geminiImage(prompt: string): Promise<Uint8Array> {
  const key = requireGeminiKey();
  const res = await fetch(
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
  if (!res.ok) throw new Error(`Gemini image ${res.status}: ${await res.text()}`);
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
    requireGeminiKey();
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
    if (remaining < 1) {
      return new Response(JSON.stringify({ error: "Out of credits", code: "no_credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: asset } = await admin.from("rocket_assets").select("*, rockets!inner(*)").eq("id", asset_id).maybeSingle();
    if (!asset) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (asset.rockets.user_id !== user.id) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
        await admin.from("user_usage").update({ credits_used: usage.credits_used + 1 }).eq("user_id", user.id);
        return new Response(JSON.stringify({ image_url: pub.publicUrl, image_prompt: finalPrompt }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: "image_generation_failed", details: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ===== Text asset regeneration (existing path) =====
    const sys = "You are Rocket, an AI launch co-pilot. Rewrite the requested launch asset. Be specific, confident, ready-to-paste. Output ONLY the new content, no preamble.";
    const usr = `Product: ${asset.rockets.product_name || asset.rockets.product_url}\nURL: ${asset.rockets.product_url}\nAsset: ${asset.title}\nCurrent content:\n"""${asset.content}"""\n\n${instruction ? `User instruction: ${instruction}` : "Generate a fresh, improved alternative."}`;

    const newContent = await geminiText({ system: sys, user: usr, temperature: 0.8 });

    await admin.from("rocket_assets").update({ content: newContent }).eq("id", asset_id);
    await admin.from("user_usage").update({ credits_used: usage.credits_used + 1 }).eq("user_id", user.id);

    return new Response(JSON.stringify({ content: newContent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});// redeploy
