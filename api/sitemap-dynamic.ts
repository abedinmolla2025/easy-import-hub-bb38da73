const ORIGIN = "https://noorapp.in";

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => unknown };
};

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Keep this endpoint dependency-free. A database outage must never make the
// sitemap fail: only stable, public, canonical routes belong here.
const PUBLIC_ROUTES = [
  "/",
  "/quran",
  "/hadith",
  "/hadith/sahih-bukhari",
  "/hadith/sahih-bukhari/bangla",
  "/hadith/sahih-bukhari/english",
  "/hadith/sahih-bukhari/urdu",
  "/dua",
  "/prayer-times",
  "/prayer-guide",
  "/qibla",
  "/tasbih",
  "/99-names",
  "/baby-names",
  "/calendar",
  "/quiz",
  "/stories",
  "/stories/prophet-musa-story-islam",
  "/stories/prophet-nuh-story-islam",
  "/stories/prophet-yusuf-story-islam",
  "/stories/prophet-ibrahim-story-islam",
  "/stories/prophet-muhammad-story-islam",
  "/about",
  "/contact",
  "/sources",
  "/privacy-policy",
  "/terms",
  "/download",
  "/islamic-app",
] as const;

export default function handler(_req: unknown, res: ResponseLike) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_ROUTES
    .map((path) => `  <url><loc>${xmlEscape(`${ORIGIN}${path}`)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  );
  return res.status(200).send(body);
}

export { PUBLIC_ROUTES };
