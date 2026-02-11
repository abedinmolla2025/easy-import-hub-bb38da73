import { useState, useEffect, useMemo } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone, Play, X, Maximize2, Eye } from 'lucide-react';

interface SplashScreenPreviewProps {
  lottieUrl?: string;
  logoUrl?: string;
  appName?: string;
  duration: number;
  fadeOutDuration: number;
  // Optional seasonal message
  message?: {
    text?: string;
    textArabic?: string;
    textBengali?: string;
  };
  // Custom colors from template
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

const DEVICE_SIZES = {
  mobile: { width: 390, height: 844, label: 'iPhone 13', icon: Smartphone },
  tablet: { width: 768, height: 1024, label: 'iPad', icon: Tablet },
  desktop: { width: 1440, height: 900, label: 'Desktop', icon: Monitor },
};

// Islamic pattern for fallback
const IslamicPatternPreview = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
    <defs>
      <pattern id="islamicPatternPreview" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M10 0 L20 10 L10 20 L0 10 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#islamicPatternPreview)" />
  </svg>
);

// Animated stars for fallback
function AnimatedStarsPreview() {
  const stars = useMemo(
    () =>
      Array.from({ length: 15 }, () => ({
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

// Crescent moon for fallback
const CrescentMoonPreview = () => (
  <motion.div
    className="absolute top-4 right-4"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <div className="relative">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-lg" />
      <div className="absolute top-0.5 left-1.5 w-6 h-6 rounded-full bg-[#0a1628]" />
    </div>
  </motion.div>
);

// Fallback splash content with message support
function FallbackSplashContent({ 
  logoUrl, 
  appName, 
  message,
  colors 
}: { 
  logoUrl?: string; 
  appName?: string;
  message?: {
    text?: string;
    textArabic?: string;
    textBengali?: string;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}) {
  return (
    <>
      <IslamicPatternPreview />
      <AnimatedStarsPreview />
      <CrescentMoonPreview />

      <div className="relative z-10 flex flex-col items-center justify-center px-4">
        <motion.p
          className="text-sm text-amber-200/90 font-arabic mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </motion.p>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 10px rgba(16, 185, 129, 0.3)",
                "0 0 20px rgba(16, 185, 129, 0.5)",
                "0 0 10px rgba(16, 185, 129, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl overflow-hidden"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="w-14 h-14 object-contain" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-white">
                <ellipse cx="50" cy="35" rx="20" ry="15" fill="currentColor" />
                <rect x="30" y="45" width="40" height="30" fill="currentColor" />
                <rect x="20" y="25" width="6" height="50" fill="currentColor" />
                <rect x="74" y="25" width="6" height="50" fill="currentColor" />
              </svg>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="text-center mt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-lg font-bold text-white tracking-wider">{appName || "NOOR"}</h1>
          <p className="text-xs text-emerald-200/70">Islamic Companion</p>
        </motion.div>

        {/* Seasonal Message - Beautiful Typography */}
        {message && (
          <motion.div
            className="text-center mt-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
          >
            {/* Arabic text */}
            {message.textArabic && (
              <motion.p
                className="text-sm font-arabic text-amber-200/90 mb-1"
                style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.3)' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {message.textArabic}
              </motion.p>
            )}
            
            {/* Main message with gradient */}
            <motion.h2
              className="text-sm font-bold tracking-wide"
              style={{
                background: colors?.accent 
                  ? `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})`
                  : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {message.text}
            </motion.h2>

            {/* Bengali text */}
            {message.textBengali && (
              <motion.p
                className="text-xs text-white/80 mt-0.5"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {message.textBengali}
              </motion.p>
            )}
          </motion.div>
        )}

        <motion.div
          className="flex items-center gap-1 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: message ? 0.9 : 0.5 }}
        >
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay }}
            />
          ))}
        </motion.div>
      </div>
    </>
  );
}

export function SplashScreenPreview({ lottieUrl, logoUrl, appName, duration, fadeOutDuration, message, colors }: SplashScreenPreviewProps) {
  const [device, setDevice] = useState<keyof typeof DEVICE_SIZES>('mobile');
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  const currentDevice = DEVICE_SIZES[device];
  const useFallback = !animationData || loadError;

  useEffect(() => {
    if (!lottieUrl) {
      setLoadError(true);
      return;
    }

    setLoading(true);
    setLoadError(false);
    
    fetch(lottieUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load animation');
        return res.json();
      })
      .then((data) => {
        setAnimationData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, [lottieUrl]);

  const handlePlay = () => {
    setIsPlaying(true);
    setVisible(true);
    setFadeOut(false);

    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        setIsPlaying(false);
      }, fadeOutDuration);
    }, duration);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setVisible(true);
    setFadeOut(false);
  };

  const handleFullscreenPreview = () => {
    setFullscreenPreview(true);
    setTimeout(() => {
      setFullscreenPreview(false);
    }, duration + fadeOutDuration);
  };

  return (
    <>
      {/* Fullscreen Preview Overlay */}
      {fullscreenPreview && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: colors 
              ? `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              : "linear-gradient(180deg, #0a1628 0%, #0d2818 50%, #134e29 100%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {useFallback ? (
            <FallbackSplashContent logoUrl={logoUrl} appName={appName} message={message} colors={colors} />
          ) : (
            <div className="w-full max-w-md px-8">
              <Lottie animationData={animationData} loop={true} />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => setFullscreenPreview(false)}
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Live Preview</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(DEVICE_SIZES).map(([key, { label, icon: Icon }]) => (
                <Button
                  key={key}
                  variant={device === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDevice(key as keyof typeof DEVICE_SIZES)}
                  className="gap-1"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              {currentDevice.width}px × {currentDevice.height}px
              {useFallback && <span className="ml-2 text-amber-600">(Fallback view)</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleFullscreenPreview} size="sm" variant="outline" className="gap-1">
                <Maximize2 className="h-4 w-4" />
                Fullscreen
              </Button>
              {!isPlaying ? (
                <Button onClick={handlePlay} size="sm" disabled={loading}>
                  <Play className="mr-1 h-4 w-4" />
                  Play
                </Button>
              ) : (
                <Button onClick={handleStop} size="sm" variant="outline">
                  <X className="mr-1 h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          {/* Device Frame */}
          <div className="flex items-center justify-center bg-muted/30 p-4 sm:p-8 rounded-lg overflow-hidden">
            <div
              className="relative bg-background border-4 border-foreground/10 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                width: `${Math.min(currentDevice.width * 0.4, 280)}px`,
                height: `${Math.min(currentDevice.height * 0.4, 500)}px`,
              }}
            >
              {/* Splash Screen Simulation */}
              {isPlaying && visible && (
                <div
                  className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
                  style={{
                    background: colors 
                      ? `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                      : "linear-gradient(180deg, #0a1628 0%, #0d2818 50%, #134e29 100%)",
                    opacity: fadeOut ? 0 : 1,
                    transition: `opacity ${fadeOutDuration}ms ease-out`,
                  }}
                >
                  {useFallback ? (
                    <FallbackSplashContent logoUrl={logoUrl} appName={appName} message={message} colors={colors} />
                  ) : (
                    <div className="w-full max-w-[80%] px-4">
                      <Lottie animationData={animationData} loop={true} />
                    </div>
                  )}
                </div>
              )}

              {/* Static Preview (not playing) */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: colors 
                      ? `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                      : "linear-gradient(180deg, #0a1628 0%, #0d2818 50%, #134e29 100%)",
                  }}
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <p className="text-xs text-white/70">লোড হচ্ছে...</p>
                    </div>
                  ) : (
                    <FallbackSplashContent logoUrl={logoUrl} appName={appName} message={message} colors={colors} />
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={handlePlay}>
                    <div className="bg-white/20 rounded-full p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* App Content Behind (shown after splash) */}
              {isPlaying && !visible && (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-background">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">App Content</p>
                  <p className="text-xs text-muted-foreground">Splash শেষ!</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{(duration / 1000).toFixed(1)}s</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fade Out</p>
              <p className="text-sm font-medium">{fadeOutDuration}ms</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-medium">{((duration + fadeOutDuration) / 1000).toFixed(1)}s</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}