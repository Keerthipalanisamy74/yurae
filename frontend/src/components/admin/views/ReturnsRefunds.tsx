import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Truck,
  Image as ImageIcon,
  Clock,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { ReturnRequest } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface ReturnsRefundsProps {
  returnRequests: ReturnRequest[];
  onRefreshReturns: () => void;
}

export const ReturnsRefunds: React.FC<ReturnsRefundsProps> = ({
  returnRequests,
  onRefreshReturns,
}) => {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const filteredReturns = returnRequests.filter((r) => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    return true;
  });

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      setIsUpdating(id);
      await api.put(`/returns/${id}/status`, { status: newStatus });
      showToast(`Return request #${id} updated to "${newStatus}"`, 'success');
      onRefreshReturns();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update return status', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'request_number',
      header: 'Request # & Order',
      sortable: true,
      render: (r) => (
        <div className="space-y-0.5">
          <p className="font-bold text-gray-900">{r.request_number}</p>
          <p className="text-[10px] text-gray-600">Order ID: #{r.order_id}</p>
        </div>
      ),
    },
    {
      key: 'request_type',
      header: 'Type',
      render: (r) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            r.request_type === 'EXCHANGE'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {r.request_type}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Return Reason',
      render: (r) => (
        <div className="space-y-0.5 max-w-xs">
          <p className="font-bold text-gray-900 line-clamp-1">{r.reason}</p>
          {r.detailed_reason && (
            <p className="text-[10px] text-gray-600 line-clamp-1">{r.detailed_reason}</p>
          )}
          {r.preferred_exchange_size && (
            <span className="inline-block text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              Exchange Size: {r.preferred_exchange_size}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            r.status === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : r.status === 'APPROVED'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : r.status === 'REJECTED'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {r.status}
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
            Reverse Logistics &amp; Claims
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Returns &amp; Exchanges Portal
          </h2>
          <p className="text-xs text-gray-500">
            Review patron exchange sizes, photo proofs, courier reverse pickups, and store credit refunds.
          </p>
        </div>

        <button
          onClick={onRefreshReturns}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Refresh Claims</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'ALL' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          All Claims ({returnRequests.length})
        </button>
        <button
          onClick={() => setFilter('PENDING_REVIEW')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'PENDING_REVIEW' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'APPROVED' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Approved / Pickup
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'COMPLETED' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Table */}
      <DataTable<ReturnRequest>
        data={filteredReturns}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Search return number, order ID, or reason..."
        searchKeys={['request_number', 'reason', 'detailed_reason']}
        renderActions={(r) => (
          <div className="flex items-center justify-end gap-1.5">
            {r.status === 'PENDING_REVIEW' && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                  disabled={isUpdating === r.id}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors shadow-2xs cursor-pointer"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                  disabled={isUpdating === r.id}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </>
            )}
            {r.status === 'APPROVED' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}
                disabled={isUpdating === r.id}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition-colors shadow-2xs cursor-pointer"
              >
                Mark Completed
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
};
