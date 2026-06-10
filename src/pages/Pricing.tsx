import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

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
  "Charts",
  "Launch Copy",
];

const Pricing = () => {
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
                <Link to="/signup">Sign up free</Link>
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
                  "Unlimited saved Brand Assets",
                  "Export tools",
                  "Priority generation",
                  "Full asset history",
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
              <Button asChild className="mt-8 w-full">
                <Link to="/signup">Start free trial</Link>
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
                { credits: "500", price: "$5", note: "Starter pack" },
                { credits: "1,500", price: "$10", note: "Most popular", highlight: true },
                { credits: "5,000", price: "$25", note: "Best value" },
              ].map((p) => (
                <div key={p.credits} className={`rounded-2xl border p-6 ${p.highlight ? "border-brand bg-brand/5" : "border-neutral-200 bg-white"}`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{p.note}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-neutral-900">{p.credits} credits</div>
                </div>
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