import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ScanSearch, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OgResult = {
  status: number;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  imageStatus?: "ok" | "failed" | "unknown";
};

function extractMeta(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  return html.match(re)?.[1] ?? html.match(alt)?.[1];
}

function checkImage(url: string): Promise<"ok" | "failed"> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (r: "ok" | "failed") => resolve(r);
    img.onload = () => done("ok");
    img.onerror = () => done("failed");
    img.src = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
    setTimeout(() => done("failed"), 8000);
  });
}

export default function SocialOgVerifyPanel({ path }: { path: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OgResult | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(
        `${base}/functions/v1/prerender?path=${encodeURIComponent(path)}&t=${Date.now()}`,
      );
      const html = await res.text();
      const ogImage = extractMeta(html, "og:image");
      const next: OgResult = {
        status: res.status,
        ogImage,
        ogTitle: extractMeta(html, "og:title"),
        ogDescription: extractMeta(html, "og:description"),
        ogUrl: extractMeta(html, "og:url"),
        imageStatus: "unknown",
      };
      setResult(next);
      if (ogImage) {
        const imageStatus = await checkImage(ogImage);
        setResult({ ...next, imageStatus });
      }
    } catch (e: any) {
      setError(e?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const ok = result?.status === 200 && !!result?.ogImage && result?.imageStatus === "ok";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">সোশ্যাল প্রিভিউ যাচাই</h2>
          <p className="text-xs text-white/60">Facebook / WhatsApp যে og:image পাবে সেটি চেক করুন</p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[hsl(45,93%,58%)]/20 text-[hsl(45,93%,58%)] text-xs font-semibold hover:bg-[hsl(45,93%,58%)]/30 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanSearch className="w-3.5 h-3.5" />}
          {loading ? "চেক হচ্ছে..." : "OG যাচাই করুন"}
        </button>
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      {result && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            {ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-300" />
            )}
            <span className="text-white/80">
              Prerender status: <strong className="text-white">{result.status}</strong> · Image:{" "}
              <strong className="text-white">
                {result.imageStatus === "ok" ? "লোড হচ্ছে" : result.imageStatus === "failed" ? "পাওয়া যায়নি" : "চেক হচ্ছে"}
              </strong>
            </span>
          </div>

          <div className="rounded-lg bg-black/25 p-2 break-all text-white/80">
            <div className="flex items-start justify-between gap-2">
              <span>
                <span className="text-white/50">og:image → </span>
                {result.ogImage ?? "(পাওয়া যায়নি)"}
              </span>
              {result.ogImage && (
                <button
                  aria-label="Copy og:image URL"
                  onClick={() => {
                    navigator.clipboard?.writeText(result.ogImage!);
                    toast({ title: "og:image লিংক কপি হয়েছে" });
                  }}
                  className="shrink-0 text-[hsl(45,93%,58%)]"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {result.ogTitle && (
            <p className="text-white/70">
              <span className="text-white/50">og:title → </span>
              {result.ogTitle}
            </p>
          )}
          {result.ogUrl && (
            <p className="text-white/70 break-all">
              <span className="text-white/50">og:url → </span>
              {result.ogUrl}
            </p>
          )}

          {result.ogImage && (
            <img
              src={result.ogImage}
              alt="OG preview"
              className="w-full max-w-sm rounded-lg border border-white/10"
              loading="lazy"
            />
          )}
        </div>
      )}
    </section>
  );
}
