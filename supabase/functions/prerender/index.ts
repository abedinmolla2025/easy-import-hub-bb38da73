import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_ORIGIN = "https://noorapp.in";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// ─── SEO defaults (mirrors src/lib/seoDefaults.ts) ───
const SEO_DEFAULTS: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Noor — Islamic App for Quran, Hadith, Prayer Times & Dua",
    description: "Noor is a free Islamic app for Muslims in India & Bangladesh. Read Quran with Bengali translation, Hadith, daily duas, prayer times, Qibla & Islamic quiz.",
  },
  "/quran": {
    title: "Quran Reader — পবিত্র কুরআন | NOOR",
    description: "Read the Holy Quran with Arabic text, Bengali translation & audio recitation — সূরা তিলাওয়াত, তাফসীর ও অডিও সহ সম্পূর্ণ কুরআন পাঠ করুন।",
  },
  "/prayer-times": {
    title: "Prayer Times — নামাজের সময়সূচী | NOOR",
    description: "Accurate daily Salah times for your location — ফজর, যোহর, আসর, মাগরিব ও এশার সঠিক সময় জানুন। Athan alerts & countdown timer included.",
  },
  "/dua": {
    title: "Duas & Supplications — দোয়া সমূহ | NOOR",
    description: "Authentic Islamic duas with Arabic, Bengali meaning & audio — দৈনন্দিন মাসনূন দোয়া, কুরআনের দোয়া ও হাদিসের দোয়া সংকলন।",
  },
  "/quiz": {
    title: "Daily Islamic Quiz — ইসলামিক কুইজ | NOOR",
    description: "Test & improve your Islamic knowledge daily — প্রতিদিন ৫টি কুইজে অংশ নিন, স্কোর অর্জন করুন, streak বজায় রাখুন ও নতুন কিছু শিখুন।",
  },
  "/hadith": {
    title: "Authentic Hadith Collections – Noor App",
    description: "Browse authentic Hadith collections — Sahih Bukhari, Sahih Muslim, Jami at-Tirmidhi & Sunan Abu Dawud with Arabic text and translations.",
  },
  "/hadith/sahih-bukhari": {
    title: "Sahih al-Bukhari Hadith Collection (7563 Hadiths) – Noor App",
    description: "Read the complete Sahih al-Bukhari — the most authentic hadith collection — in Bangla, English, or Urdu with Arabic text. 97 chapters, 7,563 hadiths.",
  },
  "/hadith/sahih-bukhari/bangla": {
    title: "Sahih Bukhari Bangla – সহীহ বুখারী বাংলা হাদিস | Noor App",
    description: "সহীহ বুখারী শরীফের সম্পূর্ণ হাদিস আরবি ও বাংলা অনুবাদ সহ পড়ুন। Read Sahih Bukhari Bangla with Arabic text & translation on Noor App.",
  },
  "/hadith/sahih-bukhari/english": {
    title: "Sahih Bukhari English – Authentic Hadith Collection | Noor App",
    description: "Read the complete Sahih Bukhari English hadith collection with Arabic text and authentic English translation. 97 chapters, 7,563 hadiths on Noor App.",
  },
  "/hadith/sahih-bukhari/urdu": {
    title: "Sahih Bukhari Urdu – صحیح بخاری اردو حدیث | Noor App",
    description: "صحیح بخاری کی مکمل احادیث عربی متن اور اردو ترجمہ کے ساتھ پڑھیں۔ Read Sahih Bukhari Urdu hadith with Arabic text on Noor App.",
  },
  "/hadith/muslim": {
    title: "Sahih Muslim — সহীহ মুসলিম হাদিস | Noor",
    description: "Read Sahih Muslim Hadith with Bengali translation. Second most authentic hadith collection — 7,500+ verified narrations. সহীহ মুসলিম পড়ুন বাংলায়।",
  },
  "/hadith/tirmidhi": {
    title: "Jami at-Tirmidhi — জামে তিরমিযী হাদিস | Noor",
    description: "Explore Jami at-Tirmidhi with Bengali translation — 3,956 hadiths covering fiqh, seerah & virtues with unique hadith grading. জামে তিরমিযী পড়ুন।",
  },
  "/hadith/abu-dawud": {
    title: "Sunan Abu Dawud — সুনানে আবু দাউদ হাদিস | Noor",
    description: "Read Sunan Abu Dawud with Bengali translation — the definitive jurisprudence-focused hadith collection. আবু দাউদ পড়ুন।",
  },
  "/prayer-guide": {
    title: "Prayer Guide — নামাজ শিক্ষা | NOOR",
    description: "Step-by-step Salah tutorial with illustrations — ওযু, নামাজের নিয়ম, সূরা, দোয়া ও তাশাহহুদ সহ সম্পূর্ণ নামাজ শিক্ষা গাইড।",
  },
  "/tasbih": {
    title: "Digital Tasbih — ডিজিটাল তাসবীহ | NOOR",
    description: "Beautiful digital Tasbih counter for dhikr — সুবহানাল্লাহ, আলহামদুলিল্লাহ, আল্লাহু আকবার সহজে গণনা করুন। Haptic feedback supported.",
  },
  "/qibla": {
    title: "Qibla Finder — কিবলার দিক | NOOR",
    description: "Find accurate Qibla direction using compass — আপনার বর্তমান অবস্থান থেকে মক্কার কাবা শরীফের সঠিক দিক নির্ণয় করুন।",
  },
  "/99-names": {
    title: "99 Names of Allah — আল্লাহর ৯৯ নাম | NOOR",
    description: "Learn the 99 beautiful names (Asma ul Husna) of Allah — আল্লাহ তাআলার ৯৯টি গুণবাচক নাম আরবি, অর্থ ও ফযীলত সহ জানুন।",
  },
  "/baby-names": {
    title: "Muslim Baby Names — শিশুর নাম | NOOR",
    description: "Find beautiful Islamic baby names for boys & girls — ছেলে ও মেয়ে শিশুদের জন্য অর্থসহ সুন্দর মুসলিম নাম বাছাই করুন।",
  },
  "/names": {
    title: "Islamic Names — ইসলামিক নামের তালিকা | NOOR",
    description: "Browse thousands of Islamic names with Arabic script & meanings — আরবি, বাংলা উচ্চারণ ও অর্থসহ ইসলামিক নাম খুঁজুন।",
  },
  "/calendar": {
    title: "Islamic Calendar — হিজরি ক্যালেন্ডার | NOOR",
    description: "Hijri calendar with key Islamic dates — রমজান, ঈদুল ফিতর, ঈদুল আযহা, শবে কদর ও অন্যান্য গুরুত্বপূর্ণ ইসলামিক দিবস দেখুন।",
  },
  "/about": {
    title: "About NOOR — আমাদের সম্পর্কে | NOOR",
    description: "Learn about the NOOR app mission & team — ইসলামিক শিক্ষা ও আধুনিক প্রযুক্তি একত্রে আনার আমাদের লক্ষ্য ও উদ্দেশ্য।",
  },
  "/contact": {
    title: "Contact Us — যোগাযোগ | NOOR",
    description: "Get in touch with the NOOR team — প্রশ্ন, পরামর্শ, বাগ রিপোর্ট বা সহযোগিতার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।",
  },
  "/privacy-policy": {
    title: "Privacy Policy — গোপনীয়তা নীতি | NOOR",
    description: "NOOR app privacy policy & data protection — আপনার ব্যক্তিগত তথ্যের নিরাপত্তা ও ব্যবহার সম্পর্কে বিস্তারিত জানুন।",
  },
  "/terms": {
    title: "Terms of Service — ব্যবহারের শর্তাবলী | NOOR",
    description: "NOOR app terms & conditions — অ্যাপ ব্যবহারের শর্তাবলী ও ব্যবহারকারীর অধিকার সম্পর্কে বিস্তারিত পড়ুন।",
  },
  "/islamic-app": {
    title: "Best Islamic App – Quran, Hadith, Dua & Prayer Times",
    description: "Noor is the best free Islamic app for Bengali Muslims. Download for Quran, Hadith, Dua, Prayer Times, Qibla & daily quiz.",
  },
  "/download": {
    title: "Download Noor App — Android APK | NOOR",
    description: "Download Noor Islamic App for Android — কুরআন, হাদিস, নামাজের সময়, দোয়া ও ইসলামিক কুইজ সহ সম্পূর্ণ ইসলামিক অ্যাপ ডাউনলোড করুন।",
  },
  "/sitemap": {
    title: "Sitemap — সাইটম্যাপ | NOOR",
    description: "Browse all pages on Noor Islamic App — Quran, Hadith, Dua, Prayer Times, Quiz ও সকল পেজের সম্পূর্ণ তালিকা দেখুন।",
  },
};

function getChapterSeo(lang: string, chapterNum: string) {
  const langLabels: Record<string, { title: string; description: string }> = {
    bangla: {
      title: `Sahih Bukhari Bangla Chapter ${chapterNum} – সহীহ বুখারী অধ্যায় ${chapterNum} | Noor`,
      description: `Read Sahih Bukhari Chapter ${chapterNum} in Bangla with Arabic text — সহীহ বুখারী অধ্যায় ${chapterNum} এর সকল হাদিস বাংলা অনুবাদ সহ পড়ুন।`,
    },
    english: {
      title: `Sahih Bukhari Chapter ${chapterNum} – English Hadith | Noor`,
      description: `Browse all hadiths in Sahih Bukhari Chapter ${chapterNum} with Arabic text and English translation on Noor App.`,
    },
    urdu: {
      title: `Sahih Bukhari Chapter ${chapterNum} – صحیح بخاری باب ${chapterNum} | Noor`,
      description: `صحیح بخاری باب ${chapterNum} کی تمام احادیث عربی متن اور اردو ترجمے کے ساتھ پڑھیں۔`,
    },
  };
  return langLabels[lang] || langLabels.english;
}

function getOgImage(path: string): string {
  if (path.startsWith("/hadith")) return `${SITE_ORIGIN}/og-bukhari.png`;
  if (path.startsWith("/quran")) return `${SITE_ORIGIN}/og-quran.png`;
  if (path.startsWith("/prayer-times")) return `${SITE_ORIGIN}/og-prayer-times.png`;
  if (path.startsWith("/dua")) return `${SITE_ORIGIN}/og-dua.png`;
  if (path.startsWith("/quiz")) return `${SITE_ORIGIN}/og-quiz.png`;
  if (path.startsWith("/tasbih")) return `${SITE_ORIGIN}/og-tasbih.png`;
  if (path.startsWith("/qibla")) return `${SITE_ORIGIN}/og-qibla.png`;
  if (path.startsWith("/99-names")) return `${SITE_ORIGIN}/og-99-names.png`;
  if (path.startsWith("/baby-names") || path.startsWith("/names")) return `${SITE_ORIGIN}/og-baby-names.png`;
  if (path.startsWith("/calendar")) return `${SITE_ORIGIN}/og-calendar.png`;
  if (path.startsWith("/prayer-guide")) return `${SITE_ORIGIN}/og-prayer-guide.png`;
  return `${SITE_ORIGIN}/og-image.png`;
}

// Build hreflang alternate links for hadith pages
function buildHreflangTags(path: string): string {
  const chapterMatch = path.match(/^\/hadith\/sahih-bukhari\/(bangla|english|urdu)(\/chapter-\d+)?$/);
  if (!chapterMatch) return "";
  const suffix = chapterMatch[2] || "";
  const langs = [
    { lang: "bn", slug: "bangla" },
    { lang: "en", slug: "english" },
    { lang: "ur", slug: "urdu" },
  ];
  return langs
    .map((l) => `<link rel="alternate" hreflang="${l.lang}" href="${SITE_ORIGIN}/hadith/sahih-bukhari/${l.slug}${suffix}" />`)
    .join("\n    ");
}

async function fetchHadithContent(
  supabase: ReturnType<typeof createClient>,
  chapterId: number,
  lang: string,
): Promise<string> {
  // Fetch hadiths for this chapter
  const langColumn = lang === "bangla" ? "bengali" : lang === "urdu" ? "bengali" : lang; // urdu uses same column check
  
  const { data: hadiths, error } = await supabase
    .from("hadiths")
    .select("hadith_number, arabic, bengali, english")
    .eq("chapter_id", chapterId)
    .eq("book_key", "bukhari")
    .order("hadith_number", { ascending: true })
    .limit(50); // First 50 hadiths for prerender

  if (error || !hadiths?.length) {
    return `<p>Loading hadith content for Chapter ${chapterId}...</p>`;
  }

  const translationKey = lang === "bangla" ? "bengali" : lang === "urdu" ? "bengali" : "english";

  return hadiths
    .map((h: any) => {
      const translation = h[translationKey] || h.english || "";
      return `
      <article class="hadith" itemscope itemtype="https://schema.org/Article">
        <h3 itemprop="name">Hadith ${h.hadith_number}</h3>
        <p dir="rtl" lang="ar" class="arabic" itemprop="text">${escapeHtml(h.arabic || "")}</p>
        <p class="translation">${escapeHtml(translation)}</p>
      </article>`;
    })
    .join("\n");
}

// Build chapter list HTML for language root pages
async function fetchChapterList(
  supabase: ReturnType<typeof createClient>,
  lang: string,
): Promise<string> {
  const { data: chapters, error } = await supabase
    .from("hadith_chapters")
    .select("chapter_number, title, title_bn")
    .eq("book_id", "bukhari")
    .order("chapter_number", { ascending: true });

  if (error || !chapters?.length) {
    return "<p>Browse 97 chapters of Sahih Bukhari.</p>";
  }

  const links = chapters
    .map((ch: any) => {
      const displayTitle = lang === "bangla" ? (ch.title_bn || ch.title) : ch.title;
      return `<li><a href="${SITE_ORIGIN}/hadith/sahih-bukhari/${lang}/chapter-${ch.chapter_number}">Chapter ${ch.chapter_number}: ${escapeHtml(displayTitle)}</a></li>`;
    })
    .join("\n");

  return `<nav aria-label="Sahih Bukhari Chapters"><ol>${links}</ol></nav>`;
}

function buildFullHtml(
  path: string,
  title: string,
  description: string,
  ogImage: string,
  bodyContent: string,
  jsonLd?: string,
): string {
  const canonical = `${SITE_ORIGIN}${path}`;
  const hreflangTags = buildHreflangTags(path);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="index,follow" />
    ${hreflangTags}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Noor Islamic App" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    
    ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
</head>
<body>
    <header>
        <h1>${escapeHtml(title)}</h1>
        <nav aria-label="Main Navigation">
            <a href="${SITE_ORIGIN}/">Home</a> |
            <a href="${SITE_ORIGIN}/quran">Quran</a> |
            <a href="${SITE_ORIGIN}/hadith">Hadith</a> |
            <a href="${SITE_ORIGIN}/prayer-times">Prayer Times</a> |
            <a href="${SITE_ORIGIN}/dua">Dua</a> |
            <a href="${SITE_ORIGIN}/quiz">Quiz</a>
        </nav>
    </header>
    <main>
        ${bodyContent}
    </main>
    <footer>
        <p>&copy; ${new Date().getFullYear()} Noor Islamic App — <a href="${SITE_ORIGIN}/">noorapp.in</a></p>
        <nav aria-label="Footer">
            <a href="${SITE_ORIGIN}/about">About</a> |
            <a href="${SITE_ORIGIN}/privacy-policy">Privacy</a> |
            <a href="${SITE_ORIGIN}/terms">Terms</a> |
            <a href="${SITE_ORIGIN}/sitemap">Sitemap</a>
        </nav>
    </footer>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.searchParams.get("path") || "/";
    // Normalize: remove trailing slash
    if (path !== "/" && path.endsWith("/")) {
      path = path.replace(/\/+$/, "");
    }
    // Decode URI
    path = decodeURIComponent(path);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Determine SEO meta
    let seo = SEO_DEFAULTS[path];
    let bodyContent = "";
    let jsonLd = "";

    // Check for chapter page pattern
    const chapterMatch = path.match(
      /^\/hadith\/sahih-bukhari\/(bangla|english|urdu)\/chapter-(\d+)$/,
    );

    // Check for language root pattern
    const langRootMatch = path.match(
      /^\/hadith\/sahih-bukhari\/(bangla|english|urdu)$/,
    );

    if (chapterMatch) {
      const [, lang, chapterNum] = chapterMatch;
      seo = getChapterSeo(lang, chapterNum);

      // Fetch actual hadith content
      const content = await fetchHadithContent(supabase, parseInt(chapterNum), lang);
      bodyContent = `
        <section>
            <h2>Sahih Bukhari – Chapter ${chapterNum}</h2>
            <p>${escapeHtml(seo.description)}</p>
            ${content}
            <nav aria-label="Chapter Navigation">
                ${parseInt(chapterNum) > 1 ? `<a href="${SITE_ORIGIN}/hadith/sahih-bukhari/${lang}/chapter-${parseInt(chapterNum) - 1}">← Previous Chapter</a>` : ""}
                <a href="${SITE_ORIGIN}/hadith/sahih-bukhari/${lang}">All Chapters</a>
                ${parseInt(chapterNum) < 97 ? `<a href="${SITE_ORIGIN}/hadith/sahih-bukhari/${lang}/chapter-${parseInt(chapterNum) + 1}">Next Chapter →</a>` : ""}
            </nav>
        </section>`;

      // Article JSON-LD
      jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: seo.title,
        author: { "@type": "Person", name: "Imam Muhammad ibn Ismail al-Bukhari" },
        publisher: { "@type": "Organization", name: "Noor Islamic App", url: SITE_ORIGIN },
        url: `${SITE_ORIGIN}${path}`,
        image: `${SITE_ORIGIN}/og-bukhari.png`,
        description: seo.description,
      });
    } else if (langRootMatch) {
      const lang = langRootMatch[1];
      // Fetch chapter list
      const chapterListHtml = await fetchChapterList(supabase, lang);
      bodyContent = `
        <section>
            <h2>Sahih Bukhari — ${lang.charAt(0).toUpperCase() + lang.slice(1)} Translation</h2>
            <p>${escapeHtml(seo?.description || "Browse all 97 chapters of Sahih Bukhari.")}</p>
            ${chapterListHtml}
        </section>`;
    } else if (path === "/hadith/sahih-bukhari") {
      bodyContent = `
        <section>
            <h2>Sahih al-Bukhari — The Most Authentic Hadith Collection</h2>
            <p>Sahih al-Bukhari is the most authentic collection of Hadith in Sunni Islam, compiled by Imam Muhammad ibn Ismail al-Bukhari (810–870 CE). It contains 7,563 hadiths organized in 97 chapters.</p>
            <h3>Read in Your Language</h3>
            <ul>
                <li><a href="${SITE_ORIGIN}/hadith/sahih-bukhari/bangla">Sahih Bukhari Bangla – সহীহ বুখারী বাংলা</a></li>
                <li><a href="${SITE_ORIGIN}/hadith/sahih-bukhari/english">Sahih Bukhari English</a></li>
                <li><a href="${SITE_ORIGIN}/hadith/sahih-bukhari/urdu">Sahih Bukhari Urdu – صحیح بخاری اردو</a></li>
            </ul>
        </section>`;
    } else if (path === "/hadith") {
      bodyContent = `
        <section>
            <h2>Authentic Hadith Collections</h2>
            <p>Browse major Hadith collections with Arabic text and translations.</p>
            <ul>
                <li><a href="${SITE_ORIGIN}/hadith/sahih-bukhari">Sahih al-Bukhari (7,563 Hadiths)</a></li>
                <li><a href="${SITE_ORIGIN}/hadith/muslim">Sahih Muslim</a></li>
                <li><a href="${SITE_ORIGIN}/hadith/tirmidhi">Jami at-Tirmidhi</a></li>
                <li><a href="${SITE_ORIGIN}/hadith/abu-dawud">Sunan Abu Dawud</a></li>
            </ul>
        </section>`;
    } else {
      // Generic page — provide a meaningful body
      bodyContent = `
        <section>
            <p>${escapeHtml(seo?.description || "Noor — Free Islamic app for Quran, Hadith, Prayer Times & Dua.")}</p>
        </section>`;
    }

    if (!seo) {
      seo = SEO_DEFAULTS["/"];
    }

    const ogImage = getOgImage(path);
    const html = buildFullHtml(path, seo.title, seo.description, ogImage, bodyContent, jsonLd);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Robots-Tag": "index,follow",
      },
    });
  } catch (err) {
    console.error("Prerender error:", err);
    // On error, return a minimal HTML with redirect to the SPA
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${SITE_ORIGIN}"></head><body>Redirecting...</body></html>`,
      {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
});
