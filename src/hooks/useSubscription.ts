import { useEffect, useState } from "react";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const supabase = _sb as any;

export type Plan = "free" | "pro" | "business" | "enterprise";

export interface Subscription {
  plan: Plan;
  status: string | null;
  isPro: boolean;
  loading: boolean;
}

const PRO_PLANS: Plan[] = ["pro", "business", "enterprise"];
const ACTIVE_STATUSES = ["active", "trialing"];

// Session cache so navigating between pages doesn't re-query.
let cache: { plan: Plan; status: string | null } | null = null;
let inflight: Promise<{ plan: Plan; status: string | null }> | null = null;

export function invalidateSubscription() {
  cache = null;
}

export function useSubscription(): Subscription {
  const { user } = useAuth();
  const [state, setState] = useState<{ plan: Plan; status: string | null } | null>(cache);
  const [loading, setLoading] = useState(!cache && !!user);

  useEffect(() => {
    if (!user) { setState({ plan: "free", status: null }); setLoading(false); return; }
    if (cache) { setState(cache); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (!inflight) {
        inflight = (async () => {
          const { data } = await supabase
            .from("subscriptions")
            .select("plan,status")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const result = {
            plan: (data?.plan as Plan) || "free",
            status: (data?.status as string) || null,
          };
          cache = result;
          return result;
        })();
      }
      try {
        const r = await inflight;
        if (!cancelled) { setState(r); setLoading(false); }
      } finally {
        inflight = null;
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const plan = state?.plan || "free";
  const status = state?.status || null;
  const isPro = PRO_PLANS.includes(plan) && (status === null || ACTIVE_STATUSES.includes(status));
  return { plan, status, isPro, loading };
}