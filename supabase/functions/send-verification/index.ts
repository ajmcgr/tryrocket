// redeploy: 2026-06-12-v3 (deploy batch unblocked)
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { renderEmail } from "../_shared/email-layout.ts";

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

function verifyEmailHtml(confirmationUrl: string): { subject: string; html: string } {
  const html = renderEmail({
    preheader: "One click to verify your email.",
    title: "Welcome to Rocket! 🚀",
    bodyHtml: `<p>Thanks for signing up. Please confirm your email address to get started discovering and launching amazing products.</p>`,
    ctaLabel: "Confirm Email",
    ctaUrl: confirmationUrl,
  });
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
    // Parse body once. Support two actions on this endpoint because the
    // separate verify-email/confirm-email function won't deploy on this
    // project — we route both through here.
    let body: { action?: string; token?: string } = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // === Verify branch (no logged-in user required) ===
    if (body.action === "verify" && body.token) {
      const token_hash = await sha256(body.token);
      const { data: row, error: selErr } = await admin
        .from("email_verification_tokens")
        .select("id, user_id, expires_at, used_at")
        .eq("token_hash", token_hash)
        .maybeSingle();
      if (selErr) return json({ error: selErr.message }, 500);
      if (!row) return json({ error: "Invalid or expired link" }, 400);
      if (row.used_at) {
        await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { email_verified: true } });
        return json({ ok: true, already_used: true });
      }
      if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: "This link has expired" }, 400);
      const { error: updErr } = await admin.auth.admin.updateUserById(row.user_id, {
        app_metadata: { email_verified: true },
      });
      if (updErr) return json({ error: updErr.message }, 500);
      await admin.from("email_verification_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);
      return json({ ok: true });
    }

    // === Send branch (requires logged-in user) ===
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

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
      const errText = await res.text();
      console.error("resend error", res.status, errText);
      return json({ error: `Resend ${res.status}: ${errText}`, from: FROM_EMAIL }, 500);
    }
    const ok = await res.json().catch(() => ({}));
    return json({ ok: true, id: (ok as any)?.id, from: FROM_EMAIL });
  } catch (e) {
    console.error("send-verification", e);
    return json({ error: (e as Error).message }, 500);
  }
});