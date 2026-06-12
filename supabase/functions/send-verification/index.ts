// redeploy: 2026-06-12-v10 (direct DB access — PostgREST schema cache doesn't include email_verification_tokens)
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import postgres from "npm:postgres@3.4.5";
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
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;
const sql = postgres(DB_URL, { prepare: false, max: 2 });

function verifyEmailHtml(confirmationUrl: string): { subject: string; html: string } {
  const html = renderEmail({
    preheader: "One click to verify your email.",
    title: "Make your product a brand.",
    bodyHtml: `<p>Welcome to Rocket — Rocket helps you position, brand, and market your product. Confirm your email to get started.</p>`,
    ctaLabel: "Confirm email",
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
      console.log("verify attempt", token_hash.slice(0, 12));
      const rows = await sql`
        select id, user_id, expires_at, used_at
        from public.email_verification_tokens
        where token_hash = ${token_hash}
        limit 1`;
      const row = rows[0] as { id: string; user_id: string; expires_at: string; used_at: string | null } | undefined;
      if (!row) {
        console.warn("verify: no matching token", token_hash.slice(0, 12));
        return json({ error: "Invalid or expired link" }, 400);
      }
      if (row.used_at) {
        await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { email_verified: true } });
        return json({ ok: true, already_used: true });
      }
      if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: "This link has expired" }, 400);
      const { error: updErr } = await admin.auth.admin.updateUserById(row.user_id, {
        app_metadata: { email_verified: true },
      });
      if (updErr) return json({ error: updErr.message }, 500);
      await sql`update public.email_verification_tokens set used_at = now() where id = ${row.id}`;
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
    const [{ n }] = await sql`
      select count(*)::int as n
      from public.email_verification_tokens
      where user_id = ${user.id} and created_at >= now() - interval '1 hour'`;
    if ((n ?? 0) >= 3) return json({ ok: true, throttled: true });

    const raw = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
    const token_hash = await sha256(token);
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      await sql`
        insert into public.email_verification_tokens (user_id, token_hash, expires_at)
        values (${user.id}, ${token_hash}, ${expires_at})`;
    } catch (insErr) {
      console.error("token insert failed", (insErr as Error).message);
      return json({ error: `Could not create verification token: ${(insErr as Error).message}` }, 500);
    }
    console.log("token stored", token_hash.slice(0, 12), "for", user.id);

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