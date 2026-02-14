import {
  Facebook,
  Youtube,
  Send,
  Mail,
  PlayCircle,
  Home,
  BookOpen,
  Clock,
  Calendar,
  ScrollText,
  Info,
  Phone,
  Shield,
  FileText,
  Map,
  HandHeart,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";

export type FooterLinksSettings = {
  playStoreUrl?: string;
  appStoreUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  footerText?: string;
  developerLine?: string;
};

function normalizeUrl(raw?: string) {
  const v = (raw ?? "").trim();
  return v.length ? v : undefined;
}

const quickLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Quran", path: "/quran", icon: BookOpen },
  { label: "Hadith", path: "/bukhari", icon: ScrollText },
  { label: "Islamic Calendar", path: "/calendar", icon: Calendar },
  { label: "Prayer Time", path: "/prayer-times", icon: Clock },
  { label: "Duas", path: "/dua", icon: HandHeart },
];

const legalLinks = [
  { label: "About Us", path: "/about", icon: Info },
  { label: "Contact Us", path: "/contact", icon: Phone },
  { label: "Privacy Policy", path: "/privacy-policy", icon: Shield },
  { label: "Terms & Conditions", path: "/terms", icon: FileText },
  { label: "Sitemap", path: "/sitemap.xml", icon: Map, external: true },
];

export default function FooterSection({
  settings,
  onNavigate,
  platform,
}: {
  settings?: FooterLinksSettings;
  onNavigate: (path: string) => void;
  platform: "web" | "app";
}) {
  const playStoreUrl = useMemo(() => normalizeUrl(settings?.playStoreUrl), [settings?.playStoreUrl]);
  const appStoreUrl = useMemo(() => normalizeUrl(settings?.appStoreUrl), [settings?.appStoreUrl]);
  const websiteUrl = useMemo(
    () => normalizeUrl(settings?.websiteUrl) ?? window.location.origin,
    [settings?.websiteUrl],
  );
  const facebookUrl = useMemo(() => normalizeUrl(settings?.facebookUrl), [settings?.facebookUrl]);
  const youtubeUrl = useMemo(() => normalizeUrl(settings?.youtubeUrl), [settings?.youtubeUrl]);
  const telegramUrl = useMemo(() => normalizeUrl(settings?.telegramUrl), [settings?.telegramUrl]);

  return (
    <footer
      className="mt-10 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      style={{
        background: "linear-gradient(135deg, #0f766e 0%, #065f46 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
          {/* ── Section 1: About ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Sparkles className="h-5 w-5 text-emerald-200" />
              <h3 className="text-lg font-bold text-white tracking-wide">
                Noor – Islamic App
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-emerald-100/90">
              Your daily companion for Prayer, Quran &amp; Islamic knowledge.
            </p>
            <p className="text-xs leading-relaxed text-emerald-200/70">
              আপনার দৈনিক নামাজ, কুরআন ও দীন শেখার সহজ সঙ্গী
            </p>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-3 pt-2 sm:justify-start">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="rounded-full bg-white/10 p-2 text-emerald-100 transition-all hover:bg-white/20 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="rounded-full bg-white/10 p-2 text-emerald-100 transition-all hover:bg-white/20 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                  className="rounded-full bg-white/10 p-2 text-emerald-100 transition-all hover:bg-white/20 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                >
                  <Send className="h-4 w-4" />
                </a>
              )}
              {/* Fallback social icons when none configured */}
              {!facebookUrl && !youtubeUrl && !telegramUrl && (
                <>
                  <span className="rounded-full bg-white/10 p-2 text-emerald-100/60">
                    <Facebook className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-white/10 p-2 text-emerald-100/60">
                    <Youtube className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-white/10 p-2 text-emerald-100/60">
                    <Send className="h-4 w-4" />
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Section 2: Quick Links ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
              Quick Links
            </h3>
            <div className="mx-auto h-px w-12 bg-emerald-400/30 sm:mx-0" />
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => onNavigate(link.path)}
                    className="group inline-flex items-center gap-2 text-sm text-emerald-100/80 transition-all hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                  >
                    <link.icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Section 3: Legal & Support ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
              Legal &amp; Support
            </h3>
            <div className="mx-auto h-px w-12 bg-emerald-400/30 sm:mx-0" />
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  {link.external ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 text-sm text-emerald-100/80 transition-all hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                    >
                      <link.icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                      <span>{link.label}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigate(link.path)}
                      className="group inline-flex items-center gap-2 text-sm text-emerald-100/80 transition-all hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                    >
                      <link.icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                      <span>{link.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Section 4: App Downloads ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
              App Download
            </h3>
            <div className="mx-auto h-px w-12 bg-emerald-400/30 sm:mx-0" />
            <div className="flex flex-col items-center gap-3 sm:items-start">
              {platform === "app" ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-md transition-all hover:shadow-lg hover:shadow-emerald-900/20"
                >
                  Visit our website
                </a>
              ) : (
                <>
                  {playStoreUrl ? (
                    <a
                      href={playStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-md transition-all hover:shadow-lg hover:shadow-emerald-900/20"
                    >
                      <PlayCircle className="h-5 w-5" />
                      Google Play Store
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-md">
                      <PlayCircle className="h-5 w-5" />
                      Google Play Store
                    </span>
                  )}

                  {appStoreUrl ? (
                    <a
                      href={appStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-white/70 hover:bg-white/10"
                    >
                      App Store
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-white/30 px-5 py-2.5 text-sm text-emerald-200/70">
                      App Store
                    </span>
                  )}

                  <p className="text-[11px] text-emerald-300/60 italic">Coming Soon</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        {/* ── Copyright ── */}
        <div className="text-center">
          <p className="text-xs text-emerald-100/70">
            © {new Date().getFullYear()} Noor App. All rights reserved.
          </p>
          <p className="mt-1 text-[11px] text-emerald-200/50">
            Developed by Abedin Molla
          </p>
        </div>
      </div>
    </footer>
  );
}
