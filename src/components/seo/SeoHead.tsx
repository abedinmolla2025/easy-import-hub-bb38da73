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

const BREADCRUMB_NAMES: Record<string, string> = {
  quran: "Quran",
  hadith: "Hadith",
  "sahih-bukhari": "Sahih Bukhari",
  bukhari: "Sahih Bukhari",
  muslim: "Sahih Muslim",
  tirmidhi: "Jami at-Tirmidhi",
  "abu-dawud": "Sunan Abu Dawud",
  bangla: "Bangla",
  english: "English",
  urdu: "Urdu",
  "prayer-times": "Prayer Times",
  "prayer-guide": "Prayer Guide",
  dua: "Dua",
  quiz: "Daily Quiz",
  tasbih: "Tasbih",
  qibla: "Qibla",
  "99-names": "99 Names of Allah",
  "baby-names": "Baby Names",
  names: "Baby Names",
  calendar: "Islamic Calendar",
  "islamic-app": "Islamic App",
  about: "About",
  contact: "Contact",
  settings: "Settings",
  notifications: "Notifications",
  "privacy-policy": "Privacy Policy",
  terms: "Terms",
  sitemap: "Sitemap",
  download: "Download App",
};

function buildBreadcrumbJsonLd(pathname: string) {
  const origin = "https://noorapp.in";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const items = [
    { "@type": "ListItem" as const, position: 1, name: "Home", item: `${origin}/` },
  ];

  let path = "";
  segments.forEach((seg, i) => {
    path += `/${seg}`;
    items.push({
      "@type": "ListItem" as const,
      position: i + 2,
      name: BREADCRUMB_NAMES[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      item: `${origin}${path}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

const PAGE_FAQS: Record<string, { q: string; a: string }[]> = {
  "/quran": [
    { q: "Can I read the Quran online for free on Noor?", a: "Yes, Noor provides the complete Quran with Arabic text, English and Urdu translations, and audio recitation — all completely free." },
    { q: "Does Noor have Quran audio recitation?", a: "Yes, you can listen to beautiful Quran recitations by renowned Qaris directly within the app while following along with the text." },
    { q: "Can I search for a specific Surah in Noor?", a: "Absolutely. Noor lets you browse all 114 Surahs and jump to any Surah or Ayah instantly." },
    { q: "Is the Quran text on Noor authentic?", a: "Yes, the Arabic text follows the Uthmani script and translations are sourced from widely accepted scholarly works." },
  ],
  "/hadith": [
    { q: "Which Hadith collections are available on Noor?", a: "Noor features major Hadith collections including Sahih Bukhari, Sahih Muslim, Jami at-Tirmidhi, and Sunan Abu Dawud." },
    { q: "Can I read Sahih Bukhari online for free?", a: "Yes, the complete Sahih Bukhari collection is available on Noor with English translations, organized by book and chapter." },
    { q: "Are the Hadith on Noor authentic?", a: "Noor sources Hadith from the most authentic and widely accepted collections in Islamic scholarship." },
    { q: "Can I browse Hadith by chapter?", a: "Yes, each Hadith book is organized by chapters so you can easily find Hadith on specific topics." },
  ],
  "/dua": [
    { q: "Where can I find daily Islamic Duas?", a: "Noor provides a curated collection of authentic Duas for daily life, including morning and evening Adhkar, travel Duas, and more." },
    { q: "Are the Duas on Noor in Arabic with translation?", a: "Yes, every Dua includes Arabic text, transliteration for easy pronunciation, and English translation." },
    { q: "Can I listen to Dua audio on Noor?", a: "Yes, Noor offers audio playback for Duas so you can learn the correct pronunciation." },
    { q: "Are the Duas on Noor from authentic sources?", a: "Yes, all Duas are sourced from the Quran and authentic Hadith collections." },
  ],
  "/quiz": [
    { q: "What is the Islamic Quiz on Noor?", a: "Noor features a daily Islamic quiz that tests your knowledge on Quran, Hadith, Islamic history, and general Islamic teachings." },
    { q: "Is the Islamic Quiz free?", a: "Yes, the daily quiz is completely free. You can take it every day to learn something new about Islam." },
    { q: "How many questions are in each quiz?", a: "Each daily quiz session includes multiple-choice questions covering various Islamic topics with instant feedback." },
    { q: "Can I track my quiz progress?", a: "Yes, Noor tracks your quiz streaks, scores, and badges so you can monitor your Islamic knowledge growth over time." },
  ],
  "/hadith/sahih-bukhari/bangla": [
    { q: "সহীহ বুখারী বাংলা হাদিস কি Noor অ্যাপে পড়া যায়?", a: "হ্যাঁ, Noor অ্যাপে সহীহ বুখারীর সম্পূর্ণ ৭,৫৬৩টি হাদিস আরবি টেক্সট ও বাংলা অনুবাদ সহ বিনামূল্যে পড়া যায়।" },
    { q: "Sahih Bukhari Bangla translation কি বিশ্বস্ত?", a: "হ্যাঁ, Noor অ্যাপের বাংলা অনুবাদ বিশ্বস্ত ও নির্ভরযোগ্য উৎস থেকে সংগৃহীত।" },
    { q: "সহীহ বুখারীতে কতটি অধ্যায় আছে?", a: "সহীহ বুখারীতে ৯৭টি অধ্যায় (কিতাব) রয়েছে, যেগুলো বিষয়ভিত্তিকভাবে সাজানো।" },
    { q: "Can I read Sahih Bukhari in Bangla for free?", a: "Yes, Noor App provides the complete Sahih Bukhari collection with Arabic text and authentic Bangla translation — completely free." },
  ],
  "/hadith/sahih-bukhari/english": [
    { q: "Can I read Sahih Bukhari in English on Noor?", a: "Yes, the complete Sahih al-Bukhari collection with 7,563 hadiths is available in English with Arabic text on Noor App, completely free." },
    { q: "Is Sahih Bukhari the most authentic hadith collection?", a: "Yes, Sahih al-Bukhari by Imam Bukhari is widely regarded as the most authentic hadith collection in Sunni Islam." },
    { q: "How many hadiths are in Sahih Bukhari?", a: "Sahih al-Bukhari contains 7,563 hadiths organized across 97 chapters covering topics from faith to daily life." },
    { q: "Can I browse Sahih Bukhari by chapter in English?", a: "Yes, Noor App organizes Sahih Bukhari into 97 chapters so you can easily find hadiths on specific topics." },
  ],
  "/hadith/sahih-bukhari/urdu": [
    { q: "کیا Noor ایپ پر صحیح بخاری اردو میں پڑھ سکتے ہیں؟", a: "جی ہاں، Noor ایپ پر صحیح بخاری کی مکمل ۷,۵۶۳ احادیث عربی متن اور اردو ترجمے کے ساتھ مفت دستیاب ہیں۔" },
    { q: "صحیح بخاری میں کتنے ابواب ہیں؟", a: "صحیح بخاری میں ۹۷ ابواب ہیں جو مختلف موضوعات جیسے ایمان، نماز، روزہ اور معاملات پر مشتمل ہیں۔" },
    { q: "Is Sahih Bukhari available in Urdu on Noor?", a: "Yes, Noor App provides the complete Sahih Bukhari collection with Arabic text and Urdu translation, free of charge." },
    { q: "کیا Noor ایپ کا اردو ترجمہ معتبر ہے؟", a: "جی ہاں، Noor ایپ کا اردو ترجمہ معتبر علمی ذرائع سے لیا گیا ہے۔" },
  ],
  "/hadith/sahih-bukhari": [
    { q: "What is Sahih al-Bukhari?", a: "Sahih al-Bukhari is the most authentic collection of Hadith in Sunni Islam, compiled by Imam Muhammad ibn Ismail al-Bukhari (810–870 CE). It contains 7,563 hadiths organized in 97 chapters." },
    { q: "How many hadiths are in Sahih Bukhari?", a: "Sahih al-Bukhari contains 7,563 hadiths carefully selected from over 600,000 narrations based on strict criteria of authenticity." },
    { q: "In which languages can I read Sahih Bukhari on Noor?", a: "Noor App offers Sahih Bukhari in Bangla (বাংলা), English, and Urdu (اردو) — all with the original Arabic text, completely free." },
    { q: "Is Sahih Bukhari free to read on Noor App?", a: "Yes, the complete Sahih al-Bukhari collection is available for free on Noor App with Arabic text and translations in three languages." },
  ],
  "/about": [
    { q: "What is Noor App?", a: "Noor is a free Islamic app that provides Quran reading, Hadith collections, daily Duas, Prayer Times, Qibla direction, Islamic quiz, and more — designed for Muslims worldwide." },
    { q: "Is Noor App free?", a: "Yes, Noor App is completely free with no ads on core Islamic content. All features including Quran, Hadith, and Prayer Times are available at no cost." },
    { q: "Which platforms is Noor available on?", a: "Noor is available as a web app at noorapp.in and as an Android app. It works on any modern browser on mobile and desktop." },
  ],
};

function buildFaqJsonLd(pathname: string) {
  const faqs = PAGE_FAQS[pathname];
  if (!faqs) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function buildHomepageJsonLd(
  branding: ReturnType<typeof useGlobalConfig>["branding"],
  seo: ReturnType<typeof useGlobalConfig>["seo"],
  legal: ReturnType<typeof useGlobalConfig>["legal"],
) {
  const origin = "https://noorapp.in";
  const schemas: object[] = [];

  // 1️⃣ Organization schema
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Noor",
    url: origin,
    logo: `${origin}/logo.png`,
    description: "Noor — Free Islamic app for Quran, Hadith, Dua, Prayer Times & Islamic learning.",
  };
  if (legal.contactEmail) org.email = legal.contactEmail;
  const sameAs: string[] = [];
  if (legal.facebookUrl) sameAs.push(legal.facebookUrl);
  if (legal.whatsappUrl) sameAs.push(legal.whatsappUrl);
  if (legal.playStoreUrl) sameAs.push(legal.playStoreUrl);
  if (legal.appStoreUrl) sameAs.push(legal.appStoreUrl);
  if (sameAs.length) org.sameAs = sameAs;
  schemas.push(org);

  // 2️⃣ WebSite schema with SearchAction
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Noor Islamic App",
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });

  // 3️⃣ MobileApplication schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Noor Islamic App",
    operatingSystem: "Android",
    applicationCategory: "LifestyleApplication",
    applicationSubCategory: "Islamic App",
    url: origin,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
  });

  return schemas;
}

function cacheBustUrl(url: string, version?: string) {
  if (!url) return url;
  const v = version || String(Date.now());
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${v}`;
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
  // Normalize: remove trailing slash (except root "/")
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const canonical =
    pageSeo?.canonical_url ?? `${SITE_ORIGIN}${normalizedPath}`;

  const robots = pageSeo?.robots ?? "index,follow";

  // Page-specific OG images
  const OG_IMAGES: Record<string, string> = {
    "/": "/og-image.png",
    "/quran": "/og-quran.png",
    "/prayer-times": "/og-prayer-times.png",
    "/dua": "/og-dua.png",
    "/quiz": "/og-quiz.png",
    "/hadith": "/og-bukhari.png",
    "/hadith/bukhari": "/og-bukhari.png",
    "/hadith/sahih-bukhari": "/og-bukhari.png",
    "/hadith/sahih-bukhari/bangla": "/og-bukhari.png",
    "/hadith/sahih-bukhari/english": "/og-bukhari.png",
    "/hadith/sahih-bukhari/urdu": "/og-bukhari.png",
    "/tasbih": "/og-tasbih.png",
    "/qibla": "/og-qibla.png",
    "/99-names": "/og-99-names.png",
    "/baby-names": "/og-baby-names.png",
    "/names": "/og-baby-names.png",
    "/calendar": "/og-calendar.png",
    "/prayer-guide": "/og-prayer-guide.png",
  };
  const ogImage = `${SITE_ORIGIN}${OG_IMAGES[normalizedPath] || OG_IMAGES[pathname] || "/og-image.png"}`;

  // Use page-specific JSON-LD if set, otherwise inject Organization+WebSite on homepage
  const isHomepage = pathname === "/";
  const jsonLd = pageSeo?.json_ld ?? null;
  const jsonLdString = jsonLd
    ? JSON.stringify(jsonLd)
    : isHomepage
      ? JSON.stringify(buildHomepageJsonLd(branding, globalSeo, legal))
      : null;

  // BreadcrumbList for all non-homepage routes
  const breadcrumbLd = !isHomepage ? buildBreadcrumbJsonLd(pathname) : null;
  const breadcrumbString = breadcrumbLd ? JSON.stringify(breadcrumbLd) : null;

  // FAQPage for key pages
  const faqLd = buildFaqJsonLd(pathname);
  const faqString = faqLd ? JSON.stringify(faqLd) : null;

  // Dynamic favicon from branding settings
  const lv = branding.logoVersion;
  const favVariants = branding.faviconVariants;
  const faviconHref = branding.faviconUrl || branding.iconUrl || branding.logoUrl;

  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}

      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}

      {/* Dynamic favicons */}
      {favVariants?.png16 ? <link rel="icon" sizes="16x16" type="image/png" href={cacheBustUrl(favVariants.png16, lv)} /> : null}
      {favVariants?.png32 ? <link rel="icon" sizes="32x32" type="image/png" href={cacheBustUrl(favVariants.png32, lv)} /> : null}
      {faviconHref ? <link rel="icon" href={cacheBustUrl(favVariants?.png32 || faviconHref, lv)} /> : null}
      {faviconHref ? <link rel="shortcut icon" href={cacheBustUrl(favVariants?.png32 || faviconHref, lv)} /> : null}
      {favVariants?.png180 || faviconHref ? <link rel="apple-touch-icon" sizes="180x180" href={cacheBustUrl(favVariants?.png180 || faviconHref!, lv)} /> : null}

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
      {breadcrumbString ? (
        <script type="application/ld+json">{breadcrumbString}</script>
      ) : null}
      {faqString ? (
        <script type="application/ld+json">{faqString}</script>
      ) : null}
    </Helmet>
  );
}
