import React, { useState } from 'react';
import {
  FileText,
  Save,
  Eye,
  Edit3,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface PageData {
  slug: string;
  title: string;
  category: string;
  lastUpdated: string;
  content: string;
}

export const ContentManagement: React.FC = () => {
  const { showToast } = useToast();

  const [pages, setPages] = useState<PageData[]>([
    {
      slug: 'privacy-policy',
      title: 'Privacy & Data Protection Policy',
      category: 'Legal',
      lastUpdated: '2026-08-15',
      content: `## 1. Introduction
At Yurae, we cherish the sacred trust of our patrons. This Privacy Policy outlines how your personal information is gathered, protected, and honored across our digital platforms.

## 2. Personal Information Collected
- **Account Data**: Full name, email address, phone number, shipping & billing addresses.
- **Transaction Logs**: Payment transaction identifiers, order amounts, itemized purchase histories.
- **Sensory & Preference Diagnostics**: Customized botanical skincare recommendations and skin tone profiles.

## 3. Data Sovereignty & Security
We employ industry-standard 256-bit encryption for all data transmissions and comply with ISO/IEC 27001 data protection standards.`,
    },
    {
      slug: 'shipping-returns',
      title: 'Shipping, Delivery & Returns Protocol',
      category: 'Operations',
      lastUpdated: '2026-08-20',
      content: `## 1. Atelier Dispatch Protocol
Each Yurae order is individually verified, wrapped in recyclable bespoke packaging, and dispatched from our Bengaluru Atelier within 24 to 48 hours.

## 2. Transit Timelines
- **Metros (Bengaluru, Mumbai, Delhi, Chennai, Hyderabad)**: 2–3 business days.
- **Rest of India**: 4–6 business days.
- **International Express**: 5–8 business days via DHL Express.

## 3. Returns & Exchange Protocol
Skincare rituals are eligible for complimentary replacement if damaged in transit. Handcrafted apparel items can be exchanged within 7 days of delivery.`,
    },
    {
      slug: 'about-us',
      title: 'The Yurae Heritage & Botanical Philosophy',
      category: 'Brand Story',
      lastUpdated: '2026-08-01',
      content: `## The Confluence of Korean Fermentation & Ayurvedic Botanicals
Born from a reverence for natural botanical bio-actives and minimalist luxury, Yurae creates transcendental rituals that nourish the skin barrier while celebrating quiet elegance.`,
    },
  ]);

  const [selectedSlug, setSelectedSlug] = useState<string>('privacy-policy');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);

  const currentPage = pages.find((p) => p.slug === selectedSlug) || pages[0];

  const handleUpdateContent = (newContent: string) => {
    setPages((prev) =>
      prev.map((p) => (p.slug === selectedSlug ? { ...p, content: newContent } : p))
    );
  };

  const handleSavePage = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast(`Page "${currentPage.title}" saved successfully`, 'success');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
          Content Management System (CMS)
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          Store Content &amp; Policy Pages
        </h2>
        <p className="text-xs text-gray-500">
          Edit public legal policies, brand philosophy, shipping rules, and customer-facing FAQ pages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Pages List */}
        <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 px-2 block mb-2">
            Store Pages ({pages.length})
          </span>

          {pages.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedSlug(p.slug)}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer ${
                selectedSlug === p.slug
                  ? 'bg-[#D84B7E] text-white font-bold shadow-xs'
                  : 'text-gray-700 hover:bg-[#FCE7F0]'
              }`}
            >
              <p className="line-clamp-1">{p.title}</p>
              <div
                className={`flex items-center justify-between text-[9px] mt-1 ${
                  selectedSlug === p.slug ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                <span>{p.category}</span>
                <span>{p.lastUpdated}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Markdown Editor & Preview */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">{currentPage.title}</h3>
              <p className="text-[10px] font-mono text-gray-500">/{currentPage.slug}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditorTab('edit')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    editorTab === 'edit'
                      ? 'bg-[#D84B7E] text-white shadow-2xs'
                      : 'text-gray-700'
                  }`}
                >
                  Markdown Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    editorTab === 'preview'
                      ? 'bg-[#D84B7E] text-white shadow-2xs'
                      : 'text-gray-700'
                  }`}
                >
                  Live Preview
                </button>
              </div>

              <button
                type="button"
                onClick={handleSavePage}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Publish Page'}</span>
              </button>
            </div>
          </div>

          {editorTab === 'edit' ? (
            <textarea
              rows={16}
              value={currentPage.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              className="w-full p-4 bg-[#FAF0F4]/40 border border-[#F1BCCE] rounded-2xl font-mono text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D84B7E] leading-relaxed"
            />
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-gray-100 min-h-[380px] prose prose-sm max-w-none text-gray-800 space-y-3">
              <div
                dangerouslySetInnerHTML={{
                  __html: currentPage.content
                    .replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-gray-900 mt-4 mb-2 font-serif">$1</h3>')
                    .replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-gray-900 mt-4 mb-2 font-serif">$1</h2>')
                    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-gray-900">$1</strong>')
                    .replace(/\n\n/gim, '<p class="text-xs text-gray-700 leading-relaxed my-2"></p>'),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
