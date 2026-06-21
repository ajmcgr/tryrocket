// Receives Google's redirect with ?code & ?state. Exchanges code for tokens,
// stores them in user_integrations keyed by the user_id from oauth_states,
// then returns an HTML page that posts a message to the opener and closes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function html(body: string, status = 200) {
  return new Response(`<!doctype html><html><body style="font-family:system-ui;padding:32px;text-align:center">${body}<script>setTimeout(()=>{try{window.opener&&window.opener.postMessage({type:'drive-oauth',ok:${status===200}},'*')}catch(e){}window.close()},800)</script></body></html>`, { status, headers: { "Content-Type": "text/html" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) return html(`<h2>Drive connection cancelled</h2><p>${error}</p>`, 400);
  if (!code || !state) return html("<h2>Missing code or state</h2>", 400);

  try {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
    const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URL")!;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Look up & consume state
    const { data: stateRow } = await admin.from("oauth_states").select("user_id, provider, created_at").eq("state", state).maybeSingle();
    if (!stateRow) return html("<h2>Invalid or expired state</h2>", 400);
    await admin.from("oauth_states").delete().eq("state", state);

    // Exchange code → tokens
    const tokRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tok = await tokRes.json();
    if (!tokRes.ok) return html(`<h2>Token exchange failed</h2><pre>${JSON.stringify(tok)}</pre>`, 400);

    // Get account email
    let email: string | null = null;
    try {
      const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } });
      if (me.ok) email = (await me.json())?.email || null;
    } catch { /* noop */ }

    const expiresAt = tok.expires_in ? new Date(Date.now() + (tok.expires_in - 60) * 1000).toISOString() : null;
    const { error: upErr } = await admin.from("user_integrations").upsert({
      user_id: stateRow.user_id,
      provider: "google_drive",
      access_token: tok.access_token,
      refresh_token: tok.refresh_token || null,
      expires_at: expiresAt,
      scope: tok.scope || null,
      account_email: email,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });
    if (upErr) return html(`<h2>Storage failed</h2><pre>${upErr.message}</pre>`, 500);

    return html(`<h2>Google Drive connected ✓</h2><p>${email || ""}</p><p>You can close this window.</p>`);
  } catch (e: any) {
    return html(`<h2>Callback failed</h2><pre>${e?.message || e}</pre>`, 500);
  }
});