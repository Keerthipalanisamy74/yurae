import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Download,
  Filter,
} from 'lucide-react';
import { Order } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { useToast } from '../../../context/ToastContext';

interface PaymentManagementProps {
  orders: Order[];
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({ orders }) => {
  const { showToast } = useToast();
  const [gatewayFilter, setGatewayFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Build transactions list from orders and payments
  const transactions = useMemo(() => {
    return orders.map((o) => {
      const p = o.payments?.[0];
      const method = p ? p.payment_method : o.is_cod ? 'Cash on Delivery' : 'Online Gateway';
      const txnId = p ? p.payment_id : `TXN-${o.order_number}`;
      const amount = o.total_amount;
      const status = o.payment_status || 'Pending';

      return {
        id: o.id,
        order_number: o.order_number,
        transaction_id: txnId,
        payment_method: method,
        amount: amount,
        currency: o.currency || 'INR',
        status: status,
        customer_name: o.user ? `${o.user.first_name} ${o.user.last_name}` : 'Client',
        created_at: o.created_at,
      };
    });
  }, [orders]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (gatewayFilter !== 'ALL' && !t.payment_method.toLowerCase().includes(gatewayFilter.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'ALL' && t.status.toUpperCase() !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [transactions, gatewayFilter, statusFilter]);

  const totalCaptured = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const pendingAmount = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const columns: Column<any>[] = [
    {
      key: 'transaction_id',
      header: 'Transaction ID & Order',
      sortable: true,
      render: (t) => (
        <div className="space-y-0.5">
          <p className="font-mono font-bold text-gray-900">{t.transaction_id}</p>
          <p className="text-[10px] text-gray-600">Order: #{t.order_number}</p>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Client',
      sortable: true,
      render: (t) => <span className="font-semibold text-gray-800">{t.customer_name}</span>,
    },
    {
      key: 'payment_method',
      header: 'Gateway / Mode',
      sortable: true,
      render: (t) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE]">
          {t.payment_method}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (t) => (
        <span className="font-serif font-bold text-gray-900">
          {t.currency} {t.amount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      sortable: true,
      render: (t) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            t.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : t.status === 'Failed'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      sortable: true,
      render: (t) => (
        <span className="text-[11px] text-gray-600">
          {t.created_at ? new Date(t.created_at).toLocaleString() : 'Recent'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
          Treasury &amp; Gateway Ledgers
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#111111]">
          Payment Gateways &amp; Transactions
        </h2>
        <p className="text-xs text-gray-500">
          Monitor Razorpay, Stripe, PayPal, and Cash on Delivery payment settlements and reconciliations.
        </p>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Captured Settlements"
          value={`₹${totalCaptured.toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="from-emerald-600 to-teal-700"
          subtext="Net successful funds"
        />

        <StatCard
          title="Pending Settlements"
          value={`₹${pendingAmount.toLocaleString('en-IN')}`}
          icon={CreditCard}
          color="from-amber-600 to-amber-700"
          subtext="COD & awaiting webhook confirmations"
        />

        <StatCard
          title="Razorpay (Domestic INR)"
          value="Connected"
          icon={ShieldCheck}
          color="from-[#D84B7E] to-[#9C2758]"
          subtext="UPI, Cards & NetBanking"
          badge="Live"
        />

        <StatCard
          title="Stripe & PayPal (Global)"
          value="Multi-Currency"
          icon={CreditCard}
          color="from-[#54122E] to-[#111111]"
          subtext="USD, EUR, GBP, AED, SGD"
          badge="Active"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <select
          value={gatewayFilter}
          onChange={(e) => setGatewayFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">All Payment Gateways</option>
          <option value="Razorpay">Razorpay (India)</option>
          <option value="Stripe">Stripe (International)</option>
          <option value="PayPal">PayPal</option>
          <option value="Cash">Cash on Delivery (COD)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">Paid / Captured</option>
          <option value="PENDING">Pending / Processing</option>
          <option value="FAILED">Failed / Declined</option>
        </select>
      </div>

      {/* Transactions Table */}
      <DataTable<any>
        data={filteredTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search transaction ID, order number, or client..."
        searchKeys={['transaction_id', 'order_number', 'customer_name']}
      />
    </div>
  );
};
