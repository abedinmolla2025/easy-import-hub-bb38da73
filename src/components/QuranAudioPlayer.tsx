import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface QuranAudioPlayerProps {
  audioUrl: string;
  ayahNumber: number;
  surahName?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const QuranAudioPlayer = ({
  audioUrl,
  ayahNumber,
  surahName = "কুরআন",
  onNext,
  onPrevious,
  hasNext = true,
  hasPrevious = true,
}: QuranAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  // --- Wake Lock: keep screen/CPU awake while playing ---
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current?.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      // Wake Lock not supported or denied
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  // Re-acquire wake lock when page becomes visible again (e.g. unlock screen)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        requestWakeLock();
        // Also ensure audio is still playing after visibility change
        if (audioRef.current && audioRef.current.paused && isPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isPlaying, requestWakeLock]);

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => releaseWakeLock();
  }, [releaseWakeLock]);

  // --- Media Session for lock-screen controls ---
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `আয়াত ${ayahNumber}`,
      artist: surahName,
      album: "আল-কুরআন আল-কারীম",
      artwork: [
        { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (hasPrevious && onPrevious) onPrevious();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (hasNext && onNext) onNext();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [ayahNumber, surahName, hasNext, hasPrevious, onNext, onPrevious]);

  // Update media session position state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !audioRef.current) return;
    const audio = audioRef.current;
    const updatePosition = () => {
      if (audio.duration && isFinite(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {}
      }
    };
    audio.addEventListener("timeupdate", updatePosition);
    return () => audio.removeEventListener("timeupdate", updatePosition);
  }, [audioUrl]);

  // --- Audio source management ---
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = speed;
      audioRef.current.load();
      setProgress(0);

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          requestWakeLock();
        })
        .catch((err) => {
          console.log("Autoplay prevented:", err);
          setIsPlaying(false);
        });
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        releaseWakeLock();
      } else {
        audioRef.current.play();
        requestWakeLock();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setSpeed(SPEED_OPTIONS[nextIndex]);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (onNext && hasNext) {
      onNext();
    } else {
      releaseWakeLock();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-0 right-0 mx-3 bg-card/98 backdrop-blur-lg rounded-2xl shadow-lg border border-primary/30 p-4"
    >
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "paused";
          }
        }}
      />

      {/* Seekable Progress Bar */}
      <div
        className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden cursor-pointer touch-none"
        onClick={handleSeek}
        onTouchStart={handleSeek}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-200 shadow-glow"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={cycleSpeed}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold min-w-[45px] hover:bg-primary/30 transition-colors border border-primary/30"
        >
          {speed}x
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-glow"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={toggleMute}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-5 h-5 text-primary" />
          )}
        </button>
      </div>

      <div className="text-center mt-2">
        <span className="text-xs text-primary font-medium">আয়াত {ayahNumber}</span>
      </div>
    </motion.div>
  );
};

export default QuranAudioPlayer;
