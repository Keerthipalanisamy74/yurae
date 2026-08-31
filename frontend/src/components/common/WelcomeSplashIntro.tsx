import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface FloatingHeartItem {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  symbol: string;
}

const HEART_SYMBOLS = ['💖', '💕', '💗', '💓', '🌸', '✨', '🤍', '🌷'];
const HEART_COLORS = ['#D84B7E', '#F472B6', '#FB7185', '#E11D48', '#FDA4AF', '#F43F5E'];

export const WelcomeSplashIntro: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeartItem[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  useEffect(() => {
    // Check if customer has already seen the welcome splash in this session
    const hasSeenSplash = sessionStorage.getItem('yurae_intro_splash_seen');
    if (hasSeenSplash) {
      return;
    }

    // Generate dreamy floating hearts
    const generatedHearts: FloatingHeartItem[] = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 96 + 2, // 2% to 98%
      size: Math.floor(Math.random() * 26) + 18, // 18px to 44px
      duration: Math.random() * 3.5 + 3.5, // 3.5s to 7s
      delay: Math.random() * 2.5, // 0s to 2.5s
      opacity: Math.random() * 0.4 + 0.5, // 0.5 to 0.9
      color: HEART_COLORS[i % HEART_COLORS.length],
      symbol: HEART_SYMBOLS[i % HEART_SYMBOLS.length],
    }));

    setHearts(generatedHearts);
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

    // Auto-dismiss after 5 seconds with smooth fadeout
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
    }, 700); // 700ms smooth fadeout
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Welcome screen"
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden transition-all duration-700 ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at center, #FFF4F8 0%, #FDE2EC 40%, #FBCFE8 75%, #F472B6 100%)',
      }}
    >
      {/* Background Floating Hearts Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute animate-float-heart"
            style={{
              left: `${h.left}%`,
              bottom: '-40px',
              fontSize: `${h.size}px`,
              opacity: h.opacity,
              animationDuration: `${h.duration}s`,
              animationDelay: `${h.delay}s`,
              color: h.color,
              filter: 'drop-shadow(0 4px 10px rgba(216,75,126,0.35))',
            }}
          >
            {h.symbol}
          </div>
        ))}

        {/* Soft Radial Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D84B7E]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Luxury Romantic Card Content */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-6 sm:space-y-7 px-4">
        
        {/* Animated Brand Emblem with Glowing Heart */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-love-pulse">
          <div className="absolute inset-0 rounded-full bg-white/70 backdrop-blur-md border-2 border-[#F1BCCE] shadow-xl" />
          <img
            src="/logo/logo-emblem.png"
            alt="Yurae Logo"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-md"
          />
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#D84B7E] text-white flex items-center justify-center shadow-lg transform rotate-12 animate-bounce">
            <Heart className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Hero Romantic Welcome Text */}
        <div className="space-y-2 sm:space-y-3">
          {/* "Hey Beautiful..." in Sweeping Romantic Typography */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#F1BCCE] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D84B7E] animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-serif italic text-base sm:text-lg text-[#8A1C47] font-semibold tracking-wide">
              Hey Beautiful...
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#D84B7E] animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          {/* Majestic Hero Title */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#8A1C47] leading-tight tracking-tight drop-shadow-xs">
            Welcome to <span className="text-[#D84B7E]">Yurae</span>
          </h1>

          {/* Lovable Poetic Subtitle */}
          <p className="font-serif text-sm sm:text-lg text-[#6A1A37] font-medium tracking-wide max-w-md mx-auto leading-relaxed">
            The Origin of Korean Botanical Radiance &amp; Glass Skin
          </p>

          <p className="text-xs sm:text-sm text-[#8A2B4E]/90 font-light max-w-sm mx-auto leading-relaxed pt-1">
            Formulated with ancient herbal wisdom, pure love, and luminous actives crafted uniquely for your glow. 💖
          </p>
        </div>

        {/* Interactive Lovable Ribbon & Instant Enter Button */}
        <div className="pt-2 sm:pt-4 space-y-3 flex flex-col items-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="group px-7 py-3.5 rounded-full bg-[#D84B7E] hover:bg-[#8A1C47] text-white font-bold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer touch-target"
          >
            <Heart className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            <span>Enter Experience</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[11px] font-medium text-[#8A1C47]/75">
            Opening your sacred beauty ritual in {secondsRemaining}s...
          </p>
        </div>

        {/* 5-Second Glowing Luxury Progress Bar */}
        <div className="w-48 sm:w-64 h-1.5 bg-white/50 rounded-full mx-auto overflow-hidden shadow-inner border border-white/60">
          <div
            className="h-full bg-gradient-to-r from-[#D84B7E] via-[#F472B6] to-[#8A1C47] rounded-full transition-all duration-100 ease-linear shadow-sm"
            style={{
              animation: 'progress-countdown 5s linear forwards',
            }}
          />
        </div>
      </div>
    </aside>
  );
};
