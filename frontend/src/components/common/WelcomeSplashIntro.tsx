import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight } from 'lucide-react';

interface FloatingHeartItem {
  id: number;
  left: number;
  bottom: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  variant: 'solid' | 'double' | 'outline' | 'sparkle';
  swayType: 'straight' | 'sway';
}

interface PopHeartItem {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  color: string;
}

// 100% Pure Pink Palette
const PURE_PINK_COLORS = [
  '#FF1493', // Deep Neon Pink
  '#FF69B4', // Hot Rose Pink
  '#D84B7E', // Signature Yurae Pink
  '#F472B6', // Blossom Pink
  '#EC4899', // Magenta Pink
  '#FB7185', // Rose Blush Pink
  '#FDA4AF', // Soft Petal Pink
  '#E11D48', // Deep Rose Pink
  '#F43F5E', // Vivid Carnation Pink
];

// Reusable Pure Pink SVG Heart Component
const PinkSvgHeart: React.FC<{ size: number; color: string; variant?: string; className?: string }> = ({
  size,
  color,
  variant = 'solid',
  className = '',
}) => {
  if (variant === 'double') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M16.5 3C14.76 3 13.09 3.81 12 5.09C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.42 2 8.5C2 12.28 5.4 15.36 10.55 20.04L12 21.35L13.45 20.03C18.6 15.36 22 12.28 22 8.5C22 5.42 19.58 3 16.5 3Z"
          fill={color}
        />
        <path
          d="M18.5 7C17.3 7 16.15 7.56 15.4 8.44C14.65 7.56 13.5 7 12.3 7C10.18 7 8.5 8.67 8.5 10.79C8.5 13.4 10.84 15.52 14.4 18.75L15.4 19.65L16.4 18.74C19.96 15.52 22.3 13.4 22.3 10.79C22.3 8.67 20.62 7 18.5 7Z"
          fill="#FFF0F6"
          fillOpacity="0.4"
        />
      </svg>
    );
  }

  if (variant === 'outline') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
          stroke={color}
          strokeWidth="2.5"
          fill={color}
          fillOpacity="0.3"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
    </svg>
  );
};

export const WelcomeSplashIntro: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [flowingHearts, setFlowingHearts] = useState<FloatingHeartItem[]>([]);
  const [popHearts, setPopHearts] = useState<PopHeartItem[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  useEffect(() => {
    // Check if customer has already seen the welcome splash in this session
    const hasSeenSplash = sessionStorage.getItem('yurae_intro_splash_seen');
    if (hasSeenSplash) {
      return;
    }

    const variants: ('solid' | 'double' | 'outline')[] = ['solid', 'double', 'outline', 'solid'];

    // 1. Generate 60+ Pure Pink flowing & rising hearts
    const generatedFlow: FloatingHeartItem[] = Array.from({ length: 65 }, (_, i) => ({
      id: i,
      left: Math.random() * 96 + 2, // 2% to 98%
      bottom: -(Math.random() * 50 + 20),
      size: Math.floor(Math.random() * 26) + 16, // 16px to 42px
      duration: Math.random() * 2.8 + 2.5, // 2.5s to 5.3s flowing
      delay: Math.random() * 2.0, // 0s to 2.0s
      opacity: Math.random() * 0.35 + 0.65, // 0.65 to 1.0 high visibility
      color: PURE_PINK_COLORS[i % PURE_PINK_COLORS.length],
      variant: variants[i % variants.length],
      swayType: i % 2 === 0 ? 'sway' : 'straight',
    }));

    // 2. Generate 28 Pure Pink pop-in bursting hearts scattered across the screen
    const generatedPops: PopHeartItem[] = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      top: Math.random() * 88 + 4, // 4% to 92%
      left: Math.random() * 92 + 4, // 4% to 96%
      size: Math.floor(Math.random() * 24) + 18, // 18px to 42px
      delay: Math.random() * 1.8,
      color: PURE_PINK_COLORS[(i + 2) % PURE_PINK_COLORS.length],
    }));

    setFlowingHearts(generatedFlow);
    setPopHearts(generatedPops);
    setIsVisible(true);

    // 5-second countdown timer
    const countdownInterval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after 5 seconds with smooth dreamlike fadeout
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(autoDismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsFadingOut(true);
    sessionStorage.setItem('yurae_intro_splash_seen', 'true');
    setTimeout(() => {
      setIsVisible(false);
    }, 600); // 600ms smooth fadeout
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Welcome screen"
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden transition-all duration-600 ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at center, #FFF0F6 0%, #FFD6E8 25%, #FFA8CD 55%, #F472B6 80%, #DB2777 100%)',
      }}
    >
      {/* 1. 100% Pure Pink Flowing Hearts Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {flowingHearts.map((h) => (
          <div
            key={`flow-${h.id}`}
            className={`absolute ${h.swayType === 'sway' ? 'animate-float-sway' : 'animate-float-heart'}`}
            style={{
              left: `${h.left}%`,
              bottom: `${h.bottom}px`,
              opacity: h.opacity,
              animationDuration: `${h.duration}s`,
              animationDelay: `${h.delay}s`,
              filter: `drop-shadow(0 4px 12px ${h.color}88)`,
            }}
          >
            <PinkSvgHeart size={h.size} color={h.color} variant={h.variant} />
          </div>
        ))}

        {/* 2. 100% Pure Pink Pop-in Bursting Hearts Layer */}
        {popHearts.map((p) => (
          <div
            key={`pop-${p.id}`}
            className="absolute animate-heart-pop pointer-events-none"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              filter: `drop-shadow(0 4px 14px ${p.color}aa)`,
            }}
          >
            <PinkSvgHeart size={p.size} color={p.color} variant="solid" />
          </div>
        ))}

        {/* Dreamy Pink Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#FF69B4]/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-[#D84B7E]/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#FFF0F6]/45 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Main Center Card with Pure Pink Aesthetics */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-5 sm:space-y-6 px-4">
        
        {/* Animated Brand Emblem with Pure Pink Heart Crown */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-love-pulse">
          <div className="absolute inset-0 rounded-full bg-white/90 backdrop-blur-md border-2 border-[#F8A4C4] shadow-2xl" />
          <img
            src="/logo/logo-emblem.png"
            alt="Yurae Logo"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-md"
          />
          <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-tr from-[#D84B7E] to-[#FF1493] text-white flex items-center justify-center shadow-xl transform rotate-12 animate-bounce border-2 border-white">
            <Heart className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="absolute -bottom-1.5 -left-1.5 animate-pulse">
            <PinkSvgHeart size={20} color="#FF1493" />
          </div>
        </div>

        {/* Hero Romantic Welcome Text */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* "Hey Beautiful..." with Pure Pink Hearts */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 backdrop-blur-lg border border-[#F8A4C4] shadow-md">
            <PinkSvgHeart size={16} color="#D84B7E" />
            <span className="font-serif italic text-lg sm:text-2xl text-[#8A1C47] font-bold tracking-wide">
              Hey Beautiful...
            </span>
            <PinkSvgHeart size={16} color="#FF1493" />
          </div>

          {/* Majestic Hero Title */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#8A1C47] leading-tight tracking-tight drop-shadow-sm">
            Welcome to <span className="text-[#D84B7E] drop-shadow-md">Yurae</span>
          </h1>

          {/* Lovable Poetic Subtitle */}
          <p className="font-serif text-sm sm:text-lg text-[#6A1A37] font-semibold tracking-wide max-w-md mx-auto leading-relaxed flex items-center justify-center gap-1.5">
            <span>The Origin of Korean Botanical Radiance</span>
            <PinkSvgHeart size={16} color="#FF1493" />
          </p>

          <p className="text-xs sm:text-sm text-[#8A1C47] font-normal max-w-sm mx-auto leading-relaxed pt-0.5 flex items-center justify-center gap-1">
            <span>Formulated with pure love &amp; precious botanical elixirs curated just for you.</span>
            <PinkSvgHeart size={14} color="#D84B7E" />
          </p>
        </div>

        {/* Interactive Lovable Button & Countdown */}
        <div className="pt-2 space-y-2.5 flex flex-col items-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D84B7E] via-[#FF1493] to-[#8A1C47] hover:opacity-95 text-white font-bold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer touch-target border border-white/50"
          >
            <Heart className="w-4 h-4 fill-white text-white group-hover:scale-125 transition-transform animate-pulse" />
            <span>Enter Experience</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[11px] font-bold text-[#8A1C47]">
            Opening your sacred beauty ritual in {secondsRemaining}s...
          </p>
        </div>

        {/* 5-Second Glowing Luxury Pink Progress Bar */}
        <div className="w-52 sm:w-72 h-2 bg-white/60 rounded-full mx-auto overflow-hidden shadow-inner border border-white/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#FF1493] via-[#F472B6] to-[#8A1C47] rounded-full transition-all duration-100 ease-linear shadow-md"
            style={{
              animation: 'progress-countdown 5s linear forwards',
            }}
          />
        </div>
      </div>
    </aside>
  );
};
