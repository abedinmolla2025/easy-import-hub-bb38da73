import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BottomNavigation from "@/components/BottomNavigation";
import { ArrowLeft, Trophy, Star, Medal, Crown, Zap, CheckCircle2, XCircle, Sparkles, Target, TrendingUp, Clock, Eye, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { playSfx } from "@/utils/quizSfx";
import { StarBadge, TrophyBadge, MedalBadge, CrownBadge, SparklesBadge } from "@/components/BadgeIcons";
import Confetti from "react-confetti";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { useCountdownToMidnight } from "@/hooks/useCountdownToMidnight";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hapticImpact, hapticNotification } from "@/lib/haptics";
import { BadgeCelebration } from "@/components/BadgeCelebration";
import { BadgeCertificate } from "@/components/BadgeCertificate";

interface Question {
  question: string;
  question_bn?: string | null;
  question_en?: string | null;
  options: string[];
  options_bn?: string[] | null;
  options_en?: string[] | null;
  correctAnswer: number;
  category: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  badges: number;
}

const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "আহমেদ", xp: 2450, badges: 12 },
  { rank: 2, name: "ফাতিমা", xp: 2320, badges: 11 },
  { rank: 3, name: "মুহাম্মদ", xp: 2180, badges: 10 },
  { rank: 4, name: "আয়েশা", xp: 1950, badges: 9 },
  { rank: 5, name: "ইব্রাহিম", xp: 1820, badges: 8 },
  { rank: 6, name: "খাদিজা", xp: 1700, badges: 7 },
  { rank: 7, name: "উমর", xp: 1580, badges: 6 },
  { rank: 8, name: "মারিয়াম", xp: 1450, badges: 5 },
];

const badges = [
  { id: 1, name: "First Steps", nameBn: "প্রথম পদক্ষেপ", BadgeIcon: StarBadge, color: "text-yellow-500", bgGradient: "from-yellow-500/20 to-amber-500/20", requirement: 50 },
  { id: 2, name: "Quiz Master", nameBn: "কুইজ মাস্টার", BadgeIcon: TrophyBadge, color: "text-amber-500", bgGradient: "from-amber-500/20 to-orange-500/20", requirement: 200 },
  { id: 3, name: "Knowledge Seeker", nameBn: "জ্ঞানী", BadgeIcon: MedalBadge, color: "text-blue-500", bgGradient: "from-blue-500/20 to-cyan-500/20", requirement: 500 },
  { id: 4, name: "Champion", nameBn: "চ্যাম্পিয়ন", BadgeIcon: CrownBadge, color: "text-purple-500", bgGradient: "from-purple-500/20 to-pink-500/20", requirement: 1000 },
  { id: 5, name: "Quran Expert", nameBn: "কুরআন বিশেষজ্ঞ", BadgeIcon: SparklesBadge, color: "text-emerald-500", bgGradient: "from-emerald-500/20 to-teal-500/20", requirement: 2000, requiresAccuracy: 85 },
];

type LanguageMode = "en" | "bn" | "mixed";

interface QuizAnswer {
  question: Question;
  userAnswer: number;
  isCorrect: boolean;
}

const QUIZ_WARNING_SOUNDS_MUTED_KEY = "quizWarningSoundsMuted";

type HapticType = "success" | "error";

const triggerHaptic = (type: HapticType) => {
  void (type === "success" ? hapticNotification("success") : hapticNotification("error"));
  void (type === "success" ? hapticImpact("light") : hapticImpact("medium"));
};

const QuizPage = () => {
  const navigate = useNavigate();
  const countdown = useCountdownToMidnight();

  const nextButtonRef = useRef<HTMLDivElement | null>(null);
  const submitAutoNextTimerRef = useRef<number | null>(null);
  const submitScrollTimerRef = useRef<number | null>(null);
  
  const {
    progress,
    isLoading: loading,
    addPoints,
    hasPlayedToday,
    hasReachedDailyLimit,
    getAccuracy,
    updateStreak,
    isQuranExpert,
    hasAcknowledgedExpert,
    acknowledgeExpert,
    hasAcknowledgedBadge,
    acknowledgeBadge,
  } = useQuizProgress();

  // Celebration & certificate modals — now for any badge
  const [celebratingBadge, setCelebratingBadge] = useState<typeof badges[number] | null>(null);
  const [certificateBadge, setCertificateBadge] = useState<typeof badges[number] | null>(null);

  // Check if any badge was just unlocked and not acknowledged
  useEffect(() => {
    for (const badge of badges) {
      const hasAccuracyReq = !!(badge as any).requiresAccuracy;
      const isEarned = hasAccuracyReq
        ? progress.totalPoints >= badge.requirement && getAccuracy() >= (badge as any).requiresAccuracy
        : progress.totalPoints >= badge.requirement;

      if (isEarned && !hasAcknowledgedBadge(badge.id)) {
        setCelebratingBadge(badge);
        break;
      }
    }
  }, [progress.totalPoints, progress.correctAnswers]);

  // Fetch questions from local JSON file
  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["quiz-questions"],
    queryFn: async () => {
      try {
        const response = await fetch("/quiz-questions-90.json");
        if (!response.ok) throw new Error("Failed to load questions");
        const data = await response.json();
        
        return (data || []).map((q: any) => ({
          question: q.question,
          question_bn: q.question_bn ?? null,
          question_en: q.question_en ?? null,
          options: q.options as string[],
          options_bn: q.options_bn ?? null,
          options_en: q.options_en ?? null,
          correctAnswer: q.correct_answer,
          category: q.category,
        }));
      } catch (error) {
        console.error("Failed to load quiz questions:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const getQuestionText = (q: Question, mode: LanguageMode) => {
    if (mode === "bn") return q.question_bn || q.question;
    if (mode === "en") return q.question_en || q.question;
    return q.question_bn || q.question_en || q.question;
  };

  const getQuestionTextSecondary = (q: Question) => {
    return q.question_en || q.question;
  };

  const getOptionText = (q: Question, optionFallback: string, index: number, mode: LanguageMode) => {
    if (mode === "bn") return q.options_bn?.[index] || optionFallback;
    if (mode === "en") return q.options_en?.[index] || optionFallback;
    return q.options_bn?.[index] || q.options_en?.[index] || optionFallback;
  };

  const getOptionTextSecondary = (q: Question, optionFallback: string, index: number) => {
    return q.options_en?.[index] || optionFallback;
  };

  const isMixedPrimaryBangla = (q: Question) => {
    const bn = (q.question_bn ?? "").trim();
    if (!bn) return false;
    const enOrBase = (q.question_en ?? q.question ?? "").trim();
    return bn !== enOrBase;
  };

  const isMixedPrimaryBanglaOption = (q: Question, index: number) => {
    const bn = (q.options_bn?.[index] ?? "").trim();
    if (!bn) return false;
    const enOrBase = (q.options_en?.[index] ?? (q.options?.[index] as string) ?? "").trim();
    return bn !== enOrBase;
  };

  const shouldShowMixedSecondaryQuestion = (q: Question) => {
    const en = (q.question_en ?? "").trim();
    if (!en) return false;
    const primary = getQuestionText(q, "mixed").trim();
    return en !== primary;
  };

  const shouldShowMixedSecondaryOption = (q: Question, index: number) => {
    const en = (q.options_en?.[index] ?? "").trim();
    if (!en) return false;
    const primary = getOptionText(q, (q.options?.[index] as string) ?? "", index, "mixed").trim();
    return en !== primary;
  };
  
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard" | "badges">("quiz");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [dailyQuestions, setDailyQuestions] = useState<Question[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [languageMode, setLanguageMode] = useState<LanguageMode>(() => {
    const saved = localStorage.getItem("quizLanguageMode") as LanguageMode | null;
    return saved ?? "mixed";
  });
  const [currentDate, setCurrentDate] = useState(() => new Date().toDateString());
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [resultProgress, setResultProgress] = useState(0);
  const resultMetaRef = useRef<{ startedAt: number; durationMs: number } | null>(null);
  const [showResultBurst, setShowResultBurst] = useState(false);
  const resultBurstTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("quizLanguageMode", languageMode);
  }, [languageMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextDate = new Date().toDateString();
      setCurrentDate(prev => (prev === nextDate ? prev : nextDate));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const playedToday = hasPlayedToday();
  const reachedLimit = hasReachedDailyLimit();

  useEffect(() => {
    const dateSeed = currentDate;
    const hasBnPack = (q: any) => !!q.question_bn && Array.isArray(q.options_bn) && q.options_bn.length === 4;
    const hasEnPack = (q: any) => !!q.question_en && Array.isArray(q.options_en) && q.options_en.length === 4;

    const preferredPool =
      languageMode === "bn"
        ? allQuestions.filter(hasBnPack)
        : languageMode === "en"
        ? allQuestions.filter(hasEnPack)
        : allQuestions.filter((q) => hasBnPack(q) && hasEnPack(q));

    const pool = preferredPool.length >= 5 ? preferredPool : allQuestions;

    const shuffled = [...pool].sort(() => {
      const hash = dateSeed.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
      return Math.sin(hash) - 0.5;
    });
    setDailyQuestions(shuffled.slice(0, 5));
    
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
    setTimeLeft(30);
    setIsTimeUp(false);
    setQuizAnswers([]);
    setShowReview(false);
  }, [currentDate, allQuestions, languageMode]);

  // Timer effect
  useEffect(() => {
    const currentQuestion = dailyQuestions[currentQuestionIndex];
    
    if (quizCompleted || reachedLimit || !currentQuestion || showResult) {
      return;
    }

    const muted = localStorage.getItem(QUIZ_WARNING_SOUNDS_MUTED_KEY) === "true";
    if (!muted) {
      if (timeLeft === 10) playSfx("warn10");
      if (timeLeft === 5) playSfx("warn5");
    }

    if (timeLeft === 0) {
      setIsTimeUp(true);
      setShowResult(true);
      playSfx("wrong");
      triggerHaptic("error");

      resultMetaRef.current = { startedAt: Date.now(), durationMs: 3000 };
      setResultProgress(0);
      
      const autoNextTimer = setTimeout(() => {
        handleNextQuestion();
      }, 3000);
      
      return () => clearTimeout(autoNextTimer);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizCompleted, reachedLimit, currentQuestionIndex, dailyQuestions, showResult]);

  // Result popup progress bar updater
  useEffect(() => {
    if (!showResult) return;
    const meta = resultMetaRef.current;
    if (!meta) return;

    const tick = () => {
      const elapsed = Date.now() - meta.startedAt;
      const p = Math.min(100, Math.max(0, (elapsed / meta.durationMs) * 100));
      setResultProgress(p);
    };

    tick();
    const id = window.setInterval(tick, 40);
    return () => window.clearInterval(id);
  }, [showResult, currentQuestionIndex]);

  // Popup micro-effects
  useEffect(() => {
    if (!showResult) return;
    const q = dailyQuestions[currentQuestionIndex];
    if (!q) return;

    const isCorrect = !isTimeUp && selectedAnswer !== null && selectedAnswer === q.correctAnswer;
    if (!isCorrect) return;

    setShowResultBurst(true);
    if (resultBurstTimerRef.current) window.clearTimeout(resultBurstTimerRef.current);
    resultBurstTimerRef.current = window.setTimeout(() => setShowResultBurst(false), 550);

    return () => {
      if (resultBurstTimerRef.current) window.clearTimeout(resultBurstTimerRef.current);
    };
  }, [showResult, currentQuestionIndex, isTimeUp, selectedAnswer, dailyQuestions]);

  const submitAnswer = (answerIndex: number) => {
    if (showResult || isTimeUp) return;
    setShowResult(true);
    
    const currentQ = dailyQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQ.correctAnswer;
    
    setQuizAnswers(prev => [...prev, {
      question: currentQ,
      userAnswer: answerIndex,
      isCorrect
    }]);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      playSfx("correct");
      triggerHaptic("success");
    } else {
      playSfx("wrong");
      triggerHaptic("error");
    }

    resultMetaRef.current = { startedAt: Date.now(), durationMs: 3000 };
    setResultProgress(0);

    if (submitAutoNextTimerRef.current) window.clearTimeout(submitAutoNextTimerRef.current);
    if (submitScrollTimerRef.current) window.clearTimeout(submitScrollTimerRef.current);

    submitScrollTimerRef.current = window.setTimeout(() => {
      nextButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult || isTimeUp) return;
    setSelectedAnswer(answerIndex);
    submitAnswer(answerIndex);
  };

  useEffect(() => {
    return () => {
      if (submitAutoNextTimerRef.current) window.clearTimeout(submitAutoNextTimerRef.current);
      if (submitScrollTimerRef.current) window.clearTimeout(submitScrollTimerRef.current);
      if (resultBurstTimerRef.current) window.clearTimeout(resultBurstTimerRef.current);
    };
  }, []);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < dailyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(30);
      setIsTimeUp(false);
    } else {
      // Quiz completed - 10 XP per correct answer
      const earnedXP = score * 10;
      
      for (let i = 0; i < score; i++) {
        addPoints(10, true);
      }
      // Add entries for wrong answers (0 XP but track question)
      for (let i = 0; i < (5 - score); i++) {
        addPoints(0, false);
      }
      
      if (score === 5) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      
      setQuizCompleted(true);
      playSfx("result");
    }
  };

  const handleShowReview = () => {
    setShowReview(true);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
    setQuizAnswers([]);
    setShowReview(false);
    setTimeLeft(30);
    setIsTimeUp(false);
  };

  if (loading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!questionsLoading && allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-2xl mx-auto pt-8 text-center">
          <p className="text-muted-foreground">কোনো প্রশ্ন পাওয়া যায়নি।</p>
        </div>
      </div>
    );
  }

  const currentQuestion = dailyQuestions[currentQuestionIndex];
  const earnedBadges = badges.filter(b => {
    if ((b as any).requiresAccuracy) {
      return progress.totalPoints >= b.requirement && getAccuracy() >= (b as any).requiresAccuracy;
    }
    return progress.totalPoints >= b.requirement;
  });

  const availableBnCount = allQuestions.filter((q) => !!q.question_bn).length;
  const availableEnCount = allQuestions.filter((q) => !!q.question_en).length;
  const availableMixedCount = allQuestions.filter((q) => !!q.question_bn && !!q.question_en).length;

  const todayXP = progress.todayCorrectAnswers * 10;

  return (
    <div className="min-h-screen quiz-page-bg pb-24">
      {/* Badge Celebration */}
      {celebratingBadge && (
        <BadgeCelebration
          open={!!celebratingBadge}
          badge={{
            ...celebratingBadge,
            isPremium: celebratingBadge.name === "Quran Expert",
            requiresAccuracy: (celebratingBadge as any).requiresAccuracy,
          }}
          totalXP={progress.totalPoints}
          correctAnswers={progress.correctAnswers}
          accuracy={getAccuracy()}
          onClose={() => {
            acknowledgeBadge(celebratingBadge.id);
            if (celebratingBadge.name === "Quran Expert") acknowledgeExpert();
            setCelebratingBadge(null);
          }}
          onGenerateCertificate={() => {
            acknowledgeBadge(celebratingBadge.id);
            if (celebratingBadge.name === "Quran Expert") acknowledgeExpert();
            setCertificateBadge(celebratingBadge);
            setCelebratingBadge(null);
          }}
        />
      )}

      {/* Badge Certificate */}
      {certificateBadge && (
        <BadgeCertificate
          open={!!certificateBadge}
          badge={{
            ...certificateBadge,
            isPremium: certificateBadge.name === "Quran Expert",
            requiresAccuracy: (certificateBadge as any).requiresAccuracy,
          }}
          totalXP={progress.totalPoints}
          correctAnswers={progress.correctAnswers}
          accuracy={getAccuracy()}
          onClose={() => setCertificateBadge(null)}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/50 quiz-glass">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Daily Quiz
          </h1>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 quiz-glass quiz-glass-accent">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary">{progress.totalPoints} XP</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-4 pb-2">
          {[
            { id: "quiz", label: "Quiz", icon: Sparkles },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "badges", label: "Badges", icon: Medal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-card border-primary/20"
                    : "quiz-glass hover:shadow-soft"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Language Toggle (Quiz only) */}
        {activeTab === "quiz" && (
          <div className="px-4 pb-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Question language</span>
              <div className="inline-flex rounded-full bg-muted/60 p-1">
                {(
                  [
                    { id: "en", label: "English" },
                    { id: "bn", label: "বাংলা" },
                    { id: "mixed", label: "Mixed" },
                  ] as { id: LanguageMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setLanguageMode(mode.id)}
                    className={`px-3 py-1 rounded-full transition-all ${
                      languageMode === mode.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {languageMode === "bn" && availableBnCount < 5 && (
              <p className="mt-2 text-muted-foreground">
                বাংলা প্রশ্ন এখন কম আছে ({availableBnCount} টি)। কিছু প্রশ্ন fallback হিসেবে English থেকে আসতে পারে।
              </p>
            )}
            {languageMode === "en" && availableEnCount < 5 && (
              <p className="mt-2 text-muted-foreground">
                English প্রশ্ন এখন কম আছে ({availableEnCount} টি)। কিছু প্রশ্ন fallback হিসেবে অন্য ভাষা থেকে আসতে পারে।
              </p>
            )}
            {languageMode === "mixed" && availableMixedCount < 5 && (
              <p className="mt-2 text-muted-foreground">
                Mixed mode চালাতে Bangla+English দুটোই দরকার। এখন আছে ({availableMixedCount} টি), তাই কিছু প্রশ্ন single-language হতে পারে।
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Quiz Tab */}
          {activeTab === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Card */}
              <Card className="mb-4 border quiz-glass quiz-glass-accent">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/10">
                      <p className="text-2xl font-bold text-primary">{progress.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-accent/15 border border-accent/15">
                      <p className="text-2xl font-bold text-accent">{earnedBadges.length}</p>
                      <p className="text-xs text-muted-foreground">Badges</p>
                    </div>
                  </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/10">
                      <div className="flex items-center justify-center gap-1 mb-1">
                          <Zap className="w-3 h-3 text-primary" />
                      </div>
                        <p className="text-lg font-bold text-primary">{progress.totalPoints}</p>
                      <p className="text-[10px] text-muted-foreground">Total XP</p>
                    </div>
                      <div className="text-center p-2 rounded-lg bg-muted/60 border border-border/60">
                      <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-3 h-3 text-foreground/70" />
                      </div>
                        <p className="text-lg font-bold text-foreground">{getAccuracy()}%</p>
                      <p className="text-[10px] text-muted-foreground">Accuracy</p>
                    </div>
                      <div className="text-center p-2 rounded-lg bg-muted/60 border border-border/60">
                      <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-foreground/70" />
                      </div>
                        <p className="text-lg font-bold text-foreground">{progress.longestStreak}</p>
                      <p className="text-[10px] text-muted-foreground">Best</p>
                    </div>
                  </div>

                  {/* Daily XP tracker */}
                  <div className="mt-3 p-2 rounded-lg bg-muted/40 border border-border/40">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Today's XP</span>
                      <span className="font-semibold text-primary">{todayXP}/50 XP</span>
                    </div>
                    <Progress value={(todayXP / 50) * 100} className="h-1.5" />
                  </div>

                  {/* Quran Expert badge button */}
                  {isQuranExpert() && (
                    <Button
                      onClick={() => setCertificateBadge(badges.find(b => b.name === "Quran Expert") || null)}
                      className="w-full mt-3 gap-2 border-0"
                      style={{
                        background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 45%))",
                        color: "hsl(35 60% 10%)",
                      }}
                    >
                      🎓 View Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>

              {(reachedLimit || playedToday) && !quizCompleted ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">আজকের কুইজ সম্পূর্ণ হয়েছে! ✅</h2>
                    <p className="text-muted-foreground mb-2">আজ আপনি {todayXP} XP অর্জন করেছেন (সর্বোচ্চ ৫০ XP/দিন)</p>
                    <p className="text-muted-foreground mb-4">আগামীকাল নতুন প্রশ্নের জন্য ফিরে আসুন।</p>
                    <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-xl border border-primary/20">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">পরবর্তী কুইজ পাওয়া যাবে:</p>
                      </div>
                      <p className="text-2xl font-bold text-primary font-mono">{countdown}</p>
                      <p className="text-xs text-muted-foreground mt-1">ঘণ্টা:মিনিট:সেকেন্ড</p>
                    </div>
                  </CardContent>
                </Card>
              ) : quizCompleted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {score === 5 && showConfetti && (
                    <Confetti
                      width={windowSize.width}
                      height={windowSize.height}
                      recycle={false}
                      numberOfPieces={500}
                      gravity={0.3}
                    />
                  )}
                  
                  {!showReview ? (
                    <Card className={`text-center py-8 relative overflow-hidden ${
                      score === 5 
                        ? "bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-2 border-amber-500/50" 
                        : "bg-gradient-to-br from-primary/10 to-amber-500/10"
                    }`}>
                      {score === 5 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 animate-pulse" />
                      )}
                      <CardContent className="relative z-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.2 }}
                        >
                          {score === 5 ? (
                            <motion.div
                              animate={{
                                rotate: [0, -5, 5, -5, 0],
                                scale: [1, 1.1, 1.1, 1.1, 1],
                              }}
                              transition={{ duration: 0.8, repeat: 2, delay: 0.3 }}
                            >
                              <Crown className="w-24 h-24 mx-auto text-amber-500 mb-4 drop-shadow-2xl" />
                            </motion.div>
                          ) : score >= 3 ? (
                            <Trophy className="w-20 h-20 mx-auto text-primary mb-4" />
                          ) : (
                            <Star className="w-20 h-20 mx-auto text-blue-500 mb-4" />
                          )}
                        </motion.div>
                        
                        <h2 className="text-2xl font-bold mb-2">
                          {score === 5
                            ? "🎉 PERFECT SCORE! 🎉"
                            : score >= 3
                            ? "Great job! 👏"
                            : "Good effort! 💪"}
                        </h2>
                        
                        {score === 5 && (
                          <p className="text-lg text-amber-600 dark:text-amber-400 font-semibold mb-2 animate-pulse">
                            ⭐ You're a Quiz Champion! ⭐
                          </p>
                        )}
                        
                        <p className="text-4xl font-bold text-primary my-4">{score}/5</p>
                        
                        <div className="bg-background/50 rounded-xl p-4 mb-4 space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">XP earned</p>
                            <p className="text-2xl font-bold text-emerald-500">
                              +{score * 10} XP
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-primary/5 p-3">
                              <p className="text-xs text-muted-foreground">Day streak</p>
                              <p className="text-lg font-semibold text-primary">{progress.currentStreak} days</p>
                            </div>
                            <div className="rounded-lg bg-emerald-500/5 p-3">
                              <p className="text-xs text-muted-foreground">Total XP</p>
                              <p className="text-lg font-semibold text-emerald-500">{progress.totalPoints}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-xl border border-primary/20">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">পরবর্তী কুইজ পাওয়া যাবে:</p>
                          </div>
                          <p className="text-2xl font-bold text-primary font-mono">{countdown}</p>
                          <p className="text-xs text-muted-foreground mt-1">ঘণ্টা:মিনিট:সেকেন্ড</p>
                        </div>

                        <div className="flex gap-3 justify-center mt-6">
                          <Button
                            onClick={handleShowReview}
                            size="lg"
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Review Answers
                          </Button>
                          <Button
                            onClick={resetQuiz}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset Quiz
                          </Button>
                        </div>

                        <p className="text-muted-foreground text-sm mt-4">প্রতিদিন একটু একটু উন্নতিই বড় পরিবর্তন আনে।</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Quiz Review</h2>
                        <Button
                          onClick={() => setShowReview(false)}
                          variant="outline"
                          size="sm"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                      </div>

                      {quizAnswers.map((answer, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                answer.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {answer.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="mb-3">
                                  <Badge variant="outline" className="mb-2">প্রশ্ন {index + 1}</Badge>
                                  <div>
                                    {languageMode === "bn" || (languageMode === "mixed" && isMixedPrimaryBangla(answer.question)) ? (
                                      <p className="quiz-text-bn text-lg font-medium">
                                        {getQuestionText(answer.question, languageMode)}
                                      </p>
                                    ) : (
                                      <p className="quiz-text-en text-lg font-semibold">
                                        {getQuestionText(answer.question, languageMode)}
                                      </p>
                                    )}
                                    {languageMode === "mixed" && isMixedPrimaryBangla(answer.question) && (
                                      <p className="quiz-text-en-secondary mt-1 text-xs">
                                        {getQuestionTextSecondary(answer.question)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {answer.question.options.map((option: string, optIndex: number) => {
                                    const isUserAnswer = optIndex === answer.userAnswer;
                                    const isCorrectAnswer = optIndex === answer.question.correctAnswer;
                                    
                                    return (
                                      <div
                                        key={optIndex}
                                        className={`p-3 rounded-lg border-2 ${
                                          isCorrectAnswer
                                            ? 'bg-green-50 border-green-500 text-green-700'
                                            : isUserAnswer && !answer.isCorrect
                                            ? 'bg-red-50 border-red-500 text-red-700'
                                            : 'border-border'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {isCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                                          {isUserAnswer && !answer.isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                          <div className="flex-1">
                                            <span
                                              className={
                                                languageMode === "bn" ||
                                                (languageMode === "mixed" && isMixedPrimaryBanglaOption(answer.question, optIndex))
                                                  ? "quiz-text-bn font-medium"
                                                  : "quiz-text-en font-medium"
                                              }
                                            >
                                              {getOptionText(answer.question, option, optIndex, languageMode)}
                                            </span>
                                            {languageMode === "mixed" && isMixedPrimaryBanglaOption(answer.question, optIndex) && (
                                              <p className="quiz-text-en-secondary text-xs mt-0.5">
                                                {getOptionTextSecondary(answer.question, option, optIndex)}
                                              </p>
                                            )}
                                          </div>
                                          {isCorrectAnswer && (
                                            <span className="ml-auto text-xs font-semibold text-green-600">সঠিক</span>
                                          )}
                                          {isUserAnswer && !answer.isCorrect && (
                                            <span className="ml-auto text-xs font-semibold text-red-600">আপনার উত্তর</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={resetQuiz}
                          variant="outline"
                          size="lg"
                          className="gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset Quiz
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : currentQuestion ? (
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                >
                  <div ref={nextButtonRef} />
                  {/* Progress & Timer */}
                  <div className="mb-4 space-y-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Question {currentQuestionIndex + 1}/5</span>
                      <span>Score: {score} ({score * 10} XP)</span>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / 5) * 100} className="h-2" />
                    
                    {/* Timer with Progress Bar */}
                    <div
                      className={`rounded-xl border-2 transition-all ${
                        timeLeft <= 5
                          ? "bg-red-500/10 border-red-500/50"
                          : timeLeft <= 10
                          ? "bg-amber-500/10 border-amber-500/50"
                          : "bg-emerald-500/10 border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 p-3">
                        <Clock
                          className={`w-5 h-5 ${
                            timeLeft <= 5
                              ? "text-red-500"
                              : timeLeft <= 10
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        />
                        <span
                          className={`text-2xl font-bold font-mono ${
                            timeLeft <= 5
                              ? "text-red-500"
                              : timeLeft <= 10
                              ? "text-amber-500"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {timeLeft}s
                        </span>
                      </div>

                      <div className="px-3 pb-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                          <motion.div
                            aria-hidden="true"
                            className={`h-full rounded-full ${
                              timeLeft <= 5
                                ? "bg-destructive"
                                : timeLeft <= 10
                                ? "bg-accent"
                                : "bg-emerald-500"
                            }`}
                            animate={{ width: `${Math.max(0, Math.min(100, (timeLeft / 30) * 100))}%` }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="mb-3">
                    <CardHeader>
                      <CardTitle className="text-xl leading-relaxed">
                        {languageMode === "bn" || (languageMode === "mixed" && isMixedPrimaryBangla(currentQuestion)) ? (
                          <span className="quiz-text-bn text-2xl md:text-3xl font-medium">
                            {getQuestionText(currentQuestion, languageMode)}
                          </span>
                        ) : (
                          <span className="quiz-text-en text-lg md:text-xl font-semibold">
                            {getQuestionText(currentQuestion, languageMode)}
                          </span>
                        )}
                      </CardTitle>
                      {languageMode === "bn" && !currentQuestion.question_bn && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          বাংলা অনুবাদ নেই — এই প্রশ্নটি fallback হিসেবে দেখানো হচ্ছে।
                        </p>
                      )}
                      {languageMode === "mixed" && isMixedPrimaryBangla(currentQuestion) && shouldShowMixedSecondaryQuestion(currentQuestion) && (
                        <div className="mt-1 space-y-0.5">
                          <p className="quiz-text-en-secondary text-sm md:text-xs">
                            {getQuestionTextSecondary(currentQuestion)}
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                      <motion.button
                          key={index}
                          whileTap={{ scale: 0.98 }}
                          animate={
                            showResult && selectedAnswer === index
                              ? index === currentQuestion.correctAnswer
                                ? { scale: [1, 1.04, 1] }
                                : { x: [0, -8, 8, -6, 6, 0] }
                              : undefined
                          }
                          transition={{ duration: 0.35 }}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showResult}
                        className={`w-full p-4 text-left quiz-option ${
                          showResult
                            ? index === currentQuestion.correctAnswer
                              ? "quiz-option-correct"
                              : selectedAnswer === index
                              ? "quiz-option-wrong"
                              : "opacity-80"
                            : selectedAnswer === index
                            ? "quiz-option-selected"
                            : ""
                        }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className={`leading-snug ${
                                  languageMode === "bn" ||
                                  (languageMode === "mixed" && isMixedPrimaryBanglaOption(currentQuestion, index))
                                    ? "quiz-text-bn text-lg font-medium"
                                    : "quiz-text-en text-sm font-medium"
                                }`}
                              >
                                {getOptionText(currentQuestion, option, index, languageMode)}
                              </p>
                              {languageMode === "mixed" &&
                                isMixedPrimaryBanglaOption(currentQuestion, index) &&
                                shouldShowMixedSecondaryOption(currentQuestion, index) && (
                                <p className="quiz-text-en-secondary text-xs mt-0.5">
                                  {getOptionTextSecondary(currentQuestion, option, index)}
                                </p>
                              )}
                            </div>
                            {showResult && index === currentQuestion.correctAnswer && (
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            )}
                            {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                              <XCircle className="w-6 h-6 text-red-500" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </CardContent>
                  </Card>

                {/* Full-screen animated result overlay */}
                <AnimatePresence>
                  {showResult && currentQuestion && (
                    <motion.div
                      key={`result-${currentQuestionIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl"
                      style={{
                        background: isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                          ? "radial-gradient(ellipse at center, hsl(0 70% 15% / 0.95), hsl(0 50% 8% / 0.98))"
                          : "radial-gradient(ellipse at center, hsl(145 60% 15% / 0.95), hsl(155 50% 8% / 0.98))",
                      }}
                      aria-live="polite"
                      role="status"
                    >
                      {/* Confetti for correct */}
                      {showResultBurst && !isTimeUp && selectedAnswer === currentQuestion.correctAnswer && (
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                          <Confetti
                            width={windowSize.width}
                            height={windowSize.height}
                            numberOfPieces={120}
                            recycle={false}
                            gravity={0.3}
                            initialVelocityY={15}
                          />
                        </div>
                      )}

                      {/* Glow effect */}
                      <motion.div
                        className="absolute rounded-full blur-3xl"
                        style={{
                          width: 300,
                          height: 300,
                          background: isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                            ? "radial-gradient(circle, hsl(0 80% 50% / 0.3), transparent)"
                            : "radial-gradient(circle, hsl(145 80% 50% / 0.3), transparent)",
                        }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />

                      {/* Main content */}
                      <motion.div
                        className="relative z-10 flex flex-col items-center text-center px-6"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={
                          isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                            ? { scale: 1, opacity: 1, x: [0, -12, 12, -8, 8, 0] }
                            : { scale: [0.5, 1.1, 1], opacity: 1 }
                        }
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        {/* Icon */}
                        <motion.div
                          className="mb-4"
                          animate={
                            !isTimeUp && selectedAnswer === currentQuestion.correctAnswer
                              ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }
                              : {}
                          }
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          {isTimeUp ? (
                            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                              <Clock className="w-10 h-10 text-red-400" />
                            </div>
                          ) : selectedAnswer === currentQuestion.correctAnswer ? (
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                              <XCircle className="w-10 h-10 text-red-400" />
                            </div>
                          )}
                        </motion.div>

                        {/* Bengali text */}
                        <motion.h2
                          className="text-4xl font-bold mb-2"
                          style={{
                            color: isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                              ? "hsl(0 80% 70%)"
                              : "hsl(145 80% 70%)",
                          }}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                        >
                          {isTimeUp
                            ? "⏰ সময় শেষ!"
                            : selectedAnswer === currentQuestion.correctAnswer
                            ? "✔️ সঠিক উত্তর!"
                            : "❌ ভুল উত্তর!"}
                        </motion.h2>

                        {/* English subtitle */}
                        <motion.p
                          className="text-lg font-semibold tracking-widest uppercase mb-6"
                          style={{
                            color: isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                              ? "hsl(0 60% 60%)"
                              : "hsl(145 60% 60%)",
                          }}
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.25 }}
                        >
                          {isTimeUp ? "TIME'S UP!" : selectedAnswer === currentQuestion.correctAnswer ? "CORRECT!" : "WRONG!"}
                        </motion.p>

                        {/* XP reward (correct) or encouragement (wrong) */}
                        <motion.div
                          className="mb-6"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                        >
                          {!isTimeUp && selectedAnswer === currentQuestion.correctAnswer ? (
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-3xl font-bold text-amber-400 drop-shadow-lg">+10 XP</span>
                              <span className="text-base text-emerald-300">🔥 Streak continues!</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              {/* Correct answer box */}
                              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-3 max-w-xs">
                                <p className="text-xs text-white/50 mb-1">
                                  {languageMode === "bn" ? "সঠিক উত্তর" : "Correct answer"}
                                </p>
                                <p className="text-base font-semibold text-white/90">
                                  {getOptionText(
                                    currentQuestion,
                                    currentQuestion.options[currentQuestion.correctAnswer],
                                    currentQuestion.correctAnswer,
                                    languageMode,
                                  )}
                                </p>
                              </div>
                              <span className="text-base text-white/70">Keep going! 💪</span>
                            </div>
                          )}
                        </motion.div>

                        {/* Next button */}
                        <motion.div
                          className="w-full max-w-xs"
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.55 }}
                        >
                          <Button
                            onClick={() => {
                              if (submitAutoNextTimerRef.current) window.clearTimeout(submitAutoNextTimerRef.current);
                              handleNextQuestion();
                            }}
                            className="w-full h-14 rounded-2xl text-lg font-bold tracking-wide shadow-lg"
                            style={{
                              background: isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                                ? "linear-gradient(135deg, hsl(0 70% 50%), hsl(20 80% 55%))"
                                : "linear-gradient(135deg, hsl(145 70% 45%), hsl(50 95% 55%))",
                              color: "hsl(0 0% 100%)",
                              boxShadow: isTimeUp || (selectedAnswer !== null && selectedAnswer !== currentQuestion.correctAnswer)
                                ? "0 4px 20px hsl(0 70% 50% / 0.4)"
                                : "0 4px 20px hsl(145 70% 45% / 0.4)",
                            }}
                          >
                            {currentQuestionIndex < dailyQuestions.length - 1
                              ? "NEXT QUESTION →"
                              : "SEE RESULTS 🏆"}
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                </motion.div>
              ) : null}
            </motion.div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
                <Card className="mb-4 bg-gradient-to-r from-amber-500/20 to-primary/20 border-amber-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Your rank</p>
                        <p className="text-3xl font-bold">#9</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Your XP</p>
                        <p className="text-3xl font-bold text-primary">{progress.totalPoints}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`${
                      entry.rank <= 3 
                        ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30" 
                        : ""
                    }`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          entry.rank === 1 
                            ? "bg-amber-500 text-white" 
                            : entry.rank === 2 
                            ? "bg-gray-400 text-white"
                            : entry.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-muted"
                        }`}>
                          {entry.rank <= 3 ? (
                            entry.rank === 1 ? <Crown className="w-5 h-5" /> :
                            entry.rank === 2 ? <Medal className="w-5 h-5" /> :
                            <Medal className="w-5 h-5" />
                          ) : entry.rank}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.badges} badges</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{entry.xp}</p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Badges Tab */}
          {activeTab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-4 bg-gradient-to-br from-primary/5 to-amber-500/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Badges collected</p>
                  <p className="text-5xl font-bold text-primary mb-1">{earnedBadges.length}/{badges.length}</p>
                  <Progress value={(earnedBadges.length / badges.length) * 100} className="h-2" />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                {badges.map((badge, index) => {
                  const hasAccuracyReq = !!(badge as any).requiresAccuracy;
                  const isEarned = hasAccuracyReq
                    ? progress.totalPoints >= badge.requirement && getAccuracy() >= (badge as any).requiresAccuracy
                    : progress.totalPoints >= badge.requirement;
                  const isNext = !isEarned && (index === 0 || (
                    index > 0 && (() => {
                      const prevBadge = badges[index - 1];
                      const prevHasAcc = !!(prevBadge as any).requiresAccuracy;
                      return prevHasAcc
                        ? progress.totalPoints >= prevBadge.requirement && getAccuracy() >= (prevBadge as any).requiresAccuracy
                        : progress.totalPoints >= prevBadge.requirement;
                    })()
                  ));
                  const xpNeeded = Math.max(0, badge.requirement - progress.totalPoints);
                  const badgeProgress = isEarned ? 100 : Math.min(100, (progress.totalPoints / badge.requirement) * 100);

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`relative overflow-hidden transition-all ${
                        isEarned 
                          ? `bg-gradient-to-br ${badge.bgGradient} border-2 border-primary/30 shadow-lg` 
                          : isNext
                          ? "bg-muted/30 border-2 border-dashed border-primary/20"
                          : "bg-muted/10 opacity-60"
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Badge Icon */}
                            <div className={`relative ${
                              isEarned 
                                ? `bg-gradient-to-br ${badge.bgGradient}` 
                                : "bg-muted/50"
                            } rounded-2xl p-3 shrink-0`}>
                              {!isEarned && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl z-10">
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <badge.BadgeIcon className="w-16 h-16" />
                            </div>

                            {/* Badge Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-base">{badge.name}</h3>
                                {isEarned && (
                                  <Badge className="bg-emerald-500 text-white shrink-0">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Unlocked
                                  </Badge>
                                )}
                                {isNext && !isEarned && (
                                  <Badge variant="outline" className="shrink-0">Next</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-bangla mb-2">{badge.nameBn}</p>
                              
                              {/* Progress Bar */}
                              {!isEarned && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{progress.totalPoints} XP</span>
                                    <span>{badge.requirement} XP needed</span>
                                  </div>
                                  <Progress value={badgeProgress} className="h-1.5" />
                                  {hasAccuracyReq && (
                                    <p className="text-xs text-muted-foreground">
                                      Requires {(badge as any).requiresAccuracy}% accuracy (current: {getAccuracy()}%)
                                    </p>
                                  )}
                                  {isNext && (
                                    <p className="text-xs text-primary font-medium">
                                      {xpNeeded} XP to unlock
                                    </p>
                                  )}
                                </div>
                              )}
                              {isEarned && (
                                <div className="space-y-1">
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    Unlocked at {badge.requirement} XP ✓
                                  </p>
                                  <Button
                                    onClick={() => setCertificateBadge(badge)}
                                    size="sm"
                                    className="mt-1 gap-1 text-xs border-0"
                                    style={{
                                      background: badge.name === "Quran Expert"
                                        ? "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 85% 45%))"
                                        : "linear-gradient(135deg, hsl(145 70% 45%), hsl(155 60% 35%))",
                                      color: badge.name === "Quran Expert" ? "hsl(35 60% 10%)" : "hsl(0 0% 100%)",
                                    }}
                                  >
                                    🎓 Certificate
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default QuizPage;
