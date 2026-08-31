import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Trash2,
  MessageSquare,
  Package,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { AdminReview } from '../types/admin';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const ReviewsManagement: React.FC = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async (isManual = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reviews?status=${statusFilter}`);
      setReviews(res.data);
      if (isManual) {
        showToast('Refreshed just now', 'success');
      }
    } catch {
      showToast('Failed to load reviews queue', 'error');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleModerate = async (reviewId: number, isApproved: boolean) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/moderate`, { is_approved: isApproved });
      showToast(isApproved ? 'Review approved & published' : 'Review unapproved', 'success');
      fetchReviews();
    } catch (err: any) {
      showToast('Failed to update review status', 'error');
    }
  };

  const columns: Column<AdminReview>[] = [
    {
      key: 'product_name',
      header: 'Product',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5 min-w-[180px]">
          <div className="w-9 h-9 rounded-lg bg-gray-100 border border-[#F1BCCE]/60 overflow-hidden shrink-0">
            {r.product_image ? (
              <img src={r.product_image} alt={r.product_name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-4 h-4 m-auto mt-2 text-gray-500" />
            )}
          </div>
          <span className="font-bold text-gray-900 line-clamp-1">{r.product_name}</span>
        </div>
      ),
    },
    {
      key: 'user_name',
      header: 'Client',
      sortable: true,
      render: (r) => (
        <div className="text-xs">
          <p className="font-semibold text-gray-900">{r.user_name}</p>
          <p className="text-[10px] text-gray-600 font-mono">{r.user_email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating & Feedback',
      render: (r) => (
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-[10px] font-bold text-gray-700 ml-1">({r.rating}/5)</span>
          </div>
          <p className="text-xs text-gray-700 italic line-clamp-2">"{r.review}"</p>
        </div>
      ),
    },
    {
      key: 'photo_url',
      header: 'Customer Photo',
      render: (r) =>
        r.photo_url ? (
          <button
            onClick={() => setSelectedPhoto(r.photo_url || null)}
            className="p-1 rounded-lg border border-[#F1BCCE] bg-[#FAF0F4] hover:bg-[#FCE7F0] text-[#D84B7E] flex items-center gap-1 text-[10px] font-bold cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>View Photo</span>
          </button>
        ) : (
          <span className="text-[10px] text-gray-600">No media</span>
        ),
    },
    {
      key: 'is_approved',
      header: 'Moderation',
      render: (r) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            r.is_approved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {r.is_approved ? 'APPROVED' : 'PENDING'}
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
            Brand Reputation &amp; Testimonials
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Reviews Moderation Station
          </h2>
          <p className="text-xs text-gray-500">
            Moderate submitted customer reviews, verified buyer testimonials, and glowing skin photos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchReviews(true)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 touch-target"
          title="Refresh customer reviews queue"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#D84B7E] transition-transform duration-500 ${
              loading ? 'animate-spin' : ''
            }`}
          />
          <span>{loading ? 'Refreshing...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            statusFilter === 'ALL' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            statusFilter === 'PENDING' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            statusFilter === 'APPROVED' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Approved &amp; Live
        </button>
      </div>

      {/* Reviews Table */}
      <DataTable<AdminReview>
        data={reviews}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        searchPlaceholder="Search review by client, product, or keywords..."
        searchKeys={['product_name', 'user_name', 'review']}
        renderActions={(r) => (
          <div className="flex items-center justify-end gap-1.5">
            {r.is_approved ? (
              <button
                type="button"
                onClick={() => handleModerate(r.id, false)}
                className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleModerate(r.id, true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Approve
              </button>
            )}
          </div>
        )}
      />

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedPhoto(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
          />
          <div className="relative max-w-lg bg-white rounded-3xl p-4 shadow-2xl z-10 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="font-bold text-xs text-[#111111]">Client Glow Photo</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <img src={selectedPhoto} alt="Review attachment" className="w-full rounded-2xl max-h-[70vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
