import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

const PACKS = [
  { id: "pack_500", credits: 500, price: "$5" },
  { id: "pack_1500", credits: 1500, price: "$10" },
  { id: "pack_5000", credits: 5000, price: "$25" },
];

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setSub(data));
    supabase.from("user_usage").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setUsage(data));
  }, [user]);

  const checkout = async (product: string) => {
    setLoading(product);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", { body: { product } });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally { setLoading(null); }
  };

  const portal = async () => {
    setLoading("portal");
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({ title: "Portal failed", description: e.message, variant: "destructive" });
    } finally { setLoading(null); }
  };

  const remaining = usage ? usage.monthly_limit + (usage.credits_extra || 0) - usage.credits_used : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold">Account</h2>
        <p className="mt-1 text-sm text-neutral-600">{user?.email}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Subscription</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Plan: <span className="font-medium capitalize">{usage?.plan || "free"}</span> · {remaining.toLocaleString()} credits remaining
            </p>
            {sub?.status && <p className="mt-0.5 text-xs text-neutral-500">Status: {sub.status}{sub.cancel_at_period_end ? " (canceling)" : ""}</p>}
          </div>
          {usage?.plan === "growth" ? (
            <button onClick={portal} disabled={loading === "portal"} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage billing"}
            </button>
          ) : (
            <button onClick={() => checkout("growth")} disabled={loading === "growth"} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              {loading === "growth" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade — $20/mo"}
            </button>
          )}
        </div>

        {usage?.plan !== "growth" && (
          <ul className="mt-5 space-y-1.5 text-sm text-neutral-700">
            {["7-day free trial", "3,000 credits / month", "Unlimited saved Rockets", "Export tools", "Priority generation"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-neutral-900" /> {f}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold">Credit packs</h2>
        <p className="mt-1 text-sm text-neutral-600">One-time top ups. Credits never expire.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <button key={p.id} onClick={() => checkout(p.id)} disabled={loading === p.id} className="rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-900">
              <div className="text-base font-semibold">{p.credits.toLocaleString()} Credits</div>
              <div className="mt-1 text-lg font-semibold">{p.price}</div>
              <div className="mt-2 text-xs font-medium text-neutral-500">{loading === p.id ? "Loading…" : "Buy →"}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Settings;