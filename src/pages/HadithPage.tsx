import { useNavigate } from "react-router-dom";
import { BookOpen, ScrollText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import BottomNavigation from "@/components/BottomNavigation";

const hadithBooks = [
  {
    id: "bukhari",
    title: "Sahih Bukhari",
    titleBn: "সহীহ বুখারী",
    description: "The most authentic collection of Hadith compiled by Imam Bukhari.",
    descriptionBn: "ইমাম বুখারী (রহ.) কর্তৃক সংকলিত সর্বাধিক বিশুদ্ধ হাদিস গ্রন্থ।",
    chapters: 97,
    hadiths: 7563,
    icon: ScrollText,
  },
];

export default function HadithPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-12 pb-6 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Hadith Collection</h1>
        <p className="mt-1 text-sm text-muted-foreground">হাদিস সংকলন</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Browse authentic Hadith collections from the most trusted scholars of Islam.
        </p>
      </div>

      {/* Book list */}
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
              <book.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">{book.title}</h2>
              <p className="text-sm text-muted-foreground">{book.titleBn}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {book.chapters} chapters · {book.hadiths.toLocaleString()} hadiths
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
