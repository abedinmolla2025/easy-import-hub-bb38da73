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
      style={{ background: "linear-gradient(170deg, #0F766E 0%, #064E3B 40%, #022c22 100%)" }}
    >
      {/* Hero section */}
      <div className="px-4 pt-14 pb-10 text-center relative">
        {/* Radial glow behind icon */}
        <div
          className="absolute left-1/2 top-10 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.15), 0 4px 12px rgba(5,150,105,0.4)",
          }}
        >
          <BookOpen className="h-7 w-7 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[26px] font-extrabold text-white tracking-tight"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
        >
          Hadith Collection
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-1 text-[15px]"
          style={{ fontFamily: "'Noto Sans Bengali', sans-serif", color: "rgba(255,255,255,0.85)" }}
        >
          হাদিস সংকলন
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-3 text-[13px] leading-relaxed max-w-xs mx-auto"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Browse authentic collections from the most trusted scholars of Islam.
        </motion.p>
      </div>

      {/* Book cards */}
      <div className="mx-auto max-w-lg px-4 flex flex-col gap-[14px]">
        {hadithBooks.map((book, i) => (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(book.id === "bukhari" ? "/sahih-al-bukhari" : `/hadith/${book.id}`)}
            className="flex items-center gap-4 bg-white p-4 text-left transition-shadow duration-200"
            style={{
              borderRadius: 20,
              boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)",
              }}
            >
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
