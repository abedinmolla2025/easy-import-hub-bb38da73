import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SplashScreen } from "@/components/SplashScreen";

type SplashMessage = {
  text?: string;
  textArabic?: string;
  textBengali?: string;
};

type SplashColors = {
  primary?: string;
  secondary?: string;
  accent?: string;
};

type SplashConfig = {
  lottieUrl?: string;
  logoUrl?: string;
  appName?: string;
  duration: number;
  fadeOutDuration: number;
  enabled: boolean;
  message?: SplashMessage;
  colors?: SplashColors;
  style?: 'elegant' | 'festive' | 'minimal' | 'royal' | 'spiritual';
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
        // Also pass logoUrl, appName, message, and colors from settings
        setConfig({
          enabled: true,
          lottieUrl: brandingValue?.lottieSplashUrl || undefined,
          logoUrl: brandingValue?.logoUrl || undefined,
          appName: brandingValue?.appName || undefined,
          duration: brandingValue?.splashDuration || DEFAULT_SPLASH_CONFIG.duration,
          fadeOutDuration: brandingValue?.splashFadeOut || DEFAULT_SPLASH_CONFIG.fadeOutDuration,
          message: brandingValue?.splashMessage || undefined,
          colors: brandingValue?.splashColors || undefined,
          style: brandingValue?.splashStyle || undefined,
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

  // Show splash screen - same component handles both loading and display states
  // The SplashScreen component will show for the full duration once rendered
  return (
    <>
      <SplashScreen
        lottieUrl={configLoaded ? config.lottieUrl : undefined}
        logoUrl={config.logoUrl}
        appName={config.appName}
        duration={config.duration}
        fadeOutDuration={config.fadeOutDuration}
        message={config.message}
        colors={config.colors}
        style={config.style}
        onComplete={() => setDone(true)}
      />
      {done && children}
    </>
  );
}
