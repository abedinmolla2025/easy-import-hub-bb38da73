import { useState, useEffect, useCallback } from "react";

interface QuizProgress {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  questionsAnswered: number;
  correctAnswers: number;
  todayQuestionsAnswered: number;
  todayCorrectAnswers: number;
  todayDate: string;
}

const STORAGE_KEY = "noor_quiz_progress";

const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

const getYesterdayString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
};

const getDefaultProgress = (): QuizProgress => ({
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: "",
  questionsAnswered: 0,
  correctAnswers: 0,
  todayQuestionsAnswered: 0,
  todayCorrectAnswers: 0,
  todayDate: getTodayString(),
});

export const useQuizProgress = () => {
  const [progress, setProgress] = useState<QuizProgress>(getDefaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QuizProgress;
        // Reset daily counters if it's a new day
        if (parsed.todayDate !== getTodayString()) {
          parsed.todayQuestionsAnswered = 0;
          parsed.todayCorrectAnswers = 0;
          parsed.todayDate = getTodayString();
        }
        setProgress(parsed);
      }
    } catch (error) {
      console.error("Failed to load quiz progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProgress = (newProgress: QuizProgress) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error("Failed to save quiz progress:", error);
    }
  };

  const updateStreak = () => {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const lastPlayed = progress.lastPlayedDate;

    if (lastPlayed === today) {
      return progress.currentStreak;
    } else if (lastPlayed === yesterday || lastPlayed === "") {
      return progress.currentStreak + 1;
    } else {
      return 1;
    }
  };

  // Each correct answer = 10 XP
  const addPoints = (points: number, isCorrect: boolean) => {
    const newStreak = updateStreak();
    const newProgress: QuizProgress = {
      ...progress,
      totalPoints: progress.totalPoints + points,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, progress.longestStreak),
      lastPlayedDate: getTodayString(),
      questionsAnswered: progress.questionsAnswered + 1,
      correctAnswers: progress.correctAnswers + (isCorrect ? 1 : 0),
      todayQuestionsAnswered: progress.todayQuestionsAnswered + 1,
      todayCorrectAnswers: progress.todayCorrectAnswers + (isCorrect ? 1 : 0),
      todayDate: getTodayString(),
    };

    saveProgress(newProgress);
    return newProgress;
  };

  const resetProgress = () => {
    const defaultProgress = getDefaultProgress();
    saveProgress(defaultProgress);
  };

  const hasPlayedToday = () => {
    return progress.lastPlayedDate === getTodayString();
  };

  // Daily limit: 5 questions
  const hasReachedDailyLimit = () => {
    if (progress.todayDate !== getTodayString()) return false;
    return progress.todayQuestionsAnswered >= 5;
  };

  const getAccuracy = () => {
    if (progress.questionsAnswered === 0) return 0;
    return Math.round((progress.correctAnswers / progress.questionsAnswered) * 100);
  };

  // Quran Expert badge: 2000+ XP and 85%+ accuracy
  const isQuranExpert = () => {
    return progress.totalPoints >= 2000 && getAccuracy() >= 85;
  };

  // Check if badge was just unlocked (not previously acknowledged)
  const EXPERT_ACK_KEY = "noor_quran_expert_ack";
  const hasAcknowledgedExpert = useCallback(() => {
    return localStorage.getItem(EXPERT_ACK_KEY) === "true";
  }, []);

  const acknowledgeExpert = useCallback(() => {
    localStorage.setItem(EXPERT_ACK_KEY, "true");
  }, []);

  return {
    progress,
    isLoading,
    addPoints,
    resetProgress,
    hasPlayedToday,
    hasReachedDailyLimit,
    getAccuracy,
    updateStreak,
    isQuranExpert,
    hasAcknowledgedExpert,
    acknowledgeExpert,
  };
};
