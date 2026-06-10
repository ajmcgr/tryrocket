import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import alexAvatar from "@/assets/alex-macgregor.png.asset.json";

const About = () => (
  <div className="min-h-screen bg-white text-neutral-900">
    <SiteHeader />
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">About Rocket</h1>
      <p className="mt-8 text-lg leading-relaxed text-neutral-700">
        Rocket is a platform where founders turn raw ideas into launch-ready brands.
      </p>
      <p className="mt-6 font-semibold text-neutral-900">Hello there!</p>
      <p className="mt-4 text-lg leading-relaxed text-neutral-700">
        We believe the future of software is being built by founders who use AI to ship at a speed that was impossible just a few years ago. Our mission is to help these builders position, brand, and market their products so they actually get discovered.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-neutral-700">
        Founders drop in a URL and Rocket generates a complete launch kit — positioning, taglines, founder bio, social copy, Product Hunt assets, directory submissions, and a full launch checklist — in under a minute.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-neutral-700">
        Whether you're shipping your first AI tool or your tenth product, Rocket is where you turn shipping into a real launch. Join thousands of founders who are redefining what it means to build software.
      </p>

      <div className="mt-16">
        <img
          src={alexAvatar.url}
          alt="Alex MacGregor"
          className="h-32 w-32 rounded-2xl object-cover"
        />
        <h3 className="mt-5 text-xl font-bold text-neutral-900">Alex MacGregor</h3>
        <p className="font-bold text-neutral-900">Founder, Rocket</p>
        <p className="mt-3">
          <a
            href="https://x.com/alexmacgregor__"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-brand hover:underline"
          >
            Follow me on X
          </a>
        </p>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default About;