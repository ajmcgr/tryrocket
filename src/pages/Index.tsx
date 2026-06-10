import WaitlistForm from "@/components/WaitlistForm";
import AudioControls from "@/components/AudioControls";
import backgroundVideo from "@/assets/background.mov.asset.json";

const Index = () => {
  return (
    <div className="relative bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh]">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={backgroundVideo.url} type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background" />

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 py-20">
          <div className="flex max-w-2xl flex-col items-center text-center">
            <h1 className="animate-fade-in-up-delay-1 text-5xl font-medium leading-[1.05] tracking-tight text-cream text-glow sm:text-6xl md:text-7xl lg:text-8xl" style={{ fontFamily: 'Reckless, serif' }}>
              Rocket
            </h1>

            <p className="animate-fade-in-up-delay-2 mt-6 text-base font-light tracking-wide text-cream/80 text-glow-sm sm:text-xl">
              The fastest way for vibe coders to brand their products.
            </p>

            <div className="animate-fade-in-up-delay-3 mt-12 w-full">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* Supporting Copy */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-2xl font-light leading-relaxed tracking-wide text-cream/90 sm:text-3xl" style={{ fontFamily: 'Reckless, serif' }}>
            AI made building easy.
          </p>
          <p className="mt-6 text-lg font-light leading-relaxed text-cream/70 sm:text-xl">
            Rocket helps you position, brand, and market your product.
          </p>
        </div>
      </section>

      {/* Product Positioning */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-cream/50 sm:text-3xl" style={{ fontFamily: 'Reckless, serif' }}>
                Launch = Discovery
              </h2>
              <p className="mt-4 text-base leading-relaxed text-cream/60">
                Launch helps vibe coders get discovered.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-cream sm:text-3xl" style={{ fontFamily: 'Reckless, serif' }}>
                Rocket = Branding
              </h2>
              <p className="mt-4 text-base leading-relaxed text-cream/80">
                Rocket helps vibe coders define how they are discovered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Narrative */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <p className="text-lg font-light leading-relaxed text-cream/80 sm:text-xl">
            AI has made building easier than ever.
          </p>
          <p className="mt-4 text-lg font-light leading-relaxed text-cream/80 sm:text-xl">
            The bottleneck is no longer building.
          </p>
          <p className="mt-8 text-base font-light leading-relaxed text-cream/60">
            The bottleneck is:
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center gap-3 text-base text-cream/70">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              positioning
            </li>
            <li className="flex items-center gap-3 text-base text-cream/70">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              branding
            </li>
            <li className="flex items-center gap-3 text-base text-cream/70">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              messaging
            </li>
            <li className="flex items-center gap-3 text-base text-cream/70">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              differentiation
            </li>
            <li className="flex items-center gap-3 text-base text-cream/70">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              distribution
            </li>
          </ul>
          <p className="mt-10 text-lg font-light leading-relaxed text-cream/80 sm:text-xl">
            Rocket helps founders solve those problems.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 flex flex-wrap items-center gap-4 px-6 py-8">
        <span className="text-xs text-cream/30">
          &copy; Rocket 2026
        </span>
        <a
          href="mailto:alex@trylaunch.ai"
          className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]"
        >
          Contact
        </a>
        <a
          href="https://x.com/tryrocketai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]"
        >
          X
        </a>
        <a
          href="https://www.instagram.com/tryrocketai/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]"
        >
          Instagram
        </a>
        <a
          href="https://discord.gg/aSkXPHhTjJ"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]"
        >
          Discord
        </a>
      </footer>

      {/* Audio Controls */}
      <AudioControls />
    </div>
  );
};

export default Index;