/**
 * AdSense safe loader – loads the script only in standard web browsers.
 * Never loads inside:
 *   - Android/iOS WebView (Capacitor / native wrapper)
 *   - PWA standalone mode
 *   - Embedded iframes
 */

let loaded = false;

function isWebViewOrEmbed(): boolean {
  if (typeof window === "undefined") return true;

  const ua = navigator.userAgent || "";

  // Capacitor / Cordova WebView
  if (/wv|WebView/i.test(ua)) return true;
  if ((window as any).Capacitor?.isNativePlatform?.()) return true;

  // Facebook / Instagram in-app browser
  if (/FBAN|FBAV|Instagram/i.test(ua)) return true;

  // PWA standalone mode
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  if ((navigator as any).standalone === true) return true;

  // Embedded iframe
  if (window.self !== window.top) return true;

  return false;
}

function isBot(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  return /bot|crawl|spider|slurp|baidu|yandex|duckduck/i.test(ua);
}

export function loadAdSense(publisherId?: string): void {
  if (loaded) return;
  if (!publisherId) return;
  if (isWebViewOrEmbed()) return;
  if (isBot()) return;

  // Check if admin route
  if (window.location.pathname.startsWith("/admin")) return;

  try {
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      // AdSense blocked (ad-blocker) – silently ignore
      console.info("[NOOR] AdSense script blocked or unavailable");
    };
    document.head.appendChild(script);
    loaded = true;
  } catch {
    // Fail silently – never crash the app
  }
}

export function isAdSenseReady(): boolean {
  return loaded && !isWebViewOrEmbed() && !isBot();
}
