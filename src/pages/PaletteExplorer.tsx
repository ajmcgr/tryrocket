import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { loadBrandMeta } from "@/lib/brandMeta";

const supabase = _sb as any;

function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex.toUpperCase()}`;
}

function collectColorsFromState(state: any, out: Set<string>) {
  if (!state) return;
  const push = (v: unknown) => {
    const h = normalizeHex(v);
    if (h) out.add(h);
  };
  if (state.kind === "logotype") {
    push(state.color);
    return;
  }
  if (Array.isArray(state)) {
    for (const el of state) {
      if (!el || typeof el !== "object") continue;
      push((el as any).fill);
      push((el as any).color);
      push((el as any).stroke);
      push((el as any).background);
      push((el as any).backgroundColor);
    }
  }
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export default function PaletteExplorer() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: assets } = await supabase
        .from("assets")
        .select("id,editor_state,meta")
        .eq("project_id", projectId);
      if (cancelled) return;
      const set = new Set<string>();
      // Include brand meta color first if present
      const meta = loadBrandMeta(projectId);
      const brand = normalizeHex(meta.brand_color);
      if (brand) set.add(brand);
      for (const c of meta.palette || []) {
        const h = normalizeHex(c);
        if (h) set.add(h);
      }
      // Only saved-to-brand-kit assets are the source of truth.
      for (const a of assets || []) {
        if (!a?.meta?.saved_at) continue;
        collectColorsFromState(a.editor_state, set);
      }
      setColors(Array.from(set));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast({ title: `Copied ${hex}` });
    } catch {}
  };

  const empty = !loading && colors.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Palette</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Colors used by the logos and icons in this brand kit.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
          ))}
        </div>
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          No colors yet. Save a logo or icon to your brand kit to populate the palette.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map((hex) => {
            const isLight = luminance(hex) > 0.6;
            return (
              <button
                key={hex}
                onClick={() => copy(hex)}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)]"
              >
                <div className="flex aspect-[4/3] items-end justify-between px-5 py-4" style={{ backgroundColor: hex }}>
                  <span className={`text-xs font-medium tracking-wide ${isLight ? "text-neutral-800" : "text-white/90"}`}>
                    {hex}
                  </span>
                  <Copy className={`h-4 w-4 opacity-0 transition group-hover:opacity-100 ${isLight ? "text-neutral-800" : "text-white"}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}