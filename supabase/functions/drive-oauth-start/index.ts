// Begin per-user Google Drive OAuth flow.
// Requires GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_REDIRECT_URL.
// Returns { url } — client opens this in a popup.

import { cors } from "../_shared/gemini.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

Deno.serve(async (req) => {
  const ch = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: ch });
  try {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URL");
    if (!clientId || !redirectUri) {
      return new Response(JSON.stringify({ error: "google_oauth_not_configured" }), { status: 500, headers: { ...ch, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...ch, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: stateRow, error } = await admin.from("oauth_states").insert({ user_id: user.id, provider: "google_drive" }).select("state").single();
    if (error) throw error;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state: stateRow.state,
      include_granted_scopes: "true",
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return new Response(JSON.stringify({ url }), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), { status: 500, headers: { ...ch, "Content-Type": "application/json" } });
  }
});