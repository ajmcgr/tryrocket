import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Simple in-memory rate limit (per cold start): 20 calls/IP/10min
const rl = new Map<string, { count: number; reset: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

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

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Rocket, an AI brand-and-launch co-pilot for indie founders. Reply in clean markdown. Be specific, concrete, founder-voiced. Never apologize. Never include preamble like 'Sure, here is…' — just deliver the output." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`OpenAI ${res.status}: ${t}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});