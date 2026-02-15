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
    <div
      className="min-h-screen pb-24"
      style={{ background: "linear-gradient(170deg, #0F766E 0%, #064E3B 45%, #022c22 100%)" }}
    >
      {/* Hero section */}
      <div className="px-4 pt-14 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10"
        >
          <BookOpen className="h-7 w-7 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[26px] font-extrabold text-white tracking-tight"
        >
          Hadith Collection
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-1 text-[15px] text-emerald-200"
          style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
        >
          হাদিস সংকলন
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3 text-[13px] leading-relaxed text-emerald-100/60 max-w-xs mx-auto"
        >
          Browse authentic collections from the most trusted scholars of Islam.
        </motion.p>
      </div>

      {/* Book cards */}
      <div className="mx-auto max-w-lg px-4 flex flex-col gap-3">
        {hadithBooks.map((book, i) => (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/hadith/${book.id}`)}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-lg shadow-black/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600">
              <ScrollText className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-gray-900 leading-snug">
                {book.title}
              </h2>
              <p
                className="text-[13px] text-gray-500 mt-0.5"
                style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
              >
                {book.title_bn}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
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
