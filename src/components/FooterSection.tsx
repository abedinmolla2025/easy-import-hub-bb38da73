import {
  Facebook,
  Mail,
  MessageCircle,
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
} from "lucide-react";
import { useMemo } from "react";

export type FooterLinksSettings = {
  playStoreUrl?: string;
  appStoreUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  footerText?: string;
  developerLine?: string;
};

function normalizeUrl(raw?: string) {
  const v = (raw ?? "").trim();
  return v.length ? v : undefined;
}

function normalizeEmail(raw?: string) {
  const v = (raw ?? "").trim();
  if (!v) return undefined;
  if (v.startsWith("mailto:")) return v;
  if (v.includes("@")) return `mailto:${v}`;
  return v;
}

const quickLinks = [
  { label: "হোম", labelEn: "Home", path: "/", icon: Home },
  { label: "কুরআন", labelEn: "Quran", path: "/quran", icon: BookOpen },
  { label: "হাদিস", labelEn: "Hadith", path: "/bukhari", icon: ScrollText },
  { label: "নামাজের সময়", labelEn: "Prayer Times", path: "/prayer-times", icon: Clock },
  { label: "ক্যালেন্ডার", labelEn: "Calendar", path: "/calendar", icon: Calendar },
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
    [settings?.websiteUrl]
  );
  const mailto = useMemo(() => normalizeEmail(settings?.contactEmail), [settings?.contactEmail]);
  const facebookUrl = useMemo(() => normalizeUrl(settings?.facebookUrl), [settings?.facebookUrl]);
  const whatsappUrl = useMemo(() => normalizeUrl(settings?.whatsappUrl), [settings?.whatsappUrl]);

  return (
    <footer className="mt-8 border-t border-border/50 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main grid — stacked on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
          {/* ── About ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Noor</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Daily Prayer, Quran, Hadith &amp; Islamic content — আপনার দৈনিক দ্বীনি রুটিনের ছোট সাথী।
            </p>

            {/* Social icons */}
            <div className="flex items-center justify-center gap-3 pt-1 sm:justify-start">
              {mailto && (
                <a href={mailto} aria-label="Email" className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => onNavigate(link.path)}
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal & Support ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Legal &amp; Support</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  {link.external ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <link.icon className="h-3.5 w-3.5" />
                      <span>{link.label}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigate(link.path)}
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <link.icon className="h-3.5 w-3.5" />
                      <span>{link.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ── App Downloads ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">App Downloads</h3>
            <div className="flex flex-col items-center gap-2 sm:items-start">
              {platform === "app" ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:brightness-105 transition-all"
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
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:brightness-105 transition-all"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Google Play Store
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground">
                      <PlayCircle className="h-4 w-4" />
                      Play Store (Coming Soon)
                    </span>
                  )}

                  {appStoreUrl ? (
                    <a
                      href={appStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all"
                    >
                      App Store
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-xs text-muted-foreground">
                      App Store (Coming Soon)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-8 border-t border-border/50 pt-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Noor App. All rights reserved.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            Developed by Abedin Molla
          </p>
        </div>
      </div>
    </footer>
  );
}
