import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase = _sb as any;

// Compact credits meter shown in the header next to the avatar.
// Reactive: refetches whenever anyone dispatches `credits:refresh` on window.
export default function HeaderCreditsChip() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setCredits(null); return; }
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("user_usage").select("monthly_limit, credits_extra, credits_used").eq("user_id", user.id).maybeSingle();
      if (!alive || !data) return;
      setCredits((data.monthly_limit || 0) + (data.credits_extra || 0) - (data.credits_used || 0));
    };
    load();
    const onRefresh = () => load();
    window.addEventListener("credits:refresh", onRefresh);
    return () => { alive = false; window.removeEventListener("credits:refresh", onRefresh); };
  }, [user]);

  if (!user || credits === null) return null;
  const low = credits < 20;
  return (
    <Link
      to="/pricing"
      title={`${credits} credits remaining`}
      className={`hidden items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition sm:inline-flex ${
        low
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      <Zap className={`h-3 w-3 ${low ? "text-amber-500" : "text-brand"}`} />
      {credits.toLocaleString()}
    </Link>
  );
}