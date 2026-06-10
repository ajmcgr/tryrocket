const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

export function requireGeminiKey() {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  return GEMINI_API_KEY;
}

type CallOpts = { system: string; user: string; temperature?: number; json?: boolean };

async function callGemini({ system, user, temperature = 0.7, json = false }: CallOpts) {
  const key = requireGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body: any = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { temperature },
  };
  if (json) body.generationConfig.responseMimeType = "application/json";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "";
  return text as string;
}

export async function geminiText(opts: CallOpts): Promise<string> {
  return (await callGemini(opts)).trim();
}

export async function geminiJSON<T = any>(opts: Omit<CallOpts, "json">): Promise<T> {
  const raw = await callGemini({ ...opts, json: true });
  try {
    return JSON.parse(raw);
  } catch {
    // strip ```json fences just in case
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
  }
}