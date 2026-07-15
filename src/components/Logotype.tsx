import { useEffect, useMemo, useState } from "react";
import { loadGoogleFont, type LogotypeState } from "@/lib/logotype";

interface Props {
  state: LogotypeState;
  className?: string;
  /** Render inside a fixed container with this aspect ratio (defaults to natural). */
  fit?: "contain" | "natural";
  /** Font size in px when fit="natural". */
  fontSizePx?: number;
}

/** Lightweight DOM-based logotype renderer used in cards. */
export function Logotype({ state, className, fit = "natural", fontSizePx = 64 }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    loadGoogleFont(state.font, [state.weight]);
    let cancelled = false;
    (async () => {
      try { await (document as any).fonts?.load?.(`${state.weight} 64px '${state.font}'`); } catch {}
      if (!cancelled) force((t) => t + 1);
    })();
    return () => { cancelled = true; };
  }, [state.font, state.weight]);

  const displayText = useMemo(() => {
    const raw = String(state.text || "").trim() || "Brand";
    if (state.transform === "uppercase") return raw.toUpperCase();
    if (state.transform === "lowercase") return raw.toLowerCase();
    if (state.transform === "capitalize") return raw.replace(/\b\w/g, (c) => c.toUpperCase());
    return raw;
  }, [state.text, state.transform]);

  if (fit === "contain") {
    // Auto-fit via SVG viewBox — always scales to the card regardless of size.
    const fontSize = 100;
    const approxWidth = Math.max(
      1,
      displayText.length * fontSize * 0.6 + state.letterSpacing * fontSize * Math.max(0, displayText.length - 1),
    );
    const height = fontSize * 1.25;
    const pad = fontSize * 0.2;
    return (
      <div className={`flex h-full w-full items-center justify-center overflow-hidden p-4 ${className || ""}`}>
        <svg
          viewBox={`0 0 ${approxWidth + pad * 2} ${height + pad * 2}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <text
            x={pad}
            y={pad + fontSize}
            fill={state.color}
            fontFamily={`'${state.font}', ui-sans-serif, system-ui, sans-serif`}
            fontWeight={state.weight}
            fontSize={fontSize}
            letterSpacing={state.letterSpacing * fontSize}
          >
            {displayText}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <span
      className={className}
      style={{
        fontFamily: `'${state.font}', ui-sans-serif, system-ui, sans-serif`,
        fontWeight: state.weight,
        color: state.color,
        letterSpacing: `${state.letterSpacing}em`,
        textTransform: state.transform,
        fontSize: fontSizePx,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {displayText}
    </span>
  );
}

/** Build an inline SVG string for export — embeds the rendered text with current font. */
export function logotypeToSvg(state: LogotypeState, opts?: { padding?: number; height?: number }): string {
  const padding = opts?.padding ?? 40;
  const fontSize = opts?.height ?? 160;
  // Estimate width: avg glyph width ~0.55em, then add letter-spacing.
  const baseWidth = state.text.length * fontSize * 0.6;
  const spacing = state.letterSpacing * fontSize * state.text.length;
  const width = Math.max(200, Math.round(baseWidth + spacing));
  const height = Math.round(fontSize * 1.3);
  const transform =
    state.transform === "uppercase" ? state.text.toUpperCase()
    : state.transform === "lowercase" ? state.text.toLowerCase()
    : state.transform === "capitalize" ? state.text.replace(/\b\w/g, c => c.toUpperCase())
    : state.text;
  const famUrl = state.font.replace(/\s+/g, "+");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width + padding * 2}" height="${height + padding * 2}" viewBox="0 0 ${width + padding * 2} ${height + padding * 2}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=${famUrl}:wght@${state.weight}&amp;display=swap');
      .lt { font-family: '${state.font}', sans-serif; font-weight: ${state.weight}; fill: ${state.color}; letter-spacing: ${state.letterSpacing}em; }
    </style>
  </defs>
  <text x="${padding}" y="${padding + fontSize}" class="lt" font-size="${fontSize}">${escapeXml(transform)}</text>
</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

/** Rasterize the logotype to a PNG data URL via canvas. */
export async function logotypeToPng(state: LogotypeState, scale = 2): Promise<string> {
  loadGoogleFont(state.font, [state.weight]);
  // Wait for the font to load.
  try { await (document as any).fonts?.load(`${state.weight} 160px '${state.font}'`); } catch {}
  const padding = 40;
  const fontSize = 160;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${state.weight} ${fontSize}px '${state.font}', sans-serif`;
  const transform =
    state.transform === "uppercase" ? state.text.toUpperCase()
    : state.transform === "lowercase" ? state.text.toLowerCase()
    : state.transform === "capitalize" ? state.text.replace(/\b\w/g, c => c.toUpperCase())
    : state.text;
  const metrics = ctx.measureText(transform);
  const spacing = state.letterSpacing * fontSize * Math.max(0, transform.length - 1);
  const width = Math.ceil(metrics.width + spacing + padding * 2);
  const height = Math.ceil(fontSize * 1.3 + padding * 2);
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${state.weight} ${fontSize}px '${state.font}', sans-serif`;
  ctx.fillStyle = state.color;
  ctx.textBaseline = "alphabetic";
  // Manual letter-spacing draw.
  let x = padding;
  const y = padding + fontSize;
  for (const ch of transform) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + state.letterSpacing * fontSize;
  }
  return canvas.toDataURL("image/png");
}