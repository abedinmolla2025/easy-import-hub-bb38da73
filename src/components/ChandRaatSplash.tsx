import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Floating Lantern ── */
function Lantern({ delay, x, size }: { delay: number; x: string; size: number }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, bottom: -40 }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -800, opacity: [0, 1, 1, 0.6, 0] }}
      transition={{ duration: 8 + Math.random() * 4, delay, repeat: Infinity, ease: "easeOut" }}
    >
      <div
        className="relative"
        style={{ width: size, height: size * 1.4 }}
      >
        {/* Lantern body */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)",
            boxShadow: `0 0 ${size}px rgba(251,191,36,0.5), 0 0 ${size * 2}px rgba(251,191,36,0.2)`,
            borderRadius: "30% 30% 40% 40%",
          }}
        />
        {/* Inner glow */}
        <div
          className="absolute inset-2 rounded-md opacity-60"
          style={{
            background: "radial-gradient(circle, #fef3c7 0%, #fbbf24 100%)",
            borderRadius: "30% 30% 40% 40%",
          }}
        />
        {/* Top cap */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-700 rounded-sm"
          style={{ width: size * 0.4, height: 4 }}
        />
      </div>
    </motion.div>
  );
}

/* ── Shimmer Particles ── */
function ShimmerParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 3,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 3,
        color: Math.random() > 0.5 ? "#fbbf24" : "#fef3c7",
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Large Crescent Moon ── */
function GlowingMoon() {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 80 }}
    >
      {/* Outer glow rings */}
      <motion.div
        className="absolute -inset-12 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute -inset-6 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />

      {/* Moon body */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 30%, #fbbf24 60%, #f59e0b 100%)",
            boxShadow: "0 0 60px rgba(251,191,36,0.6), 0 0 120px rgba(251,191,36,0.3), inset 0 -4px 10px rgba(217,119,6,0.3)",
          }}
        />
        {/* Moon cutout for crescent */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: -8,
            left: 28,
            width: "80%",
            height: "80%",
            background: "linear-gradient(180deg, #0c1445 0%, #0f1b4d 50%, #091235 100%)",
            boxShadow: "inset 0 0 20px rgba(15,27,77,0.5)",
          }}
          initial={{ left: 60, opacity: 0 }}
          animate={{ left: 28, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
      </div>

      {/* Single star near moon */}
      <motion.div
        className="absolute -top-4 -right-2"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ── Mosque Skyline (more detailed) ── */
function MosqueSkyline() {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.8 }}
    >
      <svg viewBox="0 0 400 100" className="w-full h-20 sm:h-28" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="mosqueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0c1445" />
          </linearGradient>
        </defs>
        {/* Left minaret */}
        <rect x="40" y="20" width="8" height="80" fill="url(#mosqueGrad)" />
        <ellipse cx="44" cy="20" rx="6" ry="10" fill="url(#mosqueGrad)" />
        <rect x="41" y="8" width="6" height="14" fill="url(#mosqueGrad)" />
        <circle cx="44" cy="6" r="3" fill="#fbbf24" opacity="0.8" />

        {/* Left small dome */}
        <ellipse cx="100" cy="65" rx="22" ry="18" fill="url(#mosqueGrad)" />
        <rect x="78" y="65" width="44" height="35" fill="url(#mosqueGrad)" />

        {/* Main dome */}
        <ellipse cx="200" cy="40" rx="45" ry="35" fill="url(#mosqueGrad)" />
        <rect x="155" y="55" width="90" height="45" fill="url(#mosqueGrad)" />
        <rect x="196" y="5" width="8" height="20" fill="url(#mosqueGrad)" />
        <circle cx="200" cy="3" r="4" fill="#fbbf24" opacity="0.8" />

        {/* Right small dome */}
        <ellipse cx="300" cy="65" rx="22" ry="18" fill="url(#mosqueGrad)" />
        <rect x="278" y="65" width="44" height="35" fill="url(#mosqueGrad)" />

        {/* Right minaret */}
        <rect x="352" y="20" width="8" height="80" fill="url(#mosqueGrad)" />
        <ellipse cx="356" cy="20" rx="6" ry="10" fill="url(#mosqueGrad)" />
        <rect x="353" y="8" width="6" height="14" fill="url(#mosqueGrad)" />
        <circle cx="356" cy="6" r="3" fill="#fbbf24" opacity="0.8" />

        {/* Windows on main dome */}
        <rect x="185" y="60" width="10" height="18" rx="5" fill="#0c1445" opacity="0.6" />
        <rect x="205" y="60" width="10" height="18" rx="5" fill="#0c1445" opacity="0.6" />

        {/* Ground line */}
        <rect x="0" y="95" width="400" height="5" fill="#0c1445" />
      </svg>
    </motion.div>
  );
}

/* ── Main Component ── */
export function ChandRaatSplash({
  logoUrl,
  appName = "NOOR",
  duration = 4500,
  fadeOutDuration = 800,
  onComplete,
}: {
  logoUrl?: string;
  appName?: string;
  duration?: number;
  fadeOutDuration?: number;
  onComplete: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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

  if (!visible) return null;

  const lanterns = [
    { delay: 0, x: "10%", size: 18 },
    { delay: 1.5, x: "25%", size: 14 },
    { delay: 0.8, x: "55%", size: 16 },
    { delay: 2.2, x: "75%", size: 20 },
    { delay: 3, x: "90%", size: 12 },
    { delay: 1, x: "40%", size: 15 },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #030b2e 0%, #0c1445 35%, #0f1b4d 60%, #1a1040 100%)",
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: fadeOutDuration / 1000 }}
    >
      {/* Shimmer particles */}
      <ShimmerParticles />

      {/* Floating lanterns */}
      {lanterns.map((l, i) => (
        <Lantern key={i} delay={l.delay} x={l.x} size={l.size} />
      ))}

      {/* Mosque skyline */}
      <MosqueSkyline />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6">
        {/* Arabic greeting */}
        <motion.p
          className="text-3xl sm:text-4xl font-arabic text-amber-200/90"
          style={{
            textShadow: "0 0 30px rgba(251,191,36,0.4)",
            fontFamily: "'Scheherazade New', 'Amiri', serif",
          }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          لَيْلَةُ الْهِلَالِ
        </motion.p>

        {/* Moon */}
        <GlowingMoon />

        {/* Bengali Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-wide"
            style={{
              fontFamily: "'Noto Serif Bengali', 'Hind Siliguri', serif",
              background: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 40%, #f59e0b 70%, #d97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(251,191,36,0.3))",
            }}
          >
            চাঁদ রাত মোবারক
          </h1>
        </motion.div>

        {/* Eid Mubarak subtitle */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, type: "spring", stiffness: 120 }}
        >
          <p
            className="text-xl sm:text-2xl font-arabic text-amber-100/80"
            style={{
              fontFamily: "'Scheherazade New', 'Amiri', serif",
              textShadow: "0 0 15px rgba(251,191,36,0.25)",
            }}
          >
            عِيدُ الْفِطْرِ مُبَارَكٌ
          </p>
          <p className="text-sm sm:text-base text-amber-200/60 mt-1" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
            ঈদুল ফিতরের শুভেচ্ছা
          </p>
        </motion.div>

        {/* Divider line */}
        <motion.div
          className="w-32 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, #fbbf24, transparent)",
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        />

        {/* App logo & name */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
        >
          {logoUrl && (
            <motion.img
              src={logoUrl}
              alt={appName}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain"
              style={{
                boxShadow: "0 0 15px rgba(251,191,36,0.3)",
              }}
              animate={{
                boxShadow: [
                  "0 0 15px rgba(251,191,36,0.3)",
                  "0 0 25px rgba(251,191,36,0.5)",
                  "0 0 15px rgba(251,191,36,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <span className="text-lg sm:text-xl font-bold text-white/80 tracking-widest">
            {appName}
          </span>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="flex items-center gap-2 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400/80"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: d }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
