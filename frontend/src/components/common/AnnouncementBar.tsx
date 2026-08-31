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
    'Complimentary Korean Gel Cleanser Sample on Orders Over ₹2,000 • Free Express Shipping Over ₹1,500';

  return (
    <aside
      aria-label="Announcement"
      style={bgStyle}
      className={`py-1.5 sm:py-2 px-3 sm:px-4 text-center text-[10px] sm:text-xs tracking-wider sm:tracking-widest uppercase font-semibold border-b border-white/20 shadow-xs leading-snug transition-colors ${
        !bgStyle ? 'bg-[#D84B7E] text-[#FDF4F7]' : ''
      }`}
    >
      <span className="block truncate sm:inline">{text}</span>
    </aside>
  );
};


