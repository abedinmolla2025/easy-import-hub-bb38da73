/**
 * Generate static HTML pages for all dua routes with proper OG meta tags.
 * Runs AFTER the Vite build.
 * Fetches dua data from Supabase and creates per-route HTML files.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Read Supabase config from .env
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)="?(.+?)"?$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const distDir = path.join(PROJECT_ROOT, 'dist');
  const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // 1. Fetch all published duas
  const { data: duas, error: duaError } = await supabase
    .from('admin_content')
    .select('slug, title, title_bn, seo, og_image_data')
    .eq('content_type', 'dua')
    .eq('status', 'published')
    .not('slug', 'is', null);

  if (duaError) {
    console.error('Failed to fetch duas:', duaError);
  } else {
    console.log(`Found ${duas.length} duas to prerender`);
    for (const dua of duas) {
      const seo = typeof dua.seo === 'string' ? JSON.parse(dua.seo) : (dua.seo || {});
      const ogImage = typeof dua.og_image_data === 'string' ? JSON.parse(dua.og_image_data) : (dua.og_image_data || {});
      const title = dua.title_bn || dua.title || 'Noor Islamic App';
      const ogImageUrl = ogImage.url || `https://noorapp.in/assets/og-images/${dua.slug}.png`;
      const pageHtml = generateHtml(baseHtml, {
        title: seo.meta_title || title,
        description: seo.meta_description || '',
        ogImageUrl,
        canonicalUrl: `https://noorapp.in/dua/${dua.slug}`,
      });
      const outputDir = path.join(distDir, 'dua', dua.slug);
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, 'index.html'), pageHtml);
    }
  }

  // 2. Fetch all published stories
  const { data: stories, error: storyError } = await supabase
    .from('admin_content')
    .select('slug, title, title_bn, seo, og_image_data, image_url, audio_trailer_url')
    .eq('content_type', 'story')
    .eq('status', 'published')
    .not('slug', 'is', null);

  if (storyError) {
    console.error('Failed to fetch stories:', storyError);
  } else {
    console.log(`Found ${stories.length} stories to prerender`);
    for (const story of stories) {
      const seo = typeof story.seo === 'string' ? JSON.parse(story.seo) : (story.seo || {});
      const title = story.title_bn || story.title || 'Islamic Story';
      const ogImageUrl = story.image_url || `https://noorapp.in/assets/stories/og-${story.slug}.jpg`;
      
      // Main Story Page
      const mainHtml = generateHtml(baseHtml, {
        title: seo.meta_title || title,
        description: seo.meta_description || `${title} — পড়ুন নূর ইসলামিক অ্যাপে।`,
        ogImageUrl,
        canonicalUrl: `https://noorapp.in/stories/${story.slug}`,
      });
      const mainDir = path.join(distDir, 'stories', story.slug);
      fs.mkdirSync(mainDir, { recursive: true });
      fs.writeFileSync(path.join(mainDir, 'index.html'), mainHtml);

      // Trailer Page (as a sub-path for better social sharing)
      if (story.audio_trailer_url) {
        const trailerHtml = generateHtml(baseHtml, {
          title: `🎬 Trailer: ${title}`,
          description: `এই হৃদয়স্পর্শী ইসলামিক গল্পটির একটি চমৎকার অডিও ট্রেলার শুনুন।`,
          ogImageUrl,
          canonicalUrl: `https://noorapp.in/stories/${story.slug}/trailer`,
          ogType: 'video.other',
          extraTags: `
    <meta property="og:audio" content="${story.audio_trailer_url}">
    <meta property="og:audio:type" content="audio/mpeg">
    <meta property="og:video" content="${story.audio_trailer_url}">
    <meta property="og:video:type" content="video/mp4">`
        });
        const trailerDir = path.join(distDir, 'stories', story.slug, 'trailer');
        fs.mkdirSync(trailerDir, { recursive: true });
        fs.writeFileSync(path.join(trailerDir, 'index.html'), trailerHtml);
      }
    }
  }

  // 3. Generate /dua and /stories list pages
  const duaListHtml = generateListHtml(baseHtml, 'দোয়া সমগ্র', 'https://noorapp.in/og-dua.png');
  fs.mkdirSync(path.join(distDir, 'dua'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'dua', 'index.html'), duaListHtml);

  const storyListHtml = generateListHtml(baseHtml, 'ইসলামিক গল্প', 'https://noorapp.in/og-stories-default.jpg');
  fs.mkdirSync(path.join(distDir, 'stories'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'stories', 'index.html'), storyListHtml);

  console.log(`Prerender complete.`);
}

function generateHtml(baseHtml, { title, description, ogImageUrl, canonicalUrl, ogType = 'website', extraTags = '' }) {
  let html = baseHtml;

  html = updateMetaTag(html, 'og:title', title);
  html = updateMetaTag(html, 'og:description', description);
  html = updateMetaTag(html, 'og:image', ogImageUrl);
  html = updateMetaTag(html, 'og:image:secure_url', ogImageUrl);
  html = updateMetaTag(html, 'og:image:url', ogImageUrl);
  html = updateMetaTag(html, 'og:url', canonicalUrl);
  html = updateMetaTag(html, 'og:type', ogType);
  html = updateMetaTag(html, 'twitter:title', title);
  html = updateMetaTag(html, 'twitter:description', description);
  html = updateMetaTag(html, 'twitter:image', ogImageUrl);
  html = updateMetaTag(html, 'twitter:url', canonicalUrl);
  html = updateMetaTag(html, 'title', title);
  html = updateMetaTag(html, 'description', description);

  if (!html.includes(`<link rel="canonical"`)) {
    html = html.replace('</head>', `    <link rel="canonical" href="${canonicalUrl}" />\n  </head>`);
  } else {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  }

  if (extraTags) {
    html = html.replace('</head>', `${extraTags}\n  </head>`);
  }

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": ogImageUrl,
    "url": canonicalUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Noor Islamic App",
      "logo": {
        "@type": "ImageObject",
        "url": "https://noorapp.in/logo.png"
      }
    }
  });
  html = html.replace('</head>', `    <script type="application/ld+json">${jsonLd}</script>\n  </head>`);

  return html;
}

function generateListHtml(baseHtml, title, ogImage) {
  let html = baseHtml;
  const fullTitle = `${title} | Noor Islamic App`;
  html = updateMetaTag(html, 'og:title', fullTitle);
  html = updateMetaTag(html, 'og:image', ogImage);
  html = updateMetaTag(html, 'twitter:image', ogImage);
  html = updateMetaTag(html, 'title', fullTitle);
  return html;
}

function updateMetaTag(html, property, content) {
  // Handle og:property and name attributes
  if (property === 'title') {
    return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(content)}</title>`);
  }
  if (property === 'description' || property.startsWith('twitter:')) {
    return html.replace(
      new RegExp(`<meta name="${escapeRegex(property)}" content="[^"]*">`, 'g'),
      `<meta name="${property}" content="${escapeHtml(content)}">`
    );
  }
  // og:* properties
  return html.replace(
    new RegExp(`<meta property="${escapeRegex(property)}" content="[^"]*">`, 'g'),
    `<meta property="${property}" content="${escapeHtml(content)}">`
  );
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
