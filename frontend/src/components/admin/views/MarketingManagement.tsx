import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Megaphone,
  Layers,
  Layout,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  Gift,
  Clock,
  Tag,
  Palette,
  CheckCircle2,
  RefreshCw,
  X,
  Copy,
  ArrowRight,
  ExternalLink,
  Flame,
  MousePointer,
  Sliders,
  Check,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import {
  MarketingCampaignConfig,
  PopupStyleType,
  TargetPageType,
  TargetDeviceType,
  TargetAudienceType,
  TriggerType,
  FrequencyType,
} from '../../../types';

interface ColorPreset {
  id: string;
  name: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  accentColor: string;
  btnBgColor: string;
  btnTextColor: string;
  previewClass: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'blush',
    name: 'Blush Royale',
    gradientFrom: '#D84B7E',
    gradientTo: '#8A1C47',
    textColor: '#FFFFFF',
    accentColor: '#FFE0EB',
    btnBgColor: '#FFFFFF',
    btnTextColor: '#D84B7E',
    previewClass: 'from-[#D84B7E] to-[#8A1C47]',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Noir',
    gradientFrom: '#111111',
    gradientTo: '#222222',
    textColor: '#FFFFFF',
    accentColor: '#D4AF37',
    btnBgColor: '#D4AF37',
    btnTextColor: '#111111',
    previewClass: 'from-[#111111] to-[#222222]',
  },
  {
    id: 'gold',
    name: 'Champagne Silk',
    gradientFrom: '#D4AF37',
    gradientTo: '#996515',
    textColor: '#FFFFFF',
    accentColor: '#FFF4D6',
    btnBgColor: '#FFFFFF',
    btnTextColor: '#996515',
    previewClass: 'from-[#D4AF37] to-[#996515]',
  },
  {
    id: 'emerald',
    name: 'Botanical Sage',
    gradientFrom: '#1E4D3E',
    gradientTo: '#0B2019',
    textColor: '#FFFFFF',
    accentColor: '#B2E2D2',
    btnBgColor: '#FFFFFF',
    btnTextColor: '#1E4D3E',
    previewClass: 'from-[#1E4D3E] to-[#0B2019]',
  },
  {
    id: 'plum',
    name: 'Velvet Amethyst',
    gradientFrom: '#4A154B',
    gradientTo: '#230724',
    textColor: '#FFFFFF',
    accentColor: '#FFD6F3',
    btnBgColor: '#FFFFFF',
    btnTextColor: '#4A154B',
    previewClass: 'from-[#4A154B] to-[#230724]',
  },
  {
    id: 'sunset',
    name: 'Sunset Coral',
    gradientFrom: '#F27121',
    gradientTo: '#E94057',
    textColor: '#FFFFFF',
    accentColor: '#FFE3DC',
    btnBgColor: '#FFFFFF',
    btnTextColor: '#E94057',
    previewClass: 'from-[#F27121] to-[#E94057]',
  },
  {
    id: 'pearl',
    name: 'Ivory Minimalist',
    gradientFrom: '#FFFFFF',
    gradientTo: '#FAF0F4',
    textColor: '#111111',
    accentColor: '#D84B7E',
    btnBgColor: '#D84B7E',
    btnTextColor: '#FFFFFF',
    previewClass: 'from-[#FFFFFF] to-[#FAF0F4]',
  },
];

const POPUP_STYLES: { id: PopupStyleType; title: string; desc: string; icon: any; badge: string }[] = [
  {
    id: 'TOP_TICKER',
    title: 'Top Announcement Ticker',
    desc: 'Slim marquee bar running at the top of pages for site-wide alerts and free shipping.',
    icon: Megaphone,
    badge: 'High Visibility',
  },
  {
    id: 'CENTER_MODAL',
    title: 'Center Luxury Modal Pop-Up',
    desc: 'High-converting centered dialogue with promo code, photo preview, and 1-click CTA.',
    icon: Layout,
    badge: 'Highest Conversion',
  },
  {
    id: 'BOTTOM_PILL',
    title: 'Bottom Floating Slide-In Pill',
    desc: 'Non-intrusive floating glassmorphism pill banner in the bottom viewport.',
    icon: Layers,
    badge: 'Sleek & Modern',
  },
  {
    id: 'FLOATING_CORNER',
    title: 'Floating Sticky Corner Widget',
    desc: 'Interactive badge in the bottom-right corner that expands into a promotional card.',
    icon: Gift,
    badge: 'Interactive Gamified',
  },
  {
    id: 'FULLSCREEN_TAKEOVER',
    title: 'Full-Screen Welcome Hero Takeover',
    desc: 'Immersive luxury modal with blurred backdrop for mega-festive sales or VIP launches.',
    icon: Sparkles,
    badge: 'VIP Event Only',
  },
];

export const MarketingManagement: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'appearance' | 'format' | 'targeting' | 'copy' | 'triggers'>('format');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [config, setConfig] = useState<MarketingCampaignConfig>({
    is_active: true,
    campaign_name: 'Artisanal Radiance Welcome Edit',
    color_theme: 'blush',
    bg_gradient_from: '#D84B7E',
    bg_gradient_to: '#8A1C47',
    text_color: '#FFFFFF',
    accent_color: '#FFE0EB',
    btn_bg_color: '#FFFFFF',
    btn_text_color: '#D84B7E',
    popup_style: 'CENTER_MODAL',
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

  const fetchCampaign = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      const res = await api.get('/admin/marketing');
      if (res.data) {
        setConfig(res.data);
      }
      if (isManual) {
        showToast('Refreshed just now', 'success');
      }
    } catch {
      if (isManual) showToast('Failed to load marketing settings', 'error');
    } finally {
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, []);

  const handleSelectPreset = (preset: ColorPreset) => {
    setConfig((prev) => ({
      ...prev,
      color_theme: preset.id,
      bg_gradient_from: preset.gradientFrom,
      bg_gradient_to: preset.gradientTo,
      text_color: preset.textColor,
      accent_color: preset.accentColor,
      btn_bg_color: preset.btnBgColor,
      btn_text_color: preset.btnTextColor,
    }));
    showToast(`Applied "${preset.name}" palette theme`, 'info');
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/admin/marketing', config);
      showToast('Marketing campaigns and pop-up settings published live!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save marketing campaign', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const dynamicBgPreview = {
    background: `linear-gradient(135deg, ${config.bg_gradient_from} 0%, ${config.bg_gradient_to} 100%)`,
    color: config.text_color,
  };

  const dynamicBtnPreview = {
    backgroundColor: config.btn_bg_color,
    color: config.btn_text_color,
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Growth &amp; Merchandising Studio
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Marketing Banners &amp; Pop-Up Studio
          </h2>
          <p className="text-xs text-gray-500">
            Customize promotional modals, announcement tickers, and floating widgets in various color palettes, page targets, and display formats.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Switcher */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-[#F1BCCE] text-xs font-bold shadow-2xs cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_active}
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="w-4 h-4 text-[#D84B7E] rounded accent-[#D84B7E]"
            />
            <span className={config.is_active ? 'text-emerald-700' : 'text-gray-600'}>
              {config.is_active ? 'Campaign Live' : 'Campaign Paused'}
            </span>
          </label>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchCampaign(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-2xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 touch-target"
            title="Refresh campaign settings"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#D84B7E] transition-transform duration-500 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveCampaign}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-[#D84B7E] hover:bg-[#111111] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Configuration on Left (7 cols), Live Preview on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT ZONE: Studio Controls & Configuration */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* SubTab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('format')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'format' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>1. Pop-Up Style</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('appearance')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'appearance' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>2. Colors &amp; Aesthetics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('targeting')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'targeting' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3. Target Pages</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('copy')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'copy' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>4. Copy &amp; Offer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('triggers')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'triggers' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>5. Triggers</span>
            </button>
          </div>

          {/* TAB 1: POP-UP STYLES */}
          {activeSubTab === 'format' && (
            <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Select Pop-Up Style &amp; Display Format
                </h3>
                <p className="text-[11px] text-gray-500">
                  Choose how this marketing experience presents to patrons on your digital storefront.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {POPUP_STYLES.map((style) => {
                  const IconComponent = style.icon;
                  const isSelected = config.popup_style === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setConfig({ ...config, popup_style: style.id })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-[#D84B7E] bg-[#FAF0F4] ring-2 ring-[#D84B7E]/20 shadow-xs'
                          : 'border-gray-200 hover:border-[#F1BCCE] bg-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#D84B7E] text-white shadow-xs' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-gray-900 text-xs">{style.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isSelected ? 'bg-[#D84B7E] text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {style.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{style.desc}</p>
                      </div>

                      <div className="self-center shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#D84B7E] bg-[#D84B7E] text-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE & COLOR STUDIO */}
          {activeSubTab === 'appearance' && (
            <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-5 text-xs animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Color Theme &amp; Gradient Studio
                </h3>
                <p className="text-[11px] text-gray-500">
                  Select a curated luxury preset or customize custom background gradients, text hues, and button accents.
                </p>
              </div>

              {/* Preset Grids */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 block">Curated Luxury Color Themes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = config.color_theme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'border-[#D84B7E] ring-2 ring-[#D84B7E]/30 shadow-xs'
                            : 'border-gray-200 hover:border-[#F1BCCE]'
                        }`}
                      >
                        <div
                          className={`h-9 w-full rounded-xl bg-gradient-to-br ${preset.previewClass} mb-2 shadow-2xs flex items-center justify-center`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm stroke-[3]" />}
                        </div>
                        <p className="font-bold text-gray-900 text-[11px] truncate">{preset.name}</p>
                        <p className="text-[9px] text-gray-500 font-mono truncate">{preset.gradientFrom}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Color Pickers */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Advanced Custom Color Overrides</span>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, color_theme: 'custom' })}
                    className="text-[10px] text-[#D84B7E] font-bold underline cursor-pointer"
                  >
                    Enable Custom Mode
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Gradient Start (Hex)</label>
                    <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <input
                        type="color"
                        value={config.bg_gradient_from}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', bg_gradient_from: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={config.bg_gradient_from}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', bg_gradient_from: e.target.value })
                        }
                        className="w-full font-mono text-xs uppercase bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Gradient End (Hex)</label>
                    <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <input
                        type="color"
                        value={config.bg_gradient_to}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', bg_gradient_to: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={config.bg_gradient_to}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', bg_gradient_to: e.target.value })
                        }
                        className="w-full font-mono text-xs uppercase bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Text Color (Hex)</label>
                    <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <input
                        type="color"
                        value={config.text_color}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', text_color: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={config.text_color}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', text_color: e.target.value })
                        }
                        className="w-full font-mono text-xs uppercase bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Button Background</label>
                    <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <input
                        type="color"
                        value={config.btn_bg_color}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', btn_bg_color: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={config.btn_bg_color}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', btn_bg_color: e.target.value })
                        }
                        className="w-full font-mono text-xs uppercase bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Button Text Color</label>
                    <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <input
                        type="color"
                        value={config.btn_text_color}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', btn_text_color: e.target.value })
                        }
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={config.btn_text_color}
                        onChange={(e) =>
                          setConfig({ ...config, color_theme: 'custom', btn_text_color: e.target.value })
                        }
                        className="w-full font-mono text-xs uppercase bg-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TARGETING & PUBLISHING RULES */}
          {activeSubTab === 'targeting' && (
            <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-5 text-xs animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Where Should This Pop-Up Publish?
                </h3>
                <p className="text-[11px] text-gray-500">
                  Target specific storefront routes, devices, and visitor profiles to maximize conversion.
                </p>
              </div>

              {/* 1. Page Targeting */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>Target Storefront Pages</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'ALL_PAGES', label: 'All Pages (Storefront Wide)', desc: 'Visible everywhere on every page' },
                    { id: 'HOME_ONLY', label: 'Home Page Only', desc: 'Welcome visitors on the landing hero' },
                    { id: 'SHOP_ONLY', label: 'Shop & Category Catalog', desc: 'Engage shoppers browsing products' },
                    { id: 'PRODUCT_ONLY', label: 'Product Detail Pages', desc: 'Trigger on specific SKU reviews' },
                    { id: 'CART_CHECKOUT', label: 'Cart & Checkout Pages', desc: 'Nudge cart abandoners to complete purchase' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        config.target_pages === p.id
                          ? 'border-[#D84B7E] bg-[#FAF0F4] font-bold'
                          : 'border-gray-200 hover:border-[#F1BCCE]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="target_pages"
                        value={p.id}
                        checked={config.target_pages === p.id}
                        onChange={() => setConfig({ ...config, target_pages: p.id as TargetPageType })}
                        className="mt-0.5 text-[#D84B7E] accent-[#D84B7E]"
                      />
                      <div>
                        <p className="text-xs text-gray-900">{p.label}</p>
                        <p className="text-[10px] text-gray-500 font-normal">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Device Targeting */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>Device Targeting</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL_DEVICES', label: 'All Devices', icon: Globe },
                    { id: 'DESKTOP_ONLY', label: 'Desktop Only', icon: Monitor },
                    { id: 'MOBILE_ONLY', label: 'Mobile Only', icon: Smartphone },
                  ].map((d) => {
                    const IconComponent = d.icon;
                    return (
                      <label
                        key={d.id}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          config.target_devices === d.id
                            ? 'border-[#D84B7E] bg-[#FAF0F4] font-bold'
                            : 'border-gray-200 hover:border-[#F1BCCE]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="target_devices"
                          value={d.id}
                          checked={config.target_devices === d.id}
                          onChange={() => setConfig({ ...config, target_devices: d.id as TargetDeviceType })}
                          className="sr-only"
                        />
                        <IconComponent className="w-4 h-4 text-[#D84B7E]" />
                        <span className="text-xs">{d.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. Audience Targeting */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>Audience Profile</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL_VISITORS', label: 'All Visitors' },
                    { id: 'NEW_VISITORS', label: 'First-Time Guests' },
                    { id: 'LOGGED_IN', label: 'VIP Logged-In' },
                  ].map((a) => (
                    <label
                      key={a.id}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        config.target_audience === a.id
                          ? 'border-[#D84B7E] bg-[#FAF0F4] font-bold text-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-[#F1BCCE]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="target_audience"
                        value={a.id}
                        checked={config.target_audience === a.id}
                        onChange={() => setConfig({ ...config, target_audience: a.id as TargetAudienceType })}
                        className="sr-only"
                      />
                      <span className="text-xs">{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COPY & CONVERSION OFFERS */}
          {activeSubTab === 'copy' && (
            <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Campaign Messaging &amp; Conversion Offer
                </h3>
                <p className="text-[11px] text-gray-500">
                  Craft compelling luxury headlines, discount coupon chips, and CTA destinations.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Campaign Internal Name</label>
                  <input
                    type="text"
                    value={config.campaign_name}
                    onChange={(e) => setConfig({ ...config, campaign_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                    placeholder="e.g. Festive Monsoon 15% OFF Edit"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Top Ticker Text (For Top Announcement Style)</label>
                  <input
                    type="text"
                    value={config.announcement_text}
                    onChange={(e) => setConfig({ ...config, announcement_text: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                    placeholder="✨ Free Express Delivery on orders above ₹1,500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Main Headline</label>
                    <input
                      type="text"
                      value={config.headline}
                      onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                      placeholder="Unlock 15% OFF Your Ritual"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Privilege Coupon Code (Optional)</label>
                    <input
                      type="text"
                      value={config.coupon_code || ''}
                      onChange={(e) => setConfig({ ...config, coupon_code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E] font-mono font-bold"
                      placeholder="WELCOME15"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Subheadline &amp; Offer Description</label>
                  <textarea
                    rows={2}
                    value={config.subheadline}
                    onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                    placeholder="Experience Korea's pristine botanical actives formulated for luminous glass skin."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">CTA Button Label</label>
                    <input
                      type="text"
                      value={config.cta_label}
                      onChange={(e) => setConfig({ ...config, cta_label: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                      placeholder="Claim Privilege"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Destination Link URL</label>
                    <input
                      type="text"
                      value={config.cta_url}
                      onChange={(e) => setConfig({ ...config, cta_url: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                      placeholder="/shop or /category/skincare"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Editorial Image URL (For Center Modal)</label>
                  <input
                    type="url"
                    value={config.image_url || ''}
                    onChange={(e) => setConfig({ ...config, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TRIGGERS & FREQUENCY */}
          {activeSubTab === 'triggers' && (
            <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-5 text-xs animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Triggers &amp; Display Frequency
                </h3>
                <p className="text-[11px] text-gray-500">
                  Control exact timing, scroll thresholds, and re-display frequency for your visitors.
                </p>
              </div>

              {/* Trigger Options */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>When Should This Trigger?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'ON_LOAD', label: 'Immediately On Load', desc: 'Triggers as soon as page completes rendering' },
                    { id: 'DELAY_3S', label: 'After 3 Seconds Delay', desc: 'Gives visitor time to orient before showing' },
                    { id: 'DELAY_7S', label: 'After 7 Seconds Delay', desc: 'Target engaged visitors exploring the page' },
                    { id: 'SCROLL_50', label: 'After 50% Page Scroll', desc: 'Triggers when user reads halfway through' },
                  ].map((t) => (
                    <label
                      key={t.id}
                      className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        config.trigger_type === t.id
                          ? 'border-[#D84B7E] bg-[#FAF0F4] font-bold'
                          : 'border-gray-200 hover:border-[#F1BCCE]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="trigger_type"
                        value={t.id}
                        checked={config.trigger_type === t.id}
                        onChange={() => setConfig({ ...config, trigger_type: t.id as TriggerType })}
                        className="mt-0.5 text-[#D84B7E] accent-[#D84B7E]"
                      />
                      <div>
                        <p className="text-xs text-gray-900">{t.label}</p>
                        <p className="text-[10px] text-gray-500 font-normal">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Frequency Options */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>Display Frequency</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'EVERY_VISIT', label: 'Every Page Visit' },
                    { id: 'ONCE_PER_SESSION', label: 'Once Per Session' },
                    { id: 'ONCE_PER_DAY', label: 'Once Per 24 Hours' },
                  ].map((f) => (
                    <label
                      key={f.id}
                      className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                        config.frequency === f.id
                          ? 'border-[#D84B7E] bg-[#FAF0F4] font-bold text-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-[#F1BCCE]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={f.id}
                        checked={config.frequency === f.id}
                        onChange={() => setConfig({ ...config, frequency: f.id as FrequencyType })}
                        className="sr-only"
                      />
                      <span className="text-xs">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Countdown Timer Settings */}
              <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#D84B7E]" />
                    <span className="font-bold text-gray-800">Seasonal Countdown Urgency Bar</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.show_countdown}
                    onChange={(e) => setConfig({ ...config, show_countdown: e.target.checked })}
                    className="w-4 h-4 text-[#D84B7E] rounded accent-[#D84B7E] cursor-pointer"
                  />
                </div>

                {config.show_countdown && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Promotion Deadline Date</label>
                    <input
                      type="date"
                      value={config.countdown_end_date || ''}
                      onChange={(e) => setConfig({ ...config, countdown_end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT ZONE: Live Interactive Simulator / Preview */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs sticky top-24">
            
            {/* Simulator Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D84B7E]" />
                <span className="font-bold text-gray-900">Live Experience Simulator</span>
              </div>

              {/* Device Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white text-[#D84B7E] shadow-2xs' : 'text-gray-500'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white text-[#D84B7E] shadow-2xs' : 'text-gray-500'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mockup Canvas Screen */}
            <div
              className={`mx-auto bg-gray-900/5 rounded-2xl p-4 border border-dashed border-gray-300 min-h-[380px] flex flex-col justify-center transition-all ${
                previewDevice === 'mobile' ? 'max-w-[280px]' : 'w-full'
              }`}
            >
              {/* STYLE 1: TOP TICKER PREVIEW */}
              {config.popup_style === 'TOP_TICKER' && (
                <div style={dynamicBgPreview} className="p-3 rounded-2xl shadow-md text-center space-y-2">
                  <p className="text-[11px] font-medium leading-tight">
                    {config.announcement_text || config.headline}
                  </p>
                  {config.coupon_code && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/20 border border-white/30">
                      <Tag className="w-2.5 h-2.5" />
                      {config.coupon_code}
                    </span>
                  )}
                </div>
              )}

              {/* STYLE 2: CENTER MODAL PREVIEW */}
              {config.popup_style === 'CENTER_MODAL' && (
                <div
                  style={dynamicBgPreview}
                  className="rounded-3xl shadow-xl border border-white/30 overflow-hidden relative"
                >
                  {config.image_url && (
                    <div className="h-28 w-full overflow-hidden bg-black/20">
                      <img src={config.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="p-4 space-y-2.5">
                    <span
                      style={{ color: config.accent_color }}
                      className="text-[9px] uppercase font-bold tracking-widest block"
                    >
                      {config.campaign_name}
                    </span>

                    <h4 className="font-serif text-base font-bold leading-tight">{config.headline}</h4>
                    <p className="text-[10px] opacity-90 leading-relaxed font-light">{config.subheadline}</p>

                    {config.coupon_code && (
                      <div className="p-2 rounded-xl bg-white/15 border border-white/30 flex items-center justify-between text-[10px] font-mono font-bold">
                        <span>CODE: {config.coupon_code}</span>
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">1-Click</span>
                      </div>
                    )}

                    <button
                      type="button"
                      style={dynamicBtnPreview}
                      className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-xs mt-1"
                    >
                      {config.cta_label || 'Claim Privilege'}
                    </button>
                  </div>
                </div>
              )}

              {/* STYLE 3: BOTTOM PILL PREVIEW */}
              {config.popup_style === 'BOTTOM_PILL' && (
                <div
                  style={dynamicBgPreview}
                  className="p-3 rounded-2xl shadow-xl border border-white/30 flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[11px] truncate">{config.headline}</p>
                    <p className="text-[9px] opacity-80 truncate">{config.subheadline}</p>
                  </div>
                  <button
                    type="button"
                    style={dynamicBtnPreview}
                    className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase shrink-0"
                  >
                    {config.coupon_code || 'View'}
                  </button>
                </div>
              )}

              {/* STYLE 4: FLOATING CORNER WIDGET PREVIEW */}
              {config.popup_style === 'FLOATING_CORNER' && (
                <div className="flex justify-end items-end h-full">
                  <div
                    style={dynamicBgPreview}
                    className="px-3.5 py-2.5 rounded-full shadow-lg border border-white/40 flex items-center gap-2"
                  >
                    <Gift className="w-3.5 h-3.5 animate-bounce" />
                    <span className="text-[10px] font-bold">
                      {config.coupon_code ? `Claim ${config.coupon_code}` : 'Exclusive Offer'}
                    </span>
                  </div>
                </div>
              )}

              {/* STYLE 5: FULLSCREEN TAKEOVER PREVIEW */}
              {config.popup_style === 'FULLSCREEN_TAKEOVER' && (
                <div
                  style={dynamicBgPreview}
                  className="p-6 rounded-3xl shadow-xl border border-white/30 text-center space-y-3"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-lg font-bold">{config.headline}</h4>
                  <p className="text-[10px] opacity-90">{config.subheadline}</p>
                  {config.coupon_code && (
                    <span className="inline-block px-3 py-1 rounded-xl bg-white/20 font-mono text-xs font-bold">
                      {config.coupon_code}
                    </span>
                  )}
                  <button
                    type="button"
                    style={dynamicBtnPreview}
                    className="w-full py-2 rounded-full text-[10px] font-bold uppercase"
                  >
                    {config.cta_label || 'Enter Store'}
                  </button>
                </div>
              )}
            </div>

            {/* Configuration Status Summary */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-[10px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Placement:</span>
                <span className="font-bold text-gray-800">{config.target_pages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Device Scope:</span>
                <span className="font-bold text-gray-800">{config.target_devices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Trigger Rule:</span>
                <span className="font-bold text-gray-800">{config.trigger_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Color Palette:</span>
                <span className="font-bold text-[#D84B7E] uppercase">{config.color_theme}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
