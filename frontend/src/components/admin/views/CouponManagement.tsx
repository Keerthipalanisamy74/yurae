import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import { Coupon } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface CouponManagementProps {
  coupons: Coupon[];
  onRefreshCoupons: () => void;
}

export const CouponManagement: React.FC<CouponManagementProps> = ({
  coupons,
  onRefreshCoupons,
}) => {
  const { showToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModalCoupon, setDeleteModalCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [validUntil, setValidUntil] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<number>(100);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/coupons', {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: discountValue,
        minimum_order_amount: minOrder,
        expiry_date: validUntil ? new Date(validUntil).toISOString() : null,
        usage_limit: usageLimit,
        active: true,
      });
      showToast(`Coupon "${code.toUpperCase()}" created successfully`, 'success');
      setIsCreateModalOpen(false);
      setCode('');
      onRefreshCoupons();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to create coupon', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalCoupon) return;
    try {
      setIsSaving(true);
      await api.delete(`/coupons/${deleteModalCoupon.id}`);
      showToast(`Coupon "${deleteModalCoupon.code}" deleted`, 'success');
      setDeleteModalCoupon(null);
      onRefreshCoupons();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete coupon', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Promo Code',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#D84B7E]" />
          <span className="font-mono font-bold text-gray-900 bg-[#FAF0F4] border border-[#F1BCCE] px-2 py-0.5 rounded-lg">
            {c.code}
          </span>
        </div>
      ),
    },
    {
      key: 'discount_value',
      header: 'Discount Offer',
      sortable: true,
      render: (c) => (
        <span className="font-serif font-bold text-emerald-700">
          {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
        </span>
      ),
    },
    {
      key: 'minimum_order_amount',
      header: 'Min Spend',
      sortable: true,
      render: (c) => (
        <span className="text-gray-700 font-semibold">
          {c.minimum_order_amount ? `₹${c.minimum_order_amount}` : 'No Min'}
        </span>
      ),
    },
    {
      key: 'usage_limit',
      header: 'Usage Limits',
      render: (c) => (
        <span className="text-xs text-gray-600 font-mono">
          {c.times_used || 0} / {c.usage_limit || '∞'} used
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (c) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            c.active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {c.active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Promotions &amp; Incentives Engine
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Coupons &amp; Promotional Discounts
          </h2>
          <p className="text-xs text-gray-500">
            Create coupon codes, percentage discounts, minimum order value rules, and expiry dates.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Promo Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <DataTable<Coupon>
        data={coupons}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search coupon code..."
        searchKeys={['code']}
        renderActions={(c) => (
          <button
            type="button"
            onClick={() => setDeleteModalCoupon(c)}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete coupon"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      />

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Create Discount Promo Code
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GLOW20"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (INR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Value *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Min Order Value (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Expiration Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] shadow-xs"
                >
                  {isSaving ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteModalCoupon)}
        title={`Delete Coupon "${deleteModalCoupon?.code}"?`}
        message="This discount code will immediately be invalidated for all customer orders."
        confirmLabel="Yes, Delete Coupon"
        variant="danger"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalCoupon(null)}
      />
    </div>
  );
};
