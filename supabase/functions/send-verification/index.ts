import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = ["https://tryrocket.ai", "http://localhost:5173", "http://localhost:3000"];
function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = (Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>").replace(/^["']+|["']+$/g, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://tryrocket.ai";

const BRAND = { blue: "#3B82F6", ink: "#0A0A0A", text: "#1F2937", muted: "#6B7280", border: "#E5E7EB", bg: "#F9FAFB" };

function verifyEmailHtml(confirmationUrl: string): { subject: string; html: string } {
  const cta = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;"><tr><td><a href="${confirmationUrl}" style="display:inline-block;background:${BRAND.blue};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:9999px;font-family:Inter,Arial,sans-serif;">Confirm email</a></td></tr></table>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Confirm your Rocket account</title></head><body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Arial,sans-serif;color:${BRAND.text};"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">One click to verify your email.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:32px 12px;"><tr><td align="center"><table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#fff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;"><tr><td style="background:${BRAND.blue};padding:24px 32px;color:#fff;font-size:18px;font-weight:700;">Rocket</td></tr><tr><td style="padding:36px 32px 32px;"><h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:${BRAND.ink};">Confirm your email to launch Rocket.</h1><div style="font-size:15px;line-height:1.65;"><p>Welcome to Rocket — your AI launch co-pilot. Tap below to confirm your email and start generating brands.</p></div>${cta}</td></tr><tr><td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};background:#FAFAFA;font-size:12px;color:${BRAND.muted};">Sent by <a href="https://tryrocket.ai" style="color:${BRAND.blue};text-decoration:none;">Rocket</a> — AI launch co-pilot.</td></tr></table></td></tr></table></body></html>`;
  return { subject: "Confirm your Rocket account", html };
}

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (userErr || !user?.email) return json({ error: "Unauthorized" }, 401);

    if ((user.app_metadata as Record<string, unknown>)?.email_verified === true) {
      return json({ ok: true, already_verified: true });
    }

    // Throttle: max 3 outstanding tokens in the last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("email_verification_tokens")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", hourAgo);
    if ((count ?? 0) >= 3) return json({ ok: true, throttled: true });

    const raw = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
    const token_hash = await sha256(token);
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await admin.from("email_verification_tokens").insert({ user_id: user.id, token_hash, expires_at });

    const url = `${APP_URL}/verify-email?token=${token}`;
    const { subject, html } = verifyEmailHtml(url);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [user.email], subject, html }),
    });
    if (!res.ok) {
      console.error("resend error", await res.text());
      return json({ error: "Failed to send email" }, 500);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("send-verification", e);
    return json({ error: (e as Error).message }, 500);
  }
});