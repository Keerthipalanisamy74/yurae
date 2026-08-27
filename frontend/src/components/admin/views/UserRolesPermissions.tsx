import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Users,
  Check,
  X,
  UserCheck,
  Lock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { StaffMember } from '../types/admin';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const UserRolesPermissions: React.FC = () => {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/staff-members');
      setStaff(res.data);
    } catch {
      // Fallback
      setStaff([
        {
          id: 1,
          name: 'Principal Administrator',
          email: 'admin@yurae.com',
          role: 'SUPER_ADMIN',
          is_active: true,
          created_at: '2026-01-01',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      setUpdatingId(userId);
      await api.put(`/admin/staff-members/${userId}/role`, { role: newRole });
      showToast(`Updated role to ${newRole}`, 'success');
      fetchStaff();
    } catch (err: any) {
      showToast('Failed to update staff role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      render: (s) => (
        <div className="space-y-0.5">
          <p className="font-bold text-gray-900">{s.name}</p>
          <p className="text-[10px] text-gray-600 font-mono">{s.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (s) => (
        <select
          value={s.role}
          onChange={(e) => handleUpdateRole(s.id, e.target.value)}
          disabled={updatingId === s.id}
          className="px-2.5 py-1 bg-white border border-[#F1BCCE] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="SUPER_ADMIN">👑 Super Admin</option>
          <option value="ADMIN">🛡️ Admin</option>
          <option value="PRODUCT_MANAGER">📦 Product Manager</option>
          <option value="WAREHOUSE_STAFF">🏭 Warehouse / WMS Staff</option>
          <option value="CUSTOMER_SUPPORT">💬 Customer Support</option>
          <option value="FINANCE">📊 Finance &amp; Accounts</option>
        </select>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (s) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            s.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {s.is_active ? 'ACTIVE' : 'INACTIVE'}
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
            Security &amp; Role-Based Access Control (RBAC)
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Staff Roles &amp; Permissions Matrix
          </h2>
          <p className="text-xs text-gray-500">
            Enforce granular department access for fulfillment clerks, inventory managers, support agents, and finance controllers.
          </p>
        </div>

        <button
          onClick={fetchStaff}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Refresh Staff</span>
        </button>
      </div>

      {/* Staff Table */}
      <DataTable<StaffMember>
        data={staff}
        columns={columns}
        keyExtractor={(s) => s.id}
        loading={loading}
        searchPlaceholder="Search staff member by name or email..."
        searchKeys={['name', 'email', 'role']}
      />

      {/* Permissions Matrix Reference Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
        <h3 className="font-serif text-base font-bold text-[#111111] border-b border-gray-100 pb-2">
          Enterprise RBAC Capabilities Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF0F4] text-[#111111] font-bold text-[10px] uppercase border-b border-[#F1BCCE]">
                <th className="p-3">Role</th>
                <th className="p-3 text-center">Catalog Edit</th>
                <th className="p-3 text-center">Fulfill Orders</th>
                <th className="p-3 text-center">Process Refunds</th>
                <th className="p-3 text-center">GST Reports</th>
                <th className="p-3 text-center">Audit Logs</th>
                <th className="p-3 text-center">Store Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-3 font-bold text-[#D84B7E]">👑 Super Admin</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800">📦 Product Manager</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800">🏭 Warehouse Staff</td>
                <td className="p-3 text-center text-gray-600">Stock Only</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800">💬 Customer Support</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-emerald-600">Initiate Only</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800">📊 Finance &amp; Accounts</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-gray-600">View Only</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-emerald-600">✓ Full</td>
                <td className="p-3 text-center text-rose-600">✕ Denied</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
