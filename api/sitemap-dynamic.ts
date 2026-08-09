const ORIGIN = "https://noorapp.in";

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => unknown };
};

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// Production sitemap endpoint: deterministic XML with a dependency-free fallback.
export default function handler(_req: unknown, res: ResponseLike) {
  // Keep this endpoint deterministic and dependency-free. Dynamic content is added only
  // when it is present in the deployed public JSON asset; an unavailable database must
  // never turn the sitemap into an HTTP 500 response.
  const urls = [
    "/stories",
    "/stories/prophet-musa-story-islam",
    "/stories/prophet-nuh-story-islam",
    "/stories/prophet-yusuf-story-islam",
    "/stories/prophet-ibrahim-story-islam",
    "/stories/prophet-muhammad-story-islam",
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${xmlEscape(`${ORIGIN}${path}`)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
  return res.status(200).send(body);
}
