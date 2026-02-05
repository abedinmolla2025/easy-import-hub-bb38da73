import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Volume2, BookOpen, Heart, Footprints, HandHeart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import { useAppSettings } from "@/context/AppSettingsContext";

// Localization strings
const UI_STRINGS = {
  bn: {
    pageTitle: "নামাজ শিক্ষা",
    pageSubtitle: "ধাপে ধাপে নামাজ শিখুন",
    searchPlaceholder: "নিয়ত খুঁজুন (ফজর, বিতর, ঈদ...)",
    noResults: "কোনো নিয়ত পাওয়া যায়নি",
    tabNiyah: "নিয়ত",
    tabLearn: "শিক্ষা",
    tabSteps: "ধাপ",
    tabDuas: "দোয়া",
    step: "ধাপ",
    action: "কাজ",
    stepsIntro: "প্রতিটি রাকাতে এই ধাপগুলো অনুসরণ করুন। এই গাইড সম্পূর্ণ নামাজের চক্র কভার করে।",
    duasIntro: "নামাজে পাঠ করা প্রয়োজনীয় দোয়াগুলো। আপনার সালাত পরিপূর্ণ করতে এগুলো মুখস্ত করুন।",
  },
  en: {
    pageTitle: "Prayer Guide",
    pageSubtitle: "Learn how to pray step by step",
    searchPlaceholder: "Search Niyah (Fajr, Witr, Eid...)",
    noResults: "No Niyah found",
    tabNiyah: "Niyah",
    tabLearn: "Learn",
    tabSteps: "Steps",
    tabDuas: "Duas",
    step: "Step",
    action: "Action",
    stepsIntro: "Follow these steps in order for each rakat of your prayer. This guide covers the complete prayer cycle.",
    duasIntro: "Essential duas recited during prayer. Memorize these to perfect your Salah.",
  },
  ar: {
    pageTitle: "دليل الصلاة",
    pageSubtitle: "تعلم كيفية الصلاة خطوة بخطوة",
    searchPlaceholder: "ابحث عن النية (الفجر، الوتر، العيد...)",
    noResults: "لم يتم العثور على نية",
    tabNiyah: "النية",
    tabLearn: "تعلم",
    tabSteps: "الخطوات",
    tabDuas: "الأدعية",
    step: "خطوة",
    action: "الفعل",
    stepsIntro: "اتبع هذه الخطوات بالترتيب لكل ركعة من صلاتك. يغطي هذا الدليل دورة الصلاة الكاملة.",
    duasIntro: "الأدعية الأساسية التي تُقرأ أثناء الصلاة. احفظها لإتقان صلاتك.",
  },
};

// Niyah Data
const NIYAH_DATA = [
  {
    id: "fajr",
    name: "Fajr",
    nameBn: "ফজর",
    rakats: "2 Farz",
    rakatsBn: "২ রাকাত ফরজ",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ الْفَجْرِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Fajr Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে ফজরের দুই রাকাত ফরজ নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatil fajri fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "dhuhr",
    name: "Dhuhr",
    nameBn: "যোহর",
    rakats: "4 Farz",
    rakatsBn: "৪ রাকাত ফরজ",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ أَرْبَعَ رَكَعَاتِ صَلَاةِ الظُّهْرِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray four rakats of Dhuhr Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে যোহরের চার রাকাত ফরজ নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala arba'a raka'ati salatidh dhuhri fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "asr",
    name: "Asr",
    nameBn: "আসর",
    rakats: "4 Farz",
    rakatsBn: "৪ রাকাত ফরজ",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ أَرْبَعَ رَكَعَاتِ صَلَاةِ الْعَصْرِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray four rakats of Asr Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে আসরের চার রাকাত ফরজ নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala arba'a raka'ati salatil asri fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "maghrib",
    name: "Maghrib",
    nameBn: "মাগরিব",
    rakats: "3 Farz",
    rakatsBn: "৩ রাকাত ফরজ",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ ثَلَاثَ رَكَعَاتِ صَلَاةِ الْمَغْرِبِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray three rakats of Maghrib Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে মাগরিবের তিন রাকাত ফরজ নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala thalatha raka'ati salatil maghribi fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "isha",
    name: "Isha",
    nameBn: "ইশা",
    rakats: "4 Farz",
    rakatsBn: "৪ রাকাত ফরজ",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ أَرْبَعَ رَكَعَاتِ صَلَاةِ الْعِشَاءِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray four rakats of Isha Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে ইশার চার রাকাত ফরজ নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala arba'a raka'ati salatil isha'i fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "witr",
    name: "Witr",
    nameBn: "বিতর",
    rakats: "3 Wajib",
    rakatsBn: "৩ রাকাত ওয়াজিব",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ ثَلَاثَ رَكَعَاتِ صَلَاةِ الْوِتْرِ وَاجِبُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray three rakats of Witr Wajib prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে বিতরের তিন রাকাত ওয়াজিব নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala thalatha raka'ati salatil witri wajibullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "sunnah",
    name: "Sunnah",
    nameBn: "সুন্নত",
    rakats: "2/4 Sunnah",
    rakatsBn: "২/৪ রাকাত সুন্নত",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ السُّنَّةِ سُنَّةُ رَسُولِ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray Sunnah prayer for Allah following the Sunnah of Rasulullah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে রাসূলুল্লাহ (সাঃ) এর সুন্নত নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatis sunnati sunnatu rasulillahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "nafl",
    name: "Nafl",
    nameBn: "নফল",
    rakats: "2 Nafl",
    rakatsBn: "২ রাকাত নফল",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ النَّفْلِ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Nafl prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে দুই রাকাত নফল নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatin nafli mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "tahajjud",
    name: "Tahajjud",
    nameBn: "তাহাজ্জুদ",
    rakats: "2-12 Nafl",
    rakatsBn: "২-১২ রাকাত নফল",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ التَّهَجُّدِ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Tahajjud prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে তাহাজ্জুদের দুই রাকাত নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatit tahajjudi mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "istikhara",
    name: "Istikhara",
    nameBn: "ইস্তিখারা",
    rakats: "2 Nafl",
    rakatsBn: "২ রাকাত নফল",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ الاِسْتِخَارَةِ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Istikhara prayer for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে ইস্তিখারার দুই রাকাত নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatil istikharati mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "eid-ul-fitr",
    name: "Eid ul-Fitr",
    nameBn: "ঈদুল ফিতর",
    rakats: "2 Wajib",
    rakatsBn: "২ রাকাত ওয়াজিব",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ عِيدِ الْفِطْرِ مَعَ سِتِّ تَكْبِيرَاتٍ وَاجِبُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Eid ul-Fitr Wajib prayer with six additional takbirs for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে ছয় তাকবিরের সাথে ঈদুল ফিতরের দুই রাকাত ওয়াজিব নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salati eidil fitri ma'a sitti takbiratin wajibullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "eid-ul-adha",
    name: "Eid ul-Adha",
    nameBn: "ঈদুল আযহা",
    rakats: "2 Wajib",
    rakatsBn: "২ রাকাত ওয়াজিব",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ عِيدِ الْأَضْحَىٰ مَعَ سِتِّ تَكْبِيرَاتٍ وَاجِبُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Eid ul-Adha Wajib prayer with six additional takbirs for Allah facing the Kaaba. Allahu Akbar.",
    meaningBn: "আমি কেবলামুখী হয়ে আল্লাহর ওয়াস্তে ছয় তাকবিরের সাথে ঈদুল আযহার দুই রাকাত ওয়াজিব নামাজ আদায় করার নিয়ত করছি। আল্লাহু আকবার।",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salati eidil adha ma'a sitti takbiratin wajibullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
];

// Prayer Learning Data
const PRAYER_LEARNING = {
  whatIsPrayer: {
    title: "What is Salah (Prayer)?",
    titleBn: "সালাত (নামাজ) কী?",
    content: [
      "Salah is the second pillar of Islam and the most important act of worship after Shahada.",
      "It is a direct connection between the worshipper and Allah.",
      "Muslims pray five times a day: Fajr, Dhuhr, Asr, Maghrib, and Isha.",
      "Prayer purifies the soul and keeps believers away from evil.",
    ],
    contentBn: [
      "সালাত ইসলামের দ্বিতীয় স্তম্ভ এবং শাহাদার পর সবচেয়ে গুরুত্বপূর্ণ ইবাদত।",
      "এটি বান্দা এবং আল্লাহর মধ্যে সরাসরি সংযোগ।",
      "মুসলমানরা দিনে পাঁচ ওয়াক্ত নামাজ পড়ে: ফজর, যোহর, আসর, মাগরিব এবং ইশা।",
      "নামাজ আত্মাকে পবিত্র করে এবং মুমিনদের মন্দ কাজ থেকে দূরে রাখে।",
    ],
  },
  farz: {
    title: "Farz (Obligatory) of Prayer",
    titleBn: "নামাজের ফরজসমূহ",
    items: [
      "Takbir Tahrimah - Saying 'Allahu Akbar' to begin",
      "Qiyam - Standing position",
      "Qira'at - Reciting from the Quran",
      "Ruku - Bowing position",
      "Sujood - Prostration (twice in each rakat)",
      "Qa'dah Akhirah - Final sitting position",
    ],
    itemsBn: [
      "তাকবীরে তাহরীমা - 'আল্লাহু আকবার' বলে শুরু করা",
      "কিয়াম - দাঁড়ানো অবস্থা",
      "কিরাআত - কুরআন তেলাওয়াত",
      "রুকু - ঝুঁকে যাওয়া",
      "সিজদা - প্রতি রাকাতে দুইবার সিজদা করা",
      "কাদাহ আখিরাহ - শেষ বৈঠক",
    ],
  },
  wajib: {
    title: "Wajib (Necessary) of Prayer",
    titleBn: "নামাজের ওয়াজিবসমূহ",
    items: [
      "Reciting Surah Fatiha in every rakat",
      "Reciting a Surah after Fatiha in first two rakats",
      "Performing Ruku and Sujood in order",
      "Maintaining tranquility in each position",
      "Sitting for Tashahhud",
      "Saying Salam to end the prayer",
    ],
    itemsBn: [
      "প্রতি রাকাতে সূরা ফাতিহা পড়া",
      "প্রথম দুই রাকাতে ফাতিহার পর একটি সূরা পড়া",
      "যথাক্রমে রুকু ও সিজদা করা",
      "প্রতিটি অবস্থানে স্থিরতা বজায় রাখা",
      "তাশাহুদের জন্য বসা",
      "সালাম দিয়ে নামাজ শেষ করা",
    ],
  },
  sunnah: {
    title: "Sunnah of Prayer",
    titleBn: "নামাজের সুন্নতসমূহ",
    items: [
      "Raising hands during Takbir",
      "Placing right hand over left on chest",
      "Looking at the place of prostration",
      "Reciting Sana (opening dua)",
      "Saying 'Ameen' after Fatiha",
      "Saying Takbir when changing positions",
    ],
    itemsBn: [
      "তাকবিরের সময় হাত তোলা",
      "বুকের উপর ডান হাত বাম হাতের উপর রাখা",
      "সিজদার স্থানে দৃষ্টি রাখা",
      "সানা (শুরুর দোয়া) পড়া",
      "ফাতিহার পর 'আমীন' বলা",
      "অবস্থান পরিবর্তনের সময় তাকবির বলা",
    ],
  },
  breaks: {
    title: "What Breaks Prayer",
    titleBn: "যা নামাজ ভঙ্গ করে",
    items: [
      "Speaking intentionally",
      "Eating or drinking",
      "Laughing loudly",
      "Turning away from Qibla",
      "Leaving out any Farz act",
      "Breaking Wudu during prayer",
    ],
    itemsBn: [
      "ইচ্ছাকৃতভাবে কথা বলা",
      "খাওয়া বা পান করা",
      "উচ্চস্বরে হাসা",
      "কিবলা থেকে ফিরে যাওয়া",
      "কোনো ফরজ কাজ ছেড়ে দেওয়া",
      "নামাজের মধ্যে অজু ভেঙে যাওয়া",
    ],
  },
};

// Prayer Steps Data
const PRAYER_STEPS = [
  {
    id: 1,
    name: "Takbir Tahrimah",
    nameBn: "তাকবীরে তাহরীমা",
    icon: "🙌",
    action: "Raise both hands to ear level and say Allahu Akbar",
    actionBn: "দুই হাত কানের লতি পর্যন্ত তুলে আল্লাহু আকবার বলুন",
    recitation: "اللَّهُ أَكْبَرُ",
    recitationMeaning: "Allahu Akbar (Allah is the Greatest)",
    recitationMeaningBn: "আল্লাহু আকবার (আল্লাহ সর্বশ্রেষ্ঠ)",
    explanation: "This opening takbir marks the beginning of prayer. Raise your hands with palms facing Qibla, fingers spread naturally.",
    explanationBn: "এই প্রথম তাকবির দিয়ে নামাজ শুরু হয়। হাতের তালু কিবলামুখী করে আঙুল স্বাভাবিকভাবে ছড়িয়ে তুলুন।",
  },
  {
    id: 2,
    name: "Qiyam (Standing)",
    nameBn: "কিয়াম",
    icon: "🧍",
    action: "Place right hand over left on chest, look at the place of Sujood",
    actionBn: "বুকের উপর ডান হাত বাম হাতের উপর রাখুন, সিজদার স্থানে দৃষ্টি রাখুন",
    recitation: "Recite Sana, then Surah Fatiha, then another Surah",
    recitationMeaning: "Begin with opening supplication, then Al-Fatiha, then any Surah",
    recitationMeaningBn: "শুরুতে সানা, তারপর সূরা ফাতিহা, তারপর যেকোনো সূরা পড়ুন",
    explanation: "Stand straight and still. Focus your gaze on the spot where you will prostrate.",
    explanationBn: "সোজা ও স্থির হয়ে দাঁড়ান। যেখানে সিজদা করবেন সেদিকে দৃষ্টি রাখুন।",
  },
  {
    id: 3,
    name: "Ruku (Bowing)",
    nameBn: "রুকু",
    icon: "🙇",
    action: "Bow down with hands on knees, back straight",
    actionBn: "হাত হাঁটুতে রেখে, পিঠ সোজা রেখে ঝুঁকুন",
    recitation: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    recitationMeaning: "Subhana Rabbiyal Azeem (Glory be to my Lord, the Magnificent) - 3 times",
    recitationMeaningBn: "সুবহানা রাব্বিয়াল আযীম (মহিমান্বিত আমার রবের পবিত্রতা) - ৩ বার",
    explanation: "Bend forward until your back is parallel to the ground. Keep your head in line with your back.",
    explanationBn: "পিঠ মাটির সমান্তরাল না হওয়া পর্যন্ত সামনে ঝুঁকুন। মাথা পিঠের সাথে সমান রাখুন।",
  },
  {
    id: 4,
    name: "Qawmah (Rising)",
    nameBn: "কওমা",
    icon: "🧍",
    action: "Rise from Ruku saying Sami Allahu liman hamidah",
    actionBn: "সামিআল্লাহু লিমান হামিদাহ বলে রুকু থেকে উঠুন",
    recitation: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ - رَبَّنَا لَكَ الْحَمْدُ",
    recitationMeaning: "Sami Allahu liman hamidah, Rabbana lakal hamd (Allah hears who praises Him. Our Lord, praise be to You)",
    recitationMeaningBn: "সামিআল্লাহু লিমান হামিদাহ, রাব্বানা লাকাল হামদ (আল্লাহ তাঁর প্রশংসাকারীর প্রশংসা শোনেন। হে আমাদের রব, সকল প্রশংসা আপনার)",
    explanation: "Stand up straight with arms at your sides. Pause briefly in this position.",
    explanationBn: "হাত দু'পাশে রেখে সোজা হয়ে দাঁড়ান। এই অবস্থায় কিছুক্ষণ থামুন।",
  },
  {
    id: 5,
    name: "Sujood (Prostration)",
    nameBn: "সিজদা",
    icon: "🙏",
    action: "Prostrate with forehead, nose, palms, knees, and toes touching the ground",
    actionBn: "কপাল, নাক, হাতের তালু, হাঁটু ও পায়ের আঙুল মাটিতে রেখে সিজদা করুন",
    recitation: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    recitationMeaning: "Subhana Rabbiyal A'la (Glory be to my Lord, the Most High) - 3 times",
    recitationMeaningBn: "সুবহানা রাব্বিয়াল আ'লা (সর্বোচ্চ আমার রবের পবিত্রতা) - ৩ বার",
    explanation: "Seven parts must touch the ground: forehead with nose, both palms, both knees, and toes of both feet.",
    explanationBn: "সাতটি অঙ্গ মাটিতে স্পর্শ করতে হবে: কপাল ও নাক, দুই হাতের তালু, দুই হাঁটু, দুই পায়ের আঙুল।",
  },
  {
    id: 6,
    name: "Jalsa (Sitting)",
    nameBn: "জলসা",
    icon: "🧎",
    action: "Sit briefly between the two Sujood",
    actionBn: "দুই সিজদার মাঝে সংক্ষেপে বসুন",
    recitation: "رَبِّ اغْفِرْ لِي",
    recitationMeaning: "Rabbighfirli (My Lord, forgive me)",
    recitationMeaningBn: "রাব্বিগফিরলী (হে আমার রব, আমাকে ক্ষমা করুন)",
    explanation: "Sit on your left foot with right foot upright. Pause briefly before the second Sujood.",
    explanationBn: "বাম পায়ের উপর বসুন, ডান পা খাড়া রাখুন। দ্বিতীয় সিজদার আগে সংক্ষেপে বিরতি নিন।",
  },
  {
    id: 7,
    name: "Second Sujood",
    nameBn: "দ্বিতীয় সিজদা",
    icon: "🙏",
    action: "Perform second prostration exactly like the first",
    actionBn: "প্রথম সিজদার মতো দ্বিতীয় সিজদা করুন",
    recitation: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    recitationMeaning: "Subhana Rabbiyal A'la (Glory be to my Lord, the Most High) - 3 times",
    recitationMeaningBn: "সুবহানা রাব্বিয়াল আ'লা (সর্বোচ্চ আমার রবের পবিত্রতা) - ৩ বার",
    explanation: "This completes one rakat. Rise for the next rakat or proceed to Tashahhud if it's the final sitting.",
    explanationBn: "এতে এক রাকাত সম্পন্ন হয়। পরবর্তী রাকাতের জন্য উঠুন অথবা শেষ বৈঠক হলে তাশাহুদে যান।",
  },
  {
    id: 8,
    name: "Tashahhud",
    nameBn: "তাশাহুদ",
    icon: "☝️",
    action: "Sit and recite At-Tahiyyat with index finger raised",
    actionBn: "বসে শাহাদাত আঙুল উঁচু করে আত্তাহিয়্যাতু পড়ুন",
    recitation: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ...",
    recitationMeaning: "At-Tahiyyatu lillahi was-salawatu wat-tayyibat...",
    recitationMeaningBn: "আত্তাহিয়্যাতু লিল্লাহি ওয়াস সালাওয়াতু ওয়াত তায়্যিবাতু...",
    explanation: "In the final sitting, recite Tashahhud, Durood, and a final dua before ending the prayer.",
    explanationBn: "শেষ বৈঠকে তাশাহুদ, দুরুদ এবং শেষ দোয়া পড়ে নামাজ শেষ করুন।",
  },
  {
    id: 9,
    name: "Salam",
    nameBn: "সালাম",
    icon: "👋",
    action: "Turn head right then left saying Assalamu Alaikum wa Rahmatullah",
    actionBn: "আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ বলে প্রথমে ডানে তারপর বামে মাথা ঘোরান",
    recitation: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
    recitationMeaning: "Assalamu Alaikum wa Rahmatullah (Peace and mercy of Allah be upon you)",
    recitationMeaningBn: "আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ (আপনার উপর আল্লাহর শান্তি ও রহমত বর্ষিত হোক)",
    explanation: "This ends the prayer. Turn your head to the right shoulder first, then to the left.",
    explanationBn: "এতে নামাজ শেষ হয়। প্রথমে ডান কাঁধের দিকে, তারপর বাম কাঁধের দিকে মাথা ঘোরান।",
  },
];

// Prayer Duas Data
const PRAYER_DUAS = [
  {
    id: "sana",
    name: "Sana (Opening Dua)",
    nameBn: "সানা",
    arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَىٰ جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ",
    transliteration: "Subhanaka Allahumma wa bihamdika wa tabarakasmuka wa ta'ala jadduka wa la ilaha ghairuk",
    meaning: "Glory be to You, O Allah, and praise be to You. Blessed is Your name and exalted is Your majesty. There is no god but You.",
    meaningBn: "হে আল্লাহ! আপনার পবিত্রতা ও প্রশংসা ঘোষণা করছি। আপনার নাম বরকতময়, আপনার মর্যাদা সুউচ্চ। আপনি ছাড়া কোনো উপাস্য নেই।",
  },
  {
    id: "ruku",
    name: "Ruku Tasbih",
    nameBn: "রুকুর তাসবীহ",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    transliteration: "Subhana Rabbiyal Azeem",
    meaning: "Glory be to my Lord, the Magnificent. (Recite 3 times)",
    meaningBn: "আমার মহান রবের পবিত্রতা ঘোষণা করছি। (৩ বার পড়ুন)",
  },
  {
    id: "sujood",
    name: "Sujood Tasbih",
    nameBn: "সিজদার তাসবীহ",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    transliteration: "Subhana Rabbiyal A'la",
    meaning: "Glory be to my Lord, the Most High. (Recite 3 times)",
    meaningBn: "আমার সর্বোচ্চ রবের পবিত্রতা ঘোষণা করছি। (৩ বার পড়ুন)",
  },
  {
    id: "tashahhud",
    name: "Tashahhud (At-Tahiyyat)",
    nameBn: "তাশাহুদ",
    arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. Assalamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. Assalamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu alla ilaha illallah wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
    meaning: "All greetings, prayers, and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and messenger.",
    meaningBn: "সকল সম্মান, নামাজ ও পবিত্র কথা আল্লাহর জন্য। হে নবী! আপনার উপর শান্তি, আল্লাহর রহমত ও বরকত বর্ষিত হোক। আমাদের ও আল্লাহর নেক বান্দাদের উপর শান্তি বর্ষিত হোক। আমি সাক্ষ্য দিচ্ছি, আল্লাহ ছাড়া কোনো উপাস্য নেই এবং মুহাম্মদ (সাঃ) তাঁর বান্দা ও রাসূল।",
  },
  {
    id: "durood",
    name: "Durood Ibrahim",
    nameBn: "দুরুদ ইব্রাহীম",
    arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahima innaka Hamidum Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammadin kama barakta 'ala Ibrahima wa 'ala ali Ibrahima innaka Hamidum Majid.",
    meaning: "O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. You are indeed Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim. You are indeed Praiseworthy, Glorious.",
    meaningBn: "হে আল্লাহ! মুহাম্মদ ও তাঁর বংশধরদের উপর রহমত বর্ষণ করুন যেমন ইব্রাহীম ও তাঁর বংশধরদের উপর করেছেন। নিশ্চয়ই আপনি প্রশংসিত, মহিমান্বিত। হে আল্লাহ! মুহাম্মদ ও তাঁর বংশধরদের উপর বরকত দিন যেমন ইব্রাহীম ও তাঁর বংশধরদের উপর দিয়েছেন। নিশ্চয়ই আপনি প্রশংসিত, মহিমান্বিত।",
  },
  {
    id: "dua-masura",
    name: "Dua Masura (Final Dua)",
    nameBn: "দোয়া মাসুরা",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: "Our Lord, give us good in this world and good in the Hereafter, and save us from the punishment of the Fire.",
    meaningBn: "হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দিন, আখেরাতেও কল্যাণ দিন এবং আমাদের জাহান্নামের আগুন থেকে রক্ষা করুন।",
  },
];

interface NiyahCardProps {
  niyah: typeof NIYAH_DATA[0];
  isBengali: boolean;
}

const NiyahCard = ({ niyah, isBengali }: NiyahCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border border-emerald-700/30 p-5 mb-4"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-semibold text-emerald-100">
          {isBengali ? niyah.nameBn : niyah.name}
        </h3>
        <p className="text-sm text-emerald-300/70">
          {isBengali ? niyah.rakatsBn : niyah.rakats}
        </p>
      </div>
      <button className="p-2 rounded-full bg-emerald-800/50 text-emerald-300 hover:bg-emerald-700/50 transition">
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
    <p className="text-right text-2xl leading-loose text-amber-200/90 font-arabic mb-4">
      {niyah.arabic}
    </p>
    <p className="text-sm text-emerald-200/80 mb-2 italic">
      {niyah.transliteration}
    </p>
    <p className="text-sm text-emerald-100/90">
      {isBengali ? niyah.meaningBn : niyah.meaning}
    </p>
  </motion.div>
);

interface DuaCardProps {
  dua: typeof PRAYER_DUAS[0];
  isBengali: boolean;
}

const DuaCard = ({ dua, isBengali }: DuaCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl bg-gradient-to-br from-teal-900/40 to-teal-950/60 border border-teal-700/30 p-5 mb-4"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-semibold text-teal-100">
          {isBengali ? dua.nameBn : dua.name}
        </h3>
      </div>
      <button className="p-2 rounded-full bg-teal-800/50 text-teal-300 hover:bg-teal-700/50 transition">
        <Volume2 className="w-4 h-4" />
      </button>
    </div>
    <p className="text-right text-xl md:text-2xl leading-loose text-amber-200/90 font-arabic mb-4">
      {dua.arabic}
    </p>
    <p className="text-sm text-teal-200/80 mb-2 italic">
      {dua.transliteration}
    </p>
    <p className="text-sm text-teal-100/90">
      {isBengali ? dua.meaningBn : dua.meaning}
    </p>
  </motion.div>
);

interface StepCardProps {
  step: typeof PRAYER_STEPS[0];
  index: number;
  isBengali: boolean;
  strings: typeof UI_STRINGS.en;
}

const StepCard = ({ step, index, isBengali, strings }: StepCardProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-indigo-950/60 border border-indigo-700/30 p-5 mb-4"
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-800/50 flex items-center justify-center text-2xl">
        {step.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-indigo-700/50 text-xs text-indigo-200">
            {strings.step} {step.id}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-indigo-100">
          {isBengali ? step.nameBn : step.name}
        </h3>
        
        <p className="text-sm text-indigo-200/90 mb-3">
          <strong>{strings.action}:</strong> {isBengali ? step.actionBn : step.action}
        </p>
        
        <div className="bg-indigo-950/50 rounded-lg p-3 mb-3">
          <p className="text-amber-200/90 text-sm font-arabic text-right mb-1">
            {step.recitation}
          </p>
          <p className="text-xs text-indigo-200/70 italic">
            {isBengali ? step.recitationMeaningBn : step.recitationMeaning}
          </p>
        </div>
        
        <p className="text-xs text-indigo-300/60">
          💡 {isBengali ? step.explanationBn : step.explanation}
        </p>
      </div>
    </div>
  </motion.div>
);

interface LearningSectionProps {
  title: string;
  items: string[];
}

const LearningSection = ({ title, items }: LearningSectionProps) => (
  <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/70 border-slate-700/30 mb-4">
    <CardHeader className="pb-2">
      <CardTitle className="text-base text-slate-100">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300/90">
            <span className="text-emerald-400 mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default function PrayerGuidePage() {
  const { language } = useAppSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("niyah");

  const isBengali = language === "bn";
  const strings = UI_STRINGS[language] || UI_STRINGS.en;

  const filteredNiyah = useMemo(() => {
    if (!searchQuery.trim()) return NIYAH_DATA;
    const q = searchQuery.toLowerCase();
    return NIYAH_DATA.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.nameBn.includes(q) ||
        n.rakats.toLowerCase().includes(q) ||
        n.rakatsBn.includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f1c] via-[#0f2922] to-[#071510] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0a1f1c] to-transparent backdrop-blur-md pt-safe-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-50 mb-1">{strings.pageTitle}</h1>
          <p className="text-sm text-emerald-300/60">{strings.pageSubtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-emerald-950/50 border border-emerald-800/30 p-1 rounded-xl mb-4 grid grid-cols-4 gap-1">
            <TabsTrigger 
              value="niyah" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <Heart className="w-3 h-3 mr-1" />
              {strings.tabNiyah}
            </TabsTrigger>
            <TabsTrigger 
              value="learning" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              {strings.tabLearn}
            </TabsTrigger>
            <TabsTrigger 
              value="steps" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <Footprints className="w-3 h-3 mr-1" />
              {strings.tabSteps}
            </TabsTrigger>
            <TabsTrigger 
              value="duas" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <HandHeart className="w-3 h-3 mr-1" />
              {strings.tabDuas}
            </TabsTrigger>
          </TabsList>

          {/* Niyah Tab */}
          <TabsContent value="niyah" className="mt-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
              <Input
                placeholder={strings.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-emerald-950/50 border-emerald-800/30 text-emerald-100 placeholder:text-emerald-500/50"
              />
            </div>
            <AnimatePresence mode="popLayout">
              {filteredNiyah.map((niyah) => (
                <NiyahCard key={niyah.id} niyah={niyah} isBengali={isBengali} />
              ))}
            </AnimatePresence>
            {filteredNiyah.length === 0 && (
              <div className="text-center py-12 text-emerald-400/60">
                {strings.noResults} "{searchQuery}"
              </div>
            )}
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="mt-0">
            <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border-emerald-700/30 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-emerald-100 flex items-center gap-2">
                  🕌 {isBengali ? PRAYER_LEARNING.whatIsPrayer.titleBn : PRAYER_LEARNING.whatIsPrayer.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(isBengali ? PRAYER_LEARNING.whatIsPrayer.contentBn : PRAYER_LEARNING.whatIsPrayer.content).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-200/90">
                      <span className="text-amber-400 mt-1">✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <LearningSection 
              title={`📌 ${isBengali ? PRAYER_LEARNING.farz.titleBn : PRAYER_LEARNING.farz.title}`} 
              items={isBengali ? PRAYER_LEARNING.farz.itemsBn : PRAYER_LEARNING.farz.items} 
            />
            <LearningSection 
              title={`📋 ${isBengali ? PRAYER_LEARNING.wajib.titleBn : PRAYER_LEARNING.wajib.title}`} 
              items={isBengali ? PRAYER_LEARNING.wajib.itemsBn : PRAYER_LEARNING.wajib.items} 
            />
            <LearningSection 
              title={`✨ ${isBengali ? PRAYER_LEARNING.sunnah.titleBn : PRAYER_LEARNING.sunnah.title}`} 
              items={isBengali ? PRAYER_LEARNING.sunnah.itemsBn : PRAYER_LEARNING.sunnah.items} 
            />
            <LearningSection 
              title={`⚠️ ${isBengali ? PRAYER_LEARNING.breaks.titleBn : PRAYER_LEARNING.breaks.title}`} 
              items={isBengali ? PRAYER_LEARNING.breaks.itemsBn : PRAYER_LEARNING.breaks.items} 
            />
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps" className="mt-0">
            <div className="mb-4 p-4 rounded-xl bg-indigo-900/30 border border-indigo-700/30">
              <p className="text-sm text-indigo-200/80">
                {strings.stepsIntro}
              </p>
            </div>
            {PRAYER_STEPS.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} isBengali={isBengali} strings={strings} />
            ))}
          </TabsContent>

          {/* Duas Tab */}
          <TabsContent value="duas" className="mt-0">
            <div className="mb-4 p-4 rounded-xl bg-teal-900/30 border border-teal-700/30">
              <p className="text-sm text-teal-200/80">
                {strings.duasIntro}
              </p>
            </div>
            {PRAYER_DUAS.map((dua) => (
              <DuaCard key={dua.id} dua={dua} isBengali={isBengali} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
