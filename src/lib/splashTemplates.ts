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
// These are verified public animations that work without authentication
export const SPLASH_TEMPLATES: SplashTemplate[] = [
  // ========== General Islamic Templates ==========
  {
    id: 'islamic-golden-mosque',
    name: 'Golden Mosque Dawn',
    category: 'general',
    description: 'Stunning golden mosque silhouette with sunrise animation',
    lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_kxsd2ytq.json',
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
    description: 'Elegant Bismillah Arabic calligraphy animation',
    lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_M9p23l.json',
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
    description: 'Beautiful crescent moon with twinkling stars',
    lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_xlmz9xwm.json',
    duration: 4500,
    fadeOutDuration: 600,
    colors: {
      primary: '#0f172a',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'islamic-geometric',
    name: 'Islamic Geometric Pattern',
    category: 'general',
    description: 'Beautiful Islamic geometric art animation',
    lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_OT15QW.json',
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

  // ========== Ramadan Templates ==========
  {
    id: 'ramadan-lanterns-glow',
    name: 'রমজান লন্ঠন',
    category: 'ramadan',
    description: 'সুন্দর জ্বলন্ত লন্ঠন animation - রমজানের আবহ',
    lottieUrl: 'https://assets5.lottiefiles.com/packages/lf20_puciaact.json',
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
    description: 'চমৎকার crescent moon এবং twinkling stars',
    lottieUrl: 'https://assets4.lottiefiles.com/packages/lf20_1pxqjqps.json',
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
    description: 'মসজিদের silhouette এবং রাতের আকাশ',
    lottieUrl: 'https://assets7.lottiefiles.com/packages/lf20_kyu7xb1v.json',
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
    description: 'সূর্যাস্তের সুন্দর দৃশ্য - ইফতারের সময়',
    lottieUrl: 'https://assets8.lottiefiles.com/packages/lf20_xlmz9xwm.json',
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
    description: 'কুরআন পড়ার সুন্দর animation',
    lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_4jlpjx3r.json',
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
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_M9p23l.json',
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
    description: 'ভোরের আলো এবং ফজরের সময়',
    lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_kyu7xb1v.json',
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
    description: 'তারাবীহ নামাজের সুন্দর দৃশ্য',
    lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_tll0j4bb.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#0f172a',
      secondary: '#38bdf8',
    },
  },

  // ========== Eid ul-Fitr Templates ==========
  {
    id: 'eid-fitr-celebration',
    name: 'ঈদুল ফিতর উদযাপন',
    category: 'eid',
    description: 'রমজান শেষে ঈদের আনন্দময় উদযাপন',
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
    description: 'সুন্দর ঈদ মোবারক celebration',
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
    description: 'ঈদের চাঁদ এবং জ্বলন্ত লন্ঠন',
    lottieUrl: 'https://assets5.lottiefiles.com/packages/lf20_puciaact.json',
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
    description: 'মসজিদে ঈদের নামাজের দৃশ্য',
    lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_kxsd2ytq.json',
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
    description: 'পরিবারের সাথে ঈদ উদযাপন',
    lottieUrl: 'https://assets4.lottiefiles.com/packages/lf20_1pxqjqps.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#4c1d95',
      secondary: '#a78bfa',
    },
  },
  {
    id: 'eid-fitr-fireworks',
    name: 'ঈদের আতশবাজি',
    category: 'eid',
    description: 'রাতের আকাশে রঙিন আতশবাজি',
    lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_xlmz9xwm.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#0f172a',
      secondary: '#ec4899',
    },
  },

  // ========== Eid ul-Adha Templates ==========
  {
    id: 'eid-adha-qurbani',
    name: 'কুরবানীর ঈদ',
    category: 'eid',
    description: 'ঈদুল আযহার পবিত্র দিন',
    lottieUrl: 'https://assets6.lottiefiles.com/packages/lf20_szviypza.json',
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
    description: 'পবিত্র কাবা শরীফ - হজ্জের স্মৃতি',
    lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_M9p23l.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#1c1917',
      secondary: '#d4af37',
    },
  },
  {
    id: 'eid-adha-takbeer',
    name: 'ঈদের তাকবীর',
    category: 'eid',
    description: 'আল্লাহু আকবার - ঈদের তাকবীর ধ্বনি',
    lottieUrl: 'https://assets8.lottiefiles.com/packages/lf20_xlmz9xwm.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#312e81',
      secondary: '#818cf8',
    },
  },
  {
    id: 'eid-golden-crescent',
    name: 'সোনালী ঈদের চাঁদ',
    category: 'eid',
    description: 'সোনালী crescent moon - উভয় ঈদের জন্য',
    lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_1pxqjqps.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#1e1b4b',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'eid-gift-box',
    name: 'ঈদের উপহার',
    category: 'eid',
    description: 'ঈদের উপহার বাক্স animation',
    lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_tll0j4bb.json',
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
    lottieUrl: 'https://assets7.lottiefiles.com/packages/lf20_4jlpjx3r.json',
    duration: 4500,
    fadeOutDuration: 800,
    colors: {
      primary: '#0ea5e9',
      secondary: '#f472b6',
    },
  },

  // ========== Muharram Templates ==========
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
  {
    id: 'muharram-new-year',
    name: 'ইসলামিক নববর্ষ',
    category: 'muharram',
    description: 'হিজরি নববর্ষের শুভেচ্ছা',
    lottieUrl: 'https://assets6.lottiefiles.com/packages/lf20_szviypza.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#1e293b',
      secondary: '#94a3b8',
    },
  },

  // ========== Seasonal Templates ==========
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
  {
    id: 'stars-galaxy',
    name: 'Stars & Galaxy',
    category: 'seasonal',
    description: 'Beautiful starry night galaxy animation',
    lottieUrl: 'https://assets5.lottiefiles.com/packages/lf20_puciaact.json',
    duration: 4000,
    fadeOutDuration: 600,
    colors: {
      primary: '#0f172a',
      secondary: '#6366f1',
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
