import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MarketingCampaignConfig } from '../../types';

export const AnnouncementBar: React.FC = () => {
  const [config, setConfig] = useState<MarketingCampaignConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/marketing/active');
        if (res.data) setConfig(res.data);
      } catch {
        // Non-blocking fallback
      }
    };
    fetchConfig();
  }, []);

  if (config && (!config.is_active || config.popup_style !== 'TOP_TICKER')) {
    return null;
  }

  const bgStyle = config
    ? {
        background: `linear-gradient(135deg, ${config.bg_gradient_from || '#D84B7E'} 0%, ${
          config.bg_gradient_to || '#8A1C47'
        } 100%)`,
        color: config.text_color || '#FDF4F7',
      }
    : undefined;

  const text =
    config?.announcement_text ||
    '✨ Complimentary Discovery Trio on all orders above ₹2,499 | Free Express Shipping across India';

  return (
    <aside
      aria-label="Announcement"
      style={bgStyle}
      className={`py-2 overflow-hidden whitespace-nowrap text-[10px] sm:text-xs tracking-wider sm:tracking-widest uppercase font-semibold border-b border-white/20 shadow-xs leading-snug transition-colors relative z-40 ${
        !bgStyle ? 'bg-[#D84B7E] text-[#FDF4F7]' : ''
      }`}
    >
      <div className="flex w-max animate-marquee-ltr select-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-8 shrink-0">
            <span className="font-bold tracking-wider">{text}</span>
            <span className="text-white/40 text-xs select-none">✦</span>
            <span className="text-amber-300 font-extrabold tracking-widest text-[9px] sm:text-[10px] bg-black/25 px-2.5 py-0.5 rounded-full border border-amber-300/30">
              LIMITED TIME LUXURY PRIVILEGE
            </span>
            <span className="text-white/40 text-xs select-none">✦</span>
          </div>
        ))}
      </div>
    </aside>
  );
};


