import { useNavigate } from "react-router-dom";
import { BookOpen, ScrollText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";

// Fallback data if DB fetch fails
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
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-12 pb-6 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Hadith Collection</h1>
        <p className="mt-1 text-sm text-muted-foreground">হাদিস সংকলন</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Browse authentic Hadith collections from the most trusted scholars of Islam.
        </p>
      </div>

      <div className="mx-auto max-w-lg px-4 mt-6 flex flex-col gap-4">
        {hadithBooks.map((book, i) => (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/hadith/${book.id}`)}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ScrollText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">{book.title}</h2>
              <p className="text-sm text-muted-foreground">{book.title_bn}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {book.total_chapters} chapters · {book.total_hadiths.toLocaleString()} hadiths
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40" />
          </motion.button>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}
