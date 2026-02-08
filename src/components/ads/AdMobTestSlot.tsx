import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { AdPlacement } from "@/lib/ads";
import type { AdFormat } from "@/lib/mobileAdsService";
import {
  isMobileAdsAvailable,
  showBanner,
  hideBanner,
  showInterstitial,
} from "@/lib/mobileAdsService";

type Props = {
  placement: AdPlacement;
  format?: AdFormat;
  className?: string;
};

/**
 * Native-only AdMob ad slot.
 * Uses the centralised MobileAdsService — safe on web (renders nothing).
 */
export function AdMobTestSlot({ placement, format, className }: Props) {
  const resolvedFormat: AdFormat =
    format ?? (placement === "app_interstitial" ? "interstitial" : "banner");

  useEffect(() => {
    if (!isMobileAdsAvailable()) return;

    if (resolvedFormat === "banner") {
      showBanner();
      return () => { hideBanner(); };
    }

    if (resolvedFormat === "interstitial") {
      showInterstitial();
    }

    // rewarded ads should be triggered by user action, not on mount
  }, [resolvedFormat]);

  if (!isMobileAdsAvailable()) return null;

  if (resolvedFormat === "banner") {
    return (
      <Card
        className={"min-h-[56px] " + (className ?? "")}
        aria-label="AdMob banner placeholder"
      />
    );
  }

  return null;
}
