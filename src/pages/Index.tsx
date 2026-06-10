import WaitlistForm from "@/components/WaitlistForm";
import AudioControls from "@/components/AudioControls";
import backgroundVideo from "@/assets/background.mov.asset.json";

const Index = () => {
  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        // @ts-ignore
        webkit-playsinline="true"
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover bg-background"
      >
        <source src={backgroundVideo.url} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/50" />

      {/* Content */}
      <main className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6 py-20">
        <div className="flex max-w-2xl flex-col items-center text-center">
          <h1 className="animate-fade-in-up-delay-1 text-5xl font-medium sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-cream text-glow" style={{ fontFamily: 'Reckless, serif' }}>
            Rocket
          </h1>

          <p className="animate-fade-in-up-delay-2 mt-6 text-base sm:text-xl font-light tracking-wide text-cream/80 text-glow-sm">
            The fastest way for vibe coders to turn ideas into products.
          </p>

          <div className="animate-fade-in-up-delay-3 mt-12 w-full">
            <WaitlistForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-4 px-6 pb-6">
        <span className="text-xs text-cream/30">
          © Rocket 2026
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
