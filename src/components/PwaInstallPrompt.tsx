import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import noorLogo from "@/assets/noor-logo.png";

const COOLDOWN_KEY = "pwa-install-dismissed-at";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const promptReady = useRef(false);

  useEffect(() => {
    // Only target mobile Android Chrome
    const ua = navigator.userAgent;
    const isAndroidChrome =
      /android/i.test(ua) && /chrome/i.test(ua) && !/edg/i.test(ua);
    if (!isAndroidChrome) return;

    // Already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone
    )
      return;

    // Cooldown
    const dismissedAt = localStorage.getItem(COOLDOWN_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      console.log("PWA install prompt available");
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      promptReady.current = true;
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show popup on first user interaction (click or scroll) once prompt is ready
  useEffect(() => {
    if (!deferredPrompt) return;

    const show = () => {
      if (!promptReady.current) return;
      setVisible(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("click", show);
      window.removeEventListener("scroll", show, true);
    };

    window.addEventListener("click", show, { once: true });
    window.addEventListener("scroll", show, { once: true, capture: true });

    return cleanup;
  }, [deferredPrompt]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  }, []);

  return (
    <AnimatePresence>
      {visible && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-24 left-3 right-3 z-50 mx-auto max-w-sm"
        >
          <div className="relative rounded-2xl border border-border bg-card p-4 shadow-xl shadow-black/20">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={noorLogo}
                alt="Noor App"
                className="h-12 w-12 rounded-xl"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Install Noor Islamic App
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get faster access from your home screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97]"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted active:scale-[0.97]"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
