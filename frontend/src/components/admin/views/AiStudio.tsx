import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  TrendingUp,
  ShieldAlert,
  Search,
  BookOpen,
  ArrowRight,
  BrainCircuit,
  Layers,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const AiStudio: React.FC = () => {
  const { showToast } = useToast();
  const [activeAiTool, setActiveAiTool] = useState<'copywriter' | 'forecasting' | 'risk'>('copywriter');

  // AI Copywriter State
  const [productName, setProductName] = useState('Centella Asiatica Soothing Barrier Elixir');
  const [category, setCategory] = useState('Yurae Skin');
  const [keyIngredients, setKeyIngredients] = useState('Centella Asiatica, Fermented Green Tea, Niacinamide');
  const [tone, setTone] = useState('Luxury & Sensory');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await api.post('/admin/ai/generate-copy', {
        product_name: productName,
        category: category,
        key_ingredients_or_fabric: keyIngredients,
        tone: tone,
      });
      setGeneratedOutput(res.data.generated);
      showToast('AI copy & SEO metadata generated successfully', 'success');
    } catch {
      showToast('Failed to generate AI copy', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Intelligence &amp; Generative AI Studio
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Yurae AI Copilot &amp; Analytics
          </h2>
          <p className="text-xs text-gray-500">
            Generate luxury product copy, high-converting SEO metadata, and predictive stock forecasts.
          </p>
        </div>

        {/* Tool Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveAiTool('copywriter')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeAiTool === 'copywriter'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Copywriter &amp; SEO
          </button>
          <button
            onClick={() => setActiveAiTool('forecasting')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeAiTool === 'forecasting'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Demand Forecasting
          </button>
          <button
            onClick={() => setActiveAiTool('risk')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeAiTool === 'risk'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Fraud &amp; Return Risk
          </button>
        </div>
      </div>

      {activeAiTool === 'copywriter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Wand2 className="w-4 h-4 text-[#D84B7E]" />
              <h3 className="font-serif text-base font-bold text-[#111111]">
                Product AI Prompt Config
              </h3>
            </div>

            <form onSubmit={handleGenerateCopy} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Centella Asiatica Soothing Barrier Elixir"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Department / Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                >
                  <option value="Yurae Skin">Yurae Skin (Skincare Rituals)</option>
                  <option value="Yurae Fashion">Yurae Fashion (Apparel)</option>
                  <option value="Yurae Accessories">Yurae Accessories (Jewelry)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Key Bio-Actives / Fabric Notes</label>
                <textarea
                  rows={2}
                  value={keyIngredients}
                  onChange={(e) => setKeyIngredients(e.target.value)}
                  placeholder="e.g. 5% Niacinamide, Pure Kumkumadi Oil, Wild Rosehip"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Editorial Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                >
                  <option value="Luxury & Sensory">Luxury &amp; Sensory (Atelier Style)</option>
                  <option value="Clinical & Botanical">Clinical &amp; Botanical Precision</option>
                  <option value="Minimalist & Modern">Minimalist &amp; Modern</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Synthesizing with AI...' : 'Generate Luxury Copy & SEO'}</span>
              </button>
            </form>
          </div>

          {/* Generated Result Output */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
            <h3 className="font-serif text-base font-bold text-[#111111] border-b border-gray-100 pb-3">
              Generated Editorial &amp; SEO Assets
            </h3>

            {generatedOutput ? (
              <div className="space-y-4">
                {/* Description */}
                <div className="p-4 bg-[#FAF0F4] rounded-2xl border border-[#F1BCCE] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#D84B7E] uppercase text-[10px]">
                      Luxury Product Description
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(generatedOutput.description, 'description')
                      }
                      className="text-gray-600 hover:text-[#D84B7E] flex items-center gap-1"
                    >
                      {copiedKey === 'description' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-gray-800 leading-relaxed font-serif text-sm">
                    {generatedOutput.description}
                  </p>
                </div>

                {/* SEO Meta */}
                <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 uppercase text-[10px]">
                      Search Engine (Google) Snippet
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${generatedOutput.seo_title}\n${generatedOutput.seo_meta_description}`,
                          'seo'
                        )
                      }
                      className="text-gray-600 hover:text-[#D84B7E] flex items-center gap-1"
                    >
                      {copiedKey === 'seo' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy SEO</span>
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-blue-700 text-xs hover:underline cursor-pointer">
                      {generatedOutput.seo_title}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {generatedOutput.seo_meta_description}
                    </p>
                  </div>
                </div>

                {/* How to Use & Ingredients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                    <span className="font-bold text-gray-800 block text-[11px]">Application Ritual</span>
                    <p className="text-gray-600 text-[10px] leading-relaxed">
                      {generatedOutput.how_to_use}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                    <span className="font-bold text-gray-800 block text-[11px]">Ingredients Deck</span>
                    <p className="text-gray-600 text-[10px] leading-relaxed font-mono">
                      {generatedOutput.ingredients}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500 space-y-2">
                <Sparkles className="w-8 h-8 text-[#D84B7E] mx-auto animate-bounce" />
                <p className="font-semibold text-xs">AI Studio ready</p>
                <p className="text-[11px] text-gray-400">
                  Fill in the product details and click "Generate Luxury Copy & SEO" to synthesize descriptions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeAiTool === 'forecasting' && (
        <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <TrendingUp className="w-4 h-4 text-[#D84B7E]" />
            <h3 className="font-serif text-base font-bold text-[#111111]">
              Predictive Sales Velocity &amp; Restock Radar
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Projected Run-Out</span>
              <p className="font-bold text-sm text-[#111111]">
                Kumkumadi Miraculous Beauty Fluid
              </p>
              <p className="text-[11px] text-rose-600 font-bold">Estimated 14 days of stock left</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Fastest Velocity SKU</span>
              <p className="font-bold text-sm text-[#111111]">Korean Centella Barrier Serum</p>
              <p className="text-[11px] text-emerald-600 font-bold">+38% demand increase</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500">Optimal Restock Batch</span>
              <p className="font-bold text-sm text-[#111111]">Order 120 units by Sept 1</p>
              <p className="text-[11px] text-gray-600">Prevents stockout during festive season</p>
            </div>
          </div>
        </div>
      )}

      {activeAiTool === 'risk' && (
        <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-[#D84B7E]" />
            <h3 className="font-serif text-base font-bold text-[#111111]">
              AI High-Risk COD &amp; Return Anomaly Guard
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
            <p className="font-bold text-xs">Zero Fraud Alerts Active</p>
            <p className="text-[11px]">
              All current pending orders pass phone verification and address geocoding authenticity checks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
