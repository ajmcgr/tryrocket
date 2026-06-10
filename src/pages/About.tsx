import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const About = () => (
  <div className="min-h-screen bg-white text-neutral-900">
    <SiteHeader />
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">About Rocket</h1>
      <p className="mt-6 text-lg leading-relaxed text-neutral-700">
        Rocket exists because building is the easy part now. Anyone with an idea and an afternoon can vibe-code an app. The hard part — the part that decides whether 10 people try it or 10,000 — is branding and launching.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-neutral-700">
        We built Rocket so a solo founder can drop in a URL and walk away with a complete launch kit in under a minute: positioning, taglines, founder bio, social copy, Product Hunt assets, directory submissions, and a full launch checklist.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-neutral-700">
        Rocket is built by the team behind <a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="text-brand hover:underline">TryLaunch.ai</a>. We've helped thousands of indie founders ship — and we think the next million products deserve to be brands, not just apps.
      </p>
      <div className="mt-12 rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
        <h2 className="text-xl font-semibold">Our promise</h2>
        <p className="mt-3 text-neutral-700">No fluff. No generic AI slop. Every Rocket is specific, founder-voiced, and ready-to-paste — or your credit back.</p>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default About;