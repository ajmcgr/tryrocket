import { cors, geminiText, hasGeminiKey } from "../_shared/gemini.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const FIRECRAWL = "https://api.firecrawl.dev/v2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BRAND_INTEL_SYSTEM = `You are a senior brand strategist at a top-tier agency.
You will receive scraped content from a company's website (title, description, summary, markdown excerpt, palette, fonts).
Return a STRICT JSON object with concise, high-signal fields — no prose outside JSON.

Schema:
{
  "productName": string,        // clean product/brand name, no domain
  "tagline": string,            // one short line
  "oneLiner": string,           // "X for Y that Z" style, 1 sentence, no fluff
  "industry": string,           // e.g. "AI dev tools", "DTC skincare"
  "category": string,           // narrower: "logo generator", "email marketing"
  "product": string,            // 1-2 sentence description of what it does
  "targetCustomer": string,     // who buys/uses it, 1 sentence
  "audienceSegments": string[], // 2-4 short segment labels
  "positioning": string,        // 1 sentence — how it differentiates
  "competitors": string[],      // up to 5 real named competitors (best guess if not stated)
  "keywords": string[],         // 5-10 brand/product keywords
  "voice": { "tone": string, "traits": string[], "notToBe": string[] },
  "valueProps": string[]        // 3-5 short bullets
}

Rules:
- Never invent domains, prices, or claims not implied by the page.
- Prefer concise, agency-quality language over marketing filler.
- Skip fields you truly cannot infer (return "" or []).`;

async function deriveBrandIntel(seed: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (!hasGeminiKey()) return null;
  try {
    const json = await geminiText({
      system: BRAND_INTEL_SYSTEM,
      user: `Scraped signal:\n${JSON.stringify(seed).slice(0, 12000)}`,
      temperature: 0.4,
      json: true,
    });
    return JSON.parse(json);
  } catch (e) {
    console.warn("brand intel derive failed", (e as Error).message);
    return null;
  }
}

async function persistScreenshot(screenshot: string | null | undefined, url: string): Promise<string | null> {
  if (!screenshot) return null;
  // Firecrawl may return either a full URL or a base64 data string
  if (/^https?:\/\//i.test(screenshot)) return screenshot;
  try {
    let b64 = screenshot;
    const m = screenshot.match(/^data:(image\/\w+);base64,(.*)$/);
    let contentType = "image/png";
    if (m) { contentType = m[1]; b64 = m[2]; }
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const host = url.replace(/^https?:\/\//, "").replace(/\W+/g, "-").slice(0, 40);
    const path = `brand-screenshots/${host}-${Date.now()}.png`;
    const { error } = await admin.storage.from("rocket-images").upload(path, bytes, { contentType, upsert: false });
    if (error) { console.warn("screenshot upload failed", error.message); return null; }
    const { data: pub } = admin.storage.from("rocket-images").getPublicUrl(path);
    return pub.publicUrl;
  } catch (e) {
    console.warn("screenshot persist failed", (e as Error).message);
    return null;
  }
}

Deno.serve(async (req) => {
  const ch = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: ch });
  try {
    const key = Deno.env.get("FIRECRAWL_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not set" }), { status: 500, headers: { ...ch, "Content-Type": "application/json" } });
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: "url required" }), { status: 400, headers: { ...ch, "Content-Type": "application/json" } });

    const res = await fetch(`${FIRECRAWL}/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["markdown", "branding", "summary", "screenshot"],
        onlyMainContent: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "firecrawl_failed", details: data }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
    }

    // Normalize v2 response shape
    const doc = data?.data ?? data;
    const branding = doc?.branding ?? {};
    const meta = doc?.metadata ?? {};
    const palette = branding?.colors ? Object.values(branding.colors).filter((v: any) => typeof v === "string") : [];
    const fonts = (branding?.fonts || []).map((f: any) => f.family).filter(Boolean);
    const rawName = meta?.title?.split("|")[0]?.split("—")[0]?.trim() || meta?.title || null;
    const tagline = meta?.description || null;
    const description = doc?.summary || meta?.description || null;
    const markdownExcerpt = typeof doc?.markdown === "string" ? doc.markdown.slice(0, 8000) : "";

    // Persist screenshot so we can reuse it as a design reference across sessions.
    const screenshotUrl = await persistScreenshot(doc?.screenshot, url);

    // Derive brand intelligence in parallel (best-effort; scrape must not fail if AI does).
    const intel = await deriveBrandIntel({
      url,
      title: meta?.title,
      description: meta?.description,
      summary: doc?.summary,
      markdown: markdownExcerpt,
      colors: palette,
      fonts,
    });

    const out = {
      // Backward-compatible surface (do not remove — Generate.tsx & ProjectWizard read these)
      productName: (intel?.productName as string) || rawName,
      tagline: (intel?.tagline as string) || tagline,
      description: (intel?.oneLiner as string) || description,
      colors: palette,
      fonts,
      logo: branding?.images?.logo || branding?.logo || null,
      favicon: branding?.images?.favicon || null,
      ogImage: branding?.images?.ogImage || null,
      colorScheme: branding?.colorScheme || null,
      screenshot: screenshotUrl,
      // Brand Intelligence Layer (new — every generator can now use these)
      url,
      intel: intel ?? null,
      industry: (intel?.industry as string) || null,
      category: (intel?.category as string) || null,
      product: (intel?.product as string) || null,
      targetCustomer: (intel?.targetCustomer as string) || null,
      audienceSegments: (intel?.audienceSegments as string[]) || [],
      positioning: (intel?.positioning as string) || null,
      competitors: (intel?.competitors as string[]) || [],
      keywords: (intel?.keywords as string[]) || [],
      voice: (intel?.voice as Record<string, unknown>) || null,
      valueProps: (intel?.valueProps as string[]) || [],
      analyzedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify(out), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
  }
});
