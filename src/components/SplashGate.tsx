import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SplashScreen } from "@/components/SplashScreen";

type SplashConfig = {
  lottieUrl?: string;
  duration: number;
  fadeOutDuration: number;
  enabled: boolean;
};

// Default splash configuration - always show beautiful Islamic splash
const DEFAULT_SPLASH_CONFIG: SplashConfig = {
  enabled: true,
  duration: 3500,
  fadeOutDuration: 800,
};

/**
 * Ensures splash overlay is visible while we fetch splash config.
 * On slower devices (native WebView), fetching can be slow enough that
 * the previous approach never rendered anything because splashConfig was null.
 */
export function SplashGate(props: { children: React.ReactNode }) {
  const { children } = props;

  const [done, setDone] = useState(false);
  const [config, setConfig] = useState<SplashConfig>(DEFAULT_SPLASH_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchActiveSplash = async () => {
      try {
        // Try to get branding settings from app_settings table
        const { data: brandingData } = await supabase
          .from("app_settings")
          .select("setting_value")
          .eq("setting_key", "branding")
          .maybeSingle();

        if (cancelled) return;

        const brandingValue = brandingData?.setting_value as any;
        
        // Check if splash is explicitly disabled
        if (brandingValue?.splashEnabled === false) {
          setDone(true);
          return;
        }

        // Use custom lottie if provided, otherwise use beautiful fallback
        setConfig({
          enabled: true,
          lottieUrl: brandingValue?.lottieSplashUrl || undefined,
          duration: brandingValue?.splashDuration || DEFAULT_SPLASH_CONFIG.duration,
          fadeOutDuration: brandingValue?.splashFadeOut || DEFAULT_SPLASH_CONFIG.fadeOutDuration,
        });
      } catch {
        // On error, still show default splash
        if (!cancelled) {
          setConfig(DEFAULT_SPLASH_CONFIG);
        }
      } finally {
        if (!cancelled) setConfigLoaded(true);
      }
    };

    fetchActiveSplash();

    return () => {
      cancelled = true;
    };
  }, []);

  // Already finished showing splash
  if (done) return <>{children}</>;

  // While we are fetching config, show the splash (with loading state)
  if (!configLoaded) {
    return (
      <SplashScreen
        duration={DEFAULT_SPLASH_CONFIG.duration}
        fadeOutDuration={DEFAULT_SPLASH_CONFIG.fadeOutDuration}
        onComplete={() => setDone(true)}
      />
    );
  }

  // Splash is disabled
  if (!config.enabled) return <>{children}</>;

  // Show configured splash screen
  return (
    <>
      <SplashScreen
        lottieUrl={config.lottieUrl}
        duration={config.duration}
        fadeOutDuration={config.fadeOutDuration}
        onComplete={() => setDone(true)}
      />
      {done && children}
    </>
  );
}
