import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Sparkles, Zap, Target, Rocket as RocketIcon, Megaphone, ListChecks, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "What does Rocket actually generate?", a: "A complete launch kit from a single URL: positioning, taglines, value props, audience, founder bio, X/LinkedIn posts, Product Hunt copy, directory submissions, launch strategy, and a full launch checklist." },
  { q: "How long does it take?", a: "About 30–60 seconds. You'll see a live progress UI, then land on your editable Rocket." },
  { q: "Can I edit and regenerate sections?", a: "Yes. Every section has Copy, Edit, and Regenerate. Regenerating a single asset costs 1 credit." },
  { q: "What's a credit?", a: "One full Rocket = 1 credit. Free plan gets 500 credits/month. Growth gets 3,000. You can also top up with credit packs." },
  { q: "Where can I launch from Rocket?", a: "We pre-fill submissions for Product Hunt, BetaList, There's An AI For That, Hacker News, Peerlist, Uneed, Alternative.me, G2, Indie Hackers, and one-click handoff to Launch." },
  { q: "Do you support custom domains / branding?", a: "Yes — Growth plan exports as Markdown and PDF with your brand colors." },
  { q: "Is there a free trial of Growth?", a: "7 days free, no card required on the Free plan to start." },
  { q: "Can I cancel anytime?", a: "Yes, from Settings → Manage Billing. You'll keep access until the end of the period." },
];

const Index = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [url, setUrl] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const target = `/create?url=${encodeURIComponent(trimmed)}`;
    if (user) nav(target);
    else nav("/signup", { state: { from: target } });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[600px] w-[1200px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(59,130,246,0.30), rgba(59,130,246,0) 70%), radial-gradient(closest-side, rgba(120,140,255,0.20), rgba(120,140,255,0) 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            AI Branding for Vibe Coders
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
            Make Your Product a Brand
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Rocket helps you brand your app with AI.
          </p>
          <p className="mx-auto mt-10 max-w-2xl text-base text-neutral-600">
            Paste your product URL. We'll handle the rest.
          </p>
          <form onSubmit={onSubmit} className="mx-auto mt-6 flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row">
            <input
              type="text"
              required
              placeholder="https://myproduct.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 flex-1 rounded-2xl border border-neutral-200 bg-white px-5 text-base outline-none ring-neutral-300 transition focus:ring-2"
            />
            <Button type="submit" size="lg" className="h-14 px-7 text-base">
              Generate Brand <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to launch</h2>
            <p className="mt-4 text-lg text-neutral-600">
              Drop in your product URL. Rocket generates the positioning, copy, and launch plan in seconds.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { emoji: "🎯", title: "Positioning", desc: "Taglines, value props, elevator pitch, target audience — locked in." },
              { emoji: "📣", title: "Launch Copy", desc: "Product Hunt, directories, X threads, LinkedIn, newsletters." },
              { emoji: "✅", title: "Launch Strategy", desc: "Channels, communities, content ideas, and a full launch checklist." },
              { emoji: "✨", title: "Founder Profile", desc: "X bio, LinkedIn headline, founder tagline — ready to paste." },
              { emoji: "⚡", title: "Instant Generation", desc: "One URL in. A complete launch kit out. Edit and regenerate any section." },
              { emoji: "🚀", title: "Launch on Launch", desc: "Ship your Rocket straight to Launch when you're ready to go live." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md">
                <div className="text-3xl leading-none" aria-hidden>{emoji}</div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, credit-based pricing</h2>
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
                {["500 Rocket Credits / month", "All output types", "Save & edit Rockets"].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                    <span className="text-neutral-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to="/signup">Sign up free</Link>
              </Button>
            </div>

            {/* Growth */}
            <div className="relative rounded-2xl border border-neutral-200 bg-neutral-100 p-8 text-neutral-900">
              <div className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                7-day free trial
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Growth</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">$20</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">For founders shipping fast.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "3,000 Rocket Credits / month",
                  "Unlimited saved Rockets",
                  "Export tools",
                  "Priority generation",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full">
                <Link to="/signup">Start free trial</Link>
              </Button>
            </div>
          </div>

          {/* Credit Packs */}
          <div className="mt-10">
            <p className="text-center text-sm font-medium text-neutral-500">Or top up with credit packs</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { credits: "500", price: "$5" },
                { credits: "1,500", price: "$10" },
                { credits: "5,000", price: "$25" },
              ].map((p) => (
                <div key={p.credits} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4">
                  <div>
                    <div className="text-base font-semibold">{p.credits} Credits</div>
                    <div className="text-xs text-neutral-500">One-time purchase</div>
                  </div>
                  <div className="text-lg font-semibold">{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked</h2>
            <p className="mt-3 text-neutral-600">Everything you wanted to know about Rocket.</p>
          </div>
          <Accordion type="single" collapsible className="mt-10 w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-neutral-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200/60">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready to launch?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            Generate your first Rocket in under 60 seconds.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/signup">Sign up free <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;