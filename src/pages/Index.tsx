import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Target, Rocket as RocketIcon, Megaphone, ListChecks, Check } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-900 text-white">
              <RocketIcon className="h-4 w-4" />
            </span>
            Rocket
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <a href="#features" className="hover:text-neutral-900">Features</a>
            <a href="#pricing" className="hover:text-neutral-900">Pricing</a>
            <a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="hover:text-neutral-900">TryLaunch</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/join" className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline">Sign in</Link>
            <Link
              to="/join"
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[600px] w-[1200px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,165,90,0.35), rgba(255,165,90,0) 70%), radial-gradient(closest-side, rgba(120,140,255,0.25), rgba(120,140,255,0) 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            AI Launch Co-Pilot for Vibe Coders
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
            Vibe Code Your Idea.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
            AI made building easy. Rocket helps you launch.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-neutral-900/10 transition hover:bg-neutral-800"
            >
              Generate Rocket
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/example"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              View example
            </Link>
          </div>

          {/* Mock preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-neutral-50 to-white p-2 shadow-2xl shadow-neutral-900/5">
              <div className="rounded-xl border border-neutral-200 bg-white p-8 text-left">
                <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono">rocket.app/generate</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <span className="text-sm text-neutral-400">https://</span>
                  <span className="text-sm font-medium text-neutral-900">myproduct.com</span>
                  <div className="ml-auto rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white">
                    Generate Rocket
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {["Positioning", "Launch Copy", "Social Content"].map((t) => (
                    <div key={t} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-orange-500">{t}</div>
                      <div className="mt-2 h-2 w-3/4 rounded bg-neutral-200" />
                      <div className="mt-1.5 h-2 w-1/2 rounded bg-neutral-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
              { icon: Target, title: "Positioning", desc: "Taglines, value props, elevator pitch, target audience — locked in." },
              { icon: Megaphone, title: "Launch Copy", desc: "Product Hunt, directories, X threads, LinkedIn, newsletters." },
              { icon: ListChecks, title: "Launch Strategy", desc: "Channels, communities, content ideas, and a full launch checklist." },
              { icon: Sparkles, title: "Founder Profile", desc: "X bio, LinkedIn headline, founder tagline — ready to paste." },
              { icon: Zap, title: "Instant Generation", desc: "One URL in. A complete launch kit out. Edit and regenerate any section." },
              { icon: RocketIcon, title: "Launch on TryLaunch.ai", desc: "Ship your Rocket straight to TryLaunch when you're ready to go live." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:shadow-md">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-white">
                  <Icon className="h-5 w-5" />
                </div>
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
              <Link
                to="/join"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Get started free
              </Link>
            </div>

            {/* Growth */}
            <div className="relative rounded-2xl border border-neutral-900 bg-neutral-900 p-8 text-white">
              <div className="absolute -top-3 right-6 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                7-day free trial
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Growth</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">$20</span>
                <span className="text-neutral-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">For founders shipping fast.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "3,000 Rocket Credits / month",
                  "Unlimited saved Rockets",
                  "Export tools",
                  "Priority generation",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/join"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
              >
                Start free trial
              </Link>
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

      {/* CTA */}
      <section className="border-t border-neutral-200/60 bg-neutral-50/50">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready to launch?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
            Generate your first Rocket in under 60 seconds.
          </p>
          <Link
            to="/join"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-neutral-800"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-neutral-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-neutral-900 text-white">
              <RocketIcon className="h-3 w-3" />
            </span>
            <span>© Rocket 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="mailto:alex@trylaunch.ai" className="hover:text-neutral-900">Contact</a>
            <a href="https://x.com/tryrocketai" target="_blank" rel="noreferrer" className="hover:text-neutral-900">X</a>
            <a href="https://www.instagram.com/tryrocketai/" target="_blank" rel="noreferrer" className="hover:text-neutral-900">Instagram</a>
            <a href="https://discord.gg/aSkXPHhTjJ" target="_blank" rel="noreferrer" className="hover:text-neutral-900">Discord</a>
            <a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="hover:text-neutral-900">TryLaunch.ai</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;