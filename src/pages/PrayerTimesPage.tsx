import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Bell, Clock, Sun, Moon, Sunrise, Sunset, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useAthanNotification } from "@/hooks/useAthanNotification";
import { motion, AnimatePresence } from "framer-motion";
import AthanSettingsModal from "@/components/AthanSettingsModal";

interface PrayerInfo {
  name: string;
  arabicName: string;
  time: string;
  icon: React.ReactNode;
  gradient: string;
}

const PrayerTimesPage = () => {
  const navigate = useNavigate();
  const { prayerTimes, location, hijriDate, isLoading } = usePrayerTimes();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [showAthanSettings, setShowAthanSettings] = useState(false);

  const {
    settings: athanSettings,
    updateSettings: updateAthanSettings,
    togglePrayer: toggleAthanPrayer,
    isPlaying: isAthanPlaying,
    currentPrayer: currentAthanPrayer,
    playAthan,
    stopAthan,
    requestNotificationPermission,
  } = useAthanNotification(prayerTimes);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;

    const prayers = [
      { name: "Fajr", time: prayerTimes.Fajr },
      { name: "Sunrise", time: prayerTimes.Sunrise },
      { name: "Dhuhr", time: prayerTimes.Dhuhr },
      { name: "Asr", time: prayerTimes.Asr },
      { name: "Maghrib", time: prayerTimes.Maghrib },
      { name: "Isha", time: prayerTimes.Isha },
    ];

    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(":").map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentMinutes) {
        setNextPrayer(prayer.name);
        const diffMinutes = prayerMinutes - currentMinutes;
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m`);
        return;
      }
    }

    // After Isha, next is Fajr tomorrow
    setNextPrayer("Fajr");
    const [fajrH, fajrM] = prayerTimes.Fajr.split(":").map(Number);
    const fajrMinutes = fajrH * 60 + fajrM;
    const remainingToday = 24 * 60 - currentMinutes;
    const totalMinutes = remainingToday + fajrMinutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    setCountdown(`${h}h ${m}m`);
  }, [prayerTimes, currentTime]);

  const getPrayerIcon = (name: string) => {
    switch (name) {
      case "Fajr":
        return <Sunrise className="w-6 h-6" />;
      case "Sunrise":
        return <Sun className="w-6 h-6" />;
      case "Dhuhr":
        return <Sun className="w-6 h-6" />;
      case "Asr":
        return <Sun className="w-6 h-6" />;
      case "Maghrib":
        return <Sunset className="w-6 h-6" />;
      case "Isha":
        return <Moon className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  const getArabicName = (name: string) => {
    const arabicNames: Record<string, string> = {
      Fajr: "الفجر",
      Sunrise: "الشروق",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء",
    };
    return arabicNames[name] || name;
  };

  const prayers: PrayerInfo[] = prayerTimes
    ? [
        { name: "Fajr", arabicName: "الفجر", time: prayerTimes.Fajr, icon: getPrayerIcon("Fajr"), gradient: "from-indigo-500 to-purple-600" },
        { name: "Sunrise", arabicName: "الشروق", time: prayerTimes.Sunrise, icon: getPrayerIcon("Sunrise"), gradient: "from-amber-400 to-orange-500" },
        { name: "Dhuhr", arabicName: "الظهر", time: prayerTimes.Dhuhr, icon: getPrayerIcon("Dhuhr"), gradient: "from-yellow-400 to-amber-500" },
        { name: "Asr", arabicName: "العصر", time: prayerTimes.Asr, icon: getPrayerIcon("Asr"), gradient: "from-orange-400 to-red-500" },
        { name: "Maghrib", arabicName: "المغرب", time: prayerTimes.Maghrib, icon: getPrayerIcon("Maghrib"), gradient: "from-rose-500 to-pink-600" },
        { name: "Isha", arabicName: "العشاء", time: prayerTimes.Isha, icon: getPrayerIcon("Isha"), gradient: "from-violet-600 to-indigo-700" },
      ]
    : [];

  const formatTime12h = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return { time: `${hours12}:${minutes.toString().padStart(2, "0")}`, period };
  };

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 via-teal-700 to-cyan-800">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-emerald-700/80 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Prayer Times</h1>
          </div>
          <button 
            onClick={() => setShowAthanSettings(true)}
            className={`p-2 hover:bg-white/10 rounded-full transition-colors relative ${
              athanSettings.enabled ? "text-white" : "text-white/50"
            }`}
          >
            <Bell className="w-6 h-6" />
            {athanSettings.enabled && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
            )}
          </button>
        </div>
      </motion.header>

      {/* Athan Playing Indicator */}
      <AnimatePresence>
        {isAthanPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-bold">{currentAthanPrayer} Athan</p>
                  <p className="text-white/80 text-sm">Playing now...</p>
                </div>
              </div>
              <button
                onClick={stopAthan}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium transition-colors"
              >
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-6 space-y-6">
        {/* Location & Date Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-5"
        >
          <div className="flex items-center gap-2 text-white/90 mb-3">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{location?.city || "Loading..."}</span>
            {location?.country && <span className="text-white/60">• {location.country}</span>}
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/70 text-sm">{dayName}</p>
              <p className="text-white font-semibold">{dateStr}</p>
            </div>
            {hijriDate && (
              <div className="text-right">
                <p className="text-white/70 text-sm">Hijri</p>
                <p className="text-white font-semibold">
                  {hijriDate.day} {hijriDate.month.en} {hijriDate.year}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-900/70 text-sm font-medium">Next Prayer</p>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-3xl font-bold text-amber-900">{nextPrayer}</h2>
                  <span className="text-2xl font-arabic text-amber-800">{getArabicName(nextPrayer)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-amber-900/70 text-sm font-medium">Time Remaining</p>
                <p className="text-3xl font-bold text-amber-900">{countdown}</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-amber-600/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={{ duration: 1 }}
                className="h-full bg-amber-900/50 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Current Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-white/60 text-sm">Current Time</p>
          <p className="text-4xl font-bold text-white">
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </p>
        </motion.div>

        {/* Prayer Times List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            prayers.map((prayer, index) => {
              const { time, period } = formatTime12h(prayer.time);
              const isNext = prayer.name === nextPrayer;
              const isPassed = !isNext && prayers.findIndex(p => p.name === nextPrayer) > index;

              return (
                <motion.div
                  key={prayer.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative rounded-2xl p-4 transition-all ${
                    isNext
                      ? "bg-white shadow-xl"
                      : isPassed
                      ? "bg-white/5"
                      : "bg-white/10 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isNext
                            ? `bg-gradient-to-br ${prayer.gradient} text-white`
                            : isPassed
                            ? "bg-white/10 text-white/40"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {prayer.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold ${
                              isNext ? "text-gray-900" : isPassed ? "text-white/40" : "text-white"
                            }`}
                          >
                            {prayer.name}
                          </h3>
                          <span
                            className={`text-lg font-arabic ${
                              isNext ? "text-gray-600" : isPassed ? "text-white/30" : "text-white/70"
                            }`}
                          >
                            {prayer.arabicName}
                          </span>
                        </div>
                        {isNext && (
                          <p className="text-sm text-emerald-600 font-medium">Up Next</p>
                        )}
                        {isPassed && (
                          <p className="text-sm text-white/30">Completed</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          isNext ? "text-gray-900" : isPassed ? "text-white/40" : "text-white"
                        }`}
                      >
                        {time}
                      </p>
                      <p
                        className={`text-sm ${
                          isNext ? "text-gray-500" : isPassed ? "text-white/30" : "text-white/60"
                        }`}
                      >
                        {period}
                      </p>
                    </div>
                  </div>
                  {isNext && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full" />
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-4"
        >
          <p className="text-white/50 text-sm">
            Calculation Method: ISNA (Islamic Society of North America)
          </p>
        </motion.div>
      </div>

      {/* Athan Settings Modal */}
      <AthanSettingsModal
        open={showAthanSettings}
        onClose={() => setShowAthanSettings(false)}
        settings={athanSettings}
        onUpdateSettings={updateAthanSettings}
        onTogglePrayer={toggleAthanPrayer}
        onRequestPermission={requestNotificationPermission}
        isPlaying={isAthanPlaying}
        onPlayTest={() => playAthan("Test")}
        onStop={stopAthan}
      />
    </div>
  );
};

export default PrayerTimesPage;
