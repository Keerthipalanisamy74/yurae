import React, { useState } from 'react';
import {
  X, RefreshCw, Undo2, Camera, Upload, Check, AlertCircle,
  ShieldCheck, Sparkles, Loader2, Image as ImageIcon, Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, OrderItem } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ReturnRequestModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ order, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [requestType, setRequestType] = useState<'EXCHANGE' | 'RETURN_REFUND'>('EXCHANGE');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>(
    order?.items?.map((it) => it.id) || []
  );
  const [reason, setReason] = useState<string>('Size / Fit Issue (Too Large)');
  const [detailedReason, setDetailedReason] = useState<string>('');
  const [preferredExchangeSize, setPreferredExchangeSize] = useState<string>('M');
  const [refundMode, setRefundMode] = useState<string>('ORIGINAL_PAYMENT');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInputUrl, setPhotoInputUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!order) return null;

  const returnReasons = [
    'Size / Fit Issue (Too Large)',
    'Size / Fit Issue (Too Small)',
    'Fabric / Stitching Imperfection',
    'Color / Shade Differs from Screen',
    'Skin Sensitivity / Botanical Reaction',
    'Wrong Item / Variant Delivered',
    'Parcel Packaging Damaged in Transit',
    'Other / Quality Feedback',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string]);
          showToast('Photo attached for verification', 'info');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotoUrl = () => {
    if (photoInputUrl.trim()) {
      setPhotos((prev) => [...prev, photoInputUrl.trim()]);
      setPhotoInputUrl('');
      showToast('Photo URL attached', 'info');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      showToast('Please select a reason for return/exchange', 'error');
      return;
    }

    const itemsToReturn = order.items
      .filter((it) => selectedItemIds.includes(it.id))
      .map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        variant_info: it.variant_info,
        quantity: it.quantity,
        price: it.price,
      }));

    if (itemsToReturn.length === 0) {
      showToast('Please select at least one item to return or exchange', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        order_id: order.id,
        request_type: requestType,
        reason,
        detailed_reason: detailedReason.trim() || undefined,
        preferred_exchange_size: requestType === 'EXCHANGE' ? preferredExchangeSize : undefined,
        refund_mode: requestType === 'RETURN_REFUND' ? refundMode : undefined,
        items: itemsToReturn,
        photos: photos.length > 0 ? photos : undefined,
      };

      const res = await api.post('/shipping/returns', payload);
      showToast(
        `Request #${res.data.request_number} submitted! Our concierge team will review within 24 hours.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit return request. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F1BCCE] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#F1BCCE] bg-[#FFF8FA]">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[#D84B7E] shrink-0" />
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111] leading-tight">
                7-Day Return & Exchange
              </h2>
              <p className="text-[10px] sm:text-[11px] text-gray-500">
                Order #{order.order_number} • Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors cursor-pointer touch-target min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs text-gray-800 touch-scroll">
          
          {/* Policy Banner */}
          <div className="p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 sm:gap-3 text-emerald-800 text-[11px]">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">YURAE 7-Day Luxury Guarantee</span>
              <span>Free doorstep pickup & courier dispatch for size exchanges and full refunds.</span>
            </div>
          </div>

          {/* Action Type Selector */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-gray-700">
              Select What You Wish to Do:
            </label>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setRequestType('EXCHANGE')}
                className={`p-3.5 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer text-left touch-target min-h-[44px] ${
                  requestType === 'EXCHANGE'
                    ? 'border-[#D84B7E] bg-[#FFF8FA] ring-2 ring-[#D84B7E]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#111111]">
                  <RefreshCw className="w-4 h-4 text-[#D84B7E]" />
                  Exchange Size / Variant
                </div>
                <span className="text-[11px] text-gray-500">
                  Swap for a different size or fit with free doorstep replacement.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType('RETURN_REFUND')}
                className={`p-3.5 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer text-left ${
                  requestType === 'RETURN_REFUND'
                    ? 'border-[#D84B7E] bg-[#FFF8FA] ring-2 ring-[#D84B7E]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#111111]">
                  <Undo2 className="w-4 h-4 text-[#D84B7E]" />
                  Return for 100% Refund
                </div>
                <span className="text-[11px] text-gray-500">
                  Return item and receive full refund back to original payment mode.
                </span>
              </button>
            </div>
          </div>

          {/* Items Checklist */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-gray-700">
              Select Items to {requestType === 'EXCHANGE' ? 'Exchange' : 'Return'}:
            </label>
            <div className="space-y-2">
              {order.items.map((it) => {
                const isChecked = selectedItemIds.includes(it.id);
                return (
                  <div
                    key={it.id}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedItemIds(selectedItemIds.filter((id) => id !== it.id));
                      } else {
                        setSelectedItemIds([...selectedItemIds, it.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isChecked ? 'border-[#F1BCCE] bg-[#FFF8FA]' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-[#D84B7E] cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-xs text-[#111111]">{it.product_name}</p>
                        {it.variant_info && <p className="text-[11px] text-gray-500">{it.variant_info}</p>}
                        <p className="text-[10px] text-gray-400">Qty: {it.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-gray-700">
                      ₹{it.price * it.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred Size for Exchange */}
          {requestType === 'EXCHANGE' && (
            <div className="space-y-2 p-4 bg-[#FFF8FA] rounded-xl border border-[#F1BCCE]">
              <label className="text-xs uppercase tracking-wider font-bold text-[#D84B7E] block">
                Preferred Replacement Size:
              </label>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '30g', '50g', '100g'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPreferredExchangeSize(sz)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      preferredExchangeSize === sz
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-white border border-[#F1BCCE] text-gray-700 hover:border-[#D84B7E]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refund Mode for Return */}
          {requestType === 'RETURN_REFUND' && (
            <div className="space-y-2 p-4 bg-[#FFF8FA] rounded-xl border border-[#F1BCCE]">
              <label className="text-xs uppercase tracking-wider font-bold text-[#D84B7E] block">
                Refund Payment Destination:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundMode('ORIGINAL_PAYMENT')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                    refundMode === 'ORIGINAL_PAYMENT' ? 'border-[#D84B7E] bg-white font-bold' : 'border-gray-200'
                  }`}
                >
                  Original Payment Method (UPI / Card / Bank)
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMode('STORE_CREDIT')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                    refundMode === 'STORE_CREDIT' ? 'border-[#D84B7E] bg-white font-bold' : 'border-gray-200'
                  }`}
                >
                  Instant Yurae Store Wallet Credit (+5% Bonus)
                </button>
              </div>
            </div>
          )}

          {/* Reason Selector */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-gray-700">
              Primary Reason:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-[#FFF8FA] border border-[#F1BCCE] rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#D84B7E]"
            >
              {returnReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Feedback */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-gray-700">
              Additional Details / Comments:
            </label>
            <textarea
              rows={3}
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              placeholder="Tell our atelier specialists how we can make this perfect for you..."
              className="w-full p-3 bg-white border border-[#F1BCCE] rounded-xl text-xs text-gray-800 outline-none focus:border-[#D84B7E] resize-none"
            />
          </div>

          {/* Photo Upload for Damage / Fit Verification */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wider font-bold text-gray-700 flex items-center justify-between">
              <span>Attach Photos (Optional for Fit / Required for Defects):</span>
              <span className="text-[10px] text-gray-500 font-normal">{photos.length}/4 uploaded</span>
            </label>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg border border-[#F1BCCE] overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex gap-2 items-center">
              <label className="px-3.5 py-2 bg-[#FFF8FA] border border-dashed border-[#F1BCCE] rounded-xl text-xs font-bold text-[#D84B7E] flex items-center gap-1.5 hover:bg-[#FDF4F7] cursor-pointer transition-colors">
                <Camera className="w-4 h-4" /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div className="flex-1 flex gap-1">
                <input
                  type="url"
                  placeholder="Or paste image URL"
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl text-xs outline-none focus:border-[#D84B7E]"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  disabled={!photoInputUrl.trim()}
                  className="px-3 py-2 bg-[#111111] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedItemIds.length === 0}
              className="px-6 py-2.5 bg-[#111111] text-white rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#D84B7E] transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Submit {requestType === 'EXCHANGE' ? 'Exchange' : 'Return'} Request
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
