import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
const supabase = _sb as any;

const OUTPUT_TYPES = [
  "Brand Guidelines",
  "Brand Templates",
  "Logos",
  "Colors",
  "Fonts",
  "Brand voice",
  "Photos",
  "Components",
  "Graphics",
  "Icons",
  "Launch Copy",
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (product: string) => {
    if (!user) {
      navigate(`/signup?next=${encodeURIComponent(`/pricing?buy=${product}`)}`);
      return;
    }
    setLoading(product);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", { body: { product } });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
      setLoading(null);
    }
  };

  // Auto-resume checkout after signup redirect: /pricing?buy=growth
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (autoTriggered.current || !user) return;
    const params = new URLSearchParams(window.location.search);
    const buy = params.get("buy");
    if (buy) {
      autoTriggered.current = true;
      startCheckout(buy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <SiteHeader />

      <section className="border-b border-neutral-200/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Simple, credit-based pricing</h1>
            <p className="mt-4 text-lg text-neutral-600">Start free. Upgrade when you're ready to ship.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Free</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">$0</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">No credit card required.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["100 credits / month", "All output types", "Save & edit brands", "Limited project history"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                    <span className="text-neutral-700">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Everything you can create</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {OUTPUT_TYPES.map((item) => (
                    <span key={item} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to={user ? "/create" : "/signup"}>{user ? "Go to Rocket" : "Sign up free"}</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border border-neutral-200 bg-neutral-100 p-8 text-neutral-900">
              <div className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                7-day free trial
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Pro</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">$20</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">For founders shipping fast.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "3,000 credits / month",
                  "Unlimited saved designs",
                  "Export tools",
                  "Priority generation",
                  "Full design history",
                  "Team workspaces (multi-seat)",
                  "Early access to new generators",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Everything you can create</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {OUTPUT_TYPES.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => startCheckout("growth")}
                disabled={loading === "growth"}
                className="mt-8 w-full"
              >
                {loading === "growth" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start free trial"}
              </Button>
            </div>
          </div>

          {/* Credit packs */}
          <div className="mt-14">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Need more credits?</h2>
              <p className="mt-2 text-neutral-600">One-time credit packs. Never expire. Stack with your plan.</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { id: "pack_500", credits: "500", price: "$5", note: "Starter pack" },
                { id: "pack_1500", credits: "1,500", price: "$10", note: "Most popular", highlight: true },
                { id: "pack_5000", credits: "5,000", price: "$25", note: "Best value" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => startCheckout(p.id)}
                  disabled={loading === p.id}
                  className={`rounded-2xl border p-6 text-left transition hover:shadow-sm disabled:opacity-60 ${p.highlight ? "border-brand bg-brand/5 hover:bg-brand/10" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{p.note}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm font-medium text-neutral-900">
                    {loading === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {p.credits} credits
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Pricing;
