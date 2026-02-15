import {
  Home,
  BookOpen,
  Clock,
  Calendar,
  ScrollText,
  PlayCircle,
  Info,
  Mail,
  ShieldCheck,
  FileText,
  LayoutGrid,
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
  { label: "Hadith", path: "/hadith", icon: ScrollText },
  { label: "Prayer Time", path: "/prayer-times", icon: Clock },
  { label: "Calendar", path: "/calendar", icon: Calendar },
];

const legalLinks = [
  { label: "About Us", path: "/about", icon: Info },
  { label: "Contact Us", path: "/contact", icon: Mail },
  { label: "Privacy Policy", path: "/privacy-policy", icon: ShieldCheck },
  { label: "Terms & Conditions", path: "/terms", icon: FileText },
  { label: "Sitemap", path: "/sitemap.xml", icon: LayoutGrid, external: true },
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
    <footer className="mt-8 border-t border-border bg-card pt-8 pb-6">
      <div className="mx-auto max-w-screen-xl px-6">
        {/* Two-column grid */}
        <div className="grid grid-cols-2 gap-x-6">
          {/* Section 1: Quick Links */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-4">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => onNavigate(link.path)}
                    className="inline-flex items-center gap-2 text-[14px] leading-none text-muted-foreground transition-all duration-150 hover:text-primary hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <link.icon className="h-[18px] w-[18px] shrink-0" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Legal & Support */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Legal & Support
            </h3>
            <ul className="flex flex-col gap-4">
              {legalLinks.map((link) =>
                link.external ? (
                  <li key={link.path}>
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[14px] leading-none text-muted-foreground transition-all duration-150 hover:text-primary hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <link.icon className="h-[18px] w-[18px] shrink-0" />
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.path}>
                    <button
                      onClick={() => onNavigate(link.path)}
                      className="inline-flex items-center gap-2 text-[14px] leading-none text-muted-foreground transition-all duration-150 hover:text-primary hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <link.icon className="h-[18px] w-[18px] shrink-0" />
                      {link.label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-5">
          {platform === "app" ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-xl bg-primary py-3 text-center text-[14px] font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-105"
            >
              Visit our website
            </a>
          ) : (
            <a
              href={playStoreUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[14px] font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-105"
            >
              <PlayCircle className="h-[18px] w-[18px]" />
              Get it on Google Play
            </a>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-[12px] leading-relaxed text-muted-foreground/50">
          © {new Date().getFullYear()} Noor App. All rights reserved.
          <br />
          Developed by Abedin Molla
        </div>
      </div>
    </footer>
  );
}
