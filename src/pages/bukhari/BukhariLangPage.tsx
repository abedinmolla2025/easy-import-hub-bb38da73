import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Search, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import BottomNavigation from "@/components/BottomNavigation";

// ── Types ────────────────────────────────────────────────────
type LangSlug = "bangla" | "english" | "urdu";

interface RawHadith {
  id: string;
  chapter_id: number;
  hadith_number: number;
  arabic: string;
  bengali?: string;
  english?: string;
  urdu?: string;
}

interface Hadith {
  id: string;
  chapterId: number;
  number: number;
  arabic: string;
  translation: string;
}

interface Chapter {
  id: number;
  count: number;
}

// ── Language config ──────────────────────────────────────────
const langConfig: Record<
  LangSlug,
  {
    file: string;
    field: keyof RawHadith;
    label: string;
    seoTitle: string;
    seoDesc: string;
    ui: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      chapters: string;
      allHadiths: string;
      hadithNo: string;
      narrator: string;
      chapter: string;
      hadiths: string;
      loading: string;
      error: string;
      noResults: string;
    };
    rtl: boolean;
  }
> = {
  bangla: {
    file: "/data/sahih_bukhari_bn.json",
    field: "bengali",
    label: "বাংলা",
    seoTitle: "Sahih al-Bukhari Bangla — সহীহ আল-বুখারী বাংলা | Noor",
    seoDesc:
      "Read Sahih al-Bukhari with Arabic text and Bengali translation. সহীহ আল-বুখারী আরবি সহ বাংলা অনুবাদ পড়ুন।",
    rtl: false,
    ui: {
      title: "সহিহ বুখারী শরীফ",
      subtitle: "আরবি + বাংলা অনুবাদ",
      searchPlaceholder: "হাদিস খুঁজুন...",
      chapters: "অধ্যায়সমূহ",
      allHadiths: "সকল হাদিস",
      hadithNo: "হাদিস নং",
      narrator: "বর্ণনাকারী",
      chapter: "অধ্যায়",
      hadiths: "টি হাদিস",
      loading: "হাদিস লোড হচ্ছে...",
      error: "ডাটা লোড করতে সমস্যা হয়েছে",
      noResults: "কোনো হাদিস পাওয়া যায়নি",
    },
  },
  english: {
    file: "/data/sahih_bukhari_en.json",
    field: "english",
    label: "English",
    seoTitle:
      "Sahih al-Bukhari English — Arabic + English Translation | Noor",
    seoDesc:
      "Read Sahih al-Bukhari with Arabic text and English translation. The most authentic hadith collection.",
    rtl: false,
    ui: {
      title: "Sahih Al-Bukhari",
      subtitle: "Arabic + English Translation",
      searchPlaceholder: "Search hadiths...",
      chapters: "Chapters",
      allHadiths: "All Hadiths",
      hadithNo: "Hadith No",
      narrator: "Narrator",
      chapter: "Chapter",
      hadiths: "Hadiths",
      loading: "Loading hadiths...",
      error: "Failed to load data",
      noResults: "No hadiths found",
    },
  },
  urdu: {
    file: "/data/sahih_bukhari_ur.json",
    field: "urdu",
    label: "اردو",
    seoTitle: "Sahih al-Bukhari Urdu — صحیح البخاری اردو | Noor",
    seoDesc:
      "صحیح البخاری عربی متن کے ساتھ اردو ترجمہ پڑھیں۔ Read Sahih al-Bukhari with Arabic and Urdu translation.",
    rtl: true,
    ui: {
      title: "صحیح البخاری",
      subtitle: "عربی + اردو ترجمہ",
      searchPlaceholder: "حدیث تلاش کریں...",
      chapters: "ابواب",
      allHadiths: "تمام احادیث",
      hadithNo: "حدیث نمبر",
      narrator: "راوی",
      chapter: "باب",
      hadiths: "احادیث",
      loading: "...احادیث لوڈ ہو رہی ہیں",
      error: "ڈیٹا لوڈ نہیں ہو سکا",
      noResults: "کوئی حدیث نہیں ملی",
    },
  },
};

// ── Flatten book_1, book_2 … into a single array ─────────────
function flattenBooks(json: Record<string, RawHadith[]>): RawHadith[] {
  const all: RawHadith[] = [];
  // Sort by key so book_1 comes before book_2 etc.
  const keys = Object.keys(json).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  for (const key of keys) {
    if (Array.isArray(json[key])) {
      all.push(...json[key]);
    }
  }
  return all;
}

// ── Pagination ───────────────────────────────────────────────
const PAGE_SIZE = 40;

// ── Component ───────────────────────────────────────────────
export default function BukhariLangPage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "hadiths">("hadiths");
  const [page, setPage] = useState(1);

  // Data loading state
  const [allHadiths, setAllHadiths] = useState<Hadith[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cfg = langConfig[(lang as LangSlug) || "bangla"] ?? langConfig.bangla;
  const t = cfg.ui;
  const isRtl = cfg.rtl;

  // ── Load JSON ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(cfg.file)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: Record<string, RawHadith[]>) => {
        if (cancelled) return;
        const raw = flattenBooks(json);
        const field = cfg.field as string;

        const mapped: Hadith[] = raw
          .filter((h) => h.arabic && (h as any)[field])
          .map((h) => ({
            id: h.id,
            chapterId: h.chapter_id,
            number: h.hadith_number,
            arabic: h.arabic,
            translation: (h as any)[field] || "",
          }));

        // Extract unique chapters
        const chapMap = new Map<number, number>();
        for (const h of mapped) {
          chapMap.set(h.chapterId, (chapMap.get(h.chapterId) || 0) + 1);
        }
        const chapArr = Array.from(chapMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([id, count]) => ({ id, count }));

        setAllHadiths(mapped);
        setChapters(chapArr);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load hadith JSON:", err);
        setError(t.error);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cfg.file, cfg.field, t.error]);

  // ── URL params ─────────────────────────────────────────────
  const chapterParam = searchParams.get("chapter");
  const hadithParam = searchParams.get("hadith");

  useEffect(() => {
    const cid = chapterParam ? Number(chapterParam) : null;
    setSelectedChapter(cid && Number.isFinite(cid) ? cid : null);
    setPage(1);
  }, [chapterParam]);

  useEffect(() => {
    if (!hadithParam || allHadiths.length === 0) {
      setSelectedHadith(null);
      return;
    }
    setSelectedHadith(
      allHadiths.find((h) => h.id === hadithParam) ?? null
    );
  }, [hadithParam, allHadiths]);

  const openChapter = (id: number) => {
    setSearchParams({ chapter: String(id) }, { replace: false });
    setActiveTab("hadiths");
  };
  const openHadith = (id: string) => {
    const next: Record<string, string> = {};
    if (selectedChapter !== null) next.chapter = String(selectedChapter);
    next.hadith = id;
    setSearchParams(next, { replace: false });
  };

  // ── Filtering ──────────────────────────────────────────────
  const filteredHadiths = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allHadiths.filter((h) => {
      const matchesChapter =
        selectedChapter === null || h.chapterId === selectedChapter;
      if (!matchesChapter) return false;
      if (!q) return true;
      return (
        h.translation.toLowerCase().includes(q) ||
        h.arabic.includes(searchQuery) ||
        String(h.number).includes(searchQuery)
      );
    });
  }, [allHadiths, searchQuery, selectedChapter]);

  const paginatedHadiths = useMemo(
    () => filteredHadiths.slice(0, page * PAGE_SIZE),
    [filteredHadiths, page]
  );
  const hasMore = paginatedHadiths.length < filteredHadiths.length;

  // ── Total stats ────────────────────────────────────────────
  const totalInChapter =
    selectedChapter !== null
      ? allHadiths.filter((h) => h.chapterId === selectedChapter).length
      : allHadiths.length;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 pb-20"
      style={{ direction: isRtl ? "rtl" : "ltr" }}
    >
      <Helmet>
        <title>{cfg.seoTitle}</title>
        <meta name="description" content={cfg.seoDesc} />
        <link
          rel="canonical"
          href={`https://noorapp.in/sahih-al-bukhari/${lang}`}
        />
      </Helmet>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-emerald-900/95 backdrop-blur-lg border-b border-white/10"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/sahih-al-bukhari")}
              className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft
                className="w-5 h-5"
                style={{ transform: isRtl ? "scaleX(-1)" : "none" }}
              />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                {selectedChapter !== null
                  ? `${t.chapter} ${selectedChapter}`
                  : t.title}
              </h1>
              <p className="text-xs text-white/70">
                {selectedChapter !== null
                  ? `${totalInChapter} ${t.hadiths}`
                  : t.subtitle}
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/90 font-medium">
            {cfg.label}
          </div>
        </div>

        {/* Search */}
        {!selectedHadith && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                style={{
                  left: isRtl ? "auto" : "1rem",
                  right: isRtl ? "1rem" : "auto",
                }}
              />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-xl bg-white/15 border-0 text-white placeholder:text-white/50"
                style={{
                  paddingLeft: isRtl ? "1rem" : "3rem",
                  paddingRight: isRtl ? "3rem" : "1rem",
                }}
              />
            </div>
          </div>
        )}
      </motion.header>

      {/* Loading / Error */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-300 animate-spin" />
          <p className="text-white/70 text-sm">{t.loading}</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-300 underline text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <AnimatePresence mode="wait">
          {selectedHadith ? (
            /* ── Detail view ── */
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 space-y-4"
            >
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 px-8 py-3 rounded-full shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {t.hadithNo} {selectedHadith.number}
                  </span>
                </div>
              </div>

              {/* Arabic — always shown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl"
              >
                <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-3 font-semibold">
                  العربية
                </p>
                <p
                  className="text-2xl md:text-3xl text-white leading-[2.2] text-right"
                  dir="rtl"
                  style={{
                    fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
                  }}
                >
                  {selectedHadith.arabic}
                </p>
              </motion.div>

              {/* Translation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl"
              >
                <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-3 font-semibold">
                  {cfg.label}
                </p>
                <p
                  className={`text-[16px] md:text-lg text-white leading-relaxed font-medium ${
                    isRtl ? "text-right" : ""
                  }`}
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  {selectedHadith.translation}
                </p>
              </motion.div>

              {/* Chapter badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl"
              >
                <p className="text-white/70 text-sm mb-1 font-medium uppercase tracking-wider">
                  {t.chapter}
                </p>
                <p className="text-white font-semibold text-base">
                  {t.chapter} {selectedHadith.chapterId}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* ── List view ── */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {/* Tabs */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActiveTab("hadiths")}
                  className={`flex-1 py-4 rounded-2xl font-semibold tracking-wide transition-all shadow-xl ${
                    activeTab === "hadiths"
                      ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                      : "bg-white/5 text-white/70 border border-white/10"
                  }`}
                >
                  {t.allHadiths} ({filteredHadiths.length})
                </button>
                <button
                  onClick={() => setActiveTab("chapters")}
                  className={`flex-1 py-4 rounded-2xl font-semibold tracking-wide transition-all shadow-xl ${
                    activeTab === "chapters"
                      ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                      : "bg-white/5 text-white/70 border border-white/10"
                  }`}
                >
                  {t.chapters} ({chapters.length})
                </button>
              </div>

              {activeTab === "hadiths" ? (
                <div className="space-y-3">
                  {paginatedHadiths.length === 0 && (
                    <p className="text-center text-white/50 py-10">
                      {t.noResults}
                    </p>
                  )}
                  {paginatedHadiths.map((hadith, index) => (
                    <motion.button
                      key={hadith.id}
                      initial={index < PAGE_SIZE ? { opacity: 0, y: 16 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index < PAGE_SIZE ? index * 0.015 : 0,
                      }}
                      onClick={() => openHadith(hadith.id)}
                      className="w-full text-left bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/15 transition-all active:scale-[0.98] shadow-xl border border-white/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                          <span className="text-white font-bold text-sm">
                            {hadith.number}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Arabic snippet */}
                          <p
                            className="text-white/50 text-xs line-clamp-1 mb-1 text-right"
                            dir="rtl"
                          >
                            {hadith.arabic}
                          </p>
                          {/* Translation */}
                          <p
                            className="text-white text-sm line-clamp-2 font-medium leading-relaxed"
                            dir={isRtl ? "rtl" : "ltr"}
                          >
                            {hadith.translation}
                          </p>
                        </div>
                        <ChevronRight
                          className="text-white/50 flex-shrink-0 mt-1"
                          size={18}
                        />
                      </div>
                    </motion.button>
                  ))}

                  {/* Load more */}
                  {hasMore && (
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="w-full py-4 mt-2 rounded-2xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/15 transition-all"
                    >
                      {lang === "ur"
                        ? "مزید لوڈ کریں"
                        : lang === "bangla"
                        ? "আরও দেখুন"
                        : "Load More"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter, index) => (
                    <motion.button
                      key={chapter.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => openChapter(chapter.id)}
                      className="w-full text-left bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/15 transition-all active:scale-[0.98] shadow-xl border border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                            <span className="text-white font-bold text-sm">
                              {chapter.id}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-base">
                              {t.chapter} {chapter.id}
                            </p>
                            <p className="text-white/60 text-sm">
                              {chapter.count} {t.hadiths}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/50" size={20} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <BottomNavigation />
    </div>
  );
}
