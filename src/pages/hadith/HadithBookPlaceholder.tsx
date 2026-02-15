import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText, Construction } from "lucide-react";
import { motion } from "framer-motion";
import BottomNavigation from "@/components/BottomNavigation";

const bookMeta: Record<string, { title: string; titleBn: string }> = {
  muslim: { title: "Sahih Muslim", titleBn: "সহীহ মুসলিম" },
  tirmidhi: { title: "Jami at-Tirmidhi", titleBn: "জামে তিরমিযী" },
  "abu-dawud": { title: "Sunan Abu Dawud", titleBn: "সুনানে আবু দাউদ" },
};

export default function HadithBookPlaceholder() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const meta = bookMeta[bookId ?? ""] ?? { title: bookId, titleBn: "" };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-12 pb-6 text-center">
        <button onClick={() => navigate("/hadith")} className="absolute left-4 top-12 p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <ScrollText className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.titleBn}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md px-6 mt-16 text-center"
      >
        <Construction className="mx-auto mb-4 h-14 w-14 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This collection is being prepared. Check back soon, insha'Allah.
        </p>
      </motion.div>

      <BottomNavigation />
    </div>
  );
}
