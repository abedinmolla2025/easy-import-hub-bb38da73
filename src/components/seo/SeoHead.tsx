import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import { isAdminRoutePath } from "@/lib/ads";
import { usePageSeo } from "@/hooks/usePageSeo";
import { getPageSeoDefaults } from "@/lib/seoDefaults";

function normalizeTitle(title?: string | null) {
  if (!title) return undefined;
  return title.length > 60 ? title.slice(0, 57) + "..." : title;
}

function normalizeDescription(description?: string | null) {
  if (!description) return undefined;
  return description.length > 160 ? description.slice(0, 157) + "..." : description;
}

function buildHomepageJsonLd(
  branding: ReturnType<typeof useGlobalConfig>["branding"],
  seo: ReturnType<typeof useGlobalConfig>["seo"],
  legal: ReturnType<typeof useGlobalConfig>["legal"],
) {
  const origin = "https://noorapp.in";
  const schemas: object[] = [];

  // Organization schema
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: branding.appName || "Noor",
    url: legal.websiteUrl || origin,
  };
  if (branding.logoUrl) org.logo = branding.logoUrl;
  if (legal.contactEmail) org.email = legal.contactEmail;
  const sameAs: string[] = [];
  if (legal.facebookUrl) sameAs.push(legal.facebookUrl);
  if (legal.whatsappUrl) sameAs.push(legal.whatsappUrl);
  if (legal.playStoreUrl) sameAs.push(legal.playStoreUrl);
  if (legal.appStoreUrl) sameAs.push(legal.appStoreUrl);
  if (sameAs.length) org.sameAs = sameAs;
  schemas.push(org);

  // WebSite schema with SearchAction
  const site: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: branding.appName || "Noor",
    url: origin,
  };
  if (seo.description) site.description = seo.description;
  schemas.push(site);

  return schemas;
}

export function SeoHead() {
  const { pathname } = useLocation();
  const { branding, seo: globalSeo, legal } = useGlobalConfig();

  const isAdmin = isAdminRoutePath(pathname);
  const pageSeoQuery = usePageSeo(pathname, !isAdmin);
  const pageSeo = pageSeoQuery.data;

  // Avoid indexing admin panel
  if (isAdmin) {
    return (
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
    );
  }

  // Bilingual defaults for the current route (fallback when no admin/db value)
  const bilingualDefaults = getPageSeoDefaults(pathname, branding.appName);

  const title = normalizeTitle(
    pageSeo?.title ?? bilingualDefaults?.title ?? globalSeo.title ?? branding.appName,
  );
  const description = normalizeDescription(
    pageSeo?.description ?? bilingualDefaults?.description ?? globalSeo.description,
  );

  const SITE_ORIGIN = "https://noorapp.in";
  const canonical =
    pageSeo?.canonical_url ?? `${SITE_ORIGIN}${pathname}`;

  const robots = pageSeo?.robots ?? "index,follow";

  // Page-specific OG images
  const OG_IMAGES: Record<string, string> = {
    "/": "/og-image.png",
    "/quran": "/og-quran.png",
    "/prayer-times": "/og-prayer-times.png",
    "/dua": "/og-dua.png",
    "/quiz": "/og-quiz.png",
    "/bukhari": "/og-bukhari.png",
    "/tasbih": "/og-tasbih.png",
    "/qibla": "/og-qibla.png",
    "/99-names": "/og-99-names.png",
    "/baby-names": "/og-baby-names.png",
    "/names": "/og-baby-names.png",
    "/calendar": "/og-calendar.png",
    "/prayer-guide": "/og-prayer-guide.png",
  };
  const ogImage = `${SITE_ORIGIN}${OG_IMAGES[pathname] || "/og-image.png"}`;

  // Use page-specific JSON-LD if set, otherwise inject Organization+WebSite on homepage
  const isHomepage = pathname === "/";
  const jsonLd = pageSeo?.json_ld ?? null;
  const jsonLdString = jsonLd
    ? JSON.stringify(jsonLd)
    : isHomepage
      ? JSON.stringify(buildHomepageJsonLd(branding, globalSeo, legal))
      : null;

  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}

      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}

      {/* OG tags */}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? <meta name="twitter:description" content={description} /> : null}
      <meta name="twitter:image" content={ogImage} />

      {jsonLdString ? (
        <script type="application/ld+json">{jsonLdString}</script>
      ) : null}
    </Helmet>
  );
}
