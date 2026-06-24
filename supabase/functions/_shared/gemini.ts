// Shared Gemini wrapper with retries.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image-preview";

export function hasGeminiKey() { return !!GEMINI_API_KEY; }

export class GeminiUnavailableError extends Error {
  status: number; bodyText: string;
  constructor(status: number, bodyText: string) {
    super(`Gemini ${status}: ${bodyText}`);
    this.status = status; this.bodyText = bodyText;
  }
}
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const BACKOFF = [800, 2000, 5000];

async function gFetch(url: string, init: RequestInit): Promise<Response> {
  let lastStatus = 0; let lastBody = "";
  for (let i = 0; i <= BACKOFF.length; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      lastStatus = res.status; lastBody = await res.text();
      if (!RETRYABLE.has(res.status) || i === BACKOFF.length) break;
    } catch (e) {
      lastStatus = 0; lastBody = (e as Error).message;
      if (i === BACKOFF.length) throw new GeminiUnavailableError(0, lastBody);
    }
    await new Promise(r => setTimeout(r, BACKOFF[i]));
  }
  if (RETRYABLE.has(lastStatus)) throw new GeminiUnavailableError(lastStatus, lastBody);
  throw new Error(`Gemini ${lastStatus}: ${lastBody}`);
}

export async function geminiText(opts: { system: string; user: string; temperature?: number; json?: boolean }): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const callOnce = async (userText: string, maxTokens: number): Promise<{ text: string; finishReason: string | undefined }> => {
    const body: any = {
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: maxTokens },
    };
    if (opts.json) {
      body.generationConfig.responseMimeType = "application/json";
      body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    const res = await gFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text = (cand?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "").trim();
    if (!text) console.warn("geminiText empty", { finishReason: cand?.finishReason, usage: data?.usageMetadata });
    else if (cand?.finishReason && cand.finishReason !== "STOP") console.warn("geminiText non-STOP", { finishReason: cand.finishReason, len: text.length });
    return { text, finishReason: cand?.finishReason };
  };

  if (!opts.json) {
    const { text } = await callOnce(opts.user, 16384);
    return text;
  }

  // JSON mode: validate, repair, and retry up to 2x to guarantee parseable JSON.
  let lastText = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const maxTokens = attempt === 0 ? 32768 : 65536;
    const userText = attempt === 0
      ? opts.user
      : `${opts.user}\n\nCRITICAL: Your previous response was not valid JSON or was truncated. Return ONLY a single complete, valid JSON object. No markdown fences. No preamble. No trailing text. Keep field values concise so the entire object fits.`;
    const { text, finishReason } = await callOnce(userText, maxTokens);
    lastText = text;
    if (!text) continue;
    // Strip fences if any
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    const body = (fenced ? fenced[1] : text).trim();
    try { JSON.parse(body); return body; } catch {}
    // Try repair
    const repaired = repairJson(body);
    if (repaired) { try { JSON.parse(repaired); return repaired; } catch {} }
    console.warn("geminiText JSON parse failed", { attempt, finishReason, len: text.length, head: text.slice(0, 120) });
  }
  // Final fallback: return last text (frontend has its own repair as last resort).
  return lastText;
}

/** Close unclosed strings, arrays, and objects in truncated JSON. */
function repairJson(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let out = "";
  const stack: string[] = [];
  let escape = false;
  let inString = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    out += c;
    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') { inString = false; stack.pop(); }
      continue;
    }
    if (c === '"') { inString = true; stack.push('"'); continue; }
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") {
      const open = c === "}" ? "{" : "[";
      if (stack[stack.length - 1] === open) stack.pop();
    }
  }
  if (inString) { out += '"'; stack.pop(); }
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ": null").replace(/,\s*([\}\]])/g, "$1");
  while (stack.length) {
    const top = stack.pop();
    if (top === "{") out += "}";
    else if (top === "[") out += "]";
  }
  return out;
}

export async function geminiImage(prompt: string, referenceImages?: { mimeType: string; data: string }[]): Promise<Uint8Array> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const parts: any[] = [{ text: prompt }];
  if (referenceImages?.length) {
    for (const img of referenceImages) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }
  const res = await gFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    }
  );
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p?.inlineData || p?.inline_data;
    if (inline?.data) {
      const bin = atob(inline.data);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
  }
  throw new Error("no image in Gemini response");
}

export const ALLOWED_ORIGINS = ["https://tryrocket.ai", "https://www.tryrocket.ai", "http://localhost:5173", "http://localhost:3000"];
export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}
