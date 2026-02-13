import { useEffect } from "react";

/**
 * This route proxies /sitemap.xml to the Supabase Edge Function.
 * It replaces the entire document with the raw XML response so that
 * crawlers see Content-Type: application/xml (via document.write).
 */
const SitemapProxy = () => {
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const edgeFnUrl = `${supabaseUrl}/functions/v1/sitemap`;

    fetch(edgeFnUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
        return res.text();
      })
      .then((xml) => {
        // Replace the entire document with raw XML
        document.open("application/xml");
        document.write(xml);
        document.close();
      })
      .catch((err) => {
        console.error("Sitemap proxy error:", err);
      });
  }, []);

  return null;
};

export default SitemapProxy;
