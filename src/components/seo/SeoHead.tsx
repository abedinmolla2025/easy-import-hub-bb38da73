import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import { isAdminRoutePath } from "@/lib/ads";
import { usePageSeo } from "@/hooks/usePageSeo";

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
  const origin = typeof window !== "undefined" ? window.location.origin : "";
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

  const title = normalizeTitle(pageSeo?.title ?? globalSeo.title ?? branding.appName);
  const description = normalizeDescription(pageSeo?.description ?? globalSeo.description);

  const canonical =
    pageSeo?.canonical_url ??
    (typeof window !== "undefined" ? `${window.location.origin}${pathname}` : undefined);

  const robots = pageSeo?.robots ?? "index,follow";

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

      {/* Keep OG tags aligned with per-page content */}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? <meta property="og:description" content={description} /> : null}

      {jsonLdString ? (
        <script type="application/ld+json">{jsonLdString}</script>
      ) : null}
    </Helmet>
  );
}
