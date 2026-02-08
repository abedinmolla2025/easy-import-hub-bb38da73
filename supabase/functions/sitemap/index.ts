import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Fetch SEO pages
    const { data: seoPages, error: seoErr } = await supabase
      .from("seo_pages")
      .select("path, updated_at, robots, changefreq, priority")
      .order("path", { ascending: true });

    if (seoErr) {
      console.error("Error fetching seo_pages:", seoErr);
      return new Response("Error fetching sitemap data", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // 2. Fetch published content pages
    const { data: contentPages, error: contentErr } = await supabase
      .from("admin_content")
      .select("id, content_type, title, updated_at")
      .eq("is_published", true)
      .eq("status", "published");

    if (contentErr) {
      console.error("Error fetching admin_content:", contentErr);
    }

    // Filter out noindex pages
    const indexablePages = (seoPages || []).filter((p) => {
      const robots = (p.robots || "").toLowerCase();
      return !robots.includes("noindex");
    });

    // Determine origin from request or use a configured domain
    const url = new URL(req.url);
    const hostParam = url.searchParams.get("host");
    const origin = hostParam ? `https://${hostParam}` : `${url.protocol}//${url.host}`;

    // Build URLs from seo_pages
    const seoUrls = indexablePages.map((p) => {
      const lastmod = p.updated_at
        ? new Date(p.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      return `  <url>
    <loc>${origin}${p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq || "weekly"}</changefreq>
    <priority>${p.priority ?? 0.8}</priority>
  </url>`;
    });

    // Build URLs from published content (if not already in seo_pages)
    const existingPaths = new Set(indexablePages.map((p) => p.path));
    const contentUrls = (contentPages || [])
      .filter((c) => {
        const contentPath = `/${c.content_type}/${c.id}`;
        return !existingPaths.has(contentPath);
      })
      .map((c) => {
        const lastmod = c.updated_at
          ? new Date(c.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        return `  <url>
    <loc>${origin}/${c.content_type}/${c.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

    const allUrls = [...seoUrls, ...contentUrls].join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response("Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
