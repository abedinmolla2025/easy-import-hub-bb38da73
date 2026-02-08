import { useEffect, useRef } from "react";
import {
  isMobileAdsAvailable,
  initMobileAds,
  showBanner,
  hideBanner,
} from "@/lib/mobileAdsService";

/**
 * Hook: initialise AdMob SDK once on native platforms.
 * Place in App or a top-level component.
 */
export function useMobileAdsInit() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !isMobileAdsAvailable()) return;
    ran.current = true;
    initMobileAds();
  }, []);
}

/**
 * Hook: show / hide a banner ad while the component is mounted.
 * Only activates on native platforms.
 */
export function useBannerAd(enabled = true) {
  useEffect(() => {
    if (!enabled || !isMobileAdsAvailable()) return;

    showBanner();
    return () => {
      hideBanner();
    };
  }, [enabled]);
}
