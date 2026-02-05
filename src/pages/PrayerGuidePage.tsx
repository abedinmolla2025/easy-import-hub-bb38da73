import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Volume2, BookOpen, Heart, Footprints, HandHeart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";

// Niyah Data
const NIYAH_DATA = [
  {
    id: "fajr",
    name: "Fajr",
    nameBn: "ফজর",
    rakats: "2 Farz",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ الْفَجْرِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Fajr Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatil fajri fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "dhuhr",
    name: "Dhuhr",
    nameBn: "যোহর",
    rakats: "4 Farz",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ أَرْبَعَ رَكَعَاتِ صَلَاةِ الظُّهْرِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray four rakats of Dhuhr Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala arba'a raka'ati salatidh dhuhri fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "asr",
    name: "Asr",
    nameBn: "আসর",
    rakats: "4 Farz",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ أَرْبَعَ رَكَعَاتِ صَلَاةِ الْعَصْرِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray four rakats of Asr Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala arba'a raka'ati salatil asri fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "maghrib",
    name: "Maghrib",
    nameBn: "মাগরিব",
    rakats: "3 Farz",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ ثَلَاثَ رَكَعَاتِ صَلَاةِ الْمَغْرِبِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray three rakats of Maghrib Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala thalatha raka'ati salatil maghribi fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "isha",
    name: "Isha",
    nameBn: "ইশা",
    rakats: "4 Farz",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ أَرْبَعَ رَكَعَاتِ صَلَاةِ الْعِشَاءِ فَرْضُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray four rakats of Isha Farz prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala arba'a raka'ati salatil isha'i fardullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "witr",
    name: "Witr",
    nameBn: "বিতর",
    rakats: "3 Wajib",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ ثَلَاثَ رَكَعَاتِ صَلَاةِ الْوِتْرِ وَاجِبُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray three rakats of Witr Wajib prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala thalatha raka'ati salatil witri wajibullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "sunnah",
    name: "Sunnah",
    nameBn: "সুন্নত",
    rakats: "2/4 Sunnah",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ السُّنَّةِ سُنَّةُ رَسُولِ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray Sunnah prayer for Allah following the Sunnah of Rasulullah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatis sunnati sunnatu rasulillahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "nafl",
    name: "Nafl",
    nameBn: "নফল",
    rakats: "2 Nafl",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ النَّفْلِ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Nafl prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatin nafli mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "tahajjud",
    name: "Tahajjud",
    nameBn: "তাহাজ্জুদ",
    rakats: "2-12 Nafl",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ التَّهَجُّدِ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Tahajjud prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatit tahajjudi mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "istikhara",
    name: "Istikhara",
    nameBn: "ইস্তিখারা",
    rakats: "2 Nafl",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ الاِسْتِخَارَةِ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Istikhara prayer for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salatil istikharati mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "eid-ul-fitr",
    name: "Eid ul-Fitr",
    nameBn: "ঈদুল ফিতর",
    rakats: "2 Wajib",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ عِيدِ الْفِطْرِ مَعَ سِتِّ تَكْبِيرَاتٍ وَاجِبُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Eid ul-Fitr Wajib prayer with six additional takbirs for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salati eidil fitri ma'a sitti takbiratin wajibullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
  {
    id: "eid-ul-adha",
    name: "Eid ul-Adha",
    nameBn: "ঈদুল আযহা",
    rakats: "2 Wajib",
    arabic: "نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَىٰ رَكْعَتَيْ صَلَاةِ عِيدِ الْأَضْحَىٰ مَعَ سِتِّ تَكْبِيرَاتٍ وَاجِبُ اللَّهِ تَعَالَىٰ مُتَوَجِّهًا إِلَىٰ جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ",
    meaning: "I intend to pray two rakats of Eid ul-Adha Wajib prayer with six additional takbirs for Allah facing the Kaaba. Allahu Akbar.",
    transliteration: "Nawaitu an usalliya lillahi ta'ala rak'atay salati eidil adha ma'a sitti takbiratin wajibullahi ta'ala mutawajjihan ila jihatil ka'batish sharifati Allahu Akbar",
  },
];

// Prayer Learning Data
const PRAYER_LEARNING = {
  whatIsPrayer: {
    title: "What is Salah (Prayer)?",
    content: [
      "Salah is the second pillar of Islam and the most important act of worship after Shahada.",
      "It is a direct connection between the worshipper and Allah.",
      "Muslims pray five times a day: Fajr, Dhuhr, Asr, Maghrib, and Isha.",
      "Prayer purifies the soul and keeps believers away from evil.",
    ],
  },
  farz: {
    title: "Farz (Obligatory) of Prayer",
    items: [
      "Takbir Tahrimah - Saying 'Allahu Akbar' to begin",
      "Qiyam - Standing position",
      "Qira'at - Reciting from the Quran",
      "Ruku - Bowing position",
      "Sujood - Prostration (twice in each rakat)",
      "Qa'dah Akhirah - Final sitting position",
    ],
  },
  wajib: {
    title: "Wajib (Necessary) of Prayer",
    items: [
      "Reciting Surah Fatiha in every rakat",
      "Reciting a Surah after Fatiha in first two rakats",
      "Performing Ruku and Sujood in order",
      "Maintaining tranquility in each position",
      "Sitting for Tashahhud",
      "Saying Salam to end the prayer",
    ],
  },
  sunnah: {
    title: "Sunnah of Prayer",
    items: [
      "Raising hands during Takbir",
      "Placing right hand over left on chest",
      "Looking at the place of prostration",
      "Reciting Sana (opening dua)",
      "Saying 'Ameen' after Fatiha",
      "Saying Takbir when changing positions",
    ],
  },
  breaks: {
    title: "What Breaks Prayer",
    items: [
      "Speaking intentionally",
      "Eating or drinking",
      "Laughing loudly",
      "Turning away from Qibla",
      "Leaving out any Farz act",
      "Breaking Wudu during prayer",
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
    recitation: "اللَّهُ أَكْبَرُ",
    recitationMeaning: "Allahu Akbar (Allah is the Greatest)",
    explanation: "This opening takbir marks the beginning of prayer. Raise your hands with palms facing Qibla, fingers spread naturally.",
  },
  {
    id: 2,
    name: "Qiyam (Standing)",
    nameBn: "কিয়াম",
    icon: "🧍",
    action: "Place right hand over left on chest, look at the place of Sujood",
    recitation: "Recite Sana, then Surah Fatiha, then another Surah",
    recitationMeaning: "Begin with opening supplication, then Al-Fatiha, then any Surah",
    explanation: "Stand straight and still. Focus your gaze on the spot where you will prostrate.",
  },
  {
    id: 3,
    name: "Ruku (Bowing)",
    nameBn: "রুকু",
    icon: "🙇",
    action: "Bow down with hands on knees, back straight",
    recitation: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    recitationMeaning: "Subhana Rabbiyal Azeem (Glory be to my Lord, the Magnificent) - 3 times",
    explanation: "Bend forward until your back is parallel to the ground. Keep your head in line with your back.",
  },
  {
    id: 4,
    name: "Qawmah (Rising)",
    nameBn: "কওমা",
    icon: "🧍",
    action: "Rise from Ruku saying Sami Allahu liman hamidah",
    recitation: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ - رَبَّنَا لَكَ الْحَمْدُ",
    recitationMeaning: "Sami Allahu liman hamidah, Rabbana lakal hamd (Allah hears who praises Him. Our Lord, praise be to You)",
    explanation: "Stand up straight with arms at your sides. Pause briefly in this position.",
  },
  {
    id: 5,
    name: "Sujood (Prostration)",
    nameBn: "সিজদা",
    icon: "🙏",
    action: "Prostrate with forehead, nose, palms, knees, and toes touching the ground",
    recitation: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    recitationMeaning: "Subhana Rabbiyal A'la (Glory be to my Lord, the Most High) - 3 times",
    explanation: "Seven parts must touch the ground: forehead with nose, both palms, both knees, and toes of both feet.",
  },
  {
    id: 6,
    name: "Jalsa (Sitting)",
    nameBn: "জলসা",
    icon: "🧎",
    action: "Sit briefly between the two Sujood",
    recitation: "رَبِّ اغْفِرْ لِي",
    recitationMeaning: "Rabbighfirli (My Lord, forgive me)",
    explanation: "Sit on your left foot with right foot upright. Pause briefly before the second Sujood.",
  },
  {
    id: 7,
    name: "Second Sujood",
    nameBn: "দ্বিতীয় সিজদা",
    icon: "🙏",
    action: "Perform second prostration exactly like the first",
    recitation: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    recitationMeaning: "Subhana Rabbiyal A'la (Glory be to my Lord, the Most High) - 3 times",
    explanation: "This completes one rakat. Rise for the next rakat or proceed to Tashahhud if it's the final sitting.",
  },
  {
    id: 8,
    name: "Tashahhud",
    nameBn: "তাশাহুদ",
    icon: "☝️",
    action: "Sit and recite At-Tahiyyat with index finger raised",
    recitation: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ...",
    recitationMeaning: "At-Tahiyyatu lillahi was-salawatu wat-tayyibat...",
    explanation: "In the final sitting, recite Tashahhud, Durood, and a final dua before ending the prayer.",
  },
  {
    id: 9,
    name: "Salam",
    nameBn: "সালাম",
    icon: "👋",
    action: "Turn head right then left saying Assalamu Alaikum wa Rahmatullah",
    recitation: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
    recitationMeaning: "Assalamu Alaikum wa Rahmatullah (Peace and mercy of Allah be upon you)",
    explanation: "This ends the prayer. Turn your head to the right shoulder first, then to the left.",
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
  },
  {
    id: "ruku",
    name: "Ruku Tasbih",
    nameBn: "রুকুর তাসবীহ",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    transliteration: "Subhana Rabbiyal Azeem",
    meaning: "Glory be to my Lord, the Magnificent. (Recite 3 times)",
  },
  {
    id: "sujood",
    name: "Sujood Tasbih",
    nameBn: "সিজদার তাসবীহ",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَىٰ",
    transliteration: "Subhana Rabbiyal A'la",
    meaning: "Glory be to my Lord, the Most High. (Recite 3 times)",
  },
  {
    id: "tashahhud",
    name: "Tashahhud (At-Tahiyyat)",
    nameBn: "তাশাহুদ",
    arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. Assalamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. Assalamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu alla ilaha illallah wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
    meaning: "All greetings, prayers, and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and messenger.",
  },
  {
    id: "durood",
    name: "Durood Ibrahim",
    nameBn: "দুরুদ ইব্রাহীম",
    arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahima innaka Hamidum Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammadin kama barakta 'ala Ibrahima wa 'ala ali Ibrahima innaka Hamidum Majid.",
    meaning: "O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. You are indeed Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim. You are indeed Praiseworthy, Glorious.",
  },
  {
    id: "dua-masura",
    name: "Dua Masura (Final Dua)",
    nameBn: "দোয়া মাসুরা",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    meaning: "Our Lord, give us good in this world and good in the Hereafter, and save us from the punishment of the Fire.",
  },
];

const NiyahCard = ({ niyah }: { niyah: typeof NIYAH_DATA[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border border-emerald-700/30 p-5 mb-4"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-semibold text-emerald-100">{niyah.name}</h3>
        <p className="text-sm text-emerald-300/70">{niyah.nameBn} • {niyah.rakats}</p>
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
      {niyah.meaning}
    </p>
  </motion.div>
);

const DuaCard = ({ dua }: { dua: typeof PRAYER_DUAS[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl bg-gradient-to-br from-teal-900/40 to-teal-950/60 border border-teal-700/30 p-5 mb-4"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-semibold text-teal-100">{dua.name}</h3>
        <p className="text-sm text-teal-300/70">{dua.nameBn}</p>
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
      {dua.meaning}
    </p>
  </motion.div>
);

const StepCard = ({ step, index }: { step: typeof PRAYER_STEPS[0]; index: number }) => (
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
          <span className="px-2 py-0.5 rounded-full bg-indigo-700/50 text-xs text-indigo-200">Step {step.id}</span>
        </div>
        <h3 className="text-lg font-semibold text-indigo-100">{step.name}</h3>
        <p className="text-sm text-indigo-300/70 mb-2">{step.nameBn}</p>
        
        <p className="text-sm text-indigo-200/90 mb-3">
          <strong>Action:</strong> {step.action}
        </p>
        
        <div className="bg-indigo-950/50 rounded-lg p-3 mb-3">
          <p className="text-amber-200/90 text-sm font-arabic text-right mb-1">
            {step.recitation}
          </p>
          <p className="text-xs text-indigo-200/70 italic">
            {step.recitationMeaning}
          </p>
        </div>
        
        <p className="text-xs text-indigo-300/60">
          💡 {step.explanation}
        </p>
      </div>
    </div>
  </motion.div>
);

const LearningSection = ({ title, items }: { title: string; items: string[] }) => (
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("niyah");

  const filteredNiyah = useMemo(() => {
    if (!searchQuery.trim()) return NIYAH_DATA;
    const q = searchQuery.toLowerCase();
    return NIYAH_DATA.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.nameBn.includes(q) ||
        n.rakats.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1f1c] via-[#0f2922] to-[#071510] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0a1f1c] to-transparent backdrop-blur-md pt-safe-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-50 mb-1">Prayer Guide</h1>
          <p className="text-sm text-emerald-300/60">Learn how to pray step by step</p>
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
              Niyah
            </TabsTrigger>
            <TabsTrigger 
              value="learning" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Learn
            </TabsTrigger>
            <TabsTrigger 
              value="steps" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <Footprints className="w-3 h-3 mr-1" />
              Steps
            </TabsTrigger>
            <TabsTrigger 
              value="duas" 
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-emerald-300/70 rounded-lg text-xs py-2"
            >
              <HandHeart className="w-3 h-3 mr-1" />
              Duas
            </TabsTrigger>
          </TabsList>

          {/* Niyah Tab */}
          <TabsContent value="niyah" className="mt-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/50" />
              <Input
                placeholder="Search Niyah (Fajr, Witr, Eid...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-emerald-950/50 border-emerald-800/30 text-emerald-100 placeholder:text-emerald-500/50"
              />
            </div>
            <AnimatePresence mode="popLayout">
              {filteredNiyah.map((niyah) => (
                <NiyahCard key={niyah.id} niyah={niyah} />
              ))}
            </AnimatePresence>
            {filteredNiyah.length === 0 && (
              <div className="text-center py-12 text-emerald-400/60">
                No Niyah found for "{searchQuery}"
              </div>
            )}
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="mt-0">
            <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border-emerald-700/30 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-emerald-100 flex items-center gap-2">
                  🕌 {PRAYER_LEARNING.whatIsPrayer.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {PRAYER_LEARNING.whatIsPrayer.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-200/90">
                      <span className="text-amber-400 mt-1">✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <LearningSection title={`📌 ${PRAYER_LEARNING.farz.title}`} items={PRAYER_LEARNING.farz.items} />
            <LearningSection title={`📋 ${PRAYER_LEARNING.wajib.title}`} items={PRAYER_LEARNING.wajib.items} />
            <LearningSection title={`✨ ${PRAYER_LEARNING.sunnah.title}`} items={PRAYER_LEARNING.sunnah.items} />
            <LearningSection title={`⚠️ ${PRAYER_LEARNING.breaks.title}`} items={PRAYER_LEARNING.breaks.items} />
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps" className="mt-0">
            <div className="mb-4 p-4 rounded-xl bg-indigo-900/30 border border-indigo-700/30">
              <p className="text-sm text-indigo-200/80">
                Follow these steps in order for each rakat of your prayer. This guide covers the complete prayer cycle.
              </p>
            </div>
            {PRAYER_STEPS.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </TabsContent>

          {/* Duas Tab */}
          <TabsContent value="duas" className="mt-0">
            <div className="mb-4 p-4 rounded-xl bg-teal-900/30 border border-teal-700/30">
              <p className="text-sm text-teal-200/80">
                Essential duas recited during prayer. Memorize these to perfect your Salah.
              </p>
            </div>
            {PRAYER_DUAS.map((dua) => (
              <DuaCard key={dua.id} dua={dua} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
