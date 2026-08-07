import { createClient } from '@supabase/supabase-js';

const SITE_ORIGIN = "https://noorapp.in";

export default async function handler(req, res) {
  try {
    // Get path from query or from the URL itself
    let { path = "/" } = req.query;
    
    // Normalize path
    if (path !== "/" && path.endsWith("/")) {
      path = path.replace(/\/+$/, "");
    }
    
    // SEO defaults
    let title = "Noor — Islamic App for Quran, Hadith, Prayer Times & Dua";
    let description = "Noor is a free Islamic app for Muslims in India & Bangladesh. Read Quran with Bengali translation, Hadith, daily duas, prayer times, Qibla & Islamic quiz.";
    let ogImage = `${SITE_ORIGIN}/og-image.png`;
    let ogType = "website";
    let extraTags = "";

    // Vercel serverless functions use process.env
    // We check for both VITE_ prefixed and standard names
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Match story pages: /stories/slug or /stories/slug/trailer
      const storyMatch = path.match(/^\/stories\/([a-zA-Z0-9-]+)(?:\/trailer)?$/);
      const isTrailerMode = path.endsWith("/trailer") || (req.url && req.url.includes("trailer=true"));

      if (storyMatch) {
        const slug = storyMatch[1];
        let story = null;
        let error = null;
        
        // Try to fetch from database first
        try {
          const result = await supabase
            .from("admin_content")
            .select("*")
            .ilike("content_type", "story")
            .eq("slug", slug)
            .maybeSingle();
          story = result.data;
          error = result.error;
        } catch (err) {
          console.error("Database fetch error:", err);
        }

        // Fallback to public/stories.json if database lookup fails
        if (!story || error) {
          try {
            const response = await fetch(`${SITE_ORIGIN}/stories.json`);
            const stories = await response.json();
            story = stories.find(s => s.slug === slug);
          } catch (err) {
            console.error("Fallback stories.json fetch error:", err);
          }
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
          
          // Get image from multiple sources
          const rawImg = story.image_url 
            || story.og_image_url 
            || story.seo?.og_image 
            || story.seo?.open_graph?.['og:image']
            || story.og_image_data?.og_image;
          
          if (rawImg) {
            if (rawImg.startsWith("http")) {
              ogImage = rawImg;
            } else {
              const clean = rawImg.replace(/^\/+/, "");
              const storagePath = clean.startsWith("media/") ? clean.slice("media/".length) : clean;
              ogImage = `${supabaseUrl}/storage/v1/object/public/media/${storagePath}`;
            }
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
    }

    // Build the HTML response with absolute URLs
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:secure_url" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${SITE_ORIGIN}${path}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Noor Islamic App">
    ${extraTags}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:url" content="${SITE_ORIGIN}${path}">
</head>
<body style="font-family: sans-serif; background: #0a1a1a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px;">
    <div>
        <h1 style="color: #10b981;">NOOR</h1>
        <h2>${title}</h2>
        <p>${description}</p>
        <p>Loading the full experience...</p>
        <script>window.location.href = "${path}";</script>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).send(html);
  } catch (err) {
    console.error("Critical Prerender Error:", err);
    return res.status(200).send(`<!DOCTYPE html><html><head><title>Noor Islamic App</title><script>window.location.href = "/";</script></head><body>Loading...</body></html>`);
  }
}
