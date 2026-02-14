import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { SparklesBadge } from "@/components/BadgeIcons";

interface Props {
  open: boolean;
  totalXP: number;
  correctAnswers: number;
  accuracy: number;
  onClose: () => void;
  onGenerateCertificate: () => void;
}

export const QuranExpertCelebration = ({
  open,
  totalXP,
  correctAnswers,
  accuracy,
  onClose,
  onGenerateCertificate,
}: Props) => {
  const [windowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl"
        style={{
          background: "radial-gradient(ellipse at center, hsl(45 80% 20% / 0.95), hsl(35 60% 8% / 0.98))",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={300}
            recycle={true}
            gravity={0.2}
            colors={["#FFD700", "#FFA500", "#FF8C00", "#DAA520", "#50C878", "#ffffff"]}
          />
        </div>

        {/* Gold glow */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, hsl(45 90% 55% / 0.4), transparent)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          {/* Badge reveal */}
          <motion.div
            className="mb-6"
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: "hsl(45 90% 55% / 0.5)" }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <SparklesBadge className="w-28 h-28 relative z-10 drop-shadow-2xl" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.p
            className="text-5xl mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            🏆
          </motion.p>

          <motion.h2
            className="text-2xl font-bold mb-1"
            style={{ color: "hsl(45 90% 70%)" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Congratulations!
          </motion.h2>

          <motion.p
            className="text-lg font-extrabold tracking-widest uppercase mb-6"
            style={{ color: "hsl(45 80% 80%)" }}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            You are now a QURAN EXPERT
          </motion.p>

          {/* Stats */}
          <motion.div
            className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 mb-6 space-y-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total XP Earned</span>
              <span className="font-bold text-amber-400">{totalXP} XP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Correct Answers</span>
              <span className="font-bold text-emerald-400">{correctAnswers}+</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Accuracy</span>
              <span className="font-bold text-amber-400">{accuracy}%</span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="w-full space-y-3"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <Button
              onClick={onGenerateCertificate}
              className="w-full h-14 rounded-2xl text-lg font-bold tracking-wide shadow-lg border-0"
              style={{
                background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 45%))",
                color: "hsl(35 60% 10%)",
                boxShadow: "0 4px 20px hsl(45 90% 55% / 0.4)",
              }}
            >
              🎓 Generate Certificate
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-white/50 hover:text-white/80"
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
