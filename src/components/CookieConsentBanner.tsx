import { useState, useEffect } from "react";
import { X } from "lucide-react";

const CONSENT_KEY = "noor_cookie_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[100] px-3 pb-2 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-lg mx-auto bg-card border border-border/80 rounded-2xl shadow-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use cookies and similar technologies to improve your experience and show relevant ads.
            By continuing, you agree to our{" "}
            <a href="/privacy-policy" className="text-primary underline">
              Privacy Policy
            </a>
            .
            <br />
            <span className="font-bangla">
              আমরা আপনার অভিজ্ঞতা উন্নত করতে ও প্রাসঙ্গিক বিজ্ঞাপন দেখাতে কুকিজ ব্যবহার করি।
            </span>
          </p>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-full hover:bg-muted/60 shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 bg-primary text-primary-foreground text-xs font-semibold rounded-xl py-2 px-4 hover:bg-primary/90 transition-colors"
          >
            Accept / সম্মত
          </button>
          <a
            href="/privacy-policy"
            className="text-xs text-muted-foreground underline self-center px-2"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}
