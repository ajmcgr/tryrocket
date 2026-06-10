import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendBranded } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://tryrocket.ai";

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email } = await req.json() as { email?: string };
    const normalized = (email || "").trim().toLowerCase();
    // Always respond OK to avoid email enumeration
    const ok = new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!normalized || !RESEND_API_KEY) return ok;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    // Find user by email
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = list?.users?.find((u) => (u.email || "").toLowerCase() === normalized);
    if (!user) return ok;

    // Generate token (random 32 bytes -> hex)
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
    const token_hash = await sha256(token);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    await admin.from("password_reset_tokens").insert({ user_id: user.id, token_hash, expires_at });

    const url = `${APP_URL}/reset-password?token=${token}`;
    const result = await sendBranded(RESEND_API_KEY, FROM_EMAIL, user.email!, "auth_recovery", { confirmation_url: url });
    if (!result.ok) console.error("resend error", result.error);
    return ok;
  } catch (e) {
    console.error("request-password-reset", e);
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});