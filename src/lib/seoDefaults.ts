/**
 * Bilingual (Bengali + English) SEO meta defaults for all public pages.
 * Used as fallback when no admin override exists in seo_pages table.
 *
 * Rules:
 * - Titles ≤ 60 chars
 * - Descriptions 120–160 chars, mixed EN+BN, natural & human-readable
 * - No duplicate descriptions across pages
 */

export type PageSeoDefaults = {
  title: string;
  description: string;
};

const DEFAULTS: Record<string, PageSeoDefaults> = {
  "/": {
    title: "NOOR — Islamic Learning & Prayer App",
    description:
      "Complete Islamic learning platform — নামাজ, Quran, দোয়া এবং ইসলামিক জ্ঞান এক জায়গায়। Prayer times, Hadith ও আরও অনেক কিছু।",
  },
  "/quran": {
    title: "Quran Reader — পবিত্র কুরআন পড়ুন",
    description:
      "Read the Holy Quran with Arabic text & Bengali translation — সূরা তিলাওয়াত, অডিও ও তাফসীর সহ সম্পূর্ণ কুরআন পাঠ।",
  },
  "/prayer-times": {
    title: "Prayer Times — নামাজের সময়সূচী",
    description:
      "Accurate daily prayer times based on your location — আপনার এলাকার ফজর, যোহর, আসর, মাগরিব ও এশার সঠিক সময়।",
  },
  "/dua": {
    title: "Islamic Duas — ইসলামিক দোয়া সমূহ",
    description:
      "Curated collection of authentic Islamic duas — দৈনন্দিন দোয়া, মাসনূন দোয়া ও কুরআনের দোয়া বাংলা অর্থসহ।",
  },
  "/quiz": {
    title: "Islamic Quiz — ইসলামিক কুইজ",
    description:
      "Test your Islamic knowledge with daily quizzes — ইসলামিক জ্ঞান যাচাই করুন, স্কোর অর্জন করুন এবং শিখুন।",
  },
  "/bukhari": {
    title: "Sahih Bukhari — সহীহ বুখারী হাদিস",
    description:
      "Browse Sahih Bukhari Hadith collection — সহীহ বুখারী শরীফের হাদিস বাংলা অনুবাদ ও ব্যাখ্যা সহ পড়ুন।",
  },
  "/prayer-guide": {
    title: "Prayer Guide — নামাজ শিক্ষা",
    description:
      "Step-by-step Salah guide with illustrations — নামাজের নিয়ম, সূরা ও দোয়া সহ সম্পূর্ণ নামাজ শিক্ষা গাইড।",
  },
  "/tasbih": {
    title: "Digital Tasbih — ডিজিটাল তাসবীহ",
    description:
      "Digital Tasbih counter for dhikr & meditation — সুবহানাল্লাহ, আলহামদুলিল্লাহ ও আল্লাহু আকবার গণনা করুন।",
  },
  "/qibla": {
    title: "Qibla Direction — কিবলার দিক",
    description:
      "Find accurate Qibla direction from your location — আপনার অবস্থান থেকে কিবলার সঠিক দিক নির্ণয় করুন।",
  },
  "/99-names": {
    title: "99 Names of Allah — আল্লাহর ৯৯ নাম",
    description:
      "Learn the 99 beautiful names of Allah — আল্লাহ তাআলার ৯৯টি গুণবাচক নাম অর্থ ও ফযীলত সহ জানুন।",
  },
  "/baby-names": {
    title: "Muslim Baby Names — মুসলিম শিশুর নাম",
    description:
      "Beautiful Islamic baby names with meanings — ছেলে ও মেয়ে শিশুদের জন্য অর্থসহ সুন্দর ইসলামিক নাম।",
  },
  "/names": {
    title: "Islamic Names — ইসলামিক নাম সমূহ",
    description:
      "Browse Islamic names with Arabic script & meanings — আরবি উচ্চারণ ও বাংলা অর্থসহ ইসলামিক নাম খুঁজুন।",
  },
  "/calendar": {
    title: "Islamic Calendar — ইসলামিক ক্যালেন্ডার",
    description:
      "Hijri calendar with important Islamic dates — হিজরি তারিখ, রমজান, ঈদ ও অন্যান্য ইসলামিক দিবস দেখুন।",
  },
  "/about": {
    title: "About NOOR — আমাদের সম্পর্কে",
    description:
      "Learn about the NOOR Islamic app mission — ইসলামিক শিক্ষা ও প্রযুক্তি একত্রে আনার আমাদের লক্ষ্য ও উদ্দেশ্য।",
  },
  "/contact": {
    title: "Contact Us — যোগাযোগ করুন",
    description:
      "Get in touch with the NOOR team — প্রশ্ন, পরামর্শ বা সহযোগিতার জন্য আমাদের সাথে যোগাযোগ করুন।",
  },
  "/privacy-policy": {
    title: "Privacy Policy — গোপনীয়তা নীতি",
    description:
      "NOOR app privacy policy & data handling — আপনার তথ্যের নিরাপত্তা ও গোপনীয়তা সম্পর্কে বিস্তারিত জানুন।",
  },
  "/terms": {
    title: "Terms of Service — সেবার শর্তাবলী",
    description:
      "NOOR app terms & conditions of use — অ্যাপ ব্যবহারের শর্তাবলী ও নিয়মাবলী বিস্তারিত পড়ুন।",
  },
  "/settings": {
    title: "Settings — সেটিংস",
    description:
      "Customize your NOOR app experience — ভাষা, থিম, নোটিফিকেশন ও অন্যান্য পছন্দ অনুযায়ী সেটিংস করুন।",
  },
  "/notifications": {
    title: "Notifications — নোটিফিকেশন",
    description:
      "Manage prayer & quiz notifications — নামাজের সময় ও কুইজ রিমাইন্ডার নোটিফিকেশন সেটিংস পরিচালনা করুন।",
  },
};

/**
 * Returns bilingual SEO defaults for a given pathname.
 * Falls back to homepage defaults for unknown routes.
 * Accepts optional appName to personalise the title.
 */
export function getPageSeoDefaults(
  pathname: string,
  appName?: string,
): PageSeoDefaults | null {
  const entry = DEFAULTS[pathname];
  if (!entry) return null;

  // Optionally replace "NOOR" with the configured app name
  if (appName && appName !== "NOOR" && appName !== "Noor") {
    return {
      title: entry.title.replace(/NOOR/g, appName),
      description: entry.description.replace(/NOOR/g, appName),
    };
  }

  return entry;
}
