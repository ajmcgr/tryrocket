// Shared handler for AI/edge-function responses so every page reacts to
// out-of-credits, rate limits, and provider outages the same way.

import type { useToast } from "@/hooks/use-toast";

type Toast = ReturnType<typeof useToast>["toast"];

export type AiErrorKind = "no_credits" | "rate_limit" | "unavailable" | "forbidden" | "generic";

export type AiError = {
  kind: AiErrorKind;
  message: string;
  needed?: number;
  remaining?: number;
};

export function parseAiError(data: any, error: any): AiError | null {
  // Network / invoke error
  if (error) {
    const msg = String(error?.message || error);
    if (/429|rate.?limit/i.test(msg)) {
      return { kind: "rate_limit", message: "Rocket is being rate-limited — try again in a moment." };
    }
    return { kind: "generic", message: msg || "Something went wrong." };
  }
  if (!data) return null;
  const code = data.error || data.code;
  if (!code) return null;
  if (code === "no_credits") {
    return {
      kind: "no_credits",
      message: "You're out of credits.",
      needed: data.needed,
      remaining: data.remaining,
    };
  }
  if (code === "rate_limit" || code === 429) {
    return { kind: "rate_limit", message: data.message || "Slow down — Rocket is rate-limited. Try again shortly." };
  }
  if (code === "ai_provider_unavailable") {
    return { kind: "unavailable", message: data.message || "Rocket is busy. Try again in a moment." };
  }
  if (code === "forbidden") {
    return { kind: "forbidden", message: data.message || "You don't have access to that." };
  }
  return { kind: "generic", message: data.message || String(code) };
}

// Handles the non-credits kinds via toast. Returns the parsed error if any
// (including no_credits) so callers can open the OutOfCreditsModal themselves.
export function handleAiError(
  data: any,
  error: any,
  toast: Toast,
): AiError | null {
  const parsed = parseAiError(data, error);
  if (!parsed) return null;
  if (parsed.kind === "no_credits") return parsed; // caller opens modal
  toast({
    title:
      parsed.kind === "rate_limit" ? "Rate limited"
      : parsed.kind === "unavailable" ? "Rocket is busy"
      : parsed.kind === "forbidden" ? "Not allowed"
      : "Something went wrong",
    description: parsed.message,
    variant: "destructive",
  });
  return parsed;
}

// Tiny word-level diff used by version history.
// Returns an array of { type: "same" | "add" | "del", text } segments.
export type DiffSeg = { type: "same" | "add" | "del"; text: string };

export function diffLines(a: string, b: string): DiffSeg[] {
  const A = (a || "").split(/\r?\n/);
  const B = (b || "").split(/\r?\n/);
  const n = A.length, m = B.length;
  // LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffSeg[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: "same", text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", text: A[i] }); i++; }
    else { out.push({ type: "add", text: B[j] }); j++; }
  }
  while (i < n) out.push({ type: "del", text: A[i++] });
  while (j < m) out.push({ type: "add", text: B[j++] });
  return out;
}