import {
  Home,
  BookOpen,
  Clock,
  Calendar,
  ScrollText,
  PlayCircle,
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

const quickLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Quran", path: "/quran", icon: BookOpen },
  { label: "Hadith", path: "/bukhari", icon: ScrollText },
  { label: "Prayer Time", path: "/prayer-times", icon: Clock },
  { label: "Calendar", path: "/calendar", icon: Calendar },
];

const legalLinks = [
  { label: "About Us", path: "/about" },
  { label: "Contact Us", path: "/contact" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms & Conditions", path: "/terms" },
  { label: "Sitemap", path: "/sitemap.xml", external: true },
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
  const playStoreUrl = useMemo(
    () => (settings?.playStoreUrl ?? "").trim() || undefined,
    [settings?.playStoreUrl]
  );
  const websiteUrl = useMemo(
    () => (settings?.websiteUrl ?? "").trim() || window.location.origin,
    [settings?.websiteUrl]
  );

  return (
    <footer className="mt-8 border-t border-border bg-background pt-6 pb-4">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Quick Links Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-center sm:text-left">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </button>
          ))}
        </div>

        {/* Legal Links Row */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-center sm:text-left">
          {legalLinks.map((link) =>
            link.external ? (
              <a
                key={link.path}
                href={link.path}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            )
          )}
        </div>

        {/* App Download */}
        <div className="mt-6 text-center">
          {platform === "app" ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-105 transition-all"
            >
              Visit our website
            </a>
          ) : (
            <a
              href={playStoreUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-105 transition-all"
            >
              <PlayCircle className="h-4 w-4" />
              Get it on Google Play
            </a>
          )}
        </div>

        {/* Copyright & Developer Credit */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Noor App. All rights reserved.
          <br />
          <span className="text-muted-foreground/70">Developed by Abedin Molla</span>
        </div>
      </div>
    </footer>
  );
}
