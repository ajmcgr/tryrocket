import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

Deno.serve(async (req) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const isPersonal = !!body?.is_personal;
    if (!name) {
      return new Response(JSON.stringify({ error: "Workspace name is required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (isPersonal) {
      const { data: existing } = await admin
        .from("workspaces")
        .select("id,name,is_personal")
        .eq("owner_id", user.id)
        .eq("is_personal", true)
        .maybeSingle();
      if (existing?.id) {
        await admin
          .from("workspace_members")
          .insert({ workspace_id: existing.id, user_id: user.id, role: "owner" })
          .select()
          .maybeSingle();
        return new Response(JSON.stringify(existing), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    const { data: workspace, error: insertError } = await admin
      .from("workspaces")
      .insert({
        name,
        owner_id: user.id,
        is_personal: isPersonal,
      })
      .select("id,name,is_personal")
      .single();

    if (insertError || !workspace?.id) {
      throw insertError || new Error("Failed to create workspace");
    }

    const { error: memberError } = await admin
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });
    if (memberError && !/duplicate key|already exists/i.test(memberError.message || "")) {
      throw memberError;
    }

    return new Response(JSON.stringify(workspace), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
