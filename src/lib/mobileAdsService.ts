/**
 * MobileAdsService — centralised, platform-safe AdMob wrapper.
 *
 * Rules:
 *  • Only runs on native Capacitor (Android / iOS).
 *  • Never loads on web — avoids AdSense / AdMob collisions.
 *  • Gracefully fails if the plugin is missing or ads fail to load.
 *  • All ad-unit IDs come from environment variables at build time;
 *    falls back to Google's official TEST IDs during development.
 */

import { Capacitor } from "@capacitor/core";
import {
  ADMOB_TEST_BANNER_AD_UNIT_ID,
  ADMOB_TEST_INTERSTITIAL_AD_UNIT_ID,
  ADMOB_TEST_REWARDED_AD_UNIT_ID,
} from "@/lib/admobTestIds";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AdFormat = "banner" | "interstitial" | "rewarded";

export interface MobileAdConfig {
  bannerAdUnitId?: string;
  interstitialAdUnitId?: string;
  rewardedAdUnitId?: string;
  /** Set true during dev to use Google test IDs. Default: true */
  useTestIds?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Singleton state                                                    */
/* ------------------------------------------------------------------ */

let _initialised = false;
let _plugin: any = null;
let _activeBanner: any = null;

const isNative = Capacitor.isNativePlatform();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAdUnitId(format: AdFormat, cfg?: MobileAdConfig): string {
  const useTest = cfg?.useTestIds ?? true;

  if (format === "banner") {
    return (
      (!useTest && cfg?.bannerAdUnitId) ||
      import.meta.env.VITE_ADMOB_BANNER_ID ||
      ADMOB_TEST_BANNER_AD_UNIT_ID
    );
  }
  if (format === "interstitial") {
    return (
      (!useTest && cfg?.interstitialAdUnitId) ||
      import.meta.env.VITE_ADMOB_INTERSTITIAL_ID ||
      ADMOB_TEST_INTERSTITIAL_AD_UNIT_ID
    );
  }
  return (
    (!useTest && cfg?.rewardedAdUnitId) ||
    import.meta.env.VITE_ADMOB_REWARDED_ID ||
    ADMOB_TEST_REWARDED_AD_UNIT_ID
  );
}

async function loadPlugin() {
  if (_plugin) return _plugin;
  try {
    _plugin = await import("@admob-plus/capacitor");
    return _plugin;
  } catch {
    console.warn("[MobileAds] admob-plus plugin not available");
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Initialise AdMob SDK. Safe to call multiple times. */
export async function initMobileAds(): Promise<boolean> {
  if (!isNative || _initialised) return _initialised;

  try {
    const mod = await loadPlugin();
    if (!mod) return false;

    const { AdMobPlus } = mod as any;
    await AdMobPlus.start();
    _initialised = true;
    console.log("[MobileAds] SDK initialised");
    return true;
  } catch (err) {
    console.warn("[MobileAds] init failed:", err);
    return false;
  }
}

/** Show a banner ad at the bottom of the screen. */
export async function showBanner(cfg?: MobileAdConfig): Promise<boolean> {
  if (!isNative) return false;

  try {
    const ready = await initMobileAds();
    if (!ready) return false;

    const mod = await loadPlugin();
    if (!mod) return false;

    // Hide existing banner first
    await hideBanner();

    const { BannerAd } = mod as any;
    const adUnitId = getAdUnitId("banner", cfg);
    const banner = new BannerAd({ adUnitId });
    _activeBanner = banner;
    await banner.show();
    console.log("[MobileAds] banner shown");
    return true;
  } catch (err) {
    console.warn("[MobileAds] banner failed:", err);
    return false;
  }
}

/** Hide the current banner ad. */
export async function hideBanner(): Promise<void> {
  try {
    if (_activeBanner && typeof _activeBanner.hide === "function") {
      await _activeBanner.hide();
    }
  } catch {
    // ignore
  }
  _activeBanner = null;
}

/** Load and show an interstitial ad. */
export async function showInterstitial(cfg?: MobileAdConfig): Promise<boolean> {
  if (!isNative) return false;

  try {
    const ready = await initMobileAds();
    if (!ready) return false;

    const mod = await loadPlugin();
    if (!mod) return false;

    const { InterstitialAd } = mod as any;
    const adUnitId = getAdUnitId("interstitial", cfg);
    const ad = new InterstitialAd({ adUnitId });
    await ad.load();
    await ad.show();
    console.log("[MobileAds] interstitial shown");
    return true;
  } catch (err) {
    console.warn("[MobileAds] interstitial failed:", err);
    return false;
  }
}

/** Load and show a rewarded ad. Returns true if the user earned the reward. */
export async function showRewarded(cfg?: MobileAdConfig): Promise<boolean> {
  if (!isNative) return false;

  try {
    const ready = await initMobileAds();
    if (!ready) return false;

    const mod = await loadPlugin();
    if (!mod) return false;

    const { RewardedAd } = mod as any;
    const adUnitId = getAdUnitId("rewarded", cfg);
    const ad = new RewardedAd({ adUnitId });
    await ad.load();
    await ad.show();
    console.log("[MobileAds] rewarded shown");
    return true;
  } catch (err) {
    console.warn("[MobileAds] rewarded failed:", err);
    return false;
  }
}

/** Check whether mobile ads are available on this platform. */
export function isMobileAdsAvailable(): boolean {
  return isNative;
}
