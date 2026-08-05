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
  // 1. Fetch all published duas
  const { data: duas, error } = await supabase
    .from('admin_content')
    .select('slug, title, title_bn, seo, og_image_data')
    .eq('content_type', 'dua')
    .eq('status', 'published')
    .not('slug', 'is', null);

  if (error) {
    console.error('Failed to fetch duas:', error);
    process.exit(1);
  }

  console.log(`Found ${duas.length} duas to prerender`);

  // 2. Read the base index.html template
  const distDir = path.join(PROJECT_ROOT, 'dist');
  const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // 3. Generate per-dua HTML pages
  for (const dua of duas) {
    const seo = typeof dua.seo === 'string' ? JSON.parse(dua.seo) : (dua.seo || {});
    const ogImage = typeof dua.og_image_data === 'string' 
      ? JSON.parse(dua.og_image_data) 
      : (dua.og_image_data || {});

    const title = dua.title_bn || dua.title || 'Noor Islamic App';
    const metaTitle = seo.meta_title || title;
    const metaDescription = seo.meta_description || '';
    const ogImageUrl = ogImage.url || `https://noorapp.in/assets/og-images/${dua.slug}.png`;
    const canonicalUrl = `https://noorapp.in/dua/${dua.slug}`;

    // Generate HTML with proper OG tags
    const pageHtml = generateDuaHtml(baseHtml, {
      title: metaTitle,
      description: metaDescription,
      ogImageUrl,
      canonicalUrl,
      slug: dua.slug,
    });

    // Write to dist/dua/{slug}/index.html
    const outputDir = path.join(distDir, 'dua', dua.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), pageHtml);
  }

  // 4. Generate /dua page
  const duaListHtml = generateDuaListHtml(baseHtml);
  fs.mkdirSync(path.join(distDir, 'dua'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'dua', 'index.html'), duaListHtml);

  console.log(`Generated ${duas.length} dua pages + /dua list page`);
}

function generateDuaHtml(baseHtml, { title, description, ogImageUrl, canonicalUrl, slug }) {
  let html = baseHtml;

  // Replace/update OG meta tags
  html = updateMetaTag(html, 'og:title', title);
  html = updateMetaTag(html, 'og:description', description);
  html = updateMetaTag(html, 'og:image', ogImageUrl);
  html = updateMetaTag(html, 'og:image:secure_url', ogImageUrl);
  html = updateMetaTag(html, 'og:image:url', ogImageUrl);
  html = updateMetaTag(html, 'og:url', canonicalUrl);
  html = updateMetaTag(html, 'twitter:title', title);
  html = updateMetaTag(html, 'twitter:description', description);
  html = updateMetaTag(html, 'twitter:image', ogImageUrl);
  html = updateMetaTag(html, 'twitter:url', canonicalUrl);
  html = updateMetaTag(html, 'title', title);
  html = updateMetaTag(html, 'description', description);

  // Add canonical link
  if (!html.includes(`<link rel="canonical"`)) {
    html = html.replace('</head>', `    <link rel="canonical" href="${canonicalUrl}" />\n  </head>`);
  } else {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  }

  // Add JSON-LD for the dua
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

function generateDuaListHtml(baseHtml) {
  let html = baseHtml;
  html = updateMetaTag(html, 'og:title', 'দোয়া সমগ্র | Noor Islamic App');
  html = updateMetaTag(html, 'og:description', '১৬০+ কুরআনি ও হাদিসের দোয়া আরবি, বাংলা, ইংরেজি ও উর্দু ভাষায়। পড়ুন, শুনুন এবং শেয়ার করুন।');
  html = updateMetaTag(html, 'og:image', 'https://noorapp.in/og-dua.png');
  html = updateMetaTag(html, 'twitter:image', 'https://noorapp.in/og-dua.png');
  html = updateMetaTag(html, 'title', 'দোয়া সমগ্র | Noor Islamic App');
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
