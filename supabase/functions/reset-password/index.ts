import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const { token, password } = await req.json() as { token?: string; password?: string };
    if (!token || !password || password.length < 6) return json({ error: "Invalid request" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const token_hash = await sha256(token);

    const { data: row } = await admin
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", token_hash)
      .maybeSingle();

    if (!row) return json({ error: "Invalid or expired link" }, 400);
    if (row.used_at) return json({ error: "This link has already been used" }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: "This link has expired" }, 400);

    const { error: updErr } = await admin.auth.admin.updateUserById(row.user_id, { password });
    if (updErr) return json({ error: updErr.message }, 500);

    await admin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});