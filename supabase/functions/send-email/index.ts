import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendBranded, type Template } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Rocket <hello@tryrocket.ai>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user?.email) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { template, data } = await req.json() as { template: Template; data?: any };
    const result = await sendBranded(RESEND_API_KEY, FROM_EMAIL, user.email, template, data || {});
    if (!result.ok) throw new Error(result.error);
    return new Response(JSON.stringify({ ok: true, id: result.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});// redeploy
