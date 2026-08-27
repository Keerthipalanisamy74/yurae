import React, { useState } from 'react';
import { X, Gift, CheckSquare, Square, Package, Sparkles, Check, RefreshCw, Printer, FileText } from 'lucide-react';
import { Order } from '../../types';

interface PackingStationModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPackSuccess: () => void;
  onOpenShippingLabel?: () => void;
  onOpenInvoice?: () => void;
}

export const PackingStationModal: React.FC<PackingStationModalProps> = ({
  order,
  isOpen,
  onClose,
  onPackSuccess,
  onOpenShippingLabel,
  onOpenInvoice
}) => {
  const [packerName, setPackerName] = useState('Atelier Packing Specialist');
  const [boxType, setBoxType] = useState('LUXURY_SLIM_BOX');
  const [weightKg, setWeightKg] = useState(0.45);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checklist, setChecklist] = useState({
    tissue_wrap: true,
    bubble_cushion: true,
    thank_you_card: true,
    promo_flyer: true,
    ribbon_seal: true
  });

  const [samples, setSamples] = useState<string[]>([
    '✨ Saffron Glow Elixir Sample (5ml)',
    '🌸 Rose & Vetiver Facial Toner Mist (10ml)'
  ]);

  if (!isOpen) return null;

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fulfillment/packing/pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          packer_name: packerName,
          box_type: boxType,
          packaging_checklist: checklist,
          free_samples: samples,
          total_weight_kg: weightKg,
          length_cm: 15.0,
          breadth_cm: 10.0,
          height_cm: 8.0,
          notes: notes
        })
      });

      if (!res.ok) {
        throw new Error('Failed to complete packing workflow.');
      }

      onPackSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error completing packing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5D7D0] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-b border-[#E5D7D0] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D84B7E]/10 border border-[#D84B7E]/20 flex items-center justify-center text-[#D84B7E]">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Luxury Packing Station Workbench
              </h3>
              <p className="text-xs text-gray-500">
                Order #{order.order_number} • Box Sizing, Free Deluxe Samples & Quality Sealing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Box & Weight Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                Luxury Packaging Box Type
              </label>
              <select
                value={boxType}
                onChange={e => setBoxType(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden cursor-pointer"
              >
                <option value="LUXURY_SLIM_BOX">Luxury Slim Rigid Box (Skincare Flacons & Serums)</option>
                <option value="BOTANICAL_GIFT_BOX">Botanical Gold Embossed Gift Box (Gift Sets)</option>
                <option value="APPAREL_GARMENT_BOX">Apparel Premium Garment Box (Dresses & Robes)</option>
                <option value="ECO_CORRUGATED_BOX">Eco-Kraft Protective Corrugated Box</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                Gross Weight (KG)
              </label>
              <input
                type="number"
                step="0.05"
                value={weightKg}
                onChange={e => setWeightKg(parseFloat(e.target.value) || 0.45)}
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
              />
            </div>
          </div>

          {/* Packing Checklist */}
          <div>
            <h4 className="font-serif font-bold text-xs text-[#111111] uppercase tracking-wider mb-2">
              Packaging Quality Checklist
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'tissue_wrap', label: 'Silk Tissue Wrap', desc: 'Crisp ivory tissue folded with sticker' },
                { key: 'bubble_cushion', label: 'Fragile Bottle Cushioning', desc: 'Flacons wrapped in protective sleeve' },
                { key: 'thank_you_card', label: 'Patron Stationery Note', desc: 'Hand-signed botanical welcome card' },
                { key: 'promo_flyer', label: 'Seasonal Ritual Guide', desc: 'Full application & ingredient ritual booklet' },
                { key: 'ribbon_seal', label: 'Rose Gold Wax / Ribbon Seal', desc: 'Finished with luxury exterior seal' }
              ].map(item => (
                <div
                  key={item.key}
                  onClick={() => toggleChecklist(item.key as any)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                    checklist[item.key as keyof typeof checklist]
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {checklist[item.key as keyof typeof checklist] ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[10px] text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Free Deluxe Samples Included */}
          <div className="bg-[#FAF6F0] p-3.5 rounded-xl border border-[#E5D7D0]">
            <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[#111111] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D84B7E]" /> Complimentary Deluxe Samples Included
            </div>
            <div className="space-y-1.5">
              {samples.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-[#E5D7D0]">
                  <span className="font-medium text-[#111111]">{s}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                    Included
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-t border-[#E5D7D0] flex justify-between items-center">
          <div className="flex items-center gap-2">
            {onOpenShippingLabel && (
              <button
                type="button"
                onClick={onOpenShippingLabel}
                className="px-3 py-1.5 bg-white border border-[#E5D7D0] text-[#111111] hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" /> Shipping Label
              </button>
            )}
            {onOpenInvoice && (
              <button
                type="button"
                onClick={onOpenInvoice}
                className="px-3 py-1.5 bg-white border border-[#E5D7D0] text-[#111111] hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" /> Invoice (PDF)
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={submitting || !allChecked}
            onClick={handleSubmit}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
              allChecked
                ? 'bg-[#111111] hover:bg-[#D84B7E] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Seal Box & Mark as Packed
          </button>
        </div>

      </div>
    </div>
  );
};
