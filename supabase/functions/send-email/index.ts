import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Template = "welcome" | "rocket_generated" | "trial_started" | "payment_succeeded" | "credits_purchased";

const TEMPLATES: Record<Template, (data: any) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: "Welcome to Rocket 🚀",
    html: `<p>Hey${d.name ? " " + d.name : ""},</p><p>Welcome to Rocket — your AI launch co-pilot. Drop in a product URL and we'll generate your full launch kit in seconds.</p><p><a href="https://tryrocket.ai/generate">Generate your first Rocket →</a></p>`,
  }),
  rocket_generated: (d) => ({
    subject: `Your Rocket for ${d.product_name} is ready`,
    html: `<p>Your launch kit is ready.</p><p><a href="https://tryrocket.ai/rocket/${d.rocket_id}">Open Rocket →</a></p>`,
  }),
  trial_started: () => ({
    subject: "Your Rocket Growth trial has started",
    html: `<p>You've started a 7-day free trial on Rocket Growth. 3,000 credits/month unlocked.</p>`,
  }),
  payment_succeeded: (d) => ({
    subject: "Payment successful",
    html: `<p>Thanks — we received your payment of $${(d.amount / 100).toFixed(2)}.</p>`,
  }),
  credits_purchased: (d) => ({
    subject: `${d.credits} Rocket Credits added`,
    html: `<p>${d.credits} credits are now on your account.</p>`,
  }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { template, data } = await req.json() as { template: Template; data?: any };
    const t = TEMPLATES[template];
    if (!t) return new Response(JSON.stringify({ error: "invalid_template" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { subject, html } = t(data || {});

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [user.email], subject, html }),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(result));
    return new Response(JSON.stringify({ ok: true, id: result.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});