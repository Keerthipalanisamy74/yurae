import React, { useState } from 'react';
import { X, ShieldCheck, CheckSquare, Square, AlertCircle, Sparkles, Check, RefreshCw } from 'lucide-react';

interface QualityControlModalProps {
  orderId: number;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onQCSuccess: () => void;
}

export const QualityControlModal: React.FC<QualityControlModalProps> = ({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onQCSuccess
}) => {
  const [inspectorName, setInspectorName] = useState('Lead QC Specialist');
  const [batchNumber, setBatchNumber] = useState(`BAT-2026-${orderId.toString().padStart(4, '0')}`);
  const [expiryDate, setExpiryDate] = useState('2028-01-15');
  const [defectReason, setDefectReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checklist, setChecklist] = useState({
    product_verified: true,
    variant_verified: true,
    quantity_verified: true,
    packaging_sealed: true,
    no_leakage: true,
    no_cosmetic_damage: true,
    batch_verified: true,
    expiry_verified: true
  });

  if (!isOpen) return null;

  const toggleItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSubmit = async (status: 'PASSED' | 'FAILED') => {
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fulfillment/qc/inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          qc_inspector_name: inspectorName,
          status: status,
          verification_checklist: checklist,
          batch_number: batchNumber,
          expiry_date: expiryDate,
          defect_reason: status === 'FAILED' ? (defectReason || 'Failed verification checks') : undefined,
          corrective_action: status === 'FAILED' ? 'Quarantine defective piece & request replacement pick' : undefined,
          notes: notes
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record QC inspection.');
      }

      onQCSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error submitting QC inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  const checklistItems: { key: keyof typeof checklist; label: string; desc: string }[] = [
    { key: 'product_verified', label: 'Correct Formulation & SKU', desc: 'Item matches order specification exactly.' },
    { key: 'variant_verified', label: 'Size & Shade Verification', desc: 'Volume/weight matches patron selection (e.g. 50ml / 100g).' },
    { key: 'quantity_verified', label: 'Item Count Confirmation', desc: 'Exact required units present.' },
    { key: 'packaging_sealed', label: 'Tamper-Evident Seal Intact', desc: 'Original foil/bottle security band is unbroken.' },
    { key: 'no_leakage', label: 'Zero Flacon / Dropper Leakage', desc: 'No oil or formulation residue on container walls.' },
    { key: 'no_cosmetic_damage', label: 'Outer Box & Flacon Condition', desc: 'Carton is pristine without tears, dents, or scratches.' },
    { key: 'batch_verified', label: 'Batch / Lot Code Verified', desc: 'Batch code logged and verified on manufacturer ledger.' },
    { key: 'expiry_verified', label: 'Shelf Life Assurance', desc: 'At least 18 months shelf stability prior to expiry.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5D7D0] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-b border-[#E5D7D0] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Quality Control (QC) Station
              </h3>
              <p className="text-xs text-gray-500">
                Order #{orderNumber} • 8-Point Luxury Formulation & Packaging Inspection
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
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Inspector & Batch Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                QC Inspector
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                Batch / Lot #
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
              />
            </div>
          </div>

          {/* 8-Point Checklist */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-serif font-bold text-xs text-[#111111] uppercase tracking-wider">
                8-Point Verification Checklist
              </h4>
              <button
                type="button"
                onClick={() => {
                  const target = !allChecked;
                  setChecklist({
                    product_verified: target,
                    variant_verified: target,
                    quantity_verified: target,
                    packaging_sealed: target,
                    no_leakage: target,
                    no_cosmetic_damage: target,
                    batch_verified: target,
                    expiry_verified: target
                  });
                }}
                className="text-[11px] font-bold text-[#D84B7E] hover:underline"
              >
                {allChecked ? 'Uncheck All' : 'Check All Passed'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {checklistItems.map(item => {
                const isChecked = checklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleItem(item.key)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/40 border-rose-200 text-gray-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes or Defect Reason */}
          {!allChecked ? (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Defect Reason & Corrective Action (Required for QC Failure)
              </label>
              <textarea
                rows={2}
                value={defectReason}
                onChange={e => setDefectReason(e.target.value)}
                placeholder="e.g. Scratched dropper seal or defective pump mechanism..."
                className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-2.5 text-xs text-[#111111] focus:ring-1 focus:ring-rose-500 outline-hidden"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                QC Specialist Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Verified by Senior Formulation Inspector."
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-t border-[#E5D7D0] flex justify-between items-center">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('FAILED')}
            className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fail QC & Quarantine Item
          </button>

          <button
            type="button"
            disabled={submitting || !allChecked}
            onClick={() => handleSubmit('PASSED')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
              allChecked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Approve & Advance to Packing
          </button>
        </div>

      </div>
    </div>
  );
};
