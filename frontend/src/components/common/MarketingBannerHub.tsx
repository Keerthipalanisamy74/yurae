import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Flame,
  Clock,
  ArrowRight,
  Gift,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MarketingCampaignConfig } from '../../types';

export const MarketingBannerHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [config, setConfig] = useState<MarketingCampaignConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCornerExpanded, setIsCornerExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Fetch active campaign configuration
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await api.get('/marketing/active');
        if (res.data) {
          setConfig(res.data);
        }
      } catch {
        // Fallback default
        setConfig({
          is_active: true,
          campaign_name: 'Artisanal Radiance Welcome Edit',
          color_theme: 'blush',
          bg_gradient_from: '#D84B7E',
          bg_gradient_to: '#8A1C47',
          text_color: '#FFFFFF',
          accent_color: '#FFE0EB',
          btn_bg_color: '#FFFFFF',
          btn_text_color: '#D84B7E',
          popup_style: 'TOP_TICKER',
          target_pages: 'ALL_PAGES',
          target_devices: 'ALL_DEVICES',
          target_audience: 'ALL_VISITORS',
          trigger_type: 'ON_LOAD',
          frequency: 'EVERY_VISIT',
          announcement_text: '✨ Complimentary Discovery Trio on all orders above ₹2,499 | Free Express Shipping across India',
          headline: 'Unlock 15% OFF Your First Ritual',
          subheadline: "Experience Korea's pristine botanical actives formulated for luminous glass skin.",
          coupon_code: 'WELCOME15',
          cta_label: 'Explore Collection',
          cta_url: '/shop',
          image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
          show_countdown: false,
          countdown_end_date: '2026-09-30',
        });
      }
    };

    fetchCampaign();
  }, []);

  // Countdown timer calculations
  useEffect(() => {
    if (!config?.show_countdown || !config?.countdown_end_date) return;

    const updateCountdown = () => {
      const difference = +new Date(config.countdown_end_date!) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [config?.show_countdown, config?.countdown_end_date]);

  // Targeting & Trigger Evaluation
  useEffect(() => {
    if (!config || !config.is_active) {
      setIsVisible(false);
      return;
    }

    // 1. Page Targeting Rule
    const path = location.pathname;
    let pageMatch = false;
    if (config.target_pages === 'ALL_PAGES') pageMatch = true;
    else if (config.target_pages === 'HOME_ONLY' && path === '/') pageMatch = true;
    else if (config.target_pages === 'SHOP_ONLY' && (path === '/shop' || path.startsWith('/category'))) pageMatch = true;
    else if (config.target_pages === 'PRODUCT_ONLY' && path.startsWith('/product')) pageMatch = true;
    else if (config.target_pages === 'CART_CHECKOUT' && (path === '/cart' || path === '/checkout')) pageMatch = true;

    if (!pageMatch) {
      setIsVisible(false);
      return;
    }

    // 2. Device Targeting Rule
    const isMobile = window.innerWidth < 768;
    if (config.target_devices === 'DESKTOP_ONLY' && isMobile) {
      setIsVisible(false);
      return;
    }
    if (config.target_devices === 'MOBILE_ONLY' && !isMobile) {
      setIsVisible(false);
      return;
    }

    // 3. Audience Targeting Rule
    if (config.target_audience === 'LOGGED_IN' && !user) {
      setIsVisible(false);
      return;
    }
    if (config.target_audience === 'NEW_VISITORS' && user) {
      setIsVisible(false);
      return;
    }

    // 4. Frequency Rule
    const dismissedKey = `yurae_dismissed_${config.campaign_name || 'promo'}`;
    if (config.frequency === 'ONCE_PER_SESSION') {
      if (sessionStorage.getItem(dismissedKey)) {
        setIsVisible(false);
        return;
      }
    } else if (config.frequency === 'ONCE_PER_DAY') {
      const lastDismissed = localStorage.getItem(dismissedKey);
      if (lastDismissed) {
        const diffHours = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
        if (diffHours < 24) {
          setIsVisible(false);
          return;
        }
      }
    }

    // 5. Trigger Timing
    if (config.trigger_type === 'ON_LOAD') {
      setIsVisible(true);
    } else if (config.trigger_type === 'DELAY_3S') {
      const t = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(t);
    } else if (config.trigger_type === 'DELAY_7S') {
      const t = setTimeout(() => setIsVisible(true), 7000);
      return () => clearTimeout(t);
    } else if (config.trigger_type === 'SCROLL_50') {
      const handleScroll = () => {
        const scrollPercent =
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= 45) {
          setIsVisible(true);
          window.removeEventListener('scroll', handleScroll);
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [config, location.pathname, user]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (!config) return;
    const dismissedKey = `yurae_dismissed_${config.campaign_name || 'promo'}`;
    if (config.frequency === 'ONCE_PER_SESSION') {
      sessionStorage.setItem(dismissedKey, 'true');
    } else if (config.frequency === 'ONCE_PER_DAY') {
      localStorage.setItem(dismissedKey, Date.now().toString());
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    showToast(`Promo code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCtaClick = () => {
    if (!config) return;
    if (config.coupon_code) {
      navigator.clipboard.writeText(config.coupon_code);
    }
    handleDismiss();
    navigate(config.cta_url || '/shop');
  };

  if (!config || !config.is_active || !isVisible) return null;

  const dynamicBgStyle = {
    background: `linear-gradient(135deg, ${config.bg_gradient_from || '#D84B7E'} 0%, ${
      config.bg_gradient_to || '#8A1C47'
    } 100%)`,
    color: config.text_color || '#FFFFFF',
  };

  const dynamicBtnStyle = {
    backgroundColor: config.btn_bg_color || '#FFFFFF',
    color: config.btn_text_color || '#D84B7E',
  };

  // =========================================================================
  // 1. TOP ANNOUNCEMENT TICKER STYLE (Rendered if chosen as top banner)
  // =========================================================================
  if (config.popup_style === 'TOP_TICKER') {
    return (
      <aside aria-label="Announcement" style={dynamicBgStyle} className="relative z-40 py-2 overflow-hidden text-xs font-medium tracking-wide shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 overflow-hidden relative">
            <div className="flex w-max animate-marquee-ltr select-none py-0.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-6 shrink-0">
                  <span className="font-semibold tracking-wide">{config.announcement_text || config.headline}</span>
                  {config.coupon_code && (
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(config.coupon_code!)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-black text-white border border-black hover:bg-black/85 transition-all cursor-pointer shadow-xs"
                      title="Click to copy promo code"
                    >
                      <Tag className="w-3 h-3 text-amber-300" />
                      <span className="font-mono text-white">{config.coupon_code}</span>
                      {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-white/70" />}
                    </button>
                  )}
                  <span className="text-white/40 text-xs select-none">✦</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pr-4 z-10 bg-inherit shadow-[-10px_0_15px_rgba(0,0,0,0.15)]">
            {config.cta_url && (
              <button
                type="button"
                onClick={handleCtaClick}
                style={dynamicBtnStyle}
                className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <span>{config.cta_label || 'Shop Now'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
              title="Close announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 2. CENTER LUXURY MODAL POP-UP STYLE
  // =========================================================================
  if (config.popup_style === 'CENTER_MODAL') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div
          style={dynamicBgStyle}
          className="relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 grid grid-cols-1 sm:grid-cols-12 transform animate-in zoom-in-95 duration-300"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors flex items-center justify-center cursor-pointer"
            title="Close promotional dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Optional Editorial Image Column */}
          {config.image_url && (
            <div className="hidden sm:block sm:col-span-5 relative overflow-hidden bg-black/20 min-h-[260px]">
              <img
                src={config.image_url}
                alt={config.headline}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Copy & Interaction Column */}
          <div className={`${config.image_url ? 'sm:col-span-7' : 'sm:col-span-12'} p-6 sm:p-8 flex flex-col justify-between space-y-4`}>
            <div>
              <span
                style={{ color: config.accent_color || '#FFE0EB' }}
                className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{config.campaign_name || 'Exclusive Offer'}</span>
              </span>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-1 leading-tight">
                {config.headline}
              </h3>

              <p className="text-xs mt-2 opacity-90 leading-relaxed font-light">
                {config.subheadline}
              </p>
            </div>

            {/* Countdown Badge if Active */}
            {timeLeft && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/20 backdrop-blur-xs text-xs font-mono">
                <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Ends in:</span>
                <span className="font-bold">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </span>
              </div>
            )}

            {/* Copyable Coupon Code Box */}
            {config.coupon_code && (
              <div
                onClick={() => handleCopyCoupon(config.coupon_code!)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-xs cursor-pointer transition-all active:scale-98"
                title="Click to copy coupon code"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider opacity-75 font-semibold block">
                    Use Privilege Code
                  </span>
                  <span className="font-mono text-sm font-bold tracking-widest">{config.coupon_code}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 text-xs font-bold">
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleCtaClick}
              style={dynamicBtnStyle}
              className="w-full py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{config.cta_label || 'Claim Privilege'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. BOTTOM FLOATING SLIDE-IN PILL / TOAST STYLE
  // =========================================================================
  if (config.popup_style === 'BOTTOM_PILL') {
    return (
      <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-500">
        <div
          style={dynamicBgStyle}
          className="p-4 rounded-3xl shadow-2xl border border-white/30 flex items-center gap-3 backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-bold truncate">{config.headline}</p>
            <p className="text-[10px] opacity-85 line-clamp-1">{config.subheadline}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCtaClick}
              style={dynamicBtnStyle}
              className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs hover:opacity-90 transition-all cursor-pointer"
            >
              {config.coupon_code ? config.coupon_code : config.cta_label || 'View'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-black/20 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. FLOATING STICKY CORNER WIDGET STYLE
  // =========================================================================
  if (config.popup_style === 'FLOATING_CORNER') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {isCornerExpanded ? (
          <div
            style={dynamicBgStyle}
            className="w-80 p-5 rounded-3xl shadow-2xl border border-white/30 space-y-3 transform animate-in zoom-in-95 duration-300 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{config.campaign_name}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCornerExpanded(false)}
                className="p-1 rounded-full hover:bg-black/20 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h4 className="font-serif text-lg font-bold">{config.headline}</h4>
            <p className="text-[11px] opacity-90 leading-relaxed font-light">{config.subheadline}</p>

            {config.coupon_code && (
              <button
                type="button"
                onClick={() => handleCopyCoupon(config.coupon_code!)}
                className="w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-mono font-bold flex items-center justify-between cursor-pointer"
              >
                <span>CODE: {config.coupon_code}</span>
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleCtaClick}
              style={dynamicBtnStyle}
              className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{config.cta_label || 'Explore Now'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCornerExpanded(true)}
            style={dynamicBgStyle}
            className="px-4 py-3 rounded-full shadow-2xl border border-white/40 flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Gift className="w-4 h-4 animate-bounce" />
            <span className="text-xs font-bold tracking-wide">
              {config.coupon_code ? `Claim ${config.coupon_code}` : config.headline}
            </span>
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. FULL-SCREEN WELCOME HERO TAKEOVER STYLE
  // =========================================================================
  if (config.popup_style === 'FULLSCREEN_TAKEOVER') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
        <div
          style={dynamicBgStyle}
          className="relative w-full max-w-2xl p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/30 text-center space-y-6 transform animate-in zoom-in-95 duration-300"
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest opacity-80">
              {config.campaign_name}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              {config.headline}
            </h2>
            <p className="text-sm opacity-90 max-w-lg mx-auto font-light leading-relaxed">
              {config.subheadline}
            </p>
          </div>

          {config.coupon_code && (
            <div
              onClick={() => handleCopyCoupon(config.coupon_code!)}
              className="inline-flex items-center gap-3 py-3 px-6 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/40 backdrop-blur-xs cursor-pointer transition-all"
            >
              <Tag className="w-4 h-4 text-amber-300" />
              <span className="font-mono text-base font-bold tracking-widest">{config.coupon_code}</span>
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 opacity-75" />}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCtaClick}
              style={dynamicBtnStyle}
              className="py-3.5 px-8 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              {config.cta_label || 'Enter Experience'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
