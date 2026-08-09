import { createClient } from '@supabase/supabase-js';

const SITE_ORIGIN = "https://noorapp.in";

// Use environment variables instead of hardcoded strings
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const VALID_STORY_CATEGORIES = new Set([
  "prophets",
  "sahaba",
  "islamic-history",
  "islamic_historical_events",
  "inspirational",
  "kids_friendly",
]);

const SEO_BY_PATH = {
  "/": { title: "Noor — Quran, Hadith, Dua & Prayer Times", description: "Read Quran, Hadith, Dua, prayer times, Qibla and Islamic resources in Bengali with Noor." },
  "/data-sources": { title: "Islamic Data Sources | Noor", description: "Review the Quran, Hadith, prayer times and Islamic content sources used by Noor." },
  "/stories": { title: "Islamic Stories in Bengali | Noor", description: "Read meaningful Islamic and Quranic stories in Bengali with sources and lessons on Noor." },
  "/hadith": { title: "Authentic Hadith in Bengali | Noor", description: "Explore authentic Hadith collections and Sahih Bukhari resources in Bengali on Noor." },
  "/dua": { title: "Daily Dua in Bengali | Noor", description: "Read daily duas with Bengali meaning, Arabic text and practical guidance on Noor." },
  "/99-names": { title: "99 Names of Allah in Bengali | Noor", description: "Learn the 99 beautiful names of Allah with Bengali meanings and reflection on Noor." },
  "/qibla": { title: "Qibla Finder | Noor", description: "Find the Qibla direction and use Noor Islamic tools from anywhere." },
  "/calendar": { title: "Islamic Calendar | Noor", description: "Check the Islamic calendar and important Hijri dates with Noor." },
  "/prayer-times": { title: "Prayer Times | Noor", description: "Check accurate daily prayer times and Islamic guidance with Noor." },
  "/baby-names": { title: "Muslim Baby Names | Noor", description: "Explore meaningful Muslim baby names with Bengali meanings on Noor." },
  "/sources": { title: "Authentic Islamic Sources | Noor", description: "Learn which Qur'an, Hadith, tafsir and scholarly sources Noor uses, and how Islamic content is reviewed." },
  "/privacy-policy": { title: "Privacy Policy | Noor", description: "Read Noor's privacy policy covering local storage, analytics, advertising cookies, third-party services and data requests." },
  "/terms": { title: "Terms & Conditions | Noor", description: "Read the terms, acceptable-use guidelines and content limitations for using Noor Islamic app." },
  "/about": { title: "About Noor Islamic App | Noor", description: "Learn about Noor, its developer, mission and free Islamic learning tools." },
  "/contact": { title: "Contact Noor | Noor", description: "Contact Noor about support, privacy requests, source corrections or Islamic content feedback." },
};

const VALID_STATIC_PATHS = new Set([
  "/", "/quran", "/hadith", "/dua",   "/prayer-times", "/prayer-guide", "/qibla", "/tasbih", "/99-names", "/baby-names", "/calendar", "/quiz", "/stories", "/about", "/contact", "/sources", "/data-sources", "/privacy-policy", "/terms", "/download", "/islamic-app",
]);

function isKnownPublicPath(path) {
  return VALID_STATIC_PATHS.has(path)
    || /^\/stories\/(?:category\/[a-zA-Z0-9-]+|[a-zA-Z0-9-]+(?:\/trailer)?)$/.test(path)
    || /^\/hadith\/[a-zA-Z0-9-]+(?:\/[a-zA-Z0-9-]+)?$/.test(path)
    || /^\/dua\/[a-zA-Z0-9-]+(?:\/[a-zA-Z0-9-]+)?$/.test(path)
    || /^\/quran\/[a-zA-Z0-9-]+(?:\/[a-zA-Z0-9-]+)?$/.test(path);
}

function humanizeSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function handler(req, res) {
  try {
    // Get path from query or from the URL itself
    let { path = "/" } = req.query;
    
    // Normalize path
    if (path !== "/" && path.endsWith("/")) {
      path = path.replace(/\/+$/, "");
    }
    
    // SEO defaults
    const routeSeo = SEO_BY_PATH[path];
    const knownPath = isKnownPublicPath(path);
    let title = routeSeo?.title || "Noor — Islamic App for Quran, Hadith, Prayer Times & Dua";
    let description = routeSeo?.description || "Noor is a free Islamic app for Muslims in India & Bangladesh. Read Quran with Bengali translation, Hadith, daily duas, prayer times, Qibla & Islamic quiz.";
    let ogImage = `${SITE_ORIGIN}/og-image.png`;
    let ogType = "website";
    let extraTags = "";
    let canonicalUrl = `${SITE_ORIGIN}${path}`;
    let bodyContent = "";

    // Initialize Supabase
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase credentials in environment");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (!knownPath) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return res.status(404).send("<!DOCTYPE html><html lang=\"bn\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex,follow\"><title>Page not found | Noor</title></head><body><h1>Page not found</h1><p>The requested Noor page could not be found.</p></body></html>");
    }

    // --- 1. Dua Category Pages ---
    const duaCategoryMatch = path.match(/^\/dua\/category\/([a-zA-Z0-9-]+)$/);
    if (duaCategoryMatch) {
      const categoryName = humanizeSlug(duaCategoryMatch[1]);
      title = `${categoryName} Duas in Bengali | Noor`;
      description = `Read Arabic duas with Bengali meaning, pronunciation and practical context for ${categoryName.toLowerCase()} on Noor.`;
      ogImage = `${SITE_ORIGIN}/og-dua.png`;
      bodyContent = `<h2>${categoryName} Duas</h2><p>Explore authentic duas for ${categoryName.toLowerCase()} with Arabic text and Bengali translation.</p>`;
    }

    // --- 2. Story Category Pages ---
    const storyCategoryMatch = path.match(/^\/stories\/category\/([a-zA-Z0-9_-]+)$/);
    if (storyCategoryMatch) {
      const categoryName = humanizeSlug(storyCategoryMatch[1]);
      title = `${categoryName} Islamic Stories in Bengali | Noor`;
      description = `Read sourced Islamic stories in Bengali from the ${categoryName.toLowerCase()} collection, with lessons and references on Noor.`;
      ogImage = `${SITE_ORIGIN}/og-stories-default.png`;
      bodyContent = `<h2>${categoryName} Stories</h2><p>Read inspiring Islamic stories from the ${categoryName.toLowerCase()} collection.</p>`;
    }

    // --- 3. Story Pages ---
    const storyMatch = path.match(/^\/stories\/([a-zA-Z0-9-]+)(?:\/trailer)?$/);
    const isTrailerMode = path.endsWith("/trailer");

    if (storyMatch) {
      const slug = storyMatch[1];
      const { data: story } = await supabase
        .from("admin_content")
        .select("*")
        .eq("content_type", "story")
        .eq("slug", slug)
        .maybeSingle();

      if (story) {
        const storyTitle = story.title_bn || story.title || story.title_en;
        title = isTrailerMode ? `🎬 Trailer: ${storyTitle}` : storyTitle;
        description = story.seo?.meta_description || `${storyTitle} — Read this beautiful Islamic story on Noor App with lessons and references.`;
        ogImage = story.og_image_url || story.image_url || `${SITE_ORIGIN}/og-stories-default.png`;
        ogType = isTrailerMode ? "video.other" : "article";
        bodyContent = `<h2>${storyTitle}</h2><p>${description}</p><p>Read the full story, explore key lessons, and check authentic references on Noor App.</p>`;
      }
    }

    // --- 4. Hadith Chapter Pages ---
    const hadithChapterMatch = path.match(/^\/hadith\/sahih-bukhari\/(bangla|english|urdu)\/chapter-(\d+)$/);
    if (hadithChapterMatch) {
      const [, lang, chapterNum] = hadithChapterMatch;
      const langLabel = lang.charAt(0).toUpperCase() + lang.slice(1);
      title = `Sahih Bukhari ${langLabel} Chapter ${chapterNum} | Noor`;
      description = `Read Sahih Bukhari Chapter ${chapterNum} hadiths in ${langLabel} with original Arabic text on Noor Islamic App.`;
      ogImage = `${SITE_ORIGIN}/og-bukhari.png`;
      bodyContent = `<h2>Sahih Bukhari - Chapter ${chapterNum} (${langLabel})</h2><p>Browse authentic hadiths from Sahih Bukhari, the most reliable hadith collection, with ${langLabel} translation and Arabic text.</p>`;
    }

    // --- 5. Hadith Detail Pages ---
    // FIXED: Querying from 'hadiths' table instead of 'admin_content'
    const hadithDetailMatch = path.match(/^\/hadith\/h\/([a-zA-Z0-9-]+)$/);
    if (hadithDetailMatch) {
      const slug = hadithDetailMatch[1];
      const { data: hadith } = await supabase
        .from("hadiths")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (hadith) {
        const hadithTitle = hadith.topic_bn || `Sahih Bukhari Hadith ${hadith.hadith_number}`;
        title = `${hadithTitle} | Noor`;
        description = hadith.bengali?.slice(0, 160) || `Read Sahih Bukhari Hadith ${hadith.hadith_number} on Noor App with Arabic text, translation, and scholarly context.`;
        ogImage = `${SITE_ORIGIN}/og-bukhari.png`;
        ogType = "article";
        bodyContent = `<h2>${hadithTitle}</h2><p>${description}</p><p>Explore the full hadith text, its source, and educational explanations on Noor.</p>`;
      }
    }

    // --- 6. Dua Detail Pages ---
    const duaDetailMatch = path.match(/^\/dua\/([a-zA-Z0-9-]+)$/);
    if (duaDetailMatch && !path.includes("category")) {
      const slug = duaDetailMatch[1];
      const { data: dua } = await supabase
        .from("admin_content")
        .select("*")
        .eq("content_type", "dua")
        .eq("slug", slug)
        .maybeSingle();

      if (dua) {
        title = dua.title || `Dua: ${slug} | Noor`;
        description = dua.seo?.meta_description || `Recite this authentic dua on Noor App with Arabic text, Bengali meaning, and benefits.`;
        ogImage = dua.og_image_url || dua.image_url || `${SITE_ORIGIN}/og-dua.png`;
        ogType = "article";
        bodyContent = `<h2>${dua.title || 'Islamic Dua'}</h2><p>${description}</p><p>Read the Arabic text, pronunciation, meaning, and when to recite this dua on Noor.</p>`;
      }
    }

    // Escape HTML for safety
    const esc = (s) => String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    // Determine image MIME type
    let imgType = "image/png";
    if (ogImage.toLowerCase().includes(".webp")) imgType = "image/webp";
    else if (ogImage.toLowerCase().includes(".jpg") || ogImage.toLowerCase().includes(".jpeg")) imgType = "image/jpeg";

    // Build the HTML response
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${esc(canonicalUrl)}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${esc(ogImage)}">
    <meta property="og:image:secure_url" content="${esc(ogImage)}">
    <meta property="og:image:type" content="${imgType}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${esc(canonicalUrl)}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Noor Islamic App">
    ${extraTags}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(ogImage)}">
</head>
<body style="font-family: sans-serif; background: #0a1a1a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px;">
    <div style="max-width: 600px;">
        <h1 style="color: #10b981;">NOOR</h1>
        ${bodyContent || `<h2>${esc(title)}</h2><p>${esc(description)}</p>`}
        <p style="margin-top: 20px; font-size: 0.9em; color: #888;">Loading the full experience... If not redirected, <a href="${esc(path)}" style="color: #10b981;">click here</a>.</p>
        <script>setTimeout(function() { window.location.href = "${esc(path)}"; }, 500);</script>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('X-Robots-Tag', 'index, follow');
    return res.status(200).send(html);
  } catch (err) {
    console.error("Critical Prerender Error:", err);
    return res.status(200).send(`<!DOCTYPE html><html><head><title>Noor Islamic App</title><script>window.location.href = "/";</script></head><body>Loading...</body></html>`);
  }
}
