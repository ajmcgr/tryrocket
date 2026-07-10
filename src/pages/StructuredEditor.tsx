import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Edit3, Loader2, RotateCcw, Save, History } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AssetVisual, { hasVisualRenderer } from "@/components/visuals/AssetVisual";
import BrandContextStrip from "@/components/BrandContextStrip";
import { tryJson } from "@/lib/assetSchemas";
import { AlertTriangle, Sparkles } from "lucide-react";
import { handleAiError } from "@/lib/aiErrors";
const supabase = _sb as any;

/* ------------------------------------------------------------------ */
/*                       Generic JSON field inspector                  */
/* ------------------------------------------------------------------ */

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;
const COLOR_KEY_RE = /(color|colour|primary|secondary|accent|success|warning|danger|neutral|background|text|border|from|to|fill)/i;
const LONG_KEY_RE = /(description|body|overview|about|copy|content|comment|text|answer|purpose|guidance|rationale|usage|pitch|paragraph|message|reply|announcement|bio|headline|subheadline|tagline|value|pillar|proof|persona|mission|vision|positioning|audience)/i;

function labelFor(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isHex(v: any): boolean {
  return typeof v === "string" && HEX_RE.test(v.trim());
}

function normalizeHex(v: string): string {
  const t = v.trim();
  return t.startsWith("#") ? t : `#${t}`;
}

function StringField({
  keyName, value, onChange, big,
}: { keyName: string; value: string; onChange: (v: string) => void; big?: boolean }) {
  const showColor = isHex(value) || COLOR_KEY_RE.test(keyName);
  const isLong = big || (typeof value === "string" && value.length > 80) || LONG_KEY_RE.test(keyName);
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{labelFor(keyName)}</label>
      <div className="flex items-start gap-2">
        {showColor && isHex(value) && (
          <input
            type="color"
            value={normalizeHex(value)}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-9 w-9 shrink-0 cursor-pointer rounded border border-neutral-200 bg-white p-0.5"
          />
        )}
        {isLong ? (
          <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={Math.min(8, Math.max(2, Math.ceil((value?.length || 0) / 60)))}
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        ) : (
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${showColor && isHex(value) ? "font-mono" : ""}`}
          />
        )}
      </div>
    </div>
  );
}

function NumberField({ keyName, value, onChange }: { keyName: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{labelFor(keyName)}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function StringArrayField({ keyName, value, onChange }: { keyName: string; value: string[]; onChange: (v: string[]) => void }) {
  const text = (value || []).join("\n");
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{labelFor(keyName)} <span className="text-neutral-400">· one per line</span></label>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value.split(/\r?\n/).map((s) => s.replace(/^\s+|\s+$/g, "")).filter((s, i, arr) => s.length > 0 || i < arr.length - 1))}
        rows={Math.min(10, Math.max(3, (value?.length || 0) + 1))}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function AnyField({
  keyName, value, onChange, depth = 0,
}: { keyName: string; value: any; onChange: (v: any) => void; depth?: number }) {
  if (value === null || value === undefined) {
    return <StringField keyName={keyName} value="" onChange={onChange} />;
  }
  if (typeof value === "string") return <StringField keyName={keyName} value={value} onChange={onChange} />;
  if (typeof value === "number") return <NumberField keyName={keyName} value={value} onChange={onChange} />;
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-neutral-800">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {labelFor(keyName)}
      </label>
    );
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) {
      return <StringArrayField keyName={keyName} value={value} onChange={onChange} />;
    }
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{labelFor(keyName)} <span className="text-neutral-400">· {value.length}</span></label>
          <button
            type="button"
            onClick={() => {
              const template = typeof value[0] === "object" && value[0] !== null ? Object.fromEntries(Object.keys(value[0]).map((k) => [k, typeof (value[0] as any)[k] === "string" ? "" : Array.isArray((value[0] as any)[k]) ? [] : typeof (value[0] as any)[k] === "number" ? 0 : ""])) : "";
              onChange([...value, template]);
            }}
            className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-600 hover:bg-neutral-50"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="text-[10px] text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <AnyField
                keyName={""}
                value={item}
                onChange={(nv) => onChange(value.map((x, j) => (j === i ? nv : x)))}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <div className={`space-y-3 ${depth > 0 ? "" : ""}`}>
        {keyName && <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">{labelFor(keyName)}</div>}
        {entries.map(([k, v]) => (
          <AnyField
            key={k}
            keyName={k}
            value={v}
            onChange={(nv) => onChange({ ...value, [k]: nv })}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*                            Section groupings                        */
/* ------------------------------------------------------------------ */

// Preferred field groups per asset type — the rest fall into "More".
const SECTIONS: Record<string, { title: string; keys: string[] }[]> = {
  color_system: [
    { title: "Palette", keys: ["name", "primary", "secondary", "accent", "success", "warning", "danger", "neutral_dark", "neutral_light"] },
    { title: "Scales", keys: ["neutrals", "gradients", "light_mode", "dark_mode"] },
    { title: "Notes", keys: ["usage", "accessibility", "rationale"] },
  ],
  font_system: [
    { title: "Families", keys: ["display_font", "heading_font", "body_font", "mono_font", "display_weight", "heading_weight", "body_weight"] },
    { title: "Scale", keys: ["scale"] },
    { title: "Samples", keys: ["example_headline", "example_body"] },
    { title: "Notes", keys: ["pair_rationale", "usage"] },
  ],
  brand_voice: [
    { title: "Overview", keys: ["overview"] },
    { title: "Pillars", keys: ["pillars"] },
    { title: "Do / Don't", keys: ["do", "dont"] },
    { title: "Examples", keys: ["tone_by_context", "website_examples", "social_examples", "launch_examples", "email_examples"] },
  ],
  brand_guidelines: [
    { title: "Positioning", keys: ["brand_name", "overview", "mission", "vision", "positioning", "audience"] },
    { title: "Voice & Messaging", keys: ["voice", "messaging", "taglines", "elevator_pitch"] },
    { title: "Personality", keys: ["personality_traits", "values"] },
    { title: "Personas", keys: ["personas"] },
    { title: "Do / Don't", keys: ["do", "dont"] },
    { title: "Examples", keys: ["website_examples", "social_examples", "launch_examples"] },
  ],
  launch_copy: [
    { title: "Hero", keys: ["hero", "tagline", "one_liner"] },
    { title: "Descriptions", keys: ["short_description", "medium_description", "long_description"] },
    { title: "CTAs", keys: ["cta_variations", "launch_announcement"] },
    { title: "SEO", keys: ["seo"] },
  ],
  product_hunt_copy: [
    { title: "Listing", keys: ["tagline", "short_description", "full_description", "topics"] },
    { title: "Comments", keys: ["first_comment", "maker_comment", "launch_tweet"] },
    { title: "FAQ", keys: ["faq"] },
    { title: "Community", keys: ["community_responses"] },
  ],
  social_post: [
    { title: "Content", keys: ["kind", "platform", "copy", "categories"] },
  ],
  founder_bio: [
    { title: "Short", keys: ["x_bio", "linkedin_headline", "short"] },
    { title: "Medium & Long", keys: ["medium", "long", "linkedin_about"] },
    { title: "Speaking & Press", keys: ["speaker_bio", "press_bio"] },
  ],
  presentation: [
    { title: "Deck", keys: ["deck_type", "overview", "layout_notes"] },
    { title: "Slides", keys: ["slides"] },
  ],
  template: [
    { title: "Groups", keys: ["groups"] },
  ],
};

function groupedFields(assetType: string, data: any): { title: string; entries: [string, any][] }[] {
  const sections = SECTIONS[assetType] || [{ title: "Fields", keys: [] }];
  const usedKeys = new Set<string>();
  const groups: { title: string; entries: [string, any][] }[] = [];
  for (const sec of sections) {
    const entries: [string, any][] = [];
    for (const k of sec.keys) {
      if (k in data) {
        entries.push([k, data[k]]);
        usedKeys.add(k);
      }
    }
    if (entries.length) groups.push({ title: sec.title, entries });
  }
  const leftover = Object.entries(data).filter(([k]) => !usedKeys.has(k));
  if (leftover.length) groups.push({ title: "More", entries: leftover });
  return groups;
}

/* ------------------------------------------------------------------ */
/*                              Page                                    */
/* ------------------------------------------------------------------ */

export default function StructuredEditor() {
  const { toast } = useToast();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const assetId = params.get("id");

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [parseError, setParseError] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const initialContent = useRef<string>("");

  useEffect(() => {
    if (!assetId) return;
    (async () => {
      setLoading(true);
      const { data: a, error } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
      if (error || !a) {
        toast({ title: "Asset not found", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!hasVisualRenderer(a)) {
        // fall back to the canvas editor for anything without a structured renderer
        nav(`/editor?id=${a.id}`, { replace: true });
        return;
      }
      const raw = String(a.content || "");
      const parsed = tryJson(raw);
      setParseError(!!raw && parsed == null);
      setAsset(a);
      setData(parsed ?? {});
      initialContent.current = raw;
      setLoading(false);
    })();
  }, [assetId, nav, toast]);

  // Autosave (debounced)
  const firstRun = useRef(true);
  useEffect(() => {
    if (!asset || !data) return;
    if (firstRun.current) { firstRun.current = false; return; }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      const nextContent = JSON.stringify(data, null, 2);
      const { error } = await supabase.from("assets").update({ content: nextContent }).eq("id", asset.id);
      if (error) { setSaveStatus("error"); return; }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    }, 800);
    return () => clearTimeout(t);
  }, [data, asset]);

  const previewAsset = useMemo(() => {
    if (!asset || !data) return null;
    return { ...asset, content: JSON.stringify(data) };
  }, [asset, data]);

  const saveVersion = useCallback(async () => {
    if (!asset) return;
    const label = prompt("Label this version (optional):") ?? "";
    const { error } = await supabase.from("asset_versions").insert({
      asset_id: asset.id,
      user_id: asset.user_id,
      label: label || null,
      snapshot: { title: asset.title, content: JSON.stringify(data, null, 2), image_url: asset.image_url },
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Version saved" });
  }, [asset, data, toast]);

  const resetToOriginal = useCallback(() => {
    if (!initialContent.current) return;
    if (!confirm("Discard your changes and reset to the original?")) return;
    const parsed = tryJson(initialContent.current) ?? {};
    setData(parsed);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-neutral-100" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
            <div className="h-96 rounded-2xl bg-neutral-100" />
            <div className="h-96 rounded-2xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }
  if (!asset || !previewAsset) return null;

  const groups = groupedFields(asset.asset_type, data);
  const isEmpty = !data || Object.keys(data || {}).length === 0;

  const rebuildStructured = async () => {
    setRebuilding(true);
    try {
      const instruction = `Regenerate this ${asset.asset_type.replace(/_/g, " ")} and return STRICT JSON ONLY that matches Rocket's schema. No markdown fences, no preamble.`;
      const { data: res, error } = await supabase.functions.invoke("regenerate-asset", {
        body: { asset_id: asset.id, instruction },
      });
      const err = handleAiError(res, error, toast);
      if (err) return;
      window.dispatchEvent(new Event("credits:refresh"));
      const parsed = tryJson((res as any)?.content) ?? {};
      setParseError(false);
      setData(parsed);
      initialContent.current = String((res as any)?.content || "");
      toast({ title: "Rebuilt", description: "Rocket generated a fresh structured version." });
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={`/assets/${asset.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500">Structured editor</div>
            <h1 className="truncate text-lg font-semibold text-neutral-900">{asset.title || "Untitled"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-[80px] text-right text-xs text-neutral-500">
            {saveStatus === "saving" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
            {saveStatus === "saved" && <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Saved</span>}
            {saveStatus === "error" && <span className="text-red-600">Save failed</span>}
          </div>
          <button onClick={resetToOriginal} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button onClick={saveVersion} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
            <History className="h-4 w-4" /> Save version
          </button>
          <Link to={`/editor?id=${asset.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
            <Edit3 className="h-4 w-4" /> Canvas editor
          </Link>
        </div>
      </div>

      {asset?.meta?.brand_context && (
        <div className="mb-4">
          <BrandContextStrip ctx={asset.meta.brand_context} compact />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        {/* Preview */}
        <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Live preview</div>
            <div className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">{asset.asset_type}</div>
          </div>
          <div className="min-h-[480px]">
            {parseError ? (
              <div className="flex h-[480px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div className="text-sm font-semibold text-amber-900">This asset couldn't be parsed as structured data.</div>
                <div className="max-w-sm text-xs text-amber-800/80">
                  The saved content isn't valid JSON, so Rocket can't render the designed layout or edit its fields. You can rebuild it as a fresh structured version.
                </div>
                <button
                  onClick={rebuildStructured}
                  disabled={rebuilding}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {rebuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Rebuild as structured
                </button>
                <Link to={`/editor?id=${asset.id}`} className="text-[11px] text-neutral-500 underline hover:text-neutral-700">or edit raw content →</Link>
              </div>
            ) : isEmpty ? (
              <div className="flex h-[480px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                <Sparkles className="h-8 w-8 text-neutral-400" />
                <div className="text-sm font-semibold text-neutral-800">Nothing here yet.</div>
                <div className="max-w-sm text-xs text-neutral-500">Add fields on the right — the preview will update live as you type.</div>
              </div>
            ) : (
              <AssetVisual asset={previewAsset} />
            )}
          </div>
        </div>

        {/* Inspector */}
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">Inspector</div>
            <div className="mt-0.5 text-sm font-semibold text-neutral-900">Edit fields</div>
            <p className="mt-0.5 text-[11px] text-neutral-500">Changes autosave. The preview on the left updates as you type.</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {groups.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-neutral-500">
                No fields to edit yet.
                <div className="mt-2">
                  <button
                    onClick={() => setData({ title: asset.title || "" })}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] hover:bg-neutral-50"
                  >
                    + Add a starter field
                  </button>
                </div>
              </div>
            ) : groups.map((g, gi) => {
              const open = openSection === g.title || (openSection === null && gi === 0);
              return (
                <div key={g.title}>
                  <button
                    type="button"
                    onClick={() => setOpenSection(open ? "__closed__" : g.title)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
                  >
                    <span className="text-sm font-medium text-neutral-900">{g.title}</span>
                    <span className="text-xs text-neutral-400">{open ? "–" : "+"}</span>
                  </button>
                  {open && g.entries.length === 0 ? (
                    <div className="border-t border-neutral-100 bg-neutral-50/40 px-4 py-4 text-xs text-neutral-500">No fields in this section.</div>
                  ) : open && (
                    <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/40 px-4 py-4">
                      {g.entries.map(([k, v]) => (
                        <AnyField
                          key={k}
                          keyName={k}
                          value={v}
                          onChange={(nv) => setData((cur: any) => ({ ...(cur || {}), [k]: nv }))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-neutral-100 px-4 py-3">
            <button
              onClick={async () => {
                const nextContent = JSON.stringify(data, null, 2);
                setSaveStatus("saving");
                const { error } = await supabase.from("assets").update({ content: nextContent }).eq("id", asset.id);
                if (error) { setSaveStatus("error"); toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
                setSaveStatus("saved");
                toast({ title: "Saved" });
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
            >
              <Save className="h-4 w-4" /> Save now
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}