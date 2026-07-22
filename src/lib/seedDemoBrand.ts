import { supabase } from "@/integrations/supabase/client";

const FLAG_PREFIX = "rocket:demo-seeded:";

/**
 * Seed the Brandbear demo brand kit into a new user's account so /saved and
 * /brands show a realistic example on first login. Server-side function is
 * idempotent, and this client also guards with localStorage per user.
 */
export async function seedDemoBrandOnce(userId: string) {
  if (!userId) return;
  const flagKey = `${FLAG_PREFIX}${userId}`;
  try {
    if (localStorage.getItem(flagKey)) return;
  } catch {}
  try {
    await (supabase as any).functions.invoke("seed-demo-brand", { body: {} });
  } catch (err) {
    // Non-fatal: user just won't see the demo brand.
    console.warn("seed-demo-brand failed", err);
    return;
  }
  try { localStorage.setItem(flagKey, "1"); } catch {}
}