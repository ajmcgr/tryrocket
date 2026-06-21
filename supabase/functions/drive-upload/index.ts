// Upload an asset (by asset_id) to the calling user's connected Google Drive.
// Refreshes the OAuth token automatically if expired.

import { cors } from "../_shared/gemini.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function refreshToken(refresh_token: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`refresh_failed: ${JSON.stringify(j)}`);
  return j as { access_token: string; expires_in: number };
}

Deno.serve(async (req) => {
  const ch = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: ch });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...ch, "Content-Type": "application/json" } });

    const { asset_id } = await req.json();
    if (!asset_id) return new Response(JSON.stringify({ error: "asset_id required" }), { status: 400, headers: { ...ch, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: integ } = await admin.from("user_integrations").select("*").eq("user_id", user.id).eq("provider", "google_drive").maybeSingle();
    if (!integ) return new Response(JSON.stringify({ error: "not_connected" }), { status: 400, headers: { ...ch, "Content-Type": "application/json" } });

    let accessToken = integ.access_token as string;
    const expired = integ.expires_at && new Date(integ.expires_at).getTime() < Date.now();
    if (expired && integ.refresh_token) {
      const r = await refreshToken(integ.refresh_token);
      accessToken = r.access_token;
      await admin.from("user_integrations").update({
        access_token: r.access_token,
        expires_at: new Date(Date.now() + (r.expires_in - 60) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", integ.id);
    }

    const { data: asset } = await admin.from("assets").select("id, title, content, image_url, user_id").eq("id", asset_id).maybeSingle();
    if (!asset || asset.user_id !== user.id) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...ch, "Content-Type": "application/json" } });

    // Build payload: image bytes if image, otherwise text/markdown
    let body: Uint8Array | string;
    let mime: string;
    let filename: string;
    if (asset.image_url) {
      const r = await fetch(asset.image_url);
      if (!r.ok) throw new Error("fetch_image_failed");
      body = new Uint8Array(await r.arrayBuffer());
      mime = r.headers.get("content-type") || "image/png";
      const ext = mime.includes("png") ? "png" : mime.includes("jpeg") ? "jpg" : "bin";
      filename = `${(asset.title || "asset").replace(/[^\w-]+/g, "_")}.${ext}`;
    } else {
      body = asset.content || "";
      mime = "text/markdown";
      filename = `${(asset.title || "asset").replace(/[^\w-]+/g, "_")}.md`;
    }

    // Multipart upload to Drive
    const boundary = "rocket_drive_" + crypto.randomUUID();
    const metadata = JSON.stringify({ name: filename, mimeType: mime });
    const enc = new TextEncoder();
    const head = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`);
    const tail = enc.encode(`\r\n--${boundary}--`);
    const bodyBytes = typeof body === "string" ? enc.encode(body) : body;
    const payload = new Uint8Array(head.length + bodyBytes.length + tail.length);
    payload.set(head, 0); payload.set(bodyBytes, head.length); payload.set(tail, head.length + bodyBytes.length);

    const upRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: payload,
    });
    const out = await upRes.json();
    if (!upRes.ok) return new Response(JSON.stringify({ error: "drive_upload_failed", details: out }), { status: 502, headers: { ...ch, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ ok: true, file: out }), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "failed" }), { status: 500, headers: { ...ch, "Content-Type": "application/json" } });
  }
});