import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Megaphone,
  Clock,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const MarketingManagement: React.FC = () => {
  const { showToast } = useToast();
  const [announcementText, setAnnouncementText] = useState(
    '✨ Complimentary Botanical Discovery Trio on all orders above ₹2,499 | Free Express Shipping across India'
  );
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true);

  // Flash Sale Banner state
  const [flashSaleTitle, setFlashSaleTitle] = useState('Monsoon Radiance Festive Edit');
  const [flashSaleDiscount, setFlashSaleDiscount] = useState('Up to 25% OFF Artisanal Skincare');
  const [flashSaleEnds, setFlashSaleEnds] = useState('2026-09-15');
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(true);

  const handleSaveMarketing = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Store banners & marketing settings updated successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
          Growth &amp; Merchandising Studio
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          Marketing Banners &amp; Campaigns
        </h2>
        <p className="text-xs text-gray-500">
          Configure top announcement tickers, flash sale countdown timers, and promotional hero banners.
        </p>
      </div>

      <form onSubmit={handleSaveMarketing} className="space-y-6">
        {/* Top Announcement Bar Manager */}
        <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Store Announcement Ticker
                </h3>
                <p className="text-[10px] text-gray-600">Displayed at the very top of all store pages</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementActive}
                onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                className="w-4 h-4 text-[#D84B7E] rounded accent-[#D84B7E]"
              />
              <span className="font-bold text-gray-700">Active</span>
            </label>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700">Announcement Message</label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
            />
          </div>

          {/* Live Preview of Announcement */}
          <div className="p-2.5 rounded-xl bg-[#111111] text-white text-center text-[11px] font-medium tracking-wide">
            {announcementText}
          </div>
        </div>

        {/* Seasonal Flash Sale Banner Manager */}
        <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Seasonal Flash Sale Banner
                </h3>
                <p className="text-[10px] text-gray-600">Special seasonal promotion countdown bar</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFlashSaleActive}
                onChange={(e) => setIsFlashSaleActive(e.target.checked)}
                className="w-4 h-4 text-[#D84B7E] rounded accent-[#D84B7E]"
              />
              <span className="font-bold text-gray-700">Active</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">Campaign Title</label>
              <input
                type="text"
                value={flashSaleTitle}
                onChange={(e) => setFlashSaleTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Discount Headline</label>
              <input
                type="text"
                value={flashSaleDiscount}
                onChange={(e) => setFlashSaleDiscount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">End Date</label>
              <input
                type="date"
                value={flashSaleEnds}
                onChange={(e) => setFlashSaleEnds(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Campaign Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
