// redeploy: 2026-06-12-v4 (force fresh deploy batch)
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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const { token } = await req.json() as { token?: string };
    if (!token) return json({ error: "Invalid request" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const token_hash = await sha256(token);

    const { data: row, error: selErr } = await admin
      .from("email_verification_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", token_hash)
      .maybeSingle();

    if (selErr) return json({ error: selErr.message }, 500);
    if (!row) return json({ error: "Invalid or expired link" }, 400);
    if (row.used_at) {
      // Still mark the user verified in case it wasn't, to be safe.
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
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});