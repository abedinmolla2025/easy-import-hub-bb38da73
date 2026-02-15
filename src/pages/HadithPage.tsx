import { useNavigate } from "react-router-dom";
import { BookOpen, ScrollText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";

const fallbackBooks = [
  { id: "bukhari", title: "Sahih Bukhari", title_bn: "সহীহ বুখারী", total_chapters: 97, total_hadiths: 7563 },
  { id: "muslim", title: "Sahih Muslim", title_bn: "সহীহ মুসলিম", total_chapters: 56, total_hadiths: 7563 },
  { id: "tirmidhi", title: "Jami at-Tirmidhi", title_bn: "জামে তিরমিযী", total_chapters: 49, total_hadiths: 3956 },
  { id: "abu-dawud", title: "Sunan Abu Dawud", title_bn: "সুনানে আবু দাউদ", total_chapters: 43, total_hadiths: 5274 },
];

const geometricPatternSvg = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M30 0L60 30L30 60L0 30z M30 8L52 30L30 52L8 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default function HadithPage() {
  const navigate = useNavigate();

  const { data: books } = useQuery({
    queryKey: ["hadith-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hadith_books" as any)
        .select("id, title, title_bn, total_chapters, total_hadiths, display_order")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as unknown as typeof fallbackBooks;
    },
  });

  const hadithBooks = books ?? fallbackBooks;

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Full-page gradient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background: "linear-gradient(160deg, #0F766E 0%, #064E3B 50%, #022c22 100%)" }}
      />
      {/* Geometric pattern overlay */}
      <div
        className="fixed inset-0 -z-10 mix-blend-overlay"
        style={{ backgroundImage: geometricPatternSvg, backgroundSize: "60px 60px" }}
      />

      {/* Hero section */}
      <div className="px-4 pt-14 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,243,208,0.15) 0%, transparent 70%)" }}
        >
          <BookOpen className="h-8 w-8 text-emerald-100" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[28px] font-extrabold tracking-tight text-white"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
        >
          Hadith Collection
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-1.5 text-[15px] text-emerald-100/90"
          style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
        >
          হাদিস সংকলন
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3 text-[13px] leading-relaxed text-white/60 max-w-sm mx-auto"
        >
          Browse authentic Hadith collections from the most trusted scholars of Islam.
        </motion.p>
      </div>

      {/* Book cards */}
      <div className="mx-auto max-w-lg px-4 flex flex-col gap-3.5">
        {hadithBooks.map((book, i) => (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/hadith/${book.id}`)}
            className="flex items-center gap-4 rounded-[20px] p-5 text-left transition-shadow duration-200 bg-white"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)" }}
          >
            {/* Icon circle */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              <ScrollText className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900 leading-snug">
                {book.title}
              </h2>
              <p
                className="text-[13px] text-gray-500 mt-0.5"
                style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
              >
                {book.title_bn}
              </p>
              <p className="mt-1 text-[11px] text-gray-400 tracking-wide">
                {book.total_chapters} chapters · {book.total_hadiths.toLocaleString()} hadiths
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
          </motion.button>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}
