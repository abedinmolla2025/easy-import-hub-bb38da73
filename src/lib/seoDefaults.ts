/**
 * Bilingual (Bengali + English) SEO meta defaults for all public pages.
 * Used as fallback when no admin override exists in seo_pages table.
 *
 * Rules:
 * - Titles ≤ 60 chars with main keyword; mixed EN+BN
 * - Descriptions 120–160 chars, mixed EN+BN, natural & human-readable
 * - No duplicate descriptions across pages
 */

export type PageSeoDefaults = {
  title: string;
  description: string;
};

const DEFAULTS: Record<string, PageSeoDefaults> = {
  "/": {
    title: "NOOR — ইসলামিক অ্যাপ | Islamic Companion App",
    description:
      "Your complete Islamic companion — নামাজের সময়, Quran, দোয়া, তাসবীহ, কিবলা, ইসলামিক কুইজ সব এক অ্যাপে। Prayer times, Hadith & more.",
  },
  "/quran": {
    title: "Quran Reader — পবিত্র কুরআন | NOOR",
    description:
      "Read the Holy Quran with Arabic text, Bengali translation & audio recitation — সূরা তিলাওয়াত, তাফসীর ও অডিও সহ সম্পূর্ণ কুরআন পাঠ করুন।",
  },
  "/prayer-times": {
    title: "Prayer Times — নামাজের সময়সূচী | NOOR",
    description:
      "Accurate daily Salah times for your location — ফজর, যোহর, আসর, মাগরিব ও এশার সঠিক সময় জানুন। Athan alerts & countdown timer included.",
  },
  "/dua": {
    title: "Duas & Supplications — দোয়া সমূহ | NOOR",
    description:
      "Authentic Islamic duas with Arabic, Bengali meaning & audio — দৈনন্দিন মাসনূন দোয়া, কুরআনের দোয়া ও হাদিসের দোয়া সংকলন।",
  },
  "/quiz": {
    title: "Islamic Quiz — ইসলামিক কুইজ | NOOR",
    description:
      "Test & improve your Islamic knowledge daily — প্রতিদিন ৫টি কুইজে অংশ নিন, স্কোর অর্জন করুন, streak বজায় রাখুন ও নতুন কিছু শিখুন।",
  },
  "/hadith": {
    title: "Hadith Collection — হাদিস সংকলন | NOOR",
    description:
      "Browse authentic Hadith collections — সহীহ বুখারী, মুসলিম ও অন্যান্য বিশ্বস্ত হাদিস গ্রন্থ আরবি, বাংলা ও ইংরেজি অনুবাদ সহ পড়ুন।",
  },
  "/hadith/bukhari": {
    title: "Sahih Bukhari — সহীহ বুখারী | NOOR",
    description:
      "Browse the complete Sahih Bukhari Hadith collection — সহীহ বুখারী শরীফের হাদিস আরবি টেক্সট ও বাংলা অনুবাদ সহ পড়ুন।",
  },
  "/prayer-guide": {
    title: "Prayer Guide — নামাজ শিক্ষা | NOOR",
    description:
      "Step-by-step Salah tutorial with illustrations — ওযু, নামাজের নিয়ম, সূরা, দোয়া ও তাশাহহুদ সহ সম্পূর্ণ নামাজ শিক্ষা গাইড।",
  },
  "/tasbih": {
    title: "Digital Tasbih — ডিজিটাল তাসবীহ | NOOR",
    description:
      "Beautiful digital Tasbih counter for dhikr — সুবহানাল্লাহ, আলহামদুলিল্লাহ, আল্লাহু আকবার সহজে গণনা করুন। Haptic feedback supported.",
  },
  "/qibla": {
    title: "Qibla Finder — কিবলার দিক | NOOR",
    description:
      "Find accurate Qibla direction using compass — আপনার বর্তমান অবস্থান থেকে মক্কার কাবা শরীফের সঠিক দিক নির্ণয় করুন।",
  },
  "/99-names": {
    title: "99 Names of Allah — আল্লাহর ৯৯ নাম | NOOR",
    description:
      "Learn the 99 beautiful names (Asma ul Husna) of Allah — আল্লাহ তাআলার ৯৯টি গুণবাচক নাম আরবি, অর্থ ও ফযীলত সহ জানুন।",
  },
  "/baby-names": {
    title: "Muslim Baby Names — শিশুর নাম | NOOR",
    description:
      "Find beautiful Islamic baby names for boys & girls — ছেলে ও মেয়ে শিশুদের জন্য অর্থসহ সুন্দর মুসলিম নাম বাছাই করুন।",
  },
  "/names": {
    title: "Islamic Names — ইসলামিক নামের তালিকা | NOOR",
    description:
      "Browse thousands of Islamic names with Arabic script & meanings — আরবি, বাংলা উচ্চারণ ও অর্থসহ ইসলামিক নাম খুঁজুন ও শেয়ার করুন।",
  },
  "/calendar": {
    title: "Islamic Calendar — হিজরি ক্যালেন্ডার | NOOR",
    description:
      "Hijri calendar with key Islamic dates — রমজান, ঈদুল ফিতর, ঈদুল আযহা, শবে কদর ও অন্যান্য গুরুত্বপূর্ণ ইসলামিক দিবস দেখুন।",
  },
  "/about": {
    title: "About NOOR — আমাদের সম্পর্কে | NOOR",
    description:
      "Learn about the NOOR app mission & team — ইসলামিক শিক্ষা ও আধুনিক প্রযুক্তি একত্রে আনার আমাদের লক্ষ্য, উদ্দেশ্য ও গল্প।",
  },
  "/contact": {
    title: "Contact Us — যোগাযোগ | NOOR",
    description:
      "Get in touch with the NOOR team — প্রশ্ন, পরামর্শ, বাগ রিপোর্ট বা সহযোগিতার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।",
  },
  "/privacy-policy": {
    title: "Privacy Policy — গোপনীয়তা নীতি | NOOR",
    description:
      "NOOR app privacy policy & data protection — আপনার ব্যক্তিগত তথ্যের নিরাপত্তা, সংরক্ষণ ও ব্যবহার সম্পর্কে বিস্তারিত জানুন।",
  },
  "/terms": {
    title: "Terms of Service — ব্যবহারের শর্তাবলী | NOOR",
    description:
      "NOOR app terms & conditions — অ্যাপ ব্যবহারের শর্তাবলী, ব্যবহারকারীর দায়িত্ব ও অধিকার সম্পর্কে বিস্তারিত পড়ুন।",
  },
  "/settings": {
    title: "Settings — সেটিংস | NOOR",
    description:
      "Customize your NOOR experience — ভাষা, থিম, নোটিফিকেশন, আযানের সেটিংস ও অন্যান্য পছন্দ অনুযায়ী কাস্টমাইজ করুন।",
  },
  "/notifications": {
    title: "Notifications — নোটিফিকেশন | NOOR",
    description:
      "Manage your notification preferences — নামাজের আযান, কুইজ রিমাইন্ডার ও গুরুত্বপূর্ণ আপডেট নোটিফিকেশন পরিচালনা করুন।",
  },
};

/**
 * Returns bilingual SEO defaults for a given pathname.
 * Falls back to null for unknown routes.
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
