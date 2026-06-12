// Standalone Resend email verification confirmer.
// Public (no JWT required) — consumes a one-time token from the email link.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  "https://tryrocket.ai",
  "https://www.tryrocket.ai",
  "https://tryrocket.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders(req) });

  const log: string[] = [];
  const step = (s: string) => { log.push(s); console.log("[verify-email]", s); };
  const fail = (status: number, error: string, message: string, details: unknown, failingStep: string) => {
    console.error("[verify-email] FAIL", failingStep, error, details);
    return new Response(JSON.stringify({ error, message, details: String(details ?? ""), step: failingStep, log }), { status, headers });
  };

  try {
    step("request_received");
    if (!SUPABASE_URL || !SERVICE_ROLE) return fail(500, "missing_env", "Supabase env not configured", "url/key missing", "env_checked");
    step("env_checked");

    let token = "";
    if (req.method === "POST") {
      try { const body = await req.json(); token = String(body?.token || "").trim(); } catch { /* ignore */ }
    } else {
      token = (new URL(req.url).searchParams.get("token") || "").trim();
    }
    token = token.replace(/[).,>\s]+$/g, "");
    if (!token) return fail(400, "missing_token", "Verification token is missing", "no token provided", "token_received");
    // DEBUG (temporary): never log full token — length + first 8 chars only.
    console.log("[verify-email] 5_received_token", "len", token.length, "prefix", token.slice(0, 8));
    step("token_received");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const token_hash = await sha256Hex(token);
    console.log("[verify-email] 6_computed_hash", "len", token_hash.length, "prefix", token_hash.slice(0, 8));

    const { data: rows, error: selErr } = await admin
      .from("email_verifications")
      .select("id, user_id, email, expires_at, used_at")
      .eq("token_hash", token_hash)
      .order("created_at", { ascending: false })
      .limit(1);
    if (selErr) return fail(500, "db_select_failed", "Lookup failed", selErr.message, "token_looked_up");
    const row = rows?.[0];
    console.log("[verify-email] 7_db_lookup", "found", !!row, "lookup_hash_prefix", token_hash.slice(0, 8));
    if (!row) return fail(400, "invalid_token", "This verification link is invalid.", token_hash.slice(0, 12), "token_looked_up");
    step("token_looked_up");

    const expired = new Date(row.expires_at).getTime() < Date.now();
    console.log("[verify-email] expired", expired, "used", !!row.used_at, "expires_at", row.expires_at);
    if (expired) {
      return fail(400, "expired_token", "This verification link has expired. Please request a new one.", row.expires_at, "token_validated");
    }

    if (row.used_at) {
      // Idempotent: if the profile is already verified (double-click / re-open), report success.
      const { data: prof } = await admin.from("profiles").select("email_verified").eq("user_id", row.user_id).maybeSingle();
      if (prof?.email_verified) {
        step("already_verified");
        return new Response(JSON.stringify({ success: true, verified: true, redirectTo: "/create", user_id: row.user_id, log }), { status: 200, headers });
      }
      return fail(400, "used_token", "This link has already been used or replaced by a newer email. Please request a new one.", row.used_at, "token_validated");
    }
    const { error: updTokErr } = await admin.from("email_verifications").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    if (updTokErr) return fail(500, "db_update_failed", "Could not mark token used", updTokErr.message, "token_consumed");
    step("token_consumed");

    // Mark profile verified.
    const { error: profErr } = await admin.from("profiles")
      .update({ email_verified: true, email_verified_at: new Date().toISOString() })
      .eq("user_id", row.user_id);
    if (profErr) return fail(500, "profile_update_failed", "Could not update profile", profErr.message, "profile_updated");
    console.log("[verify-email] profile_updated true user_id", row.user_id);
    step("profile_updated");

    // Ensure usage row exists (idempotent insert).
    const { error: usageErr } = await admin.from("user_usage")
      .upsert({ user_id: row.user_id, plan: "free", monthly_limit: 500 }, { onConflict: "user_id" });
    if (usageErr) console.warn("[verify-email] usage upsert warn", usageErr.message);
    step("usage_ensured");

    // Also flip auth metadata so any UI checking app_metadata.email_verified agrees.
    try {
      await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { email_verified: true } });
    } catch (e) { console.warn("[verify-email] app_metadata warn", (e as Error).message); }

    step("response_sent");
    return new Response(JSON.stringify({ success: true, verified: true, redirectTo: "/create", user_id: row.user_id, log }), { status: 200, headers });
  } catch (e) {
    return fail(500, "unhandled_exception", "Unexpected server error", (e as Error).message, "response_sent");
  }
});
