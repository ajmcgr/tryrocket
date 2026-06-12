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
  const body: any = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: { temperature: opts.temperature ?? 0.7 },
  };
  if (opts.json) body.generationConfig.responseMimeType = "application/json";
  const res = await gFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "").trim();
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
