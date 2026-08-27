import React, { useState } from 'react';
import { X, DollarSign, CreditCard, RotateCcw, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Order } from '../../types';

interface RefundProcessorModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onRefundSuccess: () => void;
}

export const RefundProcessorModal: React.FC<RefundProcessorModalProps> = ({
  order,
  isOpen,
  onClose,
  onRefundSuccess
}) => {
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [amount, setAmount] = useState(order.total_amount);
  const [refundMode, setRefundMode] = useState('ORIGINAL_PAYMENT');
  const [reason, setReason] = useState('Customer Return & Exchange Settlement');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fulfillment/refunds/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          amount: parseFloat(amount.toString()),
          currency: order.currency || 'INR',
          refund_type: refundType,
          refund_mode: refundMode,
          reason: reason,
          admin_notes: adminNotes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to process refund.');
      }

      onRefundSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error processing refund.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5D7D0] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-b border-[#E5D7D0] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Process Order Refund
              </h3>
              <p className="text-xs text-gray-500">
                Order #{order.order_number} • Total: ₹{order.total_amount.toLocaleString()}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Refund Type */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Refund Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRefundType('FULL');
                  setAmount(order.total_amount);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  refundType === 'FULL'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#FAF6F0] text-gray-700 border-[#E5D7D0] hover:bg-gray-100'
                }`}
              >
                Full Refund (₹{order.total_amount.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setRefundType('PARTIAL')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  refundType === 'PARTIAL'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#FAF6F0] text-gray-700 border-[#E5D7D0] hover:bg-gray-100'
                }`}
              >
                Partial Refund
              </button>
            </div>
          </div>

          {/* Amount */}
          {refundType === 'PARTIAL' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                Custom Refund Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                max={order.total_amount}
                min="1"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
              />
            </div>
          )}

          {/* Mode */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Refund Destination Mode
            </label>
            <select
              value={refundMode}
              onChange={e => setRefundMode(e.target.value)}
              className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden cursor-pointer"
            >
              <option value="ORIGINAL_PAYMENT">Original Payment Gateway (Razorpay / Stripe)</option>
              <option value="STORE_CREDIT">YURAE Store Credit / Patron Wallet</option>
              <option value="BANK_TRANSFER">Manual NEFT / Bank Account Transfer</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Refund Reason
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl px-3 py-2 text-xs font-bold text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden cursor-pointer"
            >
              <option value="Customer Return & Exchange Settlement">Customer Return & Exchange Settlement</option>
              <option value="Damaged or Defective Item on Delivery">Damaged or Defective Item on Delivery</option>
              <option value="Order Cancelled Prior to Dispatch">Order Cancelled Prior to Dispatch</option>
              <option value="Inventory Stock Shortage">Inventory Stock Shortage</option>
              <option value="Concierge Goodwill Gesture">Concierge Goodwill Gesture</option>
            </select>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Internal Audit Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="e.g. Reverse parcel received and verified at Bangalore hub..."
              className="w-full bg-[#FAF6F0] border border-[#E5D7D0] rounded-xl p-2.5 text-xs text-[#111111] focus:ring-1 focus:ring-[#D84B7E] outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || amount <= 0 || amount > order.total_amount}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Authorize ₹{amount.toLocaleString()} Refund
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
