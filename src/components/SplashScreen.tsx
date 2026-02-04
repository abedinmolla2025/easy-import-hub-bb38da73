import { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";

// Islamic geometric pattern SVG component
const IslamicPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
    <defs>
      <pattern id="islamicPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M10 0 L20 10 L10 20 L0 10 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#islamicPattern)" />
  </svg>
);

// Animated stars component
function AnimatedStars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 60}%`,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-300 rounded-full"
          style={{ left: s.left, top: s.top }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
}

// Crescent moon component
const CrescentMoon = () => (
  <motion.div
    className="absolute top-16 right-8 sm:top-20 sm:right-16"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1, delay: 0.3 }}
  >
    <div className="relative">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-lg shadow-amber-400/30" />
      <div className="absolute top-1 left-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0a1628]" />
    </div>
  </motion.div>
);

// Mosque silhouette component
const MosqueSilhouette = () => (
  <motion.div
    className="absolute bottom-0 left-0 right-0"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1, delay: 0.5 }}
  >
    <svg viewBox="0 0 400 120" className="w-full h-24 sm:h-32 text-emerald-900/80">
      {/* Main dome */}
      <ellipse cx="200" cy="60" rx="50" ry="40" fill="currentColor" />
      {/* Left minaret */}
      <rect x="80" y="30" width="12" height="90" fill="currentColor" />
      <ellipse cx="86" cy="30" rx="8" ry="12" fill="currentColor" />
      <rect x="83" y="18" width="6" height="12" fill="currentColor" />
      {/* Right minaret */}
      <rect x="308" y="30" width="12" height="90" fill="currentColor" />
      <ellipse cx="314" cy="30" rx="8" ry="12" fill="currentColor" />
      <rect x="311" y="18" width="6" height="12" fill="currentColor" />
      {/* Base structure */}
      <rect x="100" y="80" width="200" height="40" fill="currentColor" />
      {/* Side domes */}
      <ellipse cx="130" cy="80" rx="25" ry="20" fill="currentColor" />
      <ellipse cx="270" cy="80" rx="25" ry="20" fill="currentColor" />
      {/* Windows */}
      <rect x="180" y="85" width="15" height="25" rx="7" fill="#0a1628" opacity="0.5" />
      <rect x="205" y="85" width="15" height="25" rx="7" fill="#0a1628" opacity="0.5" />
    </svg>
  </motion.div>
);

export function SplashScreen(props: { 
  lottieUrl?: string; 
  logoUrl?: string;
  appName?: string;
  duration?: number;
  fadeOutDuration?: number;
  onComplete: () => void;
}) {
  const { lottieUrl, logoUrl, appName = "NOOR", duration = 3500, fadeOutDuration = 800, onComplete } = props;
  const [animationData, setAnimationData] = useState<any>(null);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Keep latest onComplete without re-starting timers
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Start timer (StrictMode-safe: effect runs twice but first timer is cleaned up)
  useEffect(() => {
    let cancelled = false;
    let doneTimer: number | undefined;

    const fadeTimer = window.setTimeout(() => {
      if (cancelled) return;
      setFadeOut(true);

      doneTimer = window.setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        onCompleteRef.current();
      }, fadeOutDuration);
    }, duration);

    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
      if (doneTimer) window.clearTimeout(doneTimer);
    };
  }, [duration, fadeOutDuration]);

  // Load lottie animation separately (optional)
  useEffect(() => {
    setAnimationData(null);

    if (!lottieUrl) {
      setLoadError(true);
      return;
    }

    setLoadError(false);

    let cancelled = false;

    fetch(lottieUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load lottie');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch((err) => {
        console.warn('[SplashScreen] Failed to load lottie, using fallback:', err);
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lottieUrl]);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0a1628 0%, #0d2818 50%, #134e29 100%)",
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: fadeOutDuration / 1000 }}
    >
      {/* Background elements */}
      <IslamicPattern />
      <AnimatedStars />
      <CrescentMoon />
      <MosqueSilhouette />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8">
        {/* Lottie animation or fallback */}
        {animationData && !loadError ? (
          <div className="w-full max-w-xs sm:max-w-sm">
            <Lottie animationData={animationData} loop={true} />
          </div>
        ) : (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Bismillah */}
            <motion.p
              className="text-2xl sm:text-3xl text-amber-200/90 font-arabic"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </motion.p>

            {/* App logo/icon */}
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(16, 185, 129, 0.3)",
                    "0 0 40px rgba(16, 185, 129, 0.5)",
                    "0 0 20px rgba(16, 185, 129, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/30 overflow-hidden"
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={appName}
                    className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
                  />
                ) : (
                  <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 text-white">
                    {/* Mosque icon */}
                    <ellipse cx="50" cy="35" rx="20" ry="15" fill="currentColor" />
                    <rect x="30" y="45" width="40" height="30" fill="currentColor" />
                    <rect x="20" y="25" width="6" height="50" fill="currentColor" />
                    <rect x="74" y="25" width="6" height="50" fill="currentColor" />
                    <ellipse cx="23" cy="25" rx="4" ry="6" fill="currentColor" />
                    <ellipse cx="77" cy="25" rx="4" ry="6" fill="currentColor" />
                    <rect x="21" y="17" width="4" height="8" fill="currentColor" />
                    <rect x="75" y="17" width="4" height="8" fill="currentColor" />
                    <rect x="45" y="55" width="10" height="20" rx="5" fill="#0d2818" />
                  </svg>
                )}
              </motion.div>
            </motion.div>

            {/* App name */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wider">{appName}</h1>
              <p className="mt-2 text-sm sm:text-base text-emerald-200/70">Islamic Companion</p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              className="flex items-center gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}