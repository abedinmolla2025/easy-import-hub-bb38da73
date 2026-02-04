import { motion } from "framer-motion";

// Animated Quran Icon - Opens with light rays
export const AnimatedQuranIcon = ({ size = 28 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className="overflow-visible"
  >
    {/* Glow effect */}
    <motion.ellipse
      cx="32"
      cy="32"
      rx="20"
      ry="20"
      fill="url(#quranGlow)"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Light rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <motion.line
        key={angle}
        x1="32"
        y1="32"
        x2={32 + Math.cos((angle * Math.PI) / 180) * 28}
        y2={32 + Math.sin((angle * Math.PI) / 180) * 28}
        stroke="url(#rayGradient)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.6, 0], pathLength: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
    
    {/* Book base */}
    <motion.path
      d="M12 48V16c0-2 2-4 4-4h32c2 0 4 2 4 4v32c0 2-2 4-4 4H16c-2 0-4-2-4-4z"
      fill="url(#bookCover)"
      stroke="#166534"
      strokeWidth="1.5"
    />
    
    {/* Book spine */}
    <motion.rect
      x="12"
      y="12"
      width="6"
      height="40"
      fill="#15803d"
      rx="1"
    />
    
    {/* Left page - opens */}
    <motion.path
      d="M18 14h12c1 0 2 1 2 2v32c0 1-1 2-2 2H18V14z"
      fill="#fef3c7"
      initial={{ rotateY: 0 }}
      animate={{ rotateY: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "left center" }}
    />
    
    {/* Right page - opens */}
    <motion.path
      d="M32 14h14c1 0 2 1 2 2v32c0 1-1 2-2 2H32V14z"
      fill="#fefce8"
      initial={{ rotateY: 0 }}
      animate={{ rotateY: [5, -5, 5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "right center" }}
    />
    
    {/* Arabic text lines */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <rect x="20" y="20" width="10" height="2" rx="1" fill="#92400e" opacity="0.6" />
      <rect x="20" y="26" width="8" height="2" rx="1" fill="#92400e" opacity="0.5" />
      <rect x="20" y="32" width="10" height="2" rx="1" fill="#92400e" opacity="0.6" />
      <rect x="34" y="20" width="10" height="2" rx="1" fill="#92400e" opacity="0.6" />
      <rect x="36" y="26" width="8" height="2" rx="1" fill="#92400e" opacity="0.5" />
      <rect x="34" y="32" width="10" height="2" rx="1" fill="#92400e" opacity="0.6" />
    </motion.g>
    
    {/* Decorative crescent */}
    <motion.path
      d="M28 42c0-2.2 1.8-4 4-4s4 1.8 4 4c-1-.6-2.2-1-3.5-1s-2.5.4-3.5 1c-.3-.3-.5-.6-.5-1z"
      fill="#fbbf24"
      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    <defs>
      <radialGradient id="quranGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>
  </motion.svg>
);

// Animated Dua Icon - Praying hands with glow
export const AnimatedDuaIcon = ({ size = 28 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className="overflow-visible"
  >
    {/* Glow aura */}
    <motion.ellipse
      cx="32"
      cy="28"
      rx="22"
      ry="22"
      fill="url(#duaGlow)"
      animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Sparkles */}
    {[
      { x: 15, y: 12, delay: 0 },
      { x: 49, y: 14, delay: 0.5 },
      { x: 12, y: 32, delay: 1 },
      { x: 52, y: 30, delay: 1.5 },
    ].map((spark, i) => (
      <motion.circle
        key={i}
        cx={spark.x}
        cy={spark.y}
        r="2"
        fill="#fbbf24"
        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: spark.delay }}
      />
    ))}
    
    {/* Left hand */}
    <motion.path
      d="M20 50c0-8 4-16 8-20 2-2 4-2 4 0v18c0 2-2 4-4 4h-4c-2 0-4-2-4-2z"
      fill="url(#handGradient)"
      stroke="#d97706"
      strokeWidth="1"
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "center bottom" }}
    />
    
    {/* Right hand */}
    <motion.path
      d="M44 50c0-8-4-16-8-20-2-2-4-2-4 0v18c0 2 2 4 4 4h4c2 0 4-2 4-2z"
      fill="url(#handGradient)"
      stroke="#d97706"
      strokeWidth="1"
      animate={{ rotate: [3, -3, 3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "center bottom" }}
    />
    
    {/* Light beam from hands */}
    <motion.path
      d="M28 28c4-8 8-8 8 0"
      stroke="url(#lightBeam)"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      animate={{ opacity: [0.5, 1, 0.5], pathLength: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    <defs>
      <radialGradient id="duaGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="lightBeam" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </motion.svg>
);

// Animated 99 Names Icon - Glowing star pattern
export const AnimatedNamesIcon = ({ size = 28 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className="overflow-visible"
  >
    {/* Outer glow */}
    <motion.circle
      cx="32"
      cy="32"
      r="26"
      fill="url(#namesGlow)"
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    
    {/* Rotating stars */}
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "32px 32px" }}
    >
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <motion.path
          key={angle}
          d={`M32 ${8 + i * 2}l2 6 6 0-5 4 2 6-5-4-5 4 2-6-5-4 6 0z`}
          fill="#ec4899"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          style={{ transformOrigin: "32px 32px", transform: `rotate(${angle}deg)` }}
        />
      ))}
    </motion.g>
    
    {/* Center Allah calligraphy simplified */}
    <motion.circle
      cx="32"
      cy="32"
      r="12"
      fill="url(#centerGradient)"
      stroke="#be185d"
      strokeWidth="2"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    <motion.text
      x="32"
      y="37"
      textAnchor="middle"
      fontSize="14"
      fontWeight="bold"
      fill="#be185d"
      animate={{ opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      99
    </motion.text>
    
    <defs>
      <radialGradient id="namesGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="centerGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fce7f3" />
        <stop offset="100%" stopColor="#fbcfe8" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated Qibla Compass Icon
export const AnimatedQiblaIcon = ({ size = 28 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className="overflow-visible"
  >
    {/* Compass glow */}
    <motion.circle
      cx="32"
      cy="32"
      r="28"
      fill="url(#compassGlow)"
      animate={{ opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    
    {/* Outer ring */}
    <motion.circle
      cx="32"
      cy="32"
      r="24"
      fill="none"
      stroke="url(#compassRing)"
      strokeWidth="3"
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
      style={{ transformOrigin: "32px 32px" }}
    />
    
    {/* Direction markers */}
    {[0, 90, 180, 270].map((angle) => (
      <motion.circle
        key={angle}
        cx={32 + Math.sin((angle * Math.PI) / 180) * 20}
        cy={32 - Math.cos((angle * Math.PI) / 180) * 20}
        r="3"
        fill="#3b82f6"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: angle / 360 }}
      />
    ))}
    
    {/* Compass needle */}
    <motion.g
      animate={{ rotate: [0, 15, -15, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "32px 32px" }}
    >
      {/* North needle (red) */}
      <motion.path
        d="M32 12l4 18h-8z"
        fill="url(#northNeedle)"
      />
      {/* South needle (blue) */}
      <motion.path
        d="M32 52l4-18h-8z"
        fill="#60a5fa"
      />
    </motion.g>
    
    {/* Center pivot */}
    <motion.circle
      cx="32"
      cy="32"
      r="4"
      fill="#1e40af"
      stroke="#fff"
      strokeWidth="1"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    
    {/* Kaaba indicator */}
    <motion.rect
      x="28"
      y="6"
      width="8"
      height="6"
      rx="1"
      fill="#1e3a8a"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    
    <defs>
      <radialGradient id="compassGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="compassRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
      <linearGradient id="northNeedle" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
  </motion.svg>
);

// Animated Tasbih Icon - Prayer beads
export const AnimatedTasbihIcon = ({ size = 28 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className="overflow-visible"
  >
    {/* Glow */}
    <motion.circle
      cx="32"
      cy="32"
      r="26"
      fill="url(#tasbihGlow)"
      animate={{ opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />
    
    {/* Beads in circle */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x = 32 + Math.cos(angle) * 20;
      const y = 32 + Math.sin(angle) * 20;
      return (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="5"
          fill="url(#beadGradient)"
          stroke="#9f1239"
          strokeWidth="1"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: i * 0.1 
          }}
        />
      );
    })}
    
    {/* String connecting beads */}
    <motion.circle
      cx="32"
      cy="32"
      r="20"
      fill="none"
      stroke="#f43f5e"
      strokeWidth="1"
      strokeDasharray="4 4"
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "32px 32px" }}
    />
    
    {/* Center counter */}
    <motion.circle
      cx="32"
      cy="32"
      r="10"
      fill="url(#centerBead)"
      stroke="#be123c"
      strokeWidth="2"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    
    {/* Tassel */}
    <motion.path
      d="M32 42v12M28 54h8"
      stroke="#be123c"
      strokeWidth="2"
      strokeLinecap="round"
      animate={{ y: [0, 2, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    <defs>
      <radialGradient id="tasbihGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fb7185" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="beadGradient" cx="30%" cy="30%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#e11d48" />
      </radialGradient>
      <radialGradient id="centerBead" cx="30%" cy="30%">
        <stop offset="0%" stopColor="#ffe4e6" />
        <stop offset="100%" stopColor="#fecdd3" />
      </radialGradient>
    </defs>
  </motion.svg>
);

// Animated Moon Icon - Crescent with stars
export const AnimatedMoonIcon = ({ size = 28 }: { size?: number }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className="overflow-visible"
  >
    {/* Moon glow */}
    <motion.circle
      cx="28"
      cy="32"
      r="24"
      fill="url(#moonGlow)"
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    
    {/* Crescent moon */}
    <motion.path
      d="M24 8c14 0 24 10 24 24s-10 24-24 24c-4 0-8-1-11-3 8-4 14-13 14-23s-6-19-14-23c3-2 7-3 11-3z"
      fill="url(#moonGradient)"
      animate={{ rotate: [0, 5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "32px 32px" }}
    />
    
    {/* Twinkling stars */}
    {[
      { x: 48, y: 16, size: 3, delay: 0 },
      { x: 54, y: 28, size: 2, delay: 0.5 },
      { x: 50, y: 42, size: 2.5, delay: 1 },
      { x: 42, y: 50, size: 2, delay: 1.5 },
    ].map((star, i) => (
      <motion.g key={i}>
        <motion.circle
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="#fbbf24"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: star.delay }}
        />
        <motion.circle
          cx={star.x}
          cy={star.y}
          r={star.size * 2}
          fill="#fbbf24"
          opacity="0.2"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: star.delay }}
        />
      </motion.g>
    ))}
    
    <defs>
      <radialGradient id="moonGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
  </motion.svg>
);
