import { corsHeaders } from "../_shared/cors.ts";
import { geminiText, requireGeminiKey } from "../_shared/gemini.ts";

// Simple in-memory rate limit (per cold start): 20 calls/IP/10min
const rl = new Map<string, { count: number; reset: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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
