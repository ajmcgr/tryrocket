const ALLOWED_ORIGINS = ["https://tryrocket.ai", "http://localhost:5173", "http://localhost:3000"];
function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
function requireGeminiKey() {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  return GEMINI_API_KEY;
}
async function geminiText(opts: { system: string; user: string; temperature?: number }): Promise<string> {
  const key = requireGeminiKey();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.user }] }],
        generationConfig: { temperature: opts.temperature ?? 0.7 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "").trim();
}

// Simple in-memory rate limit (per cold start): 20 calls/IP/10min
const rl = new Map<string, { count: number; reset: number }>();

Deno.serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    requireGeminiKey();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anon";
    const now = Date.now();
    const slot = rl.get(ip);
    if (slot && slot.reset > now) {
      if (slot.count >= 20) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a few minutes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      slot.count++;
    } else {
      rl.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 4000) {
      return new Response(JSON.stringify({ error: "Invalid prompt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await geminiText({
      system: "You are Rocket, an AI brand-and-launch co-pilot for indie founders. Reply in clean markdown. Be specific, concrete, founder-voiced. Never apologize. Never include preamble like 'Sure, here is…' — just deliver the output.",
      user: prompt,
      temperature: 0.8,
    });
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});// redeploy
