import { cors } from "../_shared/gemini.ts";

const FIRECRAWL = "https://api.firecrawl.dev/v2";

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
        formats: ["markdown", "branding", "summary"],
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
    const out = {
      productName: meta?.title?.split("|")[0]?.split("—")[0]?.trim() || meta?.title || null,
      tagline: meta?.description || null,
      description: doc?.summary || meta?.description || null,
      colors: palette,
      fonts,
      logo: branding?.images?.logo || branding?.logo || null,
      favicon: branding?.images?.favicon || null,
      ogImage: branding?.images?.ogImage || null,
      colorScheme: branding?.colorScheme || null,
    };
    return new Response(JSON.stringify(out), { headers: { ...ch, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 200, headers: { ...ch, "Content-Type": "application/json" } });
  }
});
