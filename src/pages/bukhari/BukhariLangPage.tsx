import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Search, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

// ── UI strings ───────────────────────────────────────────────
const uiStrings = {
  bangla: {
    title: "সহিহ বুখারী শরীফ",
    subtitle: "আরবি + বাংলা অনুবাদ",
    searchPlaceholder: "হাদিস খুঁজুন...",
    chapters: "কিতাবসমূহ",
    allHadiths: "সকল হাদিস",
    hadithNo: "হাদিস নং",
    chapter: "কিতাব",
    hadiths: "টি হাদিস",
    loading: "হাদিস লোড হচ্ছে...",
    error: "ডাটা লোড করতে সমস্যা হয়েছে",
    noResults: "কোনো হাদিস পাওয়া যায়নি",
    loadMore: "আরও দেখুন",
  },
  english: {
    title: "Sahih Al-Bukhari",
    subtitle: "Arabic + English Translation",
    searchPlaceholder: "Search hadiths...",
    chapters: "Books (Kitab)",
    allHadiths: "All Hadiths",
    hadithNo: "Hadith No",
    chapter: "Book",
    hadiths: "Hadiths",
    loading: "Loading hadiths...",
    error: "Failed to load data",
    noResults: "No hadiths found",
    loadMore: "Load More",
  },
  urdu: {
    title: "صحیح البخاری",
    subtitle: "عربی + اردو ترجمہ",
    searchPlaceholder: "حدیث تلاش کریں...",
    chapters: "کتب",
    allHadiths: "تمام احادیث",
    hadithNo: "حدیث نمبر",
    chapter: "کتاب",
    hadiths: "احادیث",
    loading: "...احادیث لوڈ ہو رہی ہیں",
    error: "ڈیٹا لوڈ نہیں ہو سکا",
    noResults: "کوئی حدیث نہیں ملی",
    loadMore: "مزید لوڈ کریں",
  },
} as const;

// ── Language config ──────────────────────────────────────────
interface LangCfg {
  source: "json" | "db";
  file?: string;
  dbField?: string;
  field: string;
  label: string;
  rtl: boolean;
}

const langMeta: Record<LangSlug, LangCfg> = {
  bangla: {
    source: "db",
    dbField: "bengali",
    field: "bengali",
    label: "বাংলা",
    rtl: false,
  },
  english: {
    source: "json",
    file: "/data/sahih_bukhari_en.json",
    field: "english",
    label: "English",
    rtl: false,
  },
  urdu: {
    source: "json",
    file: "/data/sahih_bukhari_ur.json",
    field: "urdu",
    label: "اردو",
    rtl: true,
  },
};

// ── Bangla chapter names (Kitab titles) ──────────────────────
const bukhariChapterNames: Record<number, { bn: string; en: string; ur: string }> = {
  1: { bn: "ওহীর সূচনা (বদউল ওহি)", en: "Revelation", ur: "وحی کی ابتداء" },
  2: { bn: "ঈমান", en: "Belief (Faith)", ur: "ایمان" },
  3: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" },
  4: { bn: "ওজু", en: "Ablution (Wudu)", ur: "وضو" },
  5: { bn: "গোসল", en: "Bathing (Ghusl)", ur: "غسل" },
  6: { bn: "হায়েজ", en: "Menstrual Periods", ur: "حیض" },
  7: { bn: "তায়াম্মুম", en: "Tayammum", ur: "تیمم" },
  8: { bn: "সালাত", en: "Prayer (Salat)", ur: "نماز" },
  9: { bn: "সালাতের সময়সমূহ", en: "Times of Prayer", ur: "نماز کے اوقات" },
  10: { bn: "আযান", en: "Call to Prayer (Adhan)", ur: "اذان" },
  11: { bn: "জুমা", en: "Friday Prayer", ur: "جمعہ" },
  12: { bn: "খাওফের সালাত", en: "Fear Prayer", ur: "نماز خوف" },
  13: { bn: "ঈদের সালাত", en: "Two Eid Prayers", ur: "عیدین کی نماز" },
  14: { bn: "বিতর", en: "Witr Prayer", ur: "وتر" },
  15: { bn: "ইস্তিসকা", en: "Invoking Allah for Rain", ur: "استسقاء" },
  16: { bn: "সূর্যগ্রহণের সালাত", en: "Eclipses", ur: "کسوف کی نماز" },
  17: { bn: "সিজদাতুল কুরআন", en: "Prostration During Quran", ur: "سجدۂ تلاوت" },
  18: { bn: "সালাত সংক্ষিপ্ত করা", en: "Shortening Prayers", ur: "نماز قصر کرنا" },
  19: { bn: "তাহাজ্জুদ", en: "Night Prayer (Tahajjud)", ur: "تہجد" },
  20: { bn: "জানাযা", en: "Funerals (Janaza)", ur: "جنازہ" },
  21: { bn: "যাকাত", en: "Obligatory Charity (Zakat)", ur: "زکاۃ" },
  22: { bn: "হজ্জ", en: "Hajj (Pilgrimage)", ur: "حج" },
  23: { bn: "উমরা", en: "Minor Pilgrimage (Umrah)", ur: "عمرہ" },
  24: { bn: "সাওম (রোজা)", en: "Fasting", ur: "روزے" },
  25: { bn: "তারাবীহ", en: "Taraweeh Prayer", ur: "تراویح" },
  26: { bn: "লাইলাতুল কদর", en: "Night of Qadr", ur: "لیلۃ القدر" },
  27: { bn: "ইতিকাফ", en: "I'tikaf", ur: "اعتکاف" },
  28: { bn: "ক্রয়-বিক্রয়", en: "Sales and Trade", ur: "خرید و فروخت" },
  29: { bn: "সালাম", en: "Advance Payment (Salam)", ur: "سلم" },
  30: { bn: "ইজারা", en: "Hiring (Ijara)", ur: "اجارہ" },
  31: { bn: "হাওয়ালা", en: "Transfer of Debt (Hawala)", ur: "حوالہ" },
  32: { bn: "কফালা", en: "Guarantee (Kafala)", ur: "کفالت" },
  33: { bn: "ওয়াকালা", en: "Representation (Wakala)", ur: "وکالت" },
  34: { bn: "কৃষিকাজ", en: "Agriculture", ur: "کھیتی باڑی" },
  35: { bn: "পানি সেচ", en: "Distribution of Water", ur: "پانی کی تقسیم" },
  36: { bn: "ঋণ", en: "Loans, Bankruptcy", ur: "قرض" },
  37: { bn: "ঝগড়া-বিবাদ", en: "Disputes", ur: "جھگڑے" },
  38: { bn: "হারানো বস্তু", en: "Lost Things (Luqata)", ur: "لقطہ" },
  39: { bn: "অত্যাচার", en: "Oppressions (Mazalim)", ur: "مظالم" },
  40: { bn: "অংশীদারিত্ব", en: "Partnership", ur: "شراکت" },
  41: { bn: "বন্ধক", en: "Mortgaging (Rahn)", ur: "رہن" },
  42: { bn: "দাসমুক্তি", en: "Manumission of Slaves", ur: "غلام آزاد کرنا" },
  43: { bn: "হিবা (উপহার)", en: "Gifts (Hiba)", ur: "ہبہ" },
  44: { bn: "সাক্ষ্য", en: "Witnesses", ur: "گواہی" },
  45: { bn: "সন্ধি", en: "Peacemaking", ur: "صلح" },
  46: { bn: "জিহাদ", en: "Fighting for Allah (Jihad)", ur: "جہاد" },
  47: { bn: "জিযিয়া", en: "Jizyah and Mawaada'ah", ur: "جزیہ" },
  48: { bn: "সৃষ্টির সূচনা", en: "Beginning of Creation", ur: "ابتدائے تخلیق" },
  49: { bn: "নবীদের কাহিনী", en: "Prophets", ur: "انبیاء" },
  50: { bn: "ফজায়েলে সাহাবা", en: "Companions of the Prophet", ur: "صحابہ کے فضائل" },
  51: { bn: "নিকাহ", en: "Weddings (Nikah)", ur: "نکاح" },
  52: { bn: "তালাক", en: "Divorce", ur: "طلاق" },
  53: { bn: "ভরণপোষণ", en: "Supporting the Family", ur: "نفقہ" },
  54: { bn: "খাদ্য", en: "Food, Meals", ur: "کھانے" },
  55: { bn: "আকিকা", en: "Aqiqa", ur: "عقیقہ" },
  56: { bn: "যবেহ", en: "Slaughtering", ur: "ذبح" },
  57: { bn: "পানীয়", en: "Drinks", ur: "مشروبات" },
  58: { bn: "রোগ", en: "Patients", ur: "مریض" },
  59: { bn: "চিকিৎসা", en: "Medicine", ur: "طب" },
  60: { bn: "পোশাক", en: "Dress", ur: "لباس" },
  61: { bn: "আদব", en: "Good Manners (Adab)", ur: "آداب" },
  62: { bn: "অনুমতি", en: "Asking Permission", ur: "اجازت" },
  63: { bn: "দোয়া", en: "Invocations (Dua)", ur: "دعائیں" },
  64: { bn: "নরম হৃদয় (রিকার)", en: "Heart Softeners (Riqaq)", ur: "رقاق" },
  65: { bn: "তাকদীর", en: "Divine Will (Qadar)", ur: "تقدیر" },
  66: { bn: "কসম", en: "Oaths and Vows", ur: "قسمیں" },
  67: { bn: "কাফফারা", en: "Expiation of Oaths", ur: "کفارہ" },
  68: { bn: "উত্তরাধিকার", en: "Laws of Inheritance", ur: "میراث" },
  69: { bn: "শাস্তি", en: "Limits and Punishments (Hudud)", ur: "حدود" },
  70: { bn: "দিয়া", en: "Blood Money (Diyat)", ur: "دیت" },
  71: { bn: "মুরতাদ", en: "Dealing with Apostates", ur: "مرتدین" },
  72: { bn: "বাধ্যবাধকতা", en: "Coercion", ur: "اکراہ" },
  73: { bn: "কুরআনের ফজিলত", en: "Virtues of the Quran", ur: "فضائل القرآن" },
  74: { bn: "তাফসীর", en: "Prophetic Commentary on Quran", ur: "تفسیر القرآن" },
  75: { bn: "বিবাহ", en: "Weddings", ur: "نکاح" },
  76: { bn: "তালাক (বিস্তারিত)", en: "Divorce (Detailed)", ur: "طلاق تفصیلی" },
  77: { bn: "মুক্তি", en: "Manumission", ur: "آزادی" },
  78: { bn: "যুদ্ধ", en: "Military Expeditions", ur: "غزوات" },
  79: { bn: "ফিতনা", en: "Tribulations (Fitan)", ur: "فتنے" },
  80: { bn: "কিয়ামতের লক্ষণ", en: "Signs of the Last Day", ur: "قیامت کی نشانیاں" },
  81: { bn: "জান্নাত", en: "Paradise", ur: "جنت" },
  82: { bn: "জাহান্নাম", en: "Hellfire", ur: "جہنم" },
  83: { bn: "জান্নাত-জাহান্নামের বর্ণনা", en: "Description of Paradise & Hell", ur: "جنت و جہنم کا بیان" },
  84: { bn: "নৈতিকতা", en: "Morality", ur: "اخلاقیات" },
  85: { bn: "আচার", en: "Etiquette", ur: "رسوم" },
  86: { bn: "আল্লাহর স্মরণ", en: "Remembrance of Allah", ur: "ذکر اللہ" },
  87: { bn: "তাওহীদ", en: "Oneness of Allah (Tawhid)", ur: "توحید" },
  88: { bn: "আল্লাহর গুণাবলী", en: "Attributes of Allah", ur: "اللہ کی صفات" },
  89: { bn: "তাকদীর আলোচনা", en: "Discussion on Destiny", ur: "تقدیر کی بحث" },
  90: { bn: "কিয়ামত", en: "Day of Judgment", ur: "قیامت" },
  91: { bn: "হিসাব", en: "Reckoning", ur: "حساب" },
  92: { bn: "মিজান", en: "The Scale (Mizan)", ur: "میزان" },
  93: { bn: "সিরাত", en: "The Bridge (Sirat)", ur: "صراط" },
  94: { bn: "শাফাআত", en: "Intercession", ur: "شفاعت" },
  95: { bn: "জান্নাতের নিয়ামত", en: "Blessings of Paradise", ur: "جنت کی نعمتیں" },
  96: { bn: "জাহান্নামের শাস্তি", en: "Punishment of Hellfire", ur: "جہنم کا عذاب" },
  97: { bn: "তাওহীদের সমাপনী আলোচনা", en: "Concluding Discussion on Tawhid", ur: "توحید کا اختتامی بیان" },
};

function getChapterName(chapterId: number, lang: LangSlug): string {
  const key = lang === "bangla" ? "bn" : lang === "urdu" ? "ur" : "en";
  const names = bukhariChapterNames[chapterId];
  if (names) return names[key];
  // Fallback for chapters beyond the map
  const fallback = { bangla: "অধ্যায়", english: "Chapter", urdu: "باب" };
  return `${fallback[lang]} ${chapterId}`;
}

// ── Lang-specific SEO helpers ────────────────────────────────
const langSeoMeta: Record<LangSlug, { rootTitle: string; rootDesc: string; titleLang: string; descLang: string }> = {
  bangla: {
    rootTitle: "Sahih Bukhari Bangla Hadith – সহীহ বুখারী বাংলা হাদিস | Noor App",
    rootDesc: "Read Sahih Bukhari Bangla Hadith with Arabic text and authentic Bangla translation.",
    titleLang: "Bangla",
    descLang: "Bangla",
  },
  english: {
    rootTitle: "Sahih Bukhari English Hadith Collection | Noor App",
    rootDesc: "Read authentic Sahih Bukhari hadith collection with Arabic and English translation.",
    titleLang: "English",
    descLang: "English",
  },
  urdu: {
    rootTitle: "Sahih Bukhari Urdu Hadith – صحیح بخاری اردو | Noor App",
    rootDesc: "صحیح بخاری احادیث اردو ترجمہ کے ساتھ پڑھیں۔",
    titleLang: "Urdu",
    descLang: "Urdu",
  },
};

function buildSeoTitle(slug: LangSlug, chapterId?: number, hadithNumber?: number): string {
  const l = langSeoMeta[slug] || langSeoMeta.bangla;
  if (hadithNumber != null) {
    return `Sahih Bukhari Hadith ${hadithNumber} – ${l.titleLang} Translation – Noor App`;
  }
  if (chapterId != null) {
    return `Sahih Bukhari Chapter ${chapterId} – ${l.titleLang} – Noor App`;
  }
  return l.rootTitle;
}

function buildSeoDesc(slug: LangSlug, chapterId?: number, hadithNumber?: number): string {
  const l = langSeoMeta[slug] || langSeoMeta.bangla;
  if (hadithNumber != null) {
    return `Read Sahih Bukhari Hadith ${hadithNumber} with Arabic text and ${l.descLang} translation on Noor App.`;
  }
  if (chapterId != null) {
    return `Browse all hadiths in Chapter ${chapterId} of Sahih Bukhari with Arabic text and ${l.descLang} translation.`;
  }
  return l.rootDesc;
}

function buildCanonical(slug: string, chapterId?: number, hadithNumber?: number): string {
  const base = `https://noorapp.in/hadith/sahih-bukhari/${slug}`;
  if (hadithNumber != null && chapterId != null) {
    return `${base}/${chapterId}/${hadithNumber}`;
  }
  if (chapterId != null) {
    return `${base}/chapter-${chapterId}`;
  }
  return base;
}

function buildArticleJsonLd(slug: LangSlug, hadithNumber?: number) {
  const l = langSeoMeta[slug] || langSeoMeta.bangla;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: hadithNumber
      ? `Sahih Bukhari Hadith ${hadithNumber} – ${l.titleLang}`
      : `Sahih Bukhari ${l.titleLang} Hadith Collection`,
    author: {
      "@type": "Person",
      name: "Imam Bukhari",
    },
    publisher: {
      "@type": "Organization",
      name: "Noor App",
      url: "https://noorapp.in",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": buildCanonical(slug, undefined, hadithNumber),
    },
  };
}

// ── Flatten book_1, book_2 … into a single array ─────────────
function flattenBooks(json: Record<string, RawHadith[]>): RawHadith[] {
  const all: RawHadith[] = [];
  const keys = Object.keys(json).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  for (const key of keys) {
    if (Array.isArray(json[key])) all.push(...json[key]);
  }
  return all;
}

// ── Load from database (Bangla) ──────────────────────────────
async function loadFromDb(dbField: string): Promise<Hadith[]> {
  const all: Hadith[] = [];
  const batchSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await (supabase as any)
      .from("hadiths")
      .select("id, chapter_id, hadith_number, arabic, " + dbField)
      .eq("book_key", "bukhari")
      .order("hadith_number", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data) {
      if (row.arabic && row[dbField]) {
        all.push({
          id: row.id,
          chapterId: row.chapter_id,
          number: row.hadith_number,
          arabic: row.arabic,
          translation: row[dbField],
        });
      }
    }

    if (data.length < batchSize) hasMore = false;
    else from += batchSize;
  }

  return all;
}

// ── Pagination ───────────────────────────────────────────────
const PAGE_SIZE = 40;

// ── Component ───────────────────────────────────────────────
export default function BukhariLangPage() {
  const { lang, chapterSlug, chapterId: chapterParam, hadithNumber: hadithParam } = useParams<{
    lang: string;
    chapterSlug: string;
    chapterId: string;
    hadithNumber: string;
  }>();
  // chapterSlug is used for /hadith/sahih-bukhari/:lang/:chapterSlug (e.g. "chapter-5")
  // chapterId is used for /hadith/sahih-bukhari/:lang/:chapterId/:hadithNumber
  const effectiveChapterParam = chapterSlug || chapterParam;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "hadiths">("hadiths");
  const [page, setPage] = useState(1);

  const [allHadiths, setAllHadiths] = useState<Hadith[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = (lang as LangSlug) || "bangla";
  const cfg = langMeta[slug] ?? langMeta.bangla;
  const t = uiStrings[slug] ?? uiStrings.bangla;
  const isRtl = cfg.rtl;

  // ── Load data ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const processHadiths = (mapped: Hadith[]) => {
      if (cancelled) return;
      const chapMap = new Map<number, number>();
      for (const h of mapped) chapMap.set(h.chapterId, (chapMap.get(h.chapterId) || 0) + 1);
      const chapArr = Array.from(chapMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([id, count]) => ({ id, count }));
      setAllHadiths(mapped);
      setChapters(chapArr);
      setLoading(false);
    };

    if (cfg.source === "db") {
      loadFromDb(cfg.dbField || "bengali")
        .then(processHadiths)
        .catch((err) => {
          if (cancelled) return;
          console.error("DB load failed:", err);
          setError(t.error);
          setLoading(false);
        });
    } else {
      fetch(cfg.file!)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json: Record<string, RawHadith[]>) => {
          const raw = flattenBooks(json);
          const field = cfg.field;
          const mapped: Hadith[] = raw
            .filter((h) => h.arabic && (h as any)[field])
            .map((h) => ({
              id: h.id,
              chapterId: h.chapter_id,
              number: h.hadith_number,
              arabic: h.arabic,
              translation: (h as any)[field] || "",
            }));
          processHadiths(mapped);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("JSON load failed:", err);
          setError(t.error);
          setLoading(false);
        });
    }

    return () => { cancelled = true; };
  }, [cfg.source, cfg.file, cfg.field, cfg.dbField, t.error]);

  // ── URL path params → state ────────────────────────────────
  useEffect(() => {
    // Parse chapter from path: "chapter-5" → 5, or just "5" for hadith route
    if (effectiveChapterParam) {
      const cid = Number(effectiveChapterParam.replace("chapter-", ""));
      setSelectedChapter(cid && Number.isFinite(cid) ? cid : null);
    } else {
      setSelectedChapter(null);
    }
    setPage(1);
  }, [effectiveChapterParam]);

  useEffect(() => {
    if (!hadithParam || allHadiths.length === 0) {
      if (!hadithParam) setSelectedHadith(null);
      return;
    }
    const num = Number(hadithParam);
    const found = allHadiths.find((h) => h.number === num);
    setSelectedHadith(found ?? null);
  }, [hadithParam, allHadiths]);

  const openChapter = (id: number) => {
    navigate(`/hadith/sahih-bukhari/${slug}/chapter-${id}`);
    setActiveTab("hadiths");
  };

  const openHadith = (hadith: Hadith) => {
    navigate(`/hadith/sahih-bukhari/${slug}/${hadith.chapterId}/${hadith.number}`);
  };

  // ── Filtering ──────────────────────────────────────────────
  const filteredHadiths = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allHadiths.filter((h) => {
      if (selectedChapter !== null && h.chapterId !== selectedChapter) return false;
      if (!q) return true;
      return h.translation.toLowerCase().includes(q) || h.arabic.includes(searchQuery) || String(h.number).includes(searchQuery);
    });
  }, [allHadiths, searchQuery, selectedChapter]);

  const paginatedHadiths = useMemo(() => filteredHadiths.slice(0, page * PAGE_SIZE), [filteredHadiths, page]);
  const hasMore = paginatedHadiths.length < filteredHadiths.length;
  const totalInChapter = selectedChapter !== null ? allHadiths.filter((h) => h.chapterId === selectedChapter).length : allHadiths.length;

  // ── SEO values ────────────────────────────────────────────
  const seoChapterId = selectedChapter ?? (effectiveChapterParam ? Number(effectiveChapterParam.replace("chapter-", "")) : undefined);
  const seoHadithNumber = selectedHadith?.number ?? (hadithParam ? Number(hadithParam) : undefined);
  const seoTitle = buildSeoTitle(slug, seoChapterId, seoHadithNumber);
  const seoDesc = buildSeoDesc(slug, seoChapterId, seoHadithNumber);
  const canonical = buildCanonical(slug, seoChapterId, seoHadithNumber);
  const articleLd = buildArticleJsonLd(slug, seoHadithNumber);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 pb-20" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index,follow" />
        {/* hreflang alternate tags for language variants */}
        <link rel="alternate" hrefLang="bn" href={buildCanonical("bangla", seoChapterId, seoHadithNumber)} />
        <link rel="alternate" hrefLang="en" href={buildCanonical("english", seoChapterId, seoHadithNumber)} />
        <link rel="alternate" hrefLang="ur" href={buildCanonical("urdu", seoChapterId, seoHadithNumber)} />
        <link rel="alternate" hrefLang="x-default" href={buildCanonical("english", seoChapterId, seoHadithNumber)} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://noorapp.in/og-bukhari.png" />
        <meta property="og:locale" content={slug === "bangla" ? "bn_BD" : slug === "urdu" ? "ur_PK" : "en_US"} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      </Helmet>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-50 bg-emerald-900/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedHadith) {
                  // Go back to chapter or lang page
                  if (selectedChapter !== null) {
                    navigate(`/hadith/sahih-bukhari/${slug}/chapter-${selectedChapter}`);
                  } else {
                    navigate(`/hadith/sahih-bukhari/${slug}`);
                  }
                } else if (selectedChapter !== null) {
                  navigate(`/hadith/sahih-bukhari/${slug}`);
                } else {
                  navigate("/hadith/sahih-bukhari");
                }
              }}
              className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" style={{ transform: isRtl ? "scaleX(-1)" : "none" }} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">{selectedChapter !== null ? getChapterName(selectedChapter, slug) : t.title}</h1>
              <p className="text-xs text-white/70">{selectedChapter !== null ? `${totalInChapter} ${t.hadiths}` : t.subtitle}</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/90 font-medium">{cfg.label}</div>
        </div>

        {!selectedHadith && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" style={{ left: isRtl ? "auto" : "1rem", right: isRtl ? "1rem" : "auto" }} />
              <Input placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="h-12 rounded-xl bg-white/15 border-0 text-white placeholder:text-white/50" style={{ paddingLeft: isRtl ? "1rem" : "3rem", paddingRight: isRtl ? "3rem" : "1rem" }} />
            </div>
          </div>
        )}
      </motion.header>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-300 animate-spin" />
          <p className="text-white/70 text-sm">{t.loading}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="text-emerald-300 underline text-sm">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <AnimatePresence mode="wait">
          {selectedHadith ? (
            <motion.div key="detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-4 space-y-4">
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 px-8 py-3 rounded-full shadow-lg">
                  <span className="text-white font-bold text-lg">{t.hadithNo} {selectedHadith.number}</span>
                </div>
              </div>

              {/* Arabic */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-3 font-semibold">العربية</p>
                <p className="text-2xl md:text-3xl text-white leading-[2.2] text-right" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{selectedHadith.arabic}</p>
              </motion.div>

              {/* Translation */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-3 font-semibold">{cfg.label}</p>
                <p className={`text-[16px] md:text-lg text-white leading-relaxed font-medium ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>{selectedHadith.translation}</p>
              </motion.div>

              {/* Breadcrumb links */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2 text-sm">
                <a href={`/hadith/sahih-bukhari/${slug}`} onClick={(e) => { e.preventDefault(); navigate(`/hadith/sahih-bukhari/${slug}`); }} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
                  {t.title}
                </a>
                <span className="text-white/30">›</span>
                <a href={`/hadith/sahih-bukhari/${slug}/chapter-${selectedHadith.chapterId}`} onClick={(e) => { e.preventDefault(); navigate(`/hadith/sahih-bukhari/${slug}/chapter-${selectedHadith.chapterId}`); }} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
                  {getChapterName(selectedHadith.chapterId, slug)}
                </a>
              </motion.div>

              {/* Prev / Next hadith navigation */}
              {(() => {
                const idx = allHadiths.findIndex((h) => h.number === selectedHadith.number);
                const prev = idx > 0 ? allHadiths[idx - 1] : null;
                const next = idx < allHadiths.length - 1 ? allHadiths[idx + 1] : null;
                return (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-3 pt-2">
                    {prev ? (
                      <a
                        href={`/hadith/sahih-bukhari/${slug}/${prev.chapterId}/${prev.number}`}
                        onClick={(e) => { e.preventDefault(); openHadith(prev); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 text-white font-medium border border-white/20 hover:bg-white/15 transition-all text-sm"
                      >
                        ← {t.hadithNo} {prev.number}
                      </a>
                    ) : <div className="flex-1" />}
                    {next ? (
                      <a
                        href={`/hadith/sahih-bukhari/${slug}/${next.chapterId}/${next.number}`}
                        onClick={(e) => { e.preventDefault(); openHadith(next); }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 text-white font-medium border border-white/20 hover:bg-white/15 transition-all text-sm"
                      >
                        {t.hadithNo} {next.number} →
                      </a>
                    ) : <div className="flex-1" />}
                  </motion.div>
                );
              })()}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
              {/* Tabs */}
              <div className="flex gap-3 mb-6">
                <button onClick={() => setActiveTab("hadiths")} className={`flex-1 py-4 rounded-2xl font-semibold tracking-wide transition-all shadow-xl ${activeTab === "hadiths" ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm" : "bg-white/5 text-white/70 border border-white/10"}`}>
                  {t.allHadiths} ({filteredHadiths.length})
                </button>
                <button onClick={() => setActiveTab("chapters")} className={`flex-1 py-4 rounded-2xl font-semibold tracking-wide transition-all shadow-xl ${activeTab === "chapters" ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm" : "bg-white/5 text-white/70 border border-white/10"}`}>
                  {t.chapters} ({chapters.length})
                </button>
              </div>

              {activeTab === "hadiths" ? (
                <div className="space-y-3">
                  {paginatedHadiths.length === 0 && <p className="text-center text-white/50 py-10">{t.noResults}</p>}
                  {paginatedHadiths.map((hadith, index) => (
                    <motion.button key={hadith.id} initial={index < PAGE_SIZE ? { opacity: 0, y: 16 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: index < PAGE_SIZE ? index * 0.015 : 0 }} onClick={() => openHadith(hadith)} className="w-full text-left bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/15 transition-all active:scale-[0.98] shadow-xl border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                          <span className="text-white font-bold text-sm">{hadith.number}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/50 text-xs line-clamp-1 mb-1 text-right" dir="rtl">{hadith.arabic}</p>
                          <p className="text-white text-sm line-clamp-2 font-medium leading-relaxed" dir={isRtl ? "rtl" : "ltr"}>{hadith.translation}</p>
                        </div>
                        <ChevronRight className="text-white/50 flex-shrink-0 mt-1" size={18} />
                      </div>
                    </motion.button>
                  ))}
                  {hasMore && (
                    <button onClick={() => setPage((p) => p + 1)} className="w-full py-4 mt-2 rounded-2xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/15 transition-all">
                      {t.loadMore}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter, index) => (
                    <motion.button key={chapter.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} onClick={() => openChapter(chapter.id)} className="w-full text-left bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/15 transition-all active:scale-[0.98] shadow-xl border border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                            <span className="text-white font-bold text-sm">{chapter.id}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-base">{getChapterName(chapter.id, slug)}</p>
                            <p className="text-white/60 text-sm">{chapter.count} {t.hadiths}</p>
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
