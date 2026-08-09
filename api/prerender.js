import { createClient } from '@supabase/supabase-js';

const SITE_ORIGIN = "https://noorapp.in";

// Supabase credentials for the public anon key (safe to expose in serverless functions)
const SUPABASE_URL = "https://llicfiepatzgllmjhzbw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaWNmaWVwYXR6Z2xsbWpoemJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4MDksImV4cCI6MjA4NDA1NjgwOX0.T7xnXRSM2jx92gVH8Of1dePj609C7WKKflv2I_VZpy0";

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

    // Always use hardcoded Supabase URL for reliability in serverless functions
    // Vercel does NOT pass VITE_ prefixed env vars to serverless functions
    const supabaseUrl = SUPABASE_URL;
    const supabaseKey = SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!knownPath) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return res.status(404).send("<!DOCTYPE html><html lang=\"bn\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex,follow\"><title>Page not found | Noor</title></head><body><h1>Page not found</h1><p>The requested Noor page could not be found.</p></body></html>");
    }

    // Dynamic category pages need useful crawler metadata too; otherwise they fall back to the generic app title.
    const duaCategoryMatch = path.match(/^\/dua\/category\/([a-zA-Z0-9-]+)$/);
    if (duaCategoryMatch) {
      const categoryName = humanizeSlug(duaCategoryMatch[1]);
      title = `${categoryName} Duas in Bengali | Noor`;
      description = `Read Arabic duas with Bengali meaning, pronunciation and practical context for ${categoryName.toLowerCase()} on Noor.`;
      ogImage = `${SITE_ORIGIN}/og-dua.png`;
    }

    const storyCategoryMatch = path.match(/^\/stories\/category\/([a-zA-Z0-9_-]+)$/);
    if (storyCategoryMatch && !VALID_STORY_CATEGORIES.has(storyCategoryMatch[1])) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return res.status(404).send("<!DOCTYPE html><html lang=\"bn\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex,follow\"><title>Story category not found | Noor</title></head><body><h1>Story category not found</h1><p>The requested Noor story category could not be found.</p></body></html>");
    }
    if (storyCategoryMatch) {
      const categoryName = humanizeSlug(storyCategoryMatch[1]);
      title = `${categoryName} Islamic Stories in Bengali | Noor`;
      description = `Read sourced Islamic stories in Bengali from the ${categoryName.toLowerCase()} collection, with lessons and references on Noor.`;
      ogImage = `${SITE_ORIGIN}/og-stories-default.png`;
    }

    // Match story pages: /stories/slug or /stories/slug/trailer
    const storyMatch = path.match(/^\/stories\/([a-zA-Z0-9-]+)(?:\/trailer)?$/);
    const isTrailerMode = path.endsWith("/trailer") || (req.url && req.url.includes("trailer=true"));

    if (storyMatch) {
      const slug = storyMatch[1];
      let story = null;
      let dbError = null;
      
      // Try to fetch from database first
      try {
        const result = await supabase
          .from("admin_content")
          .select("slug, title, title_en, seo, og_image_data, image_url, og_image_url, audio_trailer_url")
          .eq("content_type", "story")
          .eq("slug", slug)
          .maybeSingle();
        story = result.data;
        dbError = result.error;
        if (dbError) {
          console.error("Database fetch error:", dbError);
        }
      } catch (err) {
        console.error("Database fetch exception:", err);
      }

      // Fallback to public/stories.json if database lookup fails
      if (!story) {
        try {
          const response = await fetch(`${SITE_ORIGIN}/stories.json`, {
            headers: { 'Accept': 'application/json' }
          });
          if (response.ok) {
            const stories = await response.json();
            story = stories.find(s => s.slug === slug);
          }
        } catch (err) {
          console.error("Fallback stories.json fetch error:", err);
        }
      }

      if (!story) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("X-Robots-Tag", "noindex, follow");
        return res.status(404).send("<!DOCTYPE html><html lang=\"bn\"><head><meta charset=\"UTF-8\"><meta name=\"robots\" content=\"noindex,follow\"><title>Story not found | Noor</title></head><body><h1>Story not found</h1><p>The requested story could not be found.</p></body></html>");
      }

      if (story) {
        const storyTitle = story.title_bn || story.title || story.title_en;
        title = isTrailerMode ? `🎬 Trailer: ${storyTitle}` : storyTitle;
        
        // Get description from SEO or fallback
        if (isTrailerMode) {
          description = "এই হৃদয়স্পর্শী ইসলামিক গল্পটির একটি চমৎকার অডিও ট্রেলার শুনুন।";
        } else {
          description = story.seo?.meta_description 
            || story.seo?.open_graph?.['og:description']
            || `${storyTitle} — পড়ুন নূর ইসলামিক অ্যাপে।`;
        }
        
        // Get image from multiple sources - check all possible field names
        const rawImg = story.og_image_data?.url
          || story.og_image_data?.og_image
          || story.seo?.open_graph?.['og:image']
          || story.seo?.og_image
          || story.image_url
          || story.og_image_url;
        
        if (rawImg && typeof rawImg === 'string' && rawImg.trim()) {
          const clean = rawImg.trim();
          if (clean.startsWith("http")) {
            ogImage = clean;
          } else {
            const imgPath = clean.replace(/^\/+/, "");
            if (imgPath.startsWith("assets/") || imgPath.startsWith("og-")) {
              ogImage = `${SITE_ORIGIN}/${imgPath}`;
            } else {
              let bucket = "og-images";
              let storagePath = imgPath;
              if (imgPath.startsWith("og-images/")) {
                bucket = "og-images";
                storagePath = imgPath.slice("og-images/".length);
              } else if (imgPath.startsWith("media/")) {
                bucket = "media";
                storagePath = imgPath.slice("media/".length);
              }
              ogImage = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
            }
          }
        }

        // Set canonical URL from story SEO data
        const seoCanonical = story.seo?.canonical_url || story.seo?.open_graph?.['og:url'];
        if (seoCanonical) {
          canonicalUrl = seoCanonical;
        }

        if (isTrailerMode) {
          ogType = "video.other";
          if (story.audio_trailer_url) {
            const audioUrl = story.audio_trailer_url.startsWith("http") ? story.audio_trailer_url : `${SITE_ORIGIN}${story.audio_trailer_url}`;
            extraTags += `\n    <meta property="og:audio" content="${audioUrl}">`;
            extraTags += `\n    <meta property="og:audio:type" content="audio/mpeg">`;
            extraTags += `\n    <meta property="og:audio:secure_url" content="${audioUrl}">`;
            extraTags += `\n    <meta property="og:video" content="${audioUrl}">`;
            extraTags += `\n    <meta property="og:video:type" content="video/mp4">`;
          }
        }
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
    else if (ogImage.toLowerCase().includes(".png")) imgType = "image/png";

    // Build the HTML response with absolute URLs
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
    <meta property="og:image:alt" content="${esc(title)}">
    <meta property="og:url" content="${esc(canonicalUrl)}">
    <meta itemprop="image" content="${esc(ogImage)}">
    <link rel="image_src" href="${esc(ogImage)}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Noor Islamic App">
    ${extraTags}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(ogImage)}">
    <meta name="twitter:url" content="${esc(canonicalUrl)}">
</head>
<body style="font-family: sans-serif; background: #0a1a1a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px;">
    <div>
        <h1 style="color: #10b981;">NOOR</h1>
        <h2>${esc(title)}</h2>
        <p>${esc(description)}</p>
        <p>Loading the full experience...</p>
        <script>window.location.href = "${esc(path)}";</script>
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
