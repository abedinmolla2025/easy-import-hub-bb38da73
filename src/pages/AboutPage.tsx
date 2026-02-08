import { ArrowLeft, BookOpen, Moon, Compass, Clock, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted/70 border border-border/60 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide">About NOOR</h1>
            <p className="text-sm text-muted-foreground">আমাদের সম্পর্কে</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 text-sm leading-relaxed">
        {/* Mission */}
        <section className="bg-card/70 border border-border/60 rounded-2xl shadow-soft p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Our Mission / আমাদের লক্ষ্য</h2>
          </div>
          <p className="text-muted-foreground">
            NOOR is a free, community-driven Islamic companion app designed to help Muslims
            stay connected with their daily prayers, Quran recitation, duas, and Islamic
            knowledge. Our goal is to make authentic Islamic resources accessible to everyone,
            regardless of language or location.
          </p>
          <p className="text-muted-foreground font-bangla">
            NOOR হলো একটি বিনামূল্যের, কমিউনিটি-চালিত ইসলামিক সহচর অ্যাপ যা মুসলিমদের দৈনিক
            নামাজ, কুরআন তিলাওয়াত, দোয়া ও ইসলামিক জ্ঞানের সাথে সংযুক্ত থাকতে সাহায্য করে।
            আমাদের লক্ষ্য হলো ভাষা বা অবস্থান নির্বিশেষে সকলের কাছে প্রামাণিক ইসলামিক সম্পদ
            সহজলভ্য করা।
          </p>
        </section>

        {/* Features */}
        <section className="bg-card/70 border border-border/60 rounded-2xl shadow-soft p-5 space-y-3">
          <h2 className="text-lg font-semibold">What NOOR Offers / NOOR যা দেয়</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Clock, title: "Prayer Times", desc: "Accurate prayer times based on your location with athan notifications" },
              { icon: BookOpen, title: "Quran", desc: "Complete Quran with Arabic text, translations, and audio recitation" },
              { icon: Moon, title: "Islamic Calendar", desc: "Hijri calendar with important Islamic dates and occasions" },
              { icon: Compass, title: "Qibla Finder", desc: "Accurate Qibla direction compass for prayer guidance" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-2.5 p-2 rounded-lg">
                <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">{title}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">
            Additionally, NOOR includes Sahih Bukhari hadiths, a daily Islamic quiz, tasbih
            counter, dua collections, 99 Names of Allah, baby names database, and a
            comprehensive prayer guide with step-by-step instructions.
          </p>
          <p className="text-muted-foreground font-bangla">
            এছাড়াও, NOOR-এ রয়েছে সহীহ বুখারী হাদিস, দৈনিক ইসলামিক কুইজ, তাসবিহ কাউন্টার,
            দোয়া সংকলন, আল্লাহর ৯৯টি নাম, শিশুদের নাম ডেটাবেস এবং ধাপে ধাপে নামাজ শেখার
            সম্পূর্ণ গাইড।
          </p>
        </section>

        {/* Developer */}
        <section className="bg-card/70 border border-border/60 rounded-2xl shadow-soft p-5 space-y-3">
          <h2 className="text-lg font-semibold">Developer / ডেভেলপার</h2>
          <p className="text-muted-foreground">
            NOOR has been lovingly developed and maintained by <span className="font-semibold text-foreground">ABEDIN MOLLA</span> from
            India. With a deep commitment to serving the Muslim community, NOOR is built with
            attention to accuracy, beautiful design, and ease of use.
          </p>
          <p className="text-muted-foreground font-bangla">
            NOOR ভারতের <span className="font-semibold text-foreground">আবিদিন মোল্লা (ABEDIN MOLLA)</span> কর্তৃক
            যত্ন সহকারে তৈরি ও পরিচালিত। মুসলিম উম্মাহর সেবায় নিবেদিত এই অ্যাপটি নির্ভুলতা,
            সুন্দর ডিজাইন ও সহজ ব্যবহারযোগ্যতার দিকে বিশেষ নজর রেখে তৈরি করা হয়েছে।
          </p>
        </section>

        {/* Content Sources */}
        <section className="bg-card/70 border border-border/60 rounded-2xl shadow-soft p-5 space-y-3">
          <h2 className="text-lg font-semibold">Content Sources / কনটেন্ট সূত্র</h2>
          <p className="text-muted-foreground">
            All Islamic content in NOOR—including Quran text, hadiths, duas, and prayer
            instructions—is sourced from authentic and widely accepted Islamic references.
            Prayer times are calculated using established astronomical algorithms. We
            encourage users to verify critical religious information with qualified local
            scholars.
          </p>
          <p className="text-muted-foreground font-bangla">
            NOOR-এর সকল ইসলামিক কনটেন্ট—কুরআনের টেক্সট, হাদিস, দোয়া এবং নামাজের নির্দেশনা
            সহ—প্রামাণিক ও ব্যাপকভাবে স্বীকৃত ইসলামিক রেফারেন্স থেকে নেওয়া হয়েছে। নামাজের
            সময় প্রতিষ্ঠিত জ্যোতির্বিদ্যার অ্যালগরিদম ব্যবহার করে গণনা করা হয়। গুরুত্বপূর্ণ
            ধর্মীয় তথ্য যোগ্য স্থানীয় আলিমদের সাথে যাচাই করে নিতে আমরা উৎসাহিত করি।
          </p>
        </section>

        {/* Open Source */}
        <section className="bg-card/70 border border-border/60 rounded-2xl shadow-soft p-5 space-y-2">
          <h2 className="text-lg font-semibold">Community / কমিউনিটি</h2>
          <p className="text-muted-foreground">
            NOOR is built for the community, by the community. We welcome feedback,
            suggestions, and contributions from users around the world. If you find any
            errors in the content or have ideas for improvement, please reach out through
            our contact page.
          </p>
          <p className="text-muted-foreground font-bangla">
            NOOR কমিউনিটির জন্য, কমিউনিটির দ্বারা তৈরি। বিশ্বজুড়ে ব্যবহারকারীদের মতামত,
            পরামর্শ ও অবদান আমরা স্বাগত জানাই। কনটেন্টে কোনো ভুল পেলে বা উন্নতির ধারণা
            থাকলে আমাদের যোগাযোগ পেজের মাধ্যমে জানান।
          </p>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
