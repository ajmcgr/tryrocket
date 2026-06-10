import { Link } from "react-router-dom";
import HandleReserveForm from "@/components/HandleReserveForm";
import AudioControls from "@/components/AudioControls";
import backgroundVideo from "@/assets/background.mov.asset.json";

const Reserve = () => {
  const shareSubject = encodeURIComponent("Reserve your founder handle on Rocket");
  const shareBody = encodeURIComponent("Check out https://tryrocket.ai/reserve — reserve your founder handle on Rocket.");
  const tweet = encodeURIComponent("Reserve your founder handle on Rocket 🚀 https://tryrocket.ai/reserve");

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden">
      <video
        autoPlay loop muted playsInline
        // @ts-ignore
        webkit-playsinline="true"
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover bg-background"
      >
        <source src={backgroundVideo.url} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/50" />

      <main className="relative z-10 flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6 py-20">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <h1
            className="animate-fade-in-up-delay-1 text-5xl font-medium leading-[1.05] tracking-tight text-cream text-glow sm:text-6xl md:text-7xl"
            style={{ fontFamily: "Reckless, serif" }}
          >
            Reserve Your Handle
          </h1>
          <p className="animate-fade-in-up-delay-2 mt-6 max-w-md text-base font-light tracking-wide text-cream/80 text-glow-sm sm:text-xl">
            Reserve your identity. Build your brand.
          </p>

          <div className="animate-fade-in-up-delay-3 mt-12 w-full">
            <HandleReserveForm />

            <p className="mt-6 text-center text-xs text-cream/50">
              <a href={`mailto:?subject=${shareSubject}&body=${shareBody}`} className="hover:text-cream/80">Share via email</a>
              {" · "}
              <a href={`https://x.com/intent/tweet?text=${tweet}`} target="_blank" rel="noopener noreferrer" className="hover:text-cream/80">Post on X</a>
            </p>

            <p className="mt-8 text-center">
              <Link to="/" className="text-sm text-cream/70 hover:text-cream">Take me to Rocket →</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-4 px-6 pb-6">
        <span className="text-xs text-cream/30">© Rocket 2026</span>
        <a href="mailto:alex@trylaunch.ai" className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]">Contact</a>
        <a href="https://x.com/tryrocketai" target="_blank" rel="noopener noreferrer" className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]">X</a>
        <a href="https://www.instagram.com/tryrocketai/" target="_blank" rel="noopener noreferrer" className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]">Instagram</a>
        <a href="https://discord.gg/aSkXPHhTjJ" target="_blank" rel="noopener noreferrer" className="text-xs text-cream/30 transition-colors hover:text-[#FFFFFF]">Discord</a>
      </footer>

      <AudioControls />
    </div>
  );
};

export default Reserve;