// Lightweight per-field AI rewrite.
// Used by StructuredEditor inline "regenerate" buttons and by Presenter's
// per-slide regen. Charges 1 credit per call. Returns { text } or the
// caller can pass { json: true } to get JSON back.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { cors, geminiText, GeminiUnavailableError, hasGeminiKey } from "../_shared/gemini.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const ch = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: ch });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...ch, "Content-Type": "application/json" } });

  try {
    if (!hasGeminiKey()) return json({ error: "missing_environment_variable", variable: "GEMINI_API_KEY" });
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const {
      field_label = "field",
      current = "",
      instruction = "Rewrite this to be sharper and more distinctive.",
      brand_context = {},
      asset_type = "",
      as_json = false,
      max_chars = 1200,
    } = body || {};

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: usage } = await admin.from("user_usage").select("*").eq("user_id", user.id).maybeSingle();
    if (!usage) return json({ error: "usage row missing" }, 500);
    const cost = 1;
    const remaining = (usage.monthly_limit + (usage.credits_extra || 0)) - usage.credits_used;
    if (remaining < cost) return json({ error: "no_credits", code: "no_credits", needed: cost, remaining });

    const ctx = brand_context || {};
    const ctxSummary = [
      ctx.productName && `Product: ${ctx.productName}`,
      ctx.positioning && `Positioning: ${ctx.positioning}`,
      ctx.targetCustomer && `Audience: ${ctx.targetCustomer}`,
      ctx.voice?.tone && `Voice: ${ctx.voice.tone}`,
      ctx.voice?.doNotSay?.length && `Avoid: ${ctx.voice.doNotSay.slice(0, 6).join(", ")}`,
      ctx.competitors?.length && `Competitors to avoid sounding like: ${ctx.competitors.slice(0, 4).join(", ")}`,
    ].filter(Boolean).join("\n");

    const system = as_json
      ? "You are Rocket, a senior brand copywriter. Rewrite one JSON structure. Return STRICT JSON ONLY (no fences, no preamble)."
      : "You are Rocket, a senior brand copywriter. Rewrite ONE field. Return ONLY the rewritten text — no quotes, no prefix, no explanation.";

    const userPrompt = [
      `Asset type: ${asset_type || "generic"}`,
      `Field: ${field_label}`,
      ctxSummary && `\nBrand context:\n${ctxSummary}`,
      `\nCurrent value:\n${typeof current === "string" ? current : JSON.stringify(current)}`,
      `\nInstruction: ${instruction}`,
      `\nHard cap: ${max_chars} chars.`,
    ].filter(Boolean).join("\n");

    try {
      const raw = await geminiText({ system, user: userPrompt, temperature: 0.85, json: as_json });
      await admin.from("user_usage").update({ credits_used: usage.credits_used + cost }).eq("user_id", user.id);
      let value: unknown = raw;
      if (as_json) { try { value = JSON.parse(raw); } catch { /* keep raw */ } }
      else if (typeof value === "string") {
        value = String(value).trim().replace(/^["']|["']$/g, "");
        if (max_chars && String(value).length > max_chars) value = String(value).slice(0, max_chars);
      }
      return json({ value, credits_charged: cost });
    } catch (e) {
      if (e instanceof GeminiUnavailableError) {
        return json({ error: "ai_provider_unavailable", message: "Rocket is busy right now. Please try again in a moment." });
      }
      throw e;
    }
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
  }
});