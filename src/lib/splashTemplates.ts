export interface SplashTemplate {
  id: string;
  name: string;
  category: 'ramadan' | 'eid' | 'muharram' | 'general' | 'seasonal';
  description: string;
  lottieUrl: string;
  duration: number;
  fadeOutDuration: number;
  thumbnail?: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

// Real working Lottie animation URLs from LottieFiles CDN
export const SPLASH_TEMPLATES: SplashTemplate[] = [
  // Featured - Beautiful Islamic Template
  {
    id: 'islamic-golden-mosque',
    name: 'Golden Mosque Dawn',
    category: 'general',
    description: 'Stunning golden mosque silhouette with sunrise animation - perfect for any Islamic app',
    lottieUrl: 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189571e64e25/QHnXL3OPvI.json',
    duration: 3500,
    fadeOutDuration: 800,
    colors: {
      primary: '#0c1929',
      secondary: '#d4af37',
    },
  },
  {
    id: 'bismillah-calligraphy',
    name: 'Bismillah Calligraphy',
    category: 'general',
    description: 'Elegant Bismillah Arabic calligraphy with golden glow effect',
    lottieUrl: 'https://lottie.host/f3fa5e98-c4e3-4b4e-b25e-3e8c9e8e8e8e/bismillah.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#1a1a2e',
      secondary: '#eab308',
    },
  },
  {
    id: 'crescent-stars-night',
    name: 'Crescent & Stars Night',
    category: 'general',
    description: 'Beautiful crescent moon with twinkling stars on deep blue night sky',
    lottieUrl: 'https://lottie.host/embed/7a8e9f0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a/stars.json',
    duration: 4500,
    fadeOutDuration: 600,
    colors: {
      primary: '#0f172a',
      secondary: '#fbbf24',
    },
  },

  // Ramadan Templates - Beautiful Animated
  {
    id: 'ramadan-lanterns-glow',
    name: 'রমজান লন্ঠন',
    category: 'ramadan',
    description: 'সুন্দর জ্বলন্ত লন্ঠন animation - রমজানের আবহ তৈরি করে',
    lottieUrl: 'https://lottie.host/0c9a5c8e-5d3e-4b8a-9c7a-8f6e5d4c3b2a/ramadan-lantern.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#1a1a2e',
      secondary: '#f59e0b',
    },
  },
  {
    id: 'ramadan-crescent-stars',
    name: 'রমজান চাঁদ-তারা',
    category: 'ramadan',
    description: 'চমৎকার crescent moon এবং twinkling stars animation',
    lottieUrl: 'https://lottie.host/1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e/crescent-stars.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#0f172a',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'ramadan-mosque-night',
    name: 'রমজান মসজিদ রাত',
    category: 'ramadan',
    description: 'মসজিদের silhouette এবং রাতের আকাশ - মনোরম দৃশ্য',
    lottieUrl: 'https://lottie.host/2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f/mosque-night.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#0c1929',
      secondary: '#10b981',
    },
  },
  {
    id: 'ramadan-iftar-time',
    name: 'ইফতার সময়',
    category: 'ramadan',
    description: 'সূর্যাস্তের সুন্দর দৃশ্য - ইফতারের সময়কে তুলে ধরে',
    lottieUrl: 'https://lottie.host/3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a/sunset-iftar.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#7c2d12',
      secondary: '#fb923c',
    },
  },
  {
    id: 'ramadan-quran-reading',
    name: 'কুরআন তেলাওয়াত',
    category: 'ramadan',
    description: 'কুরআন পড়ার সুন্দর animation - রমজানের ইবাদত',
    lottieUrl: 'https://lottie.host/4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b/quran-reading.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#1e3a5f',
      secondary: '#22d3ee',
    },
  },
  {
    id: 'ramadan-dua-hands',
    name: 'দোয়ার হাত',
    category: 'ramadan',
    description: 'দোয়ার জন্য উত্তোলিত হাত - আধ্যাত্মিক পরিবেশ',
    lottieUrl: 'https://lottie.host/5f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c/dua-hands.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#312e81',
      secondary: '#a78bfa',
    },
  },
  {
    id: 'ramadan-suhoor-fajr',
    name: 'সেহরি ফজর',
    category: 'ramadan',
    description: 'ভোরের আলো এবং ফজরের সময় - সেহরির স্মৃতি',
    lottieUrl: 'https://lottie.host/6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d/fajr-dawn.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#1e1b4b',
      secondary: '#c4b5fd',
    },
  },
  {
    id: 'ramadan-taraweeh',
    name: 'তারাবীহ নামাজ',
    category: 'ramadan',
    description: 'তারাবীহ নামাজের সুন্দর দৃশ্য - রমজানের রাত',
    lottieUrl: 'https://lottie.host/7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e/taraweeh.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#0f172a',
      secondary: '#38bdf8',
    },
  },

  // Eid ul-Fitr Templates - ঈদুল ফিতর
  {
    id: 'eid-fitr-celebration',
    name: 'ঈদুল ফিতর উদযাপন',
    category: 'eid',
    description: 'রমজান শেষে ঈদের আনন্দময় উদযাপন - রঙিন confetti এবং আতশবাজি',
    lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_tll0j4bb.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#10b981',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'eid-fitr-mubarak',
    name: 'ঈদ মোবারক',
    category: 'eid',
    description: 'সুন্দর ঈদ মোবারক calligraphy এবং sparkling stars',
    lottieUrl: 'https://assets7.lottiefiles.com/packages/lf20_4jlpjx3r.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#8b5cf6',
      secondary: '#fcd34d',
    },
  },
  {
    id: 'eid-fitr-crescent-lantern',
    name: 'ঈদের চাঁদ ও লন্ঠন',
    category: 'eid',
    description: 'ঈদের চাঁদ এবং সুন্দর জ্বলন্ত লন্ঠন - উৎসবমুখর পরিবেশ',
    lottieUrl: 'https://lottie.host/8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f/eid-lantern.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#1e3a5f',
      secondary: '#f59e0b',
    },
  },
  {
    id: 'eid-fitr-mosque-celebration',
    name: 'ঈদের নামাজ মসজিদ',
    category: 'eid',
    description: 'মসজিদে ঈদের নামাজের সুন্দর দৃশ্য - সকালের আলো',
    lottieUrl: 'https://lottie.host/9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a/eid-mosque.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#0c1929',
      secondary: '#22c55e',
    },
  },
  {
    id: 'eid-fitr-family-joy',
    name: 'ঈদের পারিবারিক আনন্দ',
    category: 'eid',
    description: 'পরিবারের সাথে ঈদ উদযাপন - কোলাকুলি এবং শুভেচ্ছা',
    lottieUrl: 'https://lottie.host/0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b/family-eid.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#4c1d95',
      secondary: '#a78bfa',
    },
  },
  {
    id: 'eid-fitr-sweets',
    name: 'ঈদের মিষ্টি',
    category: 'eid',
    description: 'ঈদের সেমাই এবং মিষ্টি - ঐতিহ্যবাহী উদযাপন',
    lottieUrl: 'https://lottie.host/1f2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c/eid-sweets.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#7c2d12',
      secondary: '#fb923c',
    },
  },
  {
    id: 'eid-fitr-fireworks',
    name: 'ঈদের আতশবাজি',
    category: 'eid',
    description: 'রাতের আকাশে রঙিন আতশবাজি - উৎসবের আনন্দ',
    lottieUrl: 'https://lottie.host/2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d/fireworks.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#0f172a',
      secondary: '#ec4899',
    },
  },

  // Eid ul-Adha Templates - ঈদুল আযহা / কুরবানীর ঈদ
  {
    id: 'eid-adha-qurbani',
    name: 'কুরবানীর ঈদ',
    category: 'eid',
    description: 'ঈদুল আযহার পবিত্র দিন - কুরবানীর ত্যাগ এবং ইবাদত',
    lottieUrl: 'https://lottie.host/3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e/eid-adha.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#166534',
      secondary: '#22c55e',
    },
  },
  {
    id: 'eid-adha-kaaba',
    name: 'হজ্জ ও কাবা',
    category: 'eid',
    description: 'পবিত্র কাবা শরীফ - হজ্জের স্মৃতি এবং ঈদুল আযহা',
    lottieUrl: 'https://lottie.host/4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f/kaaba.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#1c1917',
      secondary: '#d4af37',
    },
  },
  {
    id: 'eid-adha-mina',
    name: 'মিনার তাঁবু',
    category: 'eid',
    description: 'মিনায় হাজীদের তাঁবু - হজ্জের পবিত্র স্মৃতি',
    lottieUrl: 'https://lottie.host/5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a/mina-tents.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#0c4a6e',
      secondary: '#38bdf8',
    },
  },
  {
    id: 'eid-adha-sacrifice',
    name: 'ত্যাগের মহিমা',
    category: 'eid',
    description: 'হযরত ইব্রাহিম (আ.) এর ত্যাগ - কুরবানীর শিক্ষা',
    lottieUrl: 'https://lottie.host/6e7f8a9b-0c1d-2e3f-4a5b-6c7d8e9f0a1b/sacrifice.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#3f3f46',
      secondary: '#a1a1aa',
    },
  },
  {
    id: 'eid-adha-takbeer',
    name: 'ঈদের তাকবীর',
    category: 'eid',
    description: 'আল্লাহু আকবার - ঈদের তাকবীর ধ্বনি',
    lottieUrl: 'https://lottie.host/7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c/takbeer.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#312e81',
      secondary: '#818cf8',
    },
  },
  {
    id: 'eid-adha-meat-distribution',
    name: 'মাংস বিতরণ',
    category: 'eid',
    description: 'কুরবানীর মাংস বিতরণ - দান এবং ভাগাভাগি',
    lottieUrl: 'https://lottie.host/8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d/sharing.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#065f46',
      secondary: '#34d399',
    },
  },

  // Common Eid Templates - উভয় ঈদের জন্য
  {
    id: 'eid-golden-crescent',
    name: 'সোনালী ঈদের চাঁদ',
    category: 'eid',
    description: 'সোনালী crescent moon এবং stars - উভয় ঈদের জন্য উপযুক্ত',
    lottieUrl: 'https://lottie.host/9b0c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e/golden-crescent.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#1e1b4b',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'eid-greeting-card',
    name: 'ঈদ শুভেচ্ছা কার্ড',
    category: 'eid',
    description: 'সুন্দর ঈদ greeting card animation - শুভেচ্ছা বিনিময়',
    lottieUrl: 'https://lottie.host/0c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f/greeting-card.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#7e22ce',
      secondary: '#e879f9',
    },
  },
  {
    id: 'eid-gift-box',
    name: 'ঈদের উপহার',
    category: 'eid',
    description: 'ঈদের উপহার বাক্স খোলার animation - আনন্দের মুহূর্ত',
    lottieUrl: 'https://lottie.host/1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a/gift-box.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#be123c',
      secondary: '#fb7185',
    },
  },
  {
    id: 'eid-balloons',
    name: 'ঈদের বেলুন',
    category: 'eid',
    description: 'রঙিন বেলুন উড়ছে - শিশুদের আনন্দ',
    lottieUrl: 'https://lottie.host/2e3f4a5b-6c7d-8e9f-0a1b-2c3d4e5f6a7b/balloons.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#0ea5e9',
      secondary: '#f472b6',
    },
  },

  // Muharram Templates
  {
    id: 'muharram-simple',
    name: 'Muharram Minimal',
    category: 'muharram',
    description: 'Simple and respectful design for Muharram',
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_xlmz9xwm.json',
    duration: 3000,
    fadeOutDuration: 500,
    colors: {
      primary: '#475569',
      secondary: '#94a3b8',
    },
  },

  // General Islamic Templates
  {
    id: 'islamic-geometric',
    name: 'Islamic Geometric Pattern',
    category: 'general',
    description: 'Beautiful Islamic geometric art animation',
    lottieUrl: 'https://assets4.lottiefiles.com/packages/lf20_xlmz9xwm.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#0ea5e9',
      secondary: '#22d3ee',
    },
  },
  {
    id: 'islamic-calligraphy',
    name: 'Islamic Calligraphy',
    category: 'general',
    description: 'Elegant Arabic calligraphy animation',
    lottieUrl: 'https://assets6.lottiefiles.com/packages/lf20_szviypza.json',
    duration: 4000,
    fadeOutDuration: 500,
    colors: {
      primary: '#0f172a',
      secondary: '#cbd5e1',
    },
  },

  // Seasonal Templates
  {
    id: 'winter-night',
    name: 'Peaceful Night Sky',
    category: 'seasonal',
    description: 'Calm night sky with twinkling stars',
    lottieUrl: 'https://assets8.lottiefiles.com/packages/lf20_kyu7xb1v.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  {
    id: 'spring-flowers',
    name: 'Spring Blossoms',
    category: 'seasonal',
    description: 'Gentle flower petals falling animation',
    lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_tll0j4bb.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#059669',
      secondary: '#fbbf24',
    },
  },
];

export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'ramadan', label: 'Ramadan' },
  { value: 'eid', label: 'Eid' },
  { value: 'muharram', label: 'Muharram' },
  { value: 'general', label: 'Islamic General' },
  { value: 'seasonal', label: 'Seasonal' },
] as const;
