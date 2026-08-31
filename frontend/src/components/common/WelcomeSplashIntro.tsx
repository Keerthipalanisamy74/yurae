import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface FloatingHeartItem {
  id: number;
  left: number;
  bottom: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  symbol: string;
  swayType: 'straight' | 'sway';
}

interface PopHeartItem {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  symbol: string;
}

const HEART_SYMBOLS = ['💖', '💕', '💗', '💓', '💞', '💘', '🌸', '✨', '🌷', '🎀'];
const HEART_COLORS = ['#FF1493', '#D84B7E', '#F472B6', '#FB7185', '#E11D48', '#FF69B4', '#FDA4AF', '#F43F5E'];

export const WelcomeSplashIntro: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [flowingHearts, setFlowingHearts] = useState<FloatingHeartItem[]>([]);
  const [popHearts, setPopHearts] = useState<PopHeartItem[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    // Check if customer has already seen the welcome splash in this session
    const hasSeenSplash = sessionStorage.getItem('yurae_intro_splash_seen');
    if (hasSeenSplash) {
      return;
    }

    // 1. Generate 55+ flowing rising hearts across the screen
    const generatedFlow: FloatingHeartItem[] = Array.from({ length: 55 }, (_, i) => ({
      id: i,
      left: Math.random() * 96 + 2, // 2% to 98%
      bottom: -(Math.random() * 40 + 20),
      size: Math.floor(Math.random() * 28) + 16, // 16px to 44px
      duration: Math.random() * 2.5 + 2.2, // 2.2s to 4.7s fast flow
      delay: Math.random() * 1.8, // 0s to 1.8s
      opacity: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      color: HEART_COLORS[i % HEART_COLORS.length],
      symbol: HEART_SYMBOLS[i % HEART_SYMBOLS.length],
      swayType: i % 2 === 0 ? 'sway' : 'straight',
    }));

    // 2. Generate 20 pop-in bursting hearts scattered all over the screen
    const generatedPops: PopHeartItem[] = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      top: Math.random() * 85 + 5, // 5% to 90%
      left: Math.random() * 90 + 5, // 5% to 95%
      size: Math.floor(Math.random() * 24) + 20, // 20px to 44px
      delay: Math.random() * 1.5,
      symbol: HEART_SYMBOLS[(i + 3) % HEART_SYMBOLS.length],
    }));

    setFlowingHearts(generatedFlow);
    setPopHearts(generatedPops);
    setIsVisible(true);

    // 3-second countdown timer
    const countdownInterval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after 3 seconds with smooth dreamlike fadeout
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 3000);

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
      {/* 1. Background Flowing & Swaying Hearts Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {flowingHearts.map((h) => (
          <div
            key={`flow-${h.id}`}
            className={`absolute ${h.swayType === 'sway' ? 'animate-float-sway' : 'animate-float-heart'}`}
            style={{
              left: `${h.left}%`,
              bottom: `${h.bottom}px`,
              fontSize: `${h.size}px`,
              opacity: h.opacity,
              animationDuration: `${h.duration}s`,
              animationDelay: `${h.delay}s`,
              color: h.color,
              filter: 'drop-shadow(0 4px 14px rgba(216,75,126,0.45))',
            }}
          >
            {h.symbol}
          </div>
        ))}

        {/* 2. Pop-in Hearts Scattered Around Entire Viewport */}
        {popHearts.map((p) => (
          <div
            key={`pop-${p.id}`}
            className="absolute animate-heart-pop pointer-events-none"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              filter: 'drop-shadow(0 4px 12px rgba(255,20,147,0.5))',
            }}
          >
            {p.symbol}
          </div>
        ))}

        {/* Dreamy Radiant Pink Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#FF69B4]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-[#D84B7E]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#FFF0F6]/40 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Main Luxury Romantic Heart Center Card */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-5 sm:space-y-6 px-4">
        
        {/* Animated Brand Emblem with Radiant Glowing Heart Crown */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-love-pulse">
          <div className="absolute inset-0 rounded-full bg-white/85 backdrop-blur-md border-2 border-[#F8A4C4] shadow-2xl" />
          <img
            src="/logo/logo-emblem.png"
            alt="Yurae Logo"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-md"
          />
          <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-tr from-[#D84B7E] to-[#FF1493] text-white flex items-center justify-center shadow-xl transform rotate-12 animate-bounce border-2 border-white">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div className="absolute -bottom-1 -left-1 text-lg animate-pulse">
            💖
          </div>
        </div>

        {/* Hero Romantic Welcome Text */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* "Hey Beautiful..." with Pink Shimmer */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 backdrop-blur-lg border border-[#F8A4C4] shadow-md">
            <span className="text-sm animate-pulse">✨</span>
            <span className="font-serif italic text-lg sm:text-2xl text-[#8A1C47] font-bold tracking-wide">
              Hey Beautiful...
            </span>
            <span className="text-sm animate-pulse">💖</span>
          </div>

          {/* Majestic Hero Title */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#8A1C47] leading-tight tracking-tight drop-shadow-sm">
            Welcome to <span className="text-[#D84B7E] drop-shadow-md">Yurae</span>
          </h1>

          {/* Lovable Poetic Subtitle */}
          <p className="font-serif text-sm sm:text-lg text-[#6A1A37] font-semibold tracking-wide max-w-md mx-auto leading-relaxed">
            The Origin of Korean Botanical Radiance &amp; Glass Skin 🌸
          </p>

          <p className="text-xs sm:text-sm text-[#8A1C47] font-normal max-w-sm mx-auto leading-relaxed pt-0.5">
            Formulated with ancient herbal wisdom, pure love &amp; precious floral elixirs curated just for you. 💕
          </p>
        </div>

        {/* Interactive Lovable Button & Countdown */}
        <div className="pt-2 space-y-2.5 flex flex-col items-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D84B7E] via-[#FF1493] to-[#8A1C47] hover:opacity-95 text-white font-bold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer touch-target border border-white/50"
          >
            <Heart className="w-4 h-4 fill-white group-hover:scale-125 transition-transform animate-pulse" />
            <span>Enter Experience</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[11px] font-bold text-[#8A1C47]">
            Opening your sacred beauty ritual in {secondsRemaining}s...
          </p>
        </div>

        {/* 3-Second Glowing Luxury Pink Progress Bar */}
        <div className="w-52 sm:w-72 h-2 bg-white/60 rounded-full mx-auto overflow-hidden shadow-inner border border-white/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#FF1493] via-[#F472B6] to-[#8A1C47] rounded-full transition-all duration-100 ease-linear shadow-md"
            style={{
              animation: 'progress-countdown 3s linear forwards',
            }}
          />
        </div>
      </div>
    </aside>
  );
};
