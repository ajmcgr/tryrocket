// redeploy: 2026-06-12-v6
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { renderEmail } from "../_shared/email-layout.ts";

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

type Template = "welcome"|"rocket_generated"|"trial_started"|"payment_succeeded"|"credits_purchased"|"auth_signup"|"auth_magiclink"|"auth_recovery"|"auth_invite"|"auth_email_change"|"auth_reauth";
function buildEmail(template: Template, data: any): { subject: string; html: string } {
  switch (template) {
    case "welcome": return { subject: "Welcome to Rocket 🚀", html: renderEmail({ preheader: "Make your product a brand.", title: `Welcome to Rocket${data?.name ? `, ${data.name}` : ""}.`, bodyHtml: `<p>You're in. Rocket helps you brand your app with AI — drop in a product URL and we'll generate your full launch kit in under 60 seconds.</p><p>You start with <strong>500 free credits</strong>. No card required.</p>`, ctaLabel: "Generate your first Brand", ctaUrl: "https://tryrocket.ai/create" }) };
    case "rocket_generated": return { subject: `Your Brand for ${data?.product_name ?? "your product"} is ready`, html: renderEmail({ preheader: "Your launch kit is ready to review.", title: `Your Brand for ${data?.product_name ?? "your product"} is ready.`, bodyHtml: `<p>We've generated your complete launch kit — positioning, taglines, social copy, founder bio, Product Hunt assets, directory submissions, and a full launch checklist.</p><p>Review it, tweak anything you want, and ship.</p>`, ctaLabel: "Open your Brand", ctaUrl: `https://tryrocket.ai/rocket/${data?.rocket_id ?? ""}` }) };
    case "trial_started": return { subject: "Your Rocket Growth trial has started", html: renderEmail({ preheader: "7 days of Growth — on the house.", title: "Your 7-day Growth trial is live.", bodyHtml: `<p>You now have <strong>3,000 credits/month</strong>, priority generation, and exports unlocked.</p><p>If you cancel before day 7, you won't be charged.</p>`, ctaLabel: "Go to projects", ctaUrl: "https://tryrocket.ai/projects" }) };
    case "payment_succeeded": return { subject: "Payment received", html: renderEmail({ preheader: `Receipt for $${((data?.amount ?? 0) / 100).toFixed(2)}.`, title: "Payment received — thank you.", bodyHtml: `<p>We received your payment of <strong>$${((data?.amount ?? 0) / 100).toFixed(2)} ${(data?.currency ?? "usd").toUpperCase()}</strong>.</p><p>You can manage your subscription anytime from Settings.</p>`, ctaLabel: "Manage billing", ctaUrl: "https://tryrocket.ai/settings" }) };
    case "credits_purchased": return { subject: `${data?.credits ?? 0} Rocket Credits added`, html: renderEmail({ preheader: "Your credits are live.", title: `${data?.credits ?? 0} credits added to your account.`, bodyHtml: `<p>Your credit pack is on your account and ready to use.</p>`, ctaLabel: "Generate a Brand", ctaUrl: "https://tryrocket.ai/create" }) };
    case "auth_signup": return { subject: "Confirm your Rocket account", html: renderEmail({ preheader: "One click to verify your email.", title: "Confirm your email to launch Rocket.", bodyHtml: `<p>Welcome to Rocket — make your product a brand. Tap the button below to confirm your email and start generating brands.</p>`, ctaLabel: "Confirm email", ctaUrl: data?.confirmation_url }) };
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


const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = (Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>").replace(/^["']+|["']+$/g, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { template, data } = await req.json() as { template: Template; data?: any };
    const result = await sendBranded(RESEND_API_KEY, FROM_EMAIL, user.email, template, data || {});
    if (!result.ok) throw new Error(result.error);
    return new Response(JSON.stringify({ ok: true, id: result.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
