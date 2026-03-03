import { useEffect, useState } from "react";
import { ArrowLeft, Search, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import BottomNavigation from "@/components/BottomNavigation";

// ── Types ────────────────────────────────────────────────────
type LangKey = "bn" | "en" | "ur";

interface Hadith {
  id: number;
  number: string;
  arabic: string;
  translations: Record<LangKey, string>;
  narrator: Record<LangKey, string>;
  chapter: Record<LangKey, string>;
}

// ── Chapter list ─────────────────────────────────────────────
const chapters: { id: number; name: Record<LangKey, string> }[] = [
  { id: 1, name: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 2, name: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 3, name: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" } },
  { id: 4, name: { bn: "অযু", en: "Ablution", ur: "وضو" } },
  { id: 5, name: { bn: "গোসল", en: "Bathing", ur: "غسل" } },
  { id: 6, name: { bn: "হায়েয", en: "Menstrual Periods", ur: "حیض" } },
  { id: 7, name: { bn: "তায়াম্মুম", en: "Tayammum", ur: "تیمم" } },
  { id: 8, name: { bn: "সালাত", en: "Prayer", ur: "نماز" } },
  { id: 9, name: { bn: "সালাতের সময়", en: "Prayer Times", ur: "نماز کے اوقات" } },
  { id: 10, name: { bn: "আযান", en: "Call to Prayer", ur: "اذان" } },
];

// ── Hadiths (Arabic always present, translations per language) ──
const hadiths: Hadith[] = [
  // Ch 1 – Revelation
  { id: 1, number: "1", arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى", translations: { bn: "কর্মের ফলাফল নিয়তের উপর নির্ভরশীল। প্রত্যেক ব্যক্তি তাই পাবে যা সে নিয়ত করে।", en: "Actions are judged by intentions. Everyone will get what they intended.", ur: "اعمال کا دارومدار نیتوں پر ہے۔ ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔" }, narrator: { bn: "উমার ইবনুল খাত্তাব (রাঃ)", en: "Umar ibn Al-Khattab (RA)", ur: "عمر بن الخطاب (رضی اللہ عنہ)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 2, number: "2", arabic: "أَوَّلُ مَا بُدِئَ بِهِ رَسُولُ اللَّهِ صلى الله عليه وسلم مِنَ الْوَحْيِ الرُّؤْيَا الصَّالِحَةُ", translations: { bn: "রাসূলুল্লাহ (সাঃ) এর কাছে ওহীর সূচনা হয়েছিল সত্য স্বপ্নের মাধ্যমে।", en: "The first form of revelation to the Messenger of Allah was true dreams.", ur: "رسول اللہ ﷺ پر وحی کی ابتدا سچے خوابوں سے ہوئی۔" }, narrator: { bn: "আয়েশা (রাঃ)", en: "Aisha (RA)", ur: "عائشہ (رضی اللہ عنہا)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 3, number: "3", arabic: "كَانَ يَخْلُو بِغَارِ حِرَاءٍ فَيَتَحَنَّثُ فِيهِ اللَّيَالِيَ ذَوَاتِ الْعَدَدِ", translations: { bn: "তিনি হেরা গুহায় একাকী থাকতেন এবং সেখানে কয়েক রাত ইবাদতে মগ্ন থাকতেন।", en: "He used to seclude himself in the cave of Hira and worship there for many nights.", ur: "آپ ﷺ غارِ حرا میں تنہائی اختیار فرماتے اور کئی راتیں عبادت میں گزارتے۔" }, narrator: { bn: "আয়েশা (রাঃ)", en: "Aisha (RA)", ur: "عائشہ (رضی اللہ عنہا)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 4, number: "4", arabic: "فَجَاءَهُ الْمَلَكُ فَقَالَ اقْرَأْ قَالَ مَا أَنَا بِقَارِئٍ", translations: { bn: "ফেরেশতা এসে বললেন, 'পড়ুন।' তিনি বললেন, 'আমি পড়তে জানি না।'", en: "The angel came to him and said, 'Read!' He said, 'I cannot read.'", ur: "فرشتے نے آ کر کہا، 'پڑھو۔' آپ ﷺ نے فرمایا، 'میں پڑھا ہوا نہیں ہوں۔'" }, narrator: { bn: "আয়েশা (রাঃ)", en: "Aisha (RA)", ur: "عائشہ (رضی اللہ عنہا)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 5, number: "5", arabic: "فَرَجَعَ بِهَا رَسُولُ اللَّهِ صلى الله عليه وسلم يَرْجُفُ فُؤَادُهُ", translations: { bn: "রাসূলুল্লাহ (সাঃ) কম্পিত হৃদয়ে ফিরে এলেন।", en: "The Messenger of Allah returned with his heart trembling.", ur: "رسول اللہ ﷺ کانپتے ہوئے دل کے ساتھ واپس تشریف لائے۔" }, narrator: { bn: "আয়েশা (রাঃ)", en: "Aisha (RA)", ur: "عائشہ (رضی اللہ عنہا)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 6, number: "6", arabic: "زَمِّلُونِي زَمِّلُونِي فَزَمَّلُوهُ حَتَّى ذَهَبَ عَنْهُ الرَّوْعُ", translations: { bn: "'আমাকে কম্বল দিয়ে ঢেকে দাও, ঢেকে দাও।' তারা তাঁকে ঢেকে দিলেন যতক্ষণ না ভয় দূর হলো।", en: "'Cover me! Cover me!' They covered him until the fear left him.", ur: "'مجھے چادر اوڑھا دو، چادر اوڑھا دو!' انہوں نے آپ ﷺ کو اوڑھا دیا یہاں تک کہ خوف دور ہو گیا۔" }, narrator: { bn: "আয়েশা (রাঃ)", en: "Aisha (RA)", ur: "عائشہ (رضی اللہ عنہا)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },
  { id: 7, number: "7", arabic: "كَلاَّ وَاللَّهِ مَا يُخْزِيكَ اللَّهُ أَبَدًا", translations: { bn: "কখনোই না! আল্লাহর কসম, আল্লাহ কখনো আপনাকে অপমানিত করবেন না।", en: "Never! By Allah, Allah will never disgrace you.", ur: "ہرگز نہیں! اللہ کی قسم، اللہ آپ کو کبھی رسوا نہیں کرے گا۔" }, narrator: { bn: "খাদিজা (রাঃ)", en: "Khadijah (RA)", ur: "خدیجہ (رضی اللہ عنہا)" }, chapter: { bn: "ওহীর সূচনা", en: "Revelation", ur: "آغازِ وحی" } },

  // Ch 2 – Belief
  { id: 8, number: "8", arabic: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ", translations: { bn: "ইসলাম পাঁচটি স্তম্ভের উপর প্রতিষ্ঠিত।", en: "Islam is built upon five pillars.", ur: "اسلام پانچ ستونوں پر قائم ہے۔" }, narrator: { bn: "ইবনে উমার (রাঃ)", en: "Ibn Umar (RA)", ur: "ابن عمر (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 9, number: "9", arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ", translations: { bn: "মুসলিম সেই ব্যক্তি যার জিহ্বা ও হাত থেকে অন্য মুসলিমরা নিরাপদ থাকে।", en: "A Muslim is the one from whose tongue and hands other Muslims are safe.", ur: "مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے مسلمان محفوظ رہیں۔" }, narrator: { bn: "আব্দুল্লাহ ইবনে আমর (রাঃ)", en: "Abdullah ibn Amr (RA)", ur: "عبداللہ بن عمرو (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 10, number: "10", arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", translations: { bn: "তোমাদের কেউ প্রকৃত মুমিন হতে পারবে না যতক্ষণ না সে তার ভাইয়ের জন্য তা পছন্দ করে যা নিজের জন্য পছন্দ করে।", en: "None of you truly believes until he loves for his brother what he loves for himself.", ur: "تم میں سے کوئی اس وقت تک مومن نہیں جب تک اپنے بھائی کے لیے وہ پسند نہ کرے جو اپنے لیے پسند کرتا ہے۔" }, narrator: { bn: "আনাস ইবনে মালিক (রাঃ)", en: "Anas ibn Malik (RA)", ur: "انس بن مالک (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 11, number: "11", arabic: "الْحَيَاءُ مِنَ الإِيمَانِ", translations: { bn: "লজ্জাশীলতা ঈমানের অংশ।", en: "Modesty is part of faith.", ur: "حیا ایمان کا حصہ ہے۔" }, narrator: { bn: "আবু হুরায়রা (রাঃ)", en: "Abu Hurairah (RA)", ur: "ابو ہریرہ (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 12, number: "12", arabic: "الدِّينُ النَّصِيحَةُ", translations: { bn: "দ্বীন হলো নসীহত (উপদেশ)।", en: "Religion is sincere advice.", ur: "دین خیرخواہی کا نام ہے۔" }, narrator: { bn: "তামীম আদ-দারী (রাঃ)", en: "Tamim ad-Dari (RA)", ur: "تمیم الداری (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 13, number: "13", arabic: "آيَةُ الْمُنَافِقِ ثَلاَثٌ إِذَا حَدَّثَ كَذَبَ وَإِذَا وَعَدَ أَخْلَفَ وَإِذَا اؤْتُمِنَ خَانَ", translations: { bn: "মুনাফিকের তিনটি লক্ষণ: যখন কথা বলে মিথ্যা বলে, প্রতিশ্রুতি দিলে ভঙ্গ করে এবং আমানত রাখলে খেয়ানত করে।", en: "The signs of a hypocrite are three: when he speaks he lies, when he promises he breaks it, and when entrusted he betrays.", ur: "منافق کی تین نشانیاں ہیں: جب بات کرے تو جھوٹ بولے، وعدہ کرے تو توڑے، اور امانت رکھی جائے تو خیانت کرے۔" }, narrator: { bn: "আবু হুরায়রা (রাঃ)", en: "Abu Hurairah (RA)", ur: "ابو ہریرہ (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },
  { id: 14, number: "14", arabic: "أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا", translations: { bn: "মুমিনদের মধ্যে সবচেয়ে পূর্ণ ঈমানের অধিকারী সে যার চরিত্র সবচেয়ে সুন্দর।", en: "The most complete believer in faith is the one with the best character.", ur: "ایمان میں سب سے کامل وہ ہے جس کے اخلاق سب سے اچھے ہوں۔" }, narrator: { bn: "আবু হুরায়রা (রাঃ)", en: "Abu Hurairah (RA)", ur: "ابو ہریرہ (رضی اللہ عنہ)" }, chapter: { bn: "ঈমান", en: "Belief", ur: "ایمان" } },

  // Ch 3 – Knowledge
  { id: 15, number: "15", arabic: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ", translations: { bn: "আল্লাহ যার কল্যাণ চান তাকে দ্বীনের জ্ঞান দান করেন।", en: "When Allah wishes good for someone, He bestows upon him understanding of the religion.", ur: "اللہ جس کی بھلائی چاہتا ہے اسے دین کی سمجھ عطا فرماتا ہے۔" }, narrator: { bn: "মুআবিয়া (রাঃ)", en: "Muawiyah (RA)", ur: "معاویہ (رضی اللہ عنہ)" }, chapter: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" } },
  { id: 16, number: "16", arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", translations: { bn: "তোমাদের মধ্যে সর্বোত্তম সেই ব্যক্তি যে কুরআন শেখে এবং অন্যদের শেখায়।", en: "The best of you is the one who learns the Quran and teaches it.", ur: "تم میں سے بہترین وہ ہے جو قرآن سیکھے اور سکھائے۔" }, narrator: { bn: "উসমান ইবনে আফফান (রাঃ)", en: "Uthman ibn Affan (RA)", ur: "عثمان بن عفان (رضی اللہ عنہ)" }, chapter: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" } },
  { id: 17, number: "17", arabic: "بَلِّغُوا عَنِّي وَلَوْ آيَةً", translations: { bn: "আমার পক্ষ থেকে একটি আয়াত হলেও পৌঁছে দাও।", en: "Convey from me even if it is one verse.", ur: "میری طرف سے پہنچا دو چاہے ایک آیت ہی ہو۔" }, narrator: { bn: "আব্দুল্লাহ ইবনে আমর (রাঃ)", en: "Abdullah ibn Amr (RA)", ur: "عبداللہ بن عمرو (رضی اللہ عنہ)" }, chapter: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" } },
  { id: 18, number: "18", arabic: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ", translations: { bn: "জ্ঞান অর্জন করা প্রত্যেক মুসলিমের উপর ফরজ।", en: "Seeking knowledge is an obligation upon every Muslim.", ur: "علم حاصل کرنا ہر مسلمان پر فرض ہے۔" }, narrator: { bn: "আনাস ইবনে মালিক (রাঃ)", en: "Anas ibn Malik (RA)", ur: "انس بن مالک (رضی اللہ عنہ)" }, chapter: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" } },
  { id: 19, number: "19", arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ", translations: { bn: "যে ব্যক্তি জ্ঞান অন্বেষণে পথ চলে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।", en: "Whoever travels a path seeking knowledge, Allah will make easy for him a path to Paradise.", ur: "جو شخص علم کی تلاش میں راستہ چلے، اللہ اس کے لیے جنت کا راستہ آسان فرما دیتا ہے۔" }, narrator: { bn: "আবু হুরায়রা (রাঃ)", en: "Abu Hurairah (RA)", ur: "ابو ہریرہ (رضی اللہ عنہ)" }, chapter: { bn: "ইলম (জ্ঞান)", en: "Knowledge", ur: "علم" } },

  // Ch 4 – Ablution
  { id: 22, number: "22", arabic: "لاَ تُقْبَلُ صَلاَةٌ بِغَيْرِ طُهُورٍ", translations: { bn: "পবিত্রতা ছাড়া নামাজ কবুল হয় না।", en: "No prayer is accepted without purification.", ur: "پاکیزگی کے بغیر نماز قبول نہیں ہوتی۔" }, narrator: { bn: "ইবনে উমার (রাঃ)", en: "Ibn Umar (RA)", ur: "ابن عمر (رضی اللہ عنہ)" }, chapter: { bn: "অযু", en: "Ablution", ur: "وضو" } },
  { id: 23, number: "23", arabic: "الطُّهُورُ شَطْرُ الإِيمَانِ", translations: { bn: "পবিত্রতা ঈমানের অর্ধেক।", en: "Purification is half of faith.", ur: "پاکیزگی آدھا ایمان ہے۔" }, narrator: { bn: "আবু মালিক আশআরী (রাঃ)", en: "Abu Malik Al-Ashari (RA)", ur: "ابو مالک اشعری (رضی اللہ عنہ)" }, chapter: { bn: "অযু", en: "Ablution", ur: "وضو" } },
  { id: 24, number: "24", arabic: "مِفْتَاحُ الصَّلاَةِ الطُّهُورُ", translations: { bn: "নামাজের চাবি হলো পবিত্রতা।", en: "The key to prayer is purification.", ur: "نماز کی کنجی پاکیزگی ہے۔" }, narrator: { bn: "আলী (রাঃ)", en: "Ali (RA)", ur: "علی (رضی اللہ عنہ)" }, chapter: { bn: "অযু", en: "Ablution", ur: "وضو" } },

  // Ch 5 – Bathing
  { id: 29, number: "29", arabic: "إِذَا الْتَقَى الْخِتَانَانِ فَقَدْ وَجَبَ الْغُسْلُ", translations: { bn: "যখন দুই খাতনার স্থান মিলিত হয় তখন গোসল ফরজ হয়ে যায়।", en: "When the two circumcised parts meet, bathing becomes obligatory.", ur: "جب دونوں ختنے کی جگہ ملیں تو غسل واجب ہو جاتا ہے۔" }, narrator: { bn: "আয়েশা (রাঃ)", en: "Aisha (RA)", ur: "عائشہ (رضی اللہ عنہا)" }, chapter: { bn: "গোসল", en: "Bathing", ur: "غسل" } },
  { id: 30, number: "30", arabic: "غُسْلُ يَوْمِ الْجُمُعَةِ وَاجِبٌ عَلَى كُلِّ مُحْتَلِمٍ", translations: { bn: "জুমার দিনের গোসল প্রত্যেক প্রাপ্তবয়স্কের উপর ওয়াজিব।", en: "Friday bath is obligatory for every adult.", ur: "جمعہ کے دن غسل ہر بالغ پر واجب ہے۔" }, narrator: { bn: "আবু সাঈদ খুদরী (রাঃ)", en: "Abu Said Al-Khudri (RA)", ur: "ابو سعید خدری (رضی اللہ عنہ)" }, chapter: { bn: "গোসল", en: "Bathing", ur: "غسل" } },

  // Ch 8 – Prayer
  { id: 37, number: "37", arabic: "جُعِلَتْ لِي الأَرْضُ مَسْجِدًا وَطَهُورًا", translations: { bn: "পৃথিবীকে আমার জন্য মসজিদ ও পবিত্রতার মাধ্যম করা হয়েছে।", en: "The earth has been made a place of prayer and purification for me.", ur: "میرے لیے زمین کو مسجد اور پاکیزگی کا ذریعہ بنایا گیا ہے۔" }, narrator: { bn: "জাবির (রাঃ)", en: "Jabir (RA)", ur: "جابر (رضی اللہ عنہ)" }, chapter: { bn: "সালাত", en: "Prayer", ur: "نماز" } },
  { id: 38, number: "38", arabic: "الصَّلاَةُ عِمَادُ الدِّينِ", translations: { bn: "নামাজ দ্বীনের স্তম্ভ।", en: "Prayer is the pillar of religion.", ur: "نماز دین کا ستون ہے۔" }, narrator: { bn: "উমার (রাঃ)", en: "Umar (RA)", ur: "عمر (رضی اللہ عنہ)" }, chapter: { bn: "সালাত", en: "Prayer", ur: "نماز" } },

  // Ch 10 – Call to Prayer
  { id: 50, number: "50", arabic: "إِذَا سَمِعْتُمُ الْمُؤَذِّنَ فَقُولُوا مِثْلَ مَا يَقُولُ", translations: { bn: "যখন তোমরা মুয়াজ্জিনের আযান শোন তখন সে যা বলে তাই বলো।", en: "When you hear the muezzin, repeat what he says.", ur: "جب تم مؤذن کی آواز سنو تو وہی کہو جو وہ کہتا ہے۔" }, narrator: { bn: "আবু সাঈদ খুদরী (রাঃ)", en: "Abu Said Al-Khudri (RA)", ur: "ابو سعید خدری (رضی اللہ عنہ)" }, chapter: { bn: "আযান", en: "Call to Prayer", ur: "اذان" } },
];

// ── UI strings ──
const uiText: Record<LangKey, { title: string; subtitle: string; searchPlaceholder: string; chapters: string; allHadiths: string; hadithNo: string; narrator: string; chapter: string; hadiths: string }> = {
  bn: { title: "সহিহ বুখারী শরীফ", subtitle: "আরবি + বাংলা অনুবাদ", searchPlaceholder: "হাদিস খুঁজুন...", chapters: "অধ্যায়সমূহ", allHadiths: "সকল হাদিস", hadithNo: "হাদিস নং", narrator: "বর্ণনাকারী", chapter: "অধ্যায়", hadiths: "টি হাদিস" },
  en: { title: "Sahih Al-Bukhari", subtitle: "Arabic + English Translation", searchPlaceholder: "Search hadiths...", chapters: "Chapters", allHadiths: "All Hadiths", hadithNo: "Hadith No", narrator: "Narrator", chapter: "Chapter", hadiths: "Hadiths" },
  ur: { title: "صحیح البخاری", subtitle: "عربی + اردو ترجمہ", searchPlaceholder: "حدیث تلاش کریں...", chapters: "ابواب", allHadiths: "تمام احادیث", hadithNo: "حدیث نمبر", narrator: "راوی", chapter: "باب", hadiths: "احادیث" },
};

const langMeta: Record<string, { key: LangKey; label: string; seoTitle: string; seoDesc: string }> = {
  bangla: { key: "bn", label: "বাংলা", seoTitle: "Sahih al-Bukhari Bangla — সহীহ আল-বুখারী বাংলা | Noor", seoDesc: "Read Sahih al-Bukhari with Arabic text and Bengali translation. সহীহ আল-বুখারী আরবি সহ বাংলা অনুবাদ পড়ুন।" },
  english: { key: "en", label: "English", seoTitle: "Sahih al-Bukhari English — Arabic + English Translation | Noor", seoDesc: "Read Sahih al-Bukhari with Arabic text and English translation. The most authentic hadith collection." },
  urdu: { key: "ur", label: "اردو", seoTitle: "Sahih al-Bukhari Urdu — صحیح البخاری اردو | Noor", seoDesc: "صحیح البخاری عربی متن کے ساتھ اردو ترجمہ پڑھیں۔ Read Sahih al-Bukhari with Arabic and Urdu translation." },
};

// ── Component ───────────────────────────────────────────────
export default function BukhariLangPage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "hadiths">("hadiths");

  const meta = langMeta[lang || ""] ?? langMeta.bangla;
  const langKey = meta.key;
  const isRtl = langKey === "ur";
  const t = uiText[langKey];

  const chapterParam = searchParams.get("chapter");
  const hadithParam = searchParams.get("hadith");

  useEffect(() => {
    const cid = chapterParam ? Number(chapterParam) : null;
    setSelectedChapter(cid && Number.isFinite(cid) ? cid : null);
  }, [chapterParam]);

  useEffect(() => {
    if (!hadithParam) { setSelectedHadith(null); return; }
    setSelectedHadith(hadiths.find((h) => String(h.id) === hadithParam) ?? null);
  }, [hadithParam]);

  const openChapter = (id: number) => { setSearchParams({ chapter: String(id) }, { replace: false }); setActiveTab("hadiths"); };
  const openHadith = (id: number) => { const next: Record<string, string> = {}; if (selectedChapter !== null) next.chapter = String(selectedChapter); next.hadith = String(id); setSearchParams(next, { replace: false }); };

  const filteredHadiths = hadiths.filter((hadith) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = hadith.translations[langKey].toLowerCase().includes(q) || hadith.arabic.includes(searchQuery) || hadith.number.includes(searchQuery);
    if (selectedChapter !== null) {
      const chName = chapters.find((c) => c.id === selectedChapter)?.name[langKey];
      return matchesSearch && hadith.chapter[langKey] === chName;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 pb-20" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <Helmet>
        <title>{meta.seoTitle}</title>
        <meta name="description" content={meta.seoDesc} />
        <link rel="canonical" href={`https://noorapp.in/sahih-al-bukhari/${lang}`} />
      </Helmet>

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-50 bg-emerald-900/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/sahih-al-bukhari")} className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" style={{ transform: isRtl ? "scaleX(-1)" : "none" }} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                {selectedChapter !== null ? chapters.find((c) => c.id === selectedChapter)?.name[langKey] : t.title}
              </h1>
              <p className="text-xs text-white/70">{selectedChapter !== null ? `${filteredHadiths.length} ${t.hadiths}` : t.subtitle}</p>
            </div>
          </div>
          {/* Language badge */}
          <div className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/90 font-medium">{meta.label}</div>
        </div>

        {/* Search */}
        {!selectedHadith && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" style={{ left: isRtl ? "auto" : "1rem", right: isRtl ? "1rem" : "auto" }} />
              <Input placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 rounded-xl bg-white/15 border-0 text-white placeholder:text-white/50" style={{ paddingLeft: isRtl ? "1rem" : "3rem", paddingRight: isRtl ? "3rem" : "1rem" }} />
            </div>
          </div>
        )}
      </motion.header>

      <AnimatePresence mode="wait">
        {selectedHadith ? (
          /* ── Detail view ── */
          <motion.div key="detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-4 space-y-4">
            <div className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 px-8 py-3 rounded-full shadow-lg">
                <span className="text-white font-bold text-lg">{t.hadithNo} {selectedHadith.number}</span>
              </div>
            </div>

            {/* Arabic — always shown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-3 font-semibold">العربية</p>
              <p className="text-3xl text-white leading-[2.2] text-right" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>{selectedHadith.arabic}</p>
            </motion.div>

            {/* Translation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-3 font-semibold">{meta.label}</p>
              <p className={`text-lg text-white leading-relaxed font-medium ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
                {selectedHadith.translations[langKey]}
              </p>
            </motion.div>

            {/* Narrator & Chapter */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl">
                <p className="text-white/70 text-sm mb-2 font-medium uppercase tracking-wider">{t.narrator}</p>
                <p className="text-white font-semibold text-base">{selectedHadith.narrator[langKey]}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl">
                <p className="text-white/70 text-sm mb-2 font-medium uppercase tracking-wider">{t.chapter}</p>
                <p className="text-white font-semibold text-base">{selectedHadith.chapter[langKey]}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ── List view ── */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
            {/* Tabs */}
            <div className="flex gap-3 mb-6">
              <button onClick={() => setActiveTab("hadiths")} className={`flex-1 py-4 rounded-2xl font-semibold tracking-wide transition-all shadow-xl ${activeTab === "hadiths" ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm" : "bg-white/5 text-white/70 border border-white/10"}`}>{t.allHadiths}</button>
              <button onClick={() => setActiveTab("chapters")} className={`flex-1 py-4 rounded-2xl font-semibold tracking-wide transition-all shadow-xl ${activeTab === "chapters" ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm" : "bg-white/5 text-white/70 border border-white/10"}`}>{t.chapters}</button>
            </div>

            {activeTab === "hadiths" ? (
              <div className="space-y-4">
                {filteredHadiths.map((hadith, index) => (
                  <motion.button key={hadith.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} onClick={() => openHadith(hadith.id)} className="w-full text-left bg-white/10 backdrop-blur-md rounded-2xl p-5 hover:bg-white/15 transition-all active:scale-[0.98] shadow-xl border border-white/20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                        <span className="text-white font-bold">{hadith.number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Arabic snippet */}
                        <p className="text-white/60 text-sm line-clamp-1 mb-1 text-right" dir="rtl">{hadith.arabic}</p>
                        {/* Translation */}
                        <p className="text-white line-clamp-2 font-medium leading-relaxed" dir={isRtl ? "rtl" : "ltr"}>{hadith.translations[langKey]}</p>
                        <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                          <BookOpen size={14} />
                          <span>{hadith.narrator[langKey]}</span>
                        </div>
                      </div>
                      <ChevronRight className="text-white/50 flex-shrink-0 mt-1" size={22} />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.map((chapter, index) => {
                  const count = hadiths.filter((h) => h.chapter[langKey] === chapter.name[langKey]).length;
                  return (
                    <motion.button key={chapter.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} onClick={() => openChapter(chapter.id)} className="w-full text-left bg-white/10 backdrop-blur-md rounded-2xl p-5 hover:bg-white/15 transition-all active:scale-[0.98] shadow-xl border border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                            <span className="text-white font-bold">{chapter.id}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-base">{chapter.name[langKey]}</p>
                            <p className="text-white/60 text-sm">{count} {t.hadiths}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/50" size={22} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
}
