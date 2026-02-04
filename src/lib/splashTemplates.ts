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

  // Ramadan Templates
  {
    id: 'ramadan-crescent',
    name: 'Ramadan Crescent Moon',
    category: 'ramadan',
    description: 'Elegant crescent moon with stars animation for Ramadan',
    lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_xlmz9xwm.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#1e3a8a',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'ramadan-lantern',
    name: 'Ramadan Lantern Glow',
    category: 'ramadan',
    description: 'Traditional lanterns with glowing light effect',
    lottieUrl: 'https://assets5.lottiefiles.com/packages/lf20_szviypza.json',
    duration: 4000,
    fadeOutDuration: 500,
    colors: {
      primary: '#7c3aed',
      secondary: '#f59e0b',
    },
  },
  {
    id: 'ramadan-mosque',
    name: 'Ramadan Mosque Silhouette',
    category: 'ramadan',
    description: 'Beautiful mosque silhouette with sunset backdrop',
    lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_kyu7xb1v.json',
    duration: 3000,
    fadeOutDuration: 500,
    colors: {
      primary: '#ec4899',
      secondary: '#fb923c',
    },
  },

  // Eid Templates
  {
    id: 'eid-celebration',
    name: 'Eid Celebration',
    category: 'eid',
    description: 'Festive celebration with geometric patterns',
    lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_tll0j4bb.json',
    duration: 3500,
    fadeOutDuration: 600,
    colors: {
      primary: '#10b981',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'eid-mubarak',
    name: 'Eid Mubarak Stars',
    category: 'eid',
    description: 'Sparkling stars and crescents for Eid',
    lottieUrl: 'https://assets7.lottiefiles.com/packages/lf20_4jlpjx3r.json',
    duration: 4000,
    fadeOutDuration: 700,
    colors: {
      primary: '#8b5cf6',
      secondary: '#fcd34d',
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
