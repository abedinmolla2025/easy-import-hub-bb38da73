import { Link } from "react-router-dom";

/**
 * SEO-optimized homepage introduction section.
 * Rendered below the main content for search engine crawlers.
 * Visually subtle so it doesn't disrupt the app UI.
 */
export default function SeoIntroSection() {
  return (
    <section
      aria-label="About Noor Islamic App"
      className="mt-2 rounded-2xl border border-border bg-card px-5 py-6 text-[13px] leading-relaxed text-muted-foreground"
    >
      <h2 className="mb-3 text-[15px] font-bold text-foreground">
        Your Complete Islamic Companion — নামাজ, কুরআন ও আরও অনেক কিছু
      </h2>
      <p className="mb-4">
        <strong>Noor</strong> is a free Islamic app designed for Muslims who want to stay connected
        to their faith every day. Whether you need accurate <em>prayer times</em>, want to read the{" "}
        <strong>Holy Quran</strong>, listen to <em>Hadith</em>, or find an authentic{" "}
        <em>dua</em> for any occasion — Noor brings it all together in one clean, easy-to-use
        platform. আমাদের লক্ষ্য প্রতিটি মুসলিমের ইবাদতকে সহজ ও সুন্দর করা।
      </p>

      <h2 className="mb-2 mt-4 text-[14px] font-semibold text-foreground">
        📖 Quran Reading & Audio Recitation
      </h2>
      <p className="mb-4">
        Access the complete{" "}
        <Link to="/quran" className="font-medium text-primary underline-offset-2 hover:underline">
          Quran
        </Link>{" "}
        with Arabic text, Bengali translation, and high-quality audio recitation. Read Surah by
        Surah, track your progress, and listen to renowned reciters from around the world. পবিত্র
        কুরআন তিলাওয়াত করুন বাংলা অনুবাদ ও অডিও সহ।
      </p>

      <h2 className="mb-2 mt-4 text-[14px] font-semibold text-foreground">
        🕌 Authentic Hadith Collections
      </h2>
      <p className="mb-4">
        Browse thousands of authenticated{" "}
        <Link to="/hadith" className="font-medium text-primary underline-offset-2 hover:underline">
          Hadith
        </Link>{" "}
        narrations from the most trusted scholars of Islam, including Sahih Bukhari and Sahih
        Muslim. Each hadith is presented with Arabic text, transliteration, and Bengali meaning.
        ইসলামের সবচেয়ে বিশ্বস্ত হাদিস গ্রন্থ থেকে হাদিস পড়ুন।
      </p>

      <h2 className="mb-2 mt-4 text-[14px] font-semibold text-foreground">
        🤲 Duas & Daily Supplications — দৈনন্দিন দোয়া
      </h2>
      <p className="mb-4">
        Find the right{" "}
        <Link to="/dua" className="font-medium text-primary underline-offset-2 hover:underline">
          dua
        </Link>{" "}
        for every moment of your day — morning and evening adhkar, duas for eating, sleeping,
        travelling, and more. All duas come with Arabic text, pronunciation guide, and meaning. প্রতিটি
        মুহূর্তের জন্য সঠিক দোয়া খুঁজুন।
      </p>

      <h2 className="mb-2 mt-4 text-[14px] font-semibold text-foreground">
        🧠 Daily Islamic Quiz — ইসলামিক কুইজ
      </h2>
      <p className="mb-4">
        Strengthen your Islamic knowledge with our{" "}
        <Link to="/quiz" className="font-medium text-primary underline-offset-2 hover:underline">
          daily Islamic quiz
        </Link>
        . Answer five questions each day, build streaks, earn badges, and continuously learn about
        Quran, Hadith, Fiqh, and Islamic history. প্রতিদিন পাঁচটি প্রশ্নে অংশ নিন ও ইসলামিক জ্ঞান
        বাড়ান।
      </p>

      <h2 className="mb-2 mt-4 text-[14px] font-semibold text-foreground">
        🗓️ Islamic Calendar & More Features
      </h2>
      <p className="mb-3">
        Explore our full suite of Islamic tools:
      </p>
      <ul className="mb-4 ml-4 list-disc space-y-1">
        <li>
          <Link
            to="/calendar"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Islamic Calendar
          </Link>{" "}
          — Hijri dates, Ramadan countdown, and key Islamic events.
        </li>
        <li>
          <Link
            to="/99-names"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            99 Names of Allah
          </Link>{" "}
          (Asma ul Husna) with Arabic, meaning, and benefits.
        </li>
        <li>
          <Link
            to="/baby-names"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Islamic Baby Names
          </Link>{" "}
          — thousands of beautiful names with meaning for boys and girls.
        </li>
        <li>
          Qibla compass, digital Tasbih counter, and prayer time alerts with Athan.
        </li>
      </ul>

      <p className="text-[12px] text-muted-foreground/60">
        Noor — ইসলামিক অ্যাপ | Free Islamic app for Quran, Hadith, Dua, Prayer Times & more.
        Available for Android. নামাজের সময়, কুরআন, হাদিস, দোয়া ও ইসলামিক কুইজ — সব এক অ্যাপে।
      </p>
    </section>
  );
}
