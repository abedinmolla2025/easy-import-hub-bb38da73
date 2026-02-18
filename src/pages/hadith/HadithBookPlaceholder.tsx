import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText, Construction } from "lucide-react";
import { motion } from "framer-motion";
import BottomNavigation from "@/components/BottomNavigation";
import { Helmet } from "react-helmet-async";

type BookMeta = {
  title: string;
  titleBn: string;
  metaTitle: string;
  metaDescription: string;
  intro: React.ReactNode;
};

const bookMeta: Record<string, BookMeta> = {
  muslim: {
    title: "Sahih Muslim",
    titleBn: "সহীহ মুসলিম",
    metaTitle: "Sahih Muslim — সহীহ মুসলিম হাদিস | NOOR",
    metaDescription:
      "Read Sahih Muslim Hadith collection with Arabic text & Bengali translation. Imam Muslim's authentic compilation of 7,500+ hadiths. সহীহ মুসলিম পড়ুন বাংলায়।",
    intro: (
      <div className="space-y-4 text-[13px] leading-relaxed text-muted-foreground">
        <h2 className="text-[15px] font-bold text-foreground">
          About Sahih Muslim — সহীহ মুসলিম সম্পর্কে
        </h2>
        <p>
          <strong>Sahih Muslim</strong> (সহীহ মুসলিম) is one of the six major hadith collections
          (<em>Kutub al-Sittah</em>) in Sunni Islam. It was compiled by the great Islamic scholar{" "}
          <strong>Imam Muslim ibn al-Hajjaj</strong> (ইমাম মুসলিম ইবনুল হাজ্জাজ রহ.), who was born
          in 815 CE in Nishapur, Persia (modern-day Iran). He studied under the greatest hadith
          scholars of his time, including Imam Bukhari himself.
        </p>
        <p>
          Imam Muslim spent approximately <strong>fifteen years</strong> meticulously collecting,
          verifying, and authenticating hadiths. He is reported to have examined over{" "}
          <strong>300,000 hadiths</strong> before selecting approximately{" "}
          <strong>7,500 unique narrations</strong> (about 12,000 with repetitions) that met his
          rigorous standards of authenticity. Every hadith in Sahih Muslim has a connected,
          unbroken chain of narrators (<em>isnad</em>), each narrator verified for trustworthiness
          and memory.
        </p>
        <h2 className="text-[14px] font-semibold text-foreground">
          Importance in Islamic Scholarship — ইসলামিক শাস্ত্রে গুরুত্ব
        </h2>
        <p>
          Sahih Muslim is universally regarded as the second most authentic hadith collection after
          Sahih Bukhari. Many scholars consider it even better organized than Sahih Bukhari due to
          its clear chapter arrangement and avoidance of repetition. The book covers all essential
          aspects of Islamic life including acts of worship (<em>ibadat</em>), transactions
          (<em>muamalat</em>), virtuous conduct (<em>akhlaq</em>), and matters of faith{" "}
          (<em>aqidah</em>). মুসলিম উম্মাহর কাছে সহীহ মুসলিম ইসলামিক আইন ও জীবনযাপনের অন্যতম
          প্রধান রেফারেন্স গ্রন্থ হিসেবে স্বীকৃত।
        </p>
        <p>
          The collection is particularly celebrated for its detailed <em>muqaddimah</em>{" "}
          (introduction), which is itself a masterwork of hadith methodology. Scholars across
          generations — from Ibn Hajar al-Asqalani to contemporary Islamic authorities — have
          written extensive commentaries on Sahih Muslim, making it one of the most studied books
          in Islamic history. সহীহ মুসলিমের উপর শতাধিক ব্যাখ্যাগ্রন্থ (শরহ) রচিত হয়েছে।
        </p>
        <p className="text-[12px] text-muted-foreground/60">
          Coming soon: Full Sahih Muslim with Arabic text, Bengali & English translations.
        </p>
      </div>
    ),
  },
  tirmidhi: {
    title: "Jami at-Tirmidhi",
    titleBn: "জামে তিরমিযী",
    metaTitle: "Jami at-Tirmidhi — জামে তিরমিযী হাদিস | NOOR",
    metaDescription:
      "Explore Jami at-Tirmidhi with Arabic text & Bengali translation. Imam Tirmidhi's essential hadith collection covering fiqh, seerah & virtues. তিরমিযী পড়ুন।",
    intro: (
      <div className="space-y-4 text-[13px] leading-relaxed text-muted-foreground">
        <h2 className="text-[15px] font-bold text-foreground">
          About Jami at-Tirmidhi — জামে তিরমিযী সম্পর্কে
        </h2>
        <p>
          <strong>Jami at-Tirmidhi</strong> (জামে তিরমিযী) is one of the six canonical hadith
          collections of Sunni Islam. It was compiled by <strong>Imam Abu Isa Muhammad at-Tirmidhi</strong>{" "}
          (ইমাম আবু ঈসা মুহাম্মাদ তিরমিযী রহ.), born in 824 CE in Tirmidh (modern-day
          Uzbekistan). He was a devoted student of Imam Bukhari and traveled extensively throughout
          the Islamic world to collect and verify hadiths from the greatest scholars of his era.
        </p>
        <p>
          The collection contains approximately <strong>3,956 hadiths</strong>, organized across
          chapters covering jurisprudence (<em>fiqh</em>), virtues, manners, the Prophet's
          biography (<em>seerah</em>), end times (<em>eschatology</em>), and tafsir (Quranic
          commentary). What makes Tirmidhi's work uniquely valuable is its inclusion of{" "}
          <strong>legal opinions from major scholars</strong> alongside each hadith, making it an
          invaluable reference for Islamic jurisprudence across all four major madhabs.
        </p>
        <h2 className="text-[14px] font-semibold text-foreground">
          Unique Features & Scholarly Value — বিশেষত্ব ও পণ্ডিতমহলে গুরুত্ব
        </h2>
        <p>
          One of the most distinctive features of Jami at-Tirmidhi is Imam Tirmidhi's practice of
          grading each hadith for authenticity — using terms like <em>Sahih</em> (authentic),{" "}
          <em>Hasan</em> (good), <em>Da'if</em> (weak), and <em>Gharib</em> (rare/strange). This
          systematic grading methodology was pioneering in hadith science and laid the groundwork
          for future hadith classification. তিরমিযীর এই পদ্ধতি হাদিস শাস্ত্রে বিপ্লব এনেছিল।
        </p>
        <p>
          The book also contains the famous <em>Shama'il Muhammadiyyah</em> — a dedicated
          collection describing the physical characteristics, noble habits, and personal life of
          Prophet Muhammad ﷺ. This unique section has been read and memorized by Muslims for
          over a thousand years. ইমাম তিরমিযীর জামে তিরমিযী আজও ইসলামিক মাদ্রাসাগুলোতে পাঠ্যসূচির
          অন্তর্ভুক্ত একটি অপরিহার্য গ্রন্থ।
        </p>
        <p className="text-[12px] text-muted-foreground/60">
          Coming soon: Full Jami at-Tirmidhi with Arabic text, Bengali & English translations.
        </p>
      </div>
    ),
  },
  "abu-dawud": {
    title: "Sunan Abu Dawud",
    titleBn: "সুনানে আবু দাউদ",
    metaTitle: "Sunan Abu Dawud — সুনানে আবু দাউদ হাদিস | NOOR",
    metaDescription:
      "Read Sunan Abu Dawud with Arabic text & Bengali translation. Imam Abu Dawud's comprehensive jurisprudence-focused hadith collection. আবু দাউদ পড়ুন বাংলায়।",
    intro: (
      <div className="space-y-4 text-[13px] leading-relaxed text-muted-foreground">
        <h2 className="text-[15px] font-bold text-foreground">
          About Sunan Abu Dawud — সুনানে আবু দাউদ সম্পর্কে
        </h2>
        <p>
          <strong>Sunan Abu Dawud</strong> (সুনানে আবু দাউদ) is one of the six canonical hadith
          collections (<em>Kutub al-Sittah</em>) and is particularly renowned as the most
          comprehensive reference for Islamic jurisprudence (<em>fiqh</em>). It was compiled by{" "}
          <strong>Imam Abu Dawud Sulayman ibn al-Ash'ath al-Azdi as-Sijistani</strong> (ইমাম আবু
          দাউদ রহ.), born in 817 CE in Sijistan (modern-day eastern Iran/Afghanistan).
        </p>
        <p>
          Imam Abu Dawud studied under Imam Ahmad ibn Hanbal and Imam Yahya ibn Ma'in — two of the
          greatest hadith scholars in Islamic history. He is said to have examined over{" "}
          <strong>500,000 hadiths</strong>, selecting only <strong>4,800 narrations</strong> for
          his Sunan based on their relevance to Islamic law and their level of authenticity. He
          personally presented his completed work to Imam Ahmad ibn Hanbal, who praised it highly.
          ইমাম আহমদ ইবন হাম্বল (রহ.) এই গ্রন্থকে অত্যন্ত প্রশংসা করেছিলেন।
        </p>
        <h2 className="text-[14px] font-semibold text-foreground">
          Focus on Islamic Law — ইসলামী আইনশাস্ত্রে অবদান
        </h2>
        <p>
          Unlike some other hadith collections, Sunan Abu Dawud is organized primarily around
          <strong> legal topics</strong> — covering purification (<em>taharah</em>), prayer (
          <em>salah</em>), fasting (<em>sawm</em>), pilgrimage (<em>hajj</em>), business
          transactions, marriage, inheritance, criminal law, and many other areas of Islamic
          jurisprudence. This makes it an indispensable resource for Islamic scholars, jurists,
          and anyone seeking guidance on practical Islamic law.
        </p>
        <p>
          Imam Abu Dawud also wrote comments alongside many hadiths, noting their legal
          implications, alternative narrations, and degrees of reliability — a practice that made
          his collection a self-contained manual of Islamic jurisprudence. সুনানে আবু দাউদ আজও
          বিশ্বের শীর্ষস্থানীয় ইসলামিক বিশ্ববিদ্যালয় ও মাদ্রাসাগুলোতে পাঠ্যক্রমের অংশ। It is
          studied in institutions from Al-Azhar in Egypt to Darul Uloom Deoband in India.
        </p>
        <p className="text-[12px] text-muted-foreground/60">
          Coming soon: Full Sunan Abu Dawud with Arabic text, Bengali & English translations.
        </p>
      </div>
    ),
  },
};

export default function HadithBookPlaceholder() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const meta = bookMeta[bookId ?? ""] ?? {
    title: bookId ?? "",
    titleBn: "",
    metaTitle: undefined,
    metaDescription: undefined,
    intro: null,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {meta.metaTitle && (
        <Helmet>
          <title>{meta.metaTitle}</title>
          {meta.metaDescription && (
            <meta name="description" content={meta.metaDescription} />
          )}
          <meta property="og:title" content={meta.metaTitle} />
          {meta.metaDescription && (
            <meta property="og:description" content={meta.metaDescription} />
          )}
          <link rel="canonical" href={`https://noorapp.in/hadith/${bookId}`} />
        </Helmet>
      )}

      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-12 pb-6 text-center relative">
        <button
          onClick={() => navigate("/hadith")}
          className="absolute left-4 top-12 p-2 rounded-full hover:bg-muted"
          aria-label="Back to Hadith"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <ScrollText className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.titleBn}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md px-4 mt-8"
      >
        {/* Coming Soon badge */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Construction className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">Coming Soon — ইনশাআল্লাহ</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This collection is being prepared. Check back soon.
          </p>
        </div>

        {/* SEO-rich intro content */}
        {meta.intro && (
          <div className="rounded-2xl border border-border bg-card px-5 py-5">
            {meta.intro}
          </div>
        )}
      </motion.div>

      <BottomNavigation />
    </div>
  );
}
