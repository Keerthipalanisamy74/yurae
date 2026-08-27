import React, { useState } from 'react';
import {
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Heart,
  Star,
  MapPin,
  Calendar,
  Mail,
  DollarSign,
  UserCheck,
  UserX,
  Search,
} from 'lucide-react';
import { User as CustomerUser } from '../../../types';
import { CustomerDetail } from '../types/admin';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface CustomerManagementProps {
  customers: CustomerUser[];
  onRefreshCustomers: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onRefreshCustomers,
}) => {
  const { showToast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchCustomer360 = async (userId: number) => {
    try {
      setSelectedCustomerId(userId);
      setIsLoadingDetail(true);
      const res = await api.get(`/admin/customers/${userId}/detail`);
      setCustomerDetail(res.data);
    } catch (err: any) {
      showToast('Failed to load customer profile', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (user: CustomerUser | CustomerDetail) => {
    try {
      setIsTogglingStatus(true);
      await api.put(`/admin/customers/${user.id}/toggle-status`);
      showToast(`Customer status updated`, 'success');
      onRefreshCustomers();
      if (customerDetail && customerDetail.id === user.id) {
        setCustomerDetail((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
      }
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update customer status', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const columns: Column<CustomerUser>[] = [
    {
      key: 'name',
      header: 'Client Profile',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D84B7E] to-[#6A1A3A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {c.first_name ? c.first_name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <p
              className="font-bold text-gray-900 hover:text-[#D84B7E] transition-colors cursor-pointer"
              onClick={() => fetchCustomer360(c.id)}
            >
              {c.first_name} {c.last_name}
            </p>
            <p className="text-[10px] text-gray-600 font-mono">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined Date',
      sortable: true,
      render: (c) => (
        <span className="text-[11px] text-gray-600">
          {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Account Status',
      sortable: true,
      render: (c) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            c.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {c.is_active ? 'ACTIVE' : 'SUSPENDED'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
          Client Relationship Management (CRM)
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          Customers &amp; Client 360°
        </h2>
        <p className="text-xs text-gray-500">
          View registered clients, order frequency, lifetime spending, wishlists, and account status.
        </p>
      </div>

      {/* Customer Table */}
      <DataTable<CustomerUser>
        data={customers}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search customer by name or email..."
        searchKeys={['first_name', 'last_name', 'email']}
        renderActions={(c) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => fetchCustomer360(c.id)}
              className="p-1.5 rounded-lg border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] transition-colors cursor-pointer"
              title="Inspect client profile"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleToggleStatus(c)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                c.is_active
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
              title={c.is_active ? 'Suspend account' : 'Activate account'}
            >
              {c.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      />

      {/* Customer 360° Profile Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            onClick={() => setSelectedCustomerId(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-[#F1BCCE]/60 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                  Customer 360° Profile
                </span>
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  {customerDetail ? `${customerDetail.first_name} ${customerDetail.last_name}` : 'Loading Client...'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="p-8 space-y-4 animate-pulse">
                <div className="h-20 bg-[#FCE7F0] rounded-2xl" />
                <div className="h-40 bg-gray-100 rounded-2xl" />
              </div>
            ) : customerDetail ? (
              <div className="p-5 space-y-6 text-xs">
                {/* Lifetime Metrics Summary Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE]/60">
                    <span className="text-[10px] text-gray-600 uppercase font-bold block">
                      Lifetime Value (LTV)
                    </span>
                    <span className="font-serif text-xl font-bold text-[#111111] block mt-1">
                      ₹{customerDetail.metrics.lifetime_value.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE]/60">
                    <span className="text-[10px] text-gray-600 uppercase font-bold block">
                      Total Orders
                    </span>
                    <span className="font-serif text-xl font-bold text-[#D84B7E] block mt-1">
                      {customerDetail.metrics.total_orders} Orders
                    </span>
                  </div>
                </div>

                {/* Account Details & Status Toggle */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-[#111111]">
                        {customerDetail.first_name} {customerDetail.last_name}
                      </p>
                      <p className="text-gray-600">{customerDetail.email}</p>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(customerDetail)}
                      disabled={isTogglingStatus}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        customerDetail.is_active
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {customerDetail.is_active ? 'Suspend Account' : 'Reactivate Account'}
                    </button>
                  </div>
                </div>

                {/* Addresses */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D84B7E]" />
                    Saved Addresses ({customerDetail.addresses.length})
                  </span>

                  {customerDetail.addresses.length === 0 ? (
                    <p className="text-gray-600">No addresses saved on file.</p>
                  ) : (
                    <div className="space-y-2">
                      {customerDetail.addresses.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{a.street}</span>
                            {a.is_default && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p>
                            {a.city}, {a.state} - {a.postal_code}, {a.country}
                          </p>
                          {a.phone && <p className="font-mono text-[10px]">Phone: {a.phone}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#D84B7E]" />
                    Purchase History ({customerDetail.recent_orders.length})
                  </span>

                  {customerDetail.recent_orders.length === 0 ? (
                    <p className="text-gray-600">No past orders registered for this account.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {customerDetail.recent_orders.map((ord) => (
                        <div key={ord.id} className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">#{ord.order_number}</p>
                            <p className="text-[10px] text-gray-600">{ord.created_at}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-serif font-bold text-gray-900">
                              {ord.currency} {ord.total_amount}
                            </span>
                            <span
                              className={`block text-[9px] font-bold ${
                                ord.payment_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {ord.payment_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
