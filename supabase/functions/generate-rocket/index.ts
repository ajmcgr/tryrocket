import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendBranded } from "../_shared/email-template.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";

const ASSET_PLAN: Array<{ asset_type: string; title: string }> = [
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
  { asset_type: "launch_submission", title: "Launch Submission" },
  { asset_type: "launch_product_hunt", title: "Product Hunt Copy" },
  { asset_type: "launch_directory", title: "Directory Submission" },
  { asset_type: "social_x_post", title: "X Post" },
  { asset_type: "social_x_thread", title: "X Thread" },
  { asset_type: "social_linkedin", title: "LinkedIn Post" },
  { asset_type: "social_reddit", title: "Reddit Post" },
  { asset_type: "social_newsletter", title: "Newsletter Announcement" },
  { asset_type: "strategy_readiness", title: "Launch Readiness Score" },
  { asset_type: "strategy_channels", title: "Recommended Channels" },
  { asset_type: "strategy_communities", title: "Recommended Communities" },
  { asset_type: "strategy_content", title: "Content Ideas" },
  { asset_type: "checklist_pre", title: "Pre-Launch Checklist" },
  { asset_type: "checklist_day", title: "Launch Day Checklist" },
  { asset_type: "checklist_post", title: "Post-Launch Checklist" },
];

async function fetchSite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 RocketBot/1.0" },
      redirect: "follow",
    });
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 12000);
  } catch (e) {
    console.error("fetch failed", e);
    return "";
  }
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<any> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { product_url } = await req.json();
    if (!product_url || typeof product_url !== "string") {
      return new Response(JSON.stringify({ error: "product_url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check credits
    const { data: usage } = await admin.from("user_usage").select("*").eq("user_id", user.id).maybeSingle();
    if (!usage) throw new Error("usage row missing");
    const remaining = (usage.monthly_limit + (usage.credits_extra || 0)) - usage.credits_used;
    if (remaining < 1) {
      return new Response(JSON.stringify({ error: "Out of credits", code: "no_credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch site
    const siteText = await fetchSite(product_url);

    // Generate
    const system = `You are Rocket, an AI launch co-pilot for vibe coders. Given a product URL and its scraped text, you generate a complete launch kit. Always respond as a single JSON object with the requested keys. Keep each value tight, concrete, and ready-to-paste. No markdown headings; plain text or short bullet lists where appropriate (use "- " for bullets).`;

    const keys = ASSET_PLAN.map((a) => a.asset_type).join(", ");
    const user_prompt = `Product URL: ${product_url}\n\nScraped page content:\n"""${siteText || "(no content fetched — infer from URL)"}"""\n\nReturn a JSON object with EXACTLY these keys, each a string: product_name, ${keys}. Tones: confident, founder-led, specific. For social posts, write the actual post copy. For checklists and use cases, use "- " bullets. For Launch Readiness Score, give a number 0-100 with 1-2 sentence rationale.`;

    const parsed = await callOpenAI(system, user_prompt);
    const product_name = parsed.product_name || new URL(product_url).hostname.replace("www.", "");

    // Create rocket
    const { data: rocket, error: rErr } = await admin
      .from("rockets")
      .insert({ user_id: user.id, product_url, product_name, status: "ready" })
      .select()
      .single();
    if (rErr) throw rErr;

    const assets = ASSET_PLAN.map((a) => ({
      rocket_id: rocket.id,
      asset_type: a.asset_type,
      title: a.title,
      content: String(parsed[a.asset_type] ?? "").trim(),
    }));
    const { error: aErr } = await admin.from("rocket_assets").insert(assets);
    if (aErr) throw aErr;

    // Decrement credits
    await admin
      .from("user_usage")
      .update({ credits_used: usage.credits_used + 1 })
      .eq("user_id", user.id);

    // Auto-fire "rocket_generated" email
    if (RESEND_API_KEY && user.email) {
      sendBranded(RESEND_API_KEY, FROM_EMAIL, user.email, "rocket_generated", {
        product_name,
        rocket_id: rocket.id,
      }).catch((e) => console.error("email send failed", e));
    }

    return new Response(JSON.stringify({ rocket_id: rocket.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});