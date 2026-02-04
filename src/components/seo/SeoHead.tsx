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

export function SeoHead() {
  const { pathname } = useLocation();
  const { branding, seo: globalSeo } = useGlobalConfig();

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

  const jsonLd = pageSeo?.json_ld ?? null;
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

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
