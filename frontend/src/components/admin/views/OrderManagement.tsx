import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Printer,
  RotateCcw,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  DollarSign,
  User as UserIcon,
  MapPin,
  Package,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Order } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { InvoiceModal } from '../../common/InvoiceModal';
import { PackingSlipModal } from '../../common/PackingSlipModal';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface OrderManagementProps {
  orders: Order[];
  onRefreshOrders: () => void;
  selectedOrderFromSearch?: Order | null;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  onRefreshOrders,
  selectedOrderFromSearch,
}) => {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Order Details Drawer
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(
    selectedOrderFromSearch || null
  );

  // Modals for Invoices & Packing Slips
  const [invoiceModalOrderId, setInvoiceModalOrderId] = useState<string | number | null>(null);
  const [packingSlipOrderId, setPackingSlipOrderId] = useState<number | null>(null);

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Cancel order confirm dialog
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.order_status.toUpperCase() !== statusFilter) {
        return false;
      }
      if (paymentFilter !== 'ALL' && (o.payment_status || 'PENDING').toUpperCase() !== paymentFilter) {
        return false;
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order status updated to "${newStatus}"`, 'success');
      onRefreshOrders();
      if (inspectedOrder && inspectedOrder.id === orderId) {
        setInspectedOrder((prev) => (prev ? { ...prev, order_status: newStatus as any } : null));
      }
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    try {
      setIsCancelling(true);
      await api.put(`/orders/${cancelModalOrder.id}/status`, { status: 'Cancelled' });
      showToast(`Order #${cancelModalOrder.order_number} cancelled`, 'success');
      setCancelModalOrder(null);
      if (inspectedOrder && inspectedOrder.id === cancelModalOrder.id) {
        setInspectedOrder(null);
      }
      onRefreshOrders();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExportOrdersCsv = () => {
    const exportData = filteredOrders.map((o) => ({
      Order_Number: o.order_number,
      Date: o.created_at,
      Customer_Name: o.user ? `${o.user.first_name} ${o.user.last_name}` : 'Client',
      Customer_Email: o.user?.email || '',
      Total_Amount: o.total_amount,
      Currency: o.currency || 'INR',
      Payment_Status: o.payment_status,
      Order_Status: o.order_status,
      Courier_AWB: o.awb_code || '',
    }));

    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yurae_orders_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Orders ledger exported to CSV successfully', 'success');
  };

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      header: 'Order Details',
      sortable: true,
      render: (o) => (
        <div className="space-y-0.5 min-w-[140px]">
          <p
            className="font-bold text-gray-900 hover:text-[#D84B7E] cursor-pointer"
            onClick={() => setInspectedOrder(o)}
          >
            #{o.order_number}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>{o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Recent'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Client & Shipping',
      render: (o) => (
        <div className="min-w-[160px] space-y-0.5">
          <p className="font-semibold text-gray-900">
            {o.user ? `${o.user.first_name} ${o.user.last_name}` : 'Client'}
          </p>
          <p className="text-[10px] text-gray-600 truncate">{o.address?.city || 'India'}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => (
        <span className="font-semibold text-gray-700">
          {o.items?.length || 1} item(s)
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total & Payment',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-serif font-bold text-gray-900">
            {o.currency || 'INR'} {o.total_amount}
          </span>
          <span
            className={`block text-[9px] font-bold ${
              o.payment_status === 'Paid'
                ? 'text-emerald-600'
                : o.payment_status === 'Failed'
                ? 'text-rose-600'
                : 'text-amber-600'
            }`}
          >
            {o.payment_status || 'Pending'}
          </span>
        </div>
      ),
    },
    {
      key: 'order_status',
      header: 'Fulfillment Status',
      sortable: true,
      render: (o) => {
        const st = o.order_status;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
              st === 'Delivered'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : st === 'Shipped'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : (st as string) === 'Packed'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : st === 'Cancelled'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {st}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Order Lifecycle Management
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Customer Orders &amp; Fulfillment
          </h2>
          <p className="text-xs text-gray-500">
            Process orders through verification, packing slips, tax invoices, and shipping logistics.
          </p>
        </div>

        <button
          onClick={handleExportOrdersCsv}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">All Order Statuses ({orders.length})</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">Payment: All</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Orders Data Table */}
      <DataTable<Order>
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search order number, customer name, email, or AWB..."
        searchKeys={['order_number', 'payment_status', 'order_status', 'awb_code']}
        renderActions={(o) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setInspectedOrder(o)}
              className="p-1.5 rounded-lg border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] transition-colors"
              title="Inspect order details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setInvoiceModalOrderId(o.id)}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
              title="GST Tax Invoice"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPackingSlipOrderId(o.id)}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
              title="Print Packing Slip"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Order Inspector Drawer */}
      {inspectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            onClick={() => setInspectedOrder(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
            {/* Top Bar */}
            <div className="p-5 border-b border-[#F1BCCE]/60 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                  Order Inspector
                </span>
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  #{inspectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setInspectedOrder(null)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-6 text-xs">
              {/* Order Status Controller */}
              <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-2">
                <span className="font-bold text-[#111111] block">Update Fulfillment State</span>
                <div className="flex items-center gap-2">
                  <select
                    value={inspectedOrder.order_status}
                    onChange={(e) => handleUpdateOrderStatus(inspectedOrder.id, e.target.value)}
                    disabled={isUpdatingStatus}
                    className="flex-1 px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing / Atelier</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped / Courier</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons Suite */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setInvoiceModalOrderId(inspectedOrder.id)}
                  className="py-2 px-3 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] font-bold text-gray-800 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>GST Tax Invoice</span>
                </button>

                <button
                  onClick={() => setPackingSlipOrderId(inspectedOrder.id)}
                  className="py-2 px-3 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] font-bold text-gray-800 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D84B7E]" />
                  <span>Packing Slip</span>
                </button>
              </div>

              {/* Client & Address Info */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-bold border-b border-gray-100 pb-2">
                  <UserIcon className="w-4 h-4 text-[#D84B7E]" />
                  <span>Client Information</span>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-gray-900">
                    {inspectedOrder.user
                      ? `${inspectedOrder.user.first_name} ${inspectedOrder.user.last_name}`
                      : 'Client'}
                  </p>
                  <p className="text-gray-600">{inspectedOrder.user?.email}</p>
                </div>

                {inspectedOrder.address && (
                  <div className="pt-2 border-t border-gray-100 space-y-1 text-gray-600">
                    <p className="font-semibold text-gray-800">Shipping Address:</p>
                    <p>{inspectedOrder.address.street || inspectedOrder.address.address_line1}</p>
                    <p>
                      {inspectedOrder.address.city}, {inspectedOrder.address.state} -{' '}
                      {inspectedOrder.address.postal_code}
                    </p>
                    <p>{inspectedOrder.address.country}</p>
                    {inspectedOrder.address.phone && (
                      <p className="font-mono text-[11px] pt-1">Phone: {inspectedOrder.address.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Ordered Items */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-bold border-b border-gray-100 pb-2">
                  <Package className="w-4 h-4 text-[#D84B7E]" />
                  <span>Ordered Items ({inspectedOrder.items?.length || 0})</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {inspectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{item.product_name}</p>
                        {item.variant_info && (
                          <p className="text-[10px] text-gray-600">Size: {item.variant_info}</p>
                        )}
                        <p className="text-[10px] text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-serif font-bold text-gray-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="pt-3 border-t border-gray-200 space-y-1.5 text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{inspectedOrder.subtotal}</span>
                  </div>
                  {inspectedOrder.discount && inspectedOrder.discount > 0 ? (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-₹{inspectedOrder.discount}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>₹{inspectedOrder.shipping_fee || 0}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#111111] pt-1 border-t border-gray-100">
                    <span>Total Amount</span>
                    <span className="font-serif">
                      {inspectedOrder.currency || 'INR'} {inspectedOrder.total_amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Cancel Order */}
              {inspectedOrder.order_status !== 'Cancelled' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalOrder(inspectedOrder)}
                    className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-xs"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModalOrderId && (
        <InvoiceModal
          isOpen={Boolean(invoiceModalOrderId)}
          orderIdentifier={invoiceModalOrderId}
          onClose={() => setInvoiceModalOrderId(null)}
        />
      )}

      {/* Packing Slip Modal */}
      {packingSlipOrderId && (
        <PackingSlipModal
          orderId={packingSlipOrderId}
          onClose={() => setPackingSlipOrderId(null)}
        />
      )}

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelModalOrder)}
        title={`Cancel Order #${cancelModalOrder?.order_number}?`}
        message="Cancelling this order will mark its fulfillment as cancelled. If payment was received, you can initiate a refund from the payments tab."
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancelOrder}
        onCancel={() => setCancelModalOrder(null)}
      />
    </div>
  );
};
