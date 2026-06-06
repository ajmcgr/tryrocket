import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import meteorAudio from "@/assets/meteor.mp3.asset.json";

const AudioControls = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.4;

    // Try to autoplay
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Browser blocked autoplay — start on first user interaction
      const resumeAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
        document.removeEventListener("click", resumeAudio);
        document.removeEventListener("touchstart", resumeAudio);
      };
      document.addEventListener("click", resumeAudio, { once: true });
      document.addEventListener("touchstart", resumeAudio, { once: true });
    });
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <audio ref={audioRef} src={meteorAudio.url} loop preload="auto" />
      <button
        onClick={togglePlay}
        className="rounded-full border border-cream/20 bg-background/30 p-2.5 text-cream/60 backdrop-blur-sm transition-colors hover:text-[#FFFFFF]"
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default AudioControls;
