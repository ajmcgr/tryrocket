import { cors, geminiText, hasGeminiKey } from "../_shared/gemini.ts";

const SYSTEM = `You are a router for Rocket, a branding/launch assistant. Given a user prompt, decide whether it's better handled by a SINGLE asset or a multi-asset WORKFLOW.

Workflows:
- "brand": Full brand starter — logo + colors + fonts + voice. Use when prompt asks for a brand, identity, branding, full kit.
- "design": Multiple logo concepts + color system. Use when asking for logo options, variations, design exploration.
- "launch": Launch copy + Product Hunt copy + social post. Use when asking to launch, ship, go-live, PH launch.
- "promote": Multiple social posts + founder bio. Use when asking for promotion, marketing, social campaign.

Return strict JSON: {"mode":"single"|"workflow","workflow":"brand"|"design"|"launch"|"promote"|null}
If single, set workflow to null. If unsure, return single.`;

Deno.serve(async (req) => {
  const ch = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: ch });
  try {
    if (!hasGeminiKey()) return new Response(JSON.stringify({ mode: "single", workflow: null }), { headers: { ...ch, "Content-Type": "application/json" } });
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ mode: "single", workflow: null }), { headers: { ...ch, "Content-Type": "application/json" } });
    const out = await geminiText({ system: SYSTEM, user: String(prompt).slice(0, 500), temperature: 0.1, json: true });
    let parsed: any = { mode: "single", workflow: null };
    try { parsed = JSON.parse(out); } catch {}
    const valid = ["brand", "design", "launch", "promote"];
    const result = parsed.mode === "workflow" && valid.includes(parsed.workflow)
      ? { mode: "workflow", workflow: parsed.workflow }
      : { mode: "single", workflow: null };
    return new Response(JSON.stringify(result), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ mode: "single", workflow: null }), { headers: { ...ch, "Content-Type": "application/json" } });
  }
});