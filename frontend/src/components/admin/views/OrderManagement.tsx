import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
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
  AlertTriangle,
  Sparkles,
  Cpu,
  Boxes,
  PackageCheck,
  Send,
  Navigation,
  Home,
  RefreshCw,
  Layers,
  SlidersHorizontal,
  CheckSquare,
  Square,
  MoreHorizontal,
  Phone,
  MessageSquare,
  Mail,
  AlertCircle,
  QrCode,
  Tag,
  ArrowUpDown,
  ChevronDown,
  Check,
  ArrowRight,
  X,
  Shield,
  FileSpreadsheet,
  Box,
  ClipboardList,
  Info,
  Flame,
  UserCheck,
  Building,
  CreditCard,
  History,
  Copy,
  Sliders,
} from 'lucide-react';
import { Order, OrderAnalyticsSummary, Order360Detail, CardStat } from '../../../types';
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

type AdminRole =
  | 'Super Admin'
  | 'Order Manager'
  | 'Warehouse Staff'
  | 'Packing Staff'
  | 'Customer Support'
  | 'Finance';

type ViewMode = 'standard' | 'warehouse';

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  onRefreshOrders,
  selectedOrderFromSearch,
}) => {
  const { showToast } = useToast();

  // --- Active View & Role Controls ---
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [activeRole, setActiveRole] = useState<AdminRole>('Super Admin');

  // --- Summary Analytics State ---
  const [analytics, setAnalytics] = useState<OrderAnalyticsSummary | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // --- Multi-Dimensional Filter State ---
  const [selectedCardKey, setSelectedCardKey] = useState<string>('TOTAL_ORDERS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('ALL'); // 'ALL' | 'COD' | 'PREPAID'
  const [cityFilter, setCityFilter] = useState<string>('');

  // --- Table Sorting & Pagination ---
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // --- Multi-Selection & Bulk Operations ---
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);

  // --- 360° Order Details Workbench ---
  const [inspectedOrderId, setInspectedOrderId] = useState<number | null>(
    selectedOrderFromSearch ? selectedOrderFromSearch.id : null
  );
  const [order360Detail, setOrder360Detail] = useState<Order360Detail | null>(null);
  const [isLoading360, setIsLoading360] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<
    'overview' | 'items' | 'packing' | 'picklist' | 'shipping' | 'invoice' | 'timeline' | 'communication'
  >('overview');

  // --- Packing Station Checklist State ---
  const [packingChecklist, setPackingChecklist] = useState<{
    itemsChecked: Record<string, boolean>;
    freeGifts: boolean;
    invoicePrinted: boolean;
    thankYouCard: boolean;
    samplesAdded: boolean;
    bubbleWrap: boolean;
    outerBox: boolean;
    shippingLabel: boolean;
    boxType: string;
    packerName: string;
    totalWeightKg: number;
  }>({
    itemsChecked: {},
    freeGifts: true,
    invoicePrinted: true,
    thankYouCard: true,
    samplesAdded: true,
    bubbleWrap: true,
    outerBox: true,
    shippingLabel: true,
    boxType: 'Luxury Matte Box',
    packerName: 'Warehouse Specialist',
    totalWeightKg: 0.45,
  });
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  // --- Customer Communication Modal ---
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [commChannel, setCommChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP' | 'CALL'>('EMAIL');
  const [commSubject, setCommSubject] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [isSendingComm, setIsSendingComm] = useState(false);

  // --- Internal Notes State ---
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // --- Modals for Invoices & Packing Slips ---
  const [invoiceModalOrderId, setInvoiceModalOrderId] = useState<string | number | null>(null);
  const [packingSlipOrderId, setPackingSlipOrderId] = useState<number | null>(null);

  // --- Order Cancellation Confirm Dialog ---
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- Refund Modal ---
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Customer Satisfaction / Return');
  const [refundType, setRefundType] = useState<string>('FULL');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [isRequestingPickup, setIsRequestingPickup] = useState(false);

  // Fetch Summary Cards Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);
      const res = await api.get('/admin/orders/analytics-summary');
      setAnalytics(res.data);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, orders.length]);

  // Fetch 360 Order Detail when order is inspected
  const fetch360Detail = useCallback(async (orderId: number) => {
    try {
      setIsLoading360(true);
      const res = await api.get(`/admin/orders/${orderId}/detail`);
      setOrder360Detail(res.data);

      // Initialize packing checklist state
      const savedChecklist = res.data.packing_checklist || {};
      const initialItems: Record<string, boolean> = {};
      res.data.items.forEach((it: any) => {
        initialItems[String(it.id)] = savedChecklist.items_checked?.[String(it.id)] ?? false;
      });

      setPackingChecklist({
        itemsChecked: initialItems,
        freeGifts: savedChecklist.free_gifts_included ?? true,
        invoicePrinted: savedChecklist.invoice_printed ?? true,
        thankYouCard: savedChecklist.thank_you_card_included ?? true,
        samplesAdded: savedChecklist.samples_added ?? true,
        bubbleWrap: savedChecklist.bubble_wrap_done ?? true,
        outerBox: savedChecklist.outer_box_secured ?? true,
        shippingLabel: savedChecklist.shipping_label_attached ?? true,
        boxType: savedChecklist.box_type || 'Luxury Matte Box',
        packerName: savedChecklist.packer_name || 'Warehouse Specialist',
        totalWeightKg: savedChecklist.total_weight_kg || 0.45,
      });

      setRefundAmount(res.data.order.total_amount);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to load order 360 detail', 'error');
    } finally {
      setIsLoading360(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (inspectedOrderId) {
      fetch360Detail(inspectedOrderId);
    } else {
      setOrder360Detail(null);
    }
  }, [inspectedOrderId, fetch360Detail]);

  // --- Filtering Logic (100% in sync with Backend Definition) ---
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const st = (o.order_status || '').toUpperCase();
      const pst = (o.payment_status || 'PENDING').toUpperCase();
      const fst = (o.fulfillment_status || '').toUpperCase();
      const courier = (o.courier_name || '').toUpperCase();
      const priority = (o.priority || 'NORMAL').toUpperCase();
      const isCod = Boolean(o.is_cod);
      const city = (o.address?.city || '').toLowerCase();
      const orderDate = o.created_at ? new Date(o.created_at) : new Date();

      // 1. Summary Card Filter
      if (selectedCardKey !== 'TOTAL_ORDERS') {
        if (selectedCardKey === 'NEW_ORDERS') {
          if (
            !['PENDING', 'NEW_ORDER', 'NEW ORDER', 'NEW'].includes(st) &&
            !['NEW_ORDER', 'PENDING'].includes(fst)
          ) {
            return false;
          }
        } else if (selectedCardKey === 'PENDING_PAYMENT') {
          if (!['PENDING', 'UNPAID'].includes(pst)) return false;
        } else if (selectedCardKey === 'PAID_ORDERS') {
          if (!['PAID', 'SUCCESS'].includes(pst)) return false;
        } else if (selectedCardKey === 'PROCESSING_ORDERS') {
          if (
            !['PROCESSING', 'CONFIRMED'].includes(st) &&
            ![
              'ORDER_CONFIRMED',
              'PICK_LIST_GENERATED',
              'ITEMS_PICKED',
              'QUALITY_CHECKED',
              'PACKING_STARTED',
              'PROCESSING',
            ].includes(fst)
          ) {
            return false;
          }
        } else if (selectedCardKey === 'READY_TO_PACK') {
          if (
            !['PICK_LIST_GENERATED', 'ITEMS_PICKED', 'QUALITY_CHECKED', 'READY_TO_PACK'].includes(fst) &&
            !(st === 'PROCESSING' && !['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(fst))
          ) {
            return false;
          }
        } else if (selectedCardKey === 'PACKED_ORDERS') {
          if (st !== 'PACKED' && fst !== 'PACKED') return false;
        } else if (selectedCardKey === 'READY_TO_SHIP') {
          const isReadyToShip =
            ['PACKED', 'SHIPPING_LABEL_PRINTED', 'COURIER_ASSIGNED', 'READY_TO_SHIP'].includes(fst) ||
            st === 'PACKED';
          if (!isReadyToShip || ['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(st)) return false;
        } else if (selectedCardKey === 'SHIPPED_ORDERS') {
          if (
            !['SHIPPED', 'IN_TRANSIT'].includes(st) &&
            !['SHIPPED', 'PICKED_UP', 'IN_TRANSIT'].includes(fst)
          ) {
            return false;
          }
        } else if (selectedCardKey === 'OUT_FOR_DELIVERY') {
          if (!['OUT FOR DELIVERY', 'OUT_FOR_DELIVERY'].includes(st) && fst !== 'OUT_FOR_DELIVERY') {
            return false;
          }
        } else if (selectedCardKey === 'DELIVERED_ORDERS') {
          if (
            !['DELIVERED', 'ORDER_COMPLETED', 'COMPLETED'].includes(st) &&
            !['DELIVERED', 'ORDER_COMPLETED'].includes(fst)
          ) {
            return false;
          }
        } else if (selectedCardKey === 'CANCELLED_ORDERS') {
          if (!['CANCELLED', 'CANCELED'].includes(st) && fst !== 'CANCELLED') return false;
        } else if (selectedCardKey === 'RETURNED_ORDERS') {
          if (
            !['RETURNED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_COMPLETED'].includes(st) &&
            !['RETURNED', 'RTO'].includes(fst)
          ) {
            return false;
          }
        } else if (selectedCardKey === 'REFUNDED_ORDERS') {
          if (
            !['REFUNDED', 'REFUND_COMPLETED'].includes(pst) &&
            !['REFUNDED', 'REFUND REQUESTED', 'REFUND APPROVED', 'REFUND COMPLETED'].includes(st) &&
            fst !== 'REFUND_COMPLETED'
          ) {
            return false;
          }
        } else if (selectedCardKey === 'FAILED_PAYMENTS') {
          if (!['FAILED', 'FAILURE'].includes(pst)) return false;
        }
      }

      // 2. Status Dropdown
      if (statusFilter !== 'ALL' && st !== statusFilter.toUpperCase()) return false;

      // 3. Payment Status Dropdown
      if (paymentFilter !== 'ALL' && pst !== paymentFilter.toUpperCase()) return false;

      // 4. Courier Dropdown
      if (courierFilter !== 'ALL' && !courier.includes(courierFilter.toUpperCase())) return false;

      // 5. Priority Dropdown
      if (priorityFilter !== 'ALL' && priority !== priorityFilter.toUpperCase()) return false;

      // 6. Payment Type (COD vs Prepaid)
      if (paymentTypeFilter === 'COD' && !isCod) return false;
      if (paymentTypeFilter === 'PREPAID' && isCod) return false;

      // 7. City Filter
      if (cityFilter && !city.includes(cityFilter.toLowerCase())) return false;

      // 8. Date Preset & Range
      const now = new Date();
      if (datePreset === 'TODAY') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (orderDate < todayStart) return false;
      } else if (datePreset === 'YESTERDAY') {
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (orderDate < yesterdayStart || orderDate >= todayStart) return false;
      } else if (datePreset === 'THIS_WEEK') {
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < weekStart) return false;
      } else if (datePreset === 'THIS_MONTH') {
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < monthStart) return false;
      } else if (datePreset === 'CUSTOM') {
        if (customStartDate && orderDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }

      // 9. Search Term (Order #, Customer Name, Email, Phone, AWB, Product)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const orderNum = o.order_number.toLowerCase();
        const custName = o.user ? `${o.user.first_name} ${o.user.last_name}`.toLowerCase() : '';
        const custEmail = o.user?.email?.toLowerCase() || '';
        const custPhone = o.address?.phone || o.user?.phone || '';
        const awb = (o.awb_code || '').toLowerCase();
        const productMatch = o.items?.some((it) => it.product_name.toLowerCase().includes(q));

        if (
          !orderNum.includes(q) &&
          !custName.includes(q) &&
          !custEmail.includes(q) &&
          !custPhone.includes(q) &&
          !awb.includes(q) &&
          !productMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    orders,
    selectedCardKey,
    statusFilter,
    paymentFilter,
    courierFilter,
    priorityFilter,
    paymentTypeFilter,
    cityFilter,
    datePreset,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // --- Sorting ---
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];

      if (sortField === 'customer') {
        aVal = a.user ? `${a.user.first_name} ${a.user.last_name}` : '';
        bVal = b.user ? `${b.user.first_name} ${b.user.last_name}` : '';
      } else if (sortField === 'items_count') {
        aVal = a.items?.length || 0;
        bVal = b.items?.length || 0;
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortField, sortDirection]);

  // --- Pagination ---
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // --- Selection / Bulk Handlers ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, id]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!selectedOrderIds.length) {
      showToast('Please select at least one order.', 'warning');
      return;
    }

    if (action.startsWith('EXPORT')) {
      try {
        setIsProcessingBulk(true);
        const res = await api.post(
          '/admin/orders/bulk-action',
          { order_ids: selectedOrderIds, action },
          { responseType: 'blob' }
        );
        const ext = action === 'EXPORT_EXCEL' ? 'tsv' : 'csv';
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `yurae_bulk_orders_${new Date().toISOString().slice(0, 10)}.${ext}`;
        link.click();
        showToast('Orders export completed successfully', 'success');
      } catch {
        showToast('Failed to export orders.', 'error');
      } finally {
        setIsProcessingBulk(false);
      }
      return;
    }

    try {
      setIsProcessingBulk(true);
      const res = await api.post('/admin/orders/bulk-action', {
        order_ids: selectedOrderIds,
        action,
      });
      showToast(res.data.message || 'Bulk operation completed', 'success');
      setSelectedOrderIds([]);
      onRefreshOrders();
      fetchAnalytics();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Bulk operation failed', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // --- Status Update Handler ---
  const handleUpdateOrderStatus = async (orderId: number, targetStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { order_status: targetStatus });
      showToast(`Order status updated to "${targetStatus}"`, 'success');
      onRefreshOrders();
      fetchAnalytics();
      if (inspectedOrderId === orderId) {
        fetch360Detail(orderId);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update order status', 'error');
    }
  };

  // --- Save Packing Checklist & Complete Packing ---
  const handleSavePackingChecklist = async (advanceToPacked: boolean = false) => {
    if (!inspectedOrderId || !order360Detail) return;

    if (advanceToPacked) {
      // Validate all items are checked
      const uncheckedItem = order360Detail.items.find(
        (it) => !packingChecklist.itemsChecked[String(it.id)]
      );
      if (uncheckedItem) {
        showToast(`Please verify and check "${uncheckedItem.product_name}" before packing.`, 'warning');
        return;
      }
      if (
        !packingChecklist.invoicePrinted ||
        !packingChecklist.samplesAdded ||
        !packingChecklist.outerBox ||
        !packingChecklist.shippingLabel
      ) {
        showToast('All quality and packaging safety checks must be ticked.', 'warning');
        return;
      }
    }

    try {
      setIsSavingChecklist(true);
      await api.post(`/admin/orders/${inspectedOrderId}/packing-checklist`, {
        items_checked: packingChecklist.itemsChecked,
        free_gifts_included: packingChecklist.freeGifts,
        invoice_printed: packingChecklist.invoicePrinted,
        thank_you_card_included: packingChecklist.thankYouCard,
        samples_added: packingChecklist.samplesAdded,
        bubble_wrap_done: packingChecklist.bubbleWrap,
        outer_box_secured: packingChecklist.outerBox,
        shipping_label_attached: packingChecklist.shippingLabel,
        packer_name: packingChecklist.packerName,
        box_type: packingChecklist.boxType,
        total_weight_kg: packingChecklist.totalWeightKg,
        advance_to_packed: advanceToPacked,
      });

      showToast(
        advanceToPacked ? 'Order successfully packed and sealed!' : 'Packing checklist saved.',
        'success'
      );
      onRefreshOrders();
      fetchAnalytics();
      fetch360Detail(inspectedOrderId);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update packing checklist', 'error');
    } finally {
      setIsSavingChecklist(false);
    }
  };

  // --- Request Courier Pickup & Generate AWB ---
  const handleRequestCourierPickup = async () => {
    if (!inspectedOrderId) return;
    try {
      setIsRequestingPickup(true);
      const res = await api.post(`/shipping/orders/${inspectedOrderId}/create-shipment`);
      showToast(res.data.message || 'Courier pickup scheduled and AWB assigned!', 'success');
      onRefreshOrders();
      fetchAnalytics();
      fetch360Detail(inspectedOrderId);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to schedule courier pickup', 'error');
    } finally {
      setIsRequestingPickup(false);
    }
  };

  // --- Add Internal Note ---
  const handleAddInternalNote = async () => {
    if (!inspectedOrderId || !newInternalNote.trim()) return;
    try {
      setIsAddingNote(true);
      await api.post(`/admin/orders/${inspectedOrderId}/notes`, { note: newInternalNote });
      showToast('Internal note saved', 'success');
      setNewInternalNote('');
      fetch360Detail(inspectedOrderId);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to add note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  // --- Send Direct Patron Communication ---
  const handleSendCommunication = async () => {
    if (!inspectedOrderId || !commMessage.trim()) return;
    try {
      setIsSendingComm(true);
      await api.post(`/admin/orders/${inspectedOrderId}/send-communication`, {
        channel: commChannel,
        subject: commSubject || undefined,
        message: commMessage,
      });
      showToast(`${commChannel} communication sent to patron`, 'success');
      setIsCommModalOpen(false);
      setCommMessage('');
      setCommSubject('');
      fetch360Detail(inspectedOrderId);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to send communication', 'error');
    } finally {
      setIsSendingComm(false);
    }
  };

  // --- Process Refund ---
  const handleProcessRefund = async () => {
    if (!inspectedOrderId) return;
    try {
      setIsProcessingRefund(true);
      await api.post('/fulfillment/refunds/initiate', {
        order_id: inspectedOrderId,
        amount: refundAmount,
        reason: refundReason,
        refund_type: refundType,
        refund_mode: 'ORIGINAL_PAYMENT',
      });
      showToast(`Refund of ₹${refundAmount} processed successfully`, 'success');
      setIsRefundModalOpen(false);
      onRefreshOrders();
      fetchAnalytics();
      fetch360Detail(inspectedOrderId);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to process refund', 'error');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // --- Cancel Order ---
  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    try {
      setIsCancelling(true);
      await api.put(`/orders/${cancelModalOrder.id}/status`, { order_status: 'Cancelled' });
      showToast(`Order #${cancelModalOrder.order_number} cancelled`, 'success');
      setCancelModalOrder(null);
      if (inspectedOrderId === cancelModalOrder.id) {
        fetch360Detail(inspectedOrderId);
      }
      onRefreshOrders();
      fetchAnalytics();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // --- Role Permission Helper ---
  const canPerform = (action: string): boolean => {
    if (activeRole === 'Super Admin') return true;
    if (activeRole === 'Order Manager') return !['REFUND_ISSUE'].includes(action);
    if (activeRole === 'Warehouse Staff') return ['VIEW', 'PICK', 'QC', 'PRINT_SLIP'].includes(action);
    if (activeRole === 'Packing Staff') return ['VIEW', 'PACK', 'PRINT_LABEL', 'PRINT_SLIP'].includes(action);
    if (activeRole === 'Customer Support') return ['VIEW', 'NOTE', 'COMMUNICATE', 'PRINT_INVOICE'].includes(action);
    if (activeRole === 'Finance') return ['VIEW', 'PRINT_INVOICE', 'REFUND_ISSUE', 'EXPORT'].includes(action);
    return true;
  };

  // 15 Lifecycle Cards Config
  const summaryCardsList = [
    { key: 'TOTAL_ORDERS', label: 'Total Orders', icon: ClipboardList },
    { key: 'NEW_ORDERS', label: 'New Orders', icon: Sparkles },
    { key: 'PENDING_PAYMENT', label: 'Pending Payment', icon: Clock },
    { key: 'PAID_ORDERS', label: 'Paid Orders', icon: CheckCircle2 },
    { key: 'PROCESSING_ORDERS', label: 'Processing', icon: Cpu },
    { key: 'READY_TO_PACK', label: 'Ready to Pack', icon: Boxes },
    { key: 'PACKED_ORDERS', label: 'Packed Orders', icon: PackageCheck },
    { key: 'READY_TO_SHIP', label: 'Ready to Ship', icon: Send },
    { key: 'SHIPPED_ORDERS', label: 'Shipped Orders', icon: Truck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery', icon: Navigation },
    { key: 'DELIVERED_ORDERS', label: 'Delivered', icon: Home },
    { key: 'CANCELLED_ORDERS', label: 'Cancelled', icon: XCircle },
    { key: 'RETURNED_ORDERS', label: 'Returned', icon: RotateCcw },
    { key: 'REFUNDED_ORDERS', label: 'Refunded', icon: DollarSign },
    { key: 'FAILED_PAYMENTS', label: 'Failed Payments', icon: AlertTriangle },
  ];

  const selectedCardMeta = summaryCardsList.find((c) => c.key === selectedCardKey);

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP BAR: HEADER, ROLE SWITCHER & WORKSPACE VIEW MODE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F1BCCE]/60 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE]">
              Enterprise Order Management
            </span>
            <span className="text-xs text-gray-400">•</span>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Shield className="w-3.5 h-3.5 text-[#D84B7E]" />
              <span className="font-semibold">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as AdminRole)}
                className="bg-transparent font-bold text-[#111111] focus:outline-none cursor-pointer hover:text-[#D84B7E]"
              >
                <option value="Super Admin">Super Admin (All Access)</option>
                <option value="Order Manager">Order Manager</option>
                <option value="Warehouse Staff">Warehouse Staff</option>
                <option value="Packing Staff">Packing Staff</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Finance">Finance &amp; Auditing</option>
              </select>
            </div>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
            Order Fulfillment &amp; Logistics Control
          </h1>
          <p className="text-xs text-gray-500">
            Real-time multi-carrier order lifecycle, warehouse packing workbench, GST invoicing, and patron telemetry.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Warehouse Mode Toggle */}
          <button
            onClick={() => setViewMode((prev) => (prev === 'standard' ? 'warehouse' : 'standard'))}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
              viewMode === 'warehouse'
                ? 'bg-[#111111] text-white ring-2 ring-[#D84B7E]'
                : 'bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE] hover:bg-[#FCE7F0]'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>{viewMode === 'warehouse' ? 'Exit Warehouse Mode' : 'Warehouse Station Mode'}</span>
          </button>

          {/* Analytics Reports Modal Button */}
          <button
            onClick={() => setIsReportsModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <History className="w-4 h-4 text-[#D84B7E]" />
            <span>Analytics Reports</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={async () => {
              try {
                setIsRefreshingOrders(true);
                if (onRefreshOrders) {
                  await onRefreshOrders();
                }
                await fetchAnalytics();
                showToast('Refreshed just now', 'success');
              } catch {
                showToast('Failed to refresh orders', 'error');
              } finally {
                setTimeout(() => setIsRefreshingOrders(false), 600);
              }
            }}
            disabled={isRefreshingOrders || isLoadingAnalytics}
            className="p-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer shadow-2xs active:scale-95 touch-target"
            title="Refresh Orders (Auto-refreshes every 10 seconds)"
          >
            <RefreshCw
              className={`w-4 h-4 text-[#D84B7E] transition-transform duration-500 ${
                isRefreshingOrders || isLoadingAnalytics ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 15 SUMMARY CARDS HORIZONTAL SCROLLER / GRID */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest font-bold text-gray-500">
              Lifecycle Milestones ({filteredOrders.length} filtered / {orders.length} total)
            </span>
          </div>
          {selectedCardKey !== 'TOTAL_ORDERS' && (
            <button
              onClick={() => setSelectedCardKey('TOTAL_ORDERS')}
              className="text-xs font-bold text-[#D84B7E] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Reset to All Orders</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-2.5 overflow-x-auto pb-1 touch-scroll">
          {summaryCardsList.map((card) => {
            const stat: CardStat | undefined = analytics?.cards?.[card.key];
            const isSelected = selectedCardKey === card.key;
            const IconComponent = card.icon;

            return (
              <div
                key={card.key}
                onClick={() => setSelectedCardKey(isSelected && card.key !== 'TOTAL_ORDERS' ? 'TOTAL_ORDERS' : card.key)}
                className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between min-w-[130px] ${
                  isSelected
                    ? 'bg-[#111111] text-white border-[#D84B7E] ring-2 ring-[#D84B7E]/50 shadow-md transform -translate-y-0.5'
                    : 'bg-white text-gray-900 border-gray-200/80 hover:border-[#F1BCCE] hover:shadow-xs'
                }`}
              >
                {/* Top: Icon and Today count */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-[#FAF0F4] text-[#D84B7E]'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  {stat && stat.today_count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-[#D84B7E] text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      +{stat.today_count} today
                    </span>
                  )}
                </div>

                {/* Middle: Count & Label */}
                <div>
                  <div className="font-serif text-xl font-bold leading-tight">
                    {stat ? stat.count : 0}
                  </div>
                  <div
                    className={`text-[11px] font-semibold truncate ${
                      isSelected ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {card.label}
                  </div>
                </div>

                {/* Bottom: Total Revenue for this status */}
                <div className="mt-2 pt-2 border-t border-gray-100/20 text-[10px] flex items-center justify-between">
                  <span className={isSelected ? 'text-gray-400' : 'text-gray-600'}>Revenue</span>
                  <span className="font-mono font-bold">
                    ₹{stat ? (stat.total_revenue > 99999 ? `${(stat.total_revenue / 100000).toFixed(1)}L` : stat.total_revenue.toLocaleString('en-IN')) : 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE CARD FILTER CHIP BANNER */}
      {/* ========================================================================= */}
      {selectedCardKey !== 'TOTAL_ORDERS' && (
        <div className="bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl p-3 px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111111]">Active Card Filter:</span>
            <span className="bg-[#D84B7E] text-white font-bold px-2.5 py-0.5 rounded-full">
              {selectedCardMeta?.label || selectedCardKey} ({filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            onClick={() => setSelectedCardKey('TOTAL_ORDERS')}
            className="font-bold text-[#D84B7E] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Show All Orders</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STICKY FILTER & SEARCH CONTROL CONSOLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F1BCCE]/60 shadow-xs space-y-3 sticky top-2 z-20 backdrop-blur-md bg-white/95">
        {/* Search Bar + Primary Date Presets */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Universal Instant Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order #, Customer Name, Email, Phone, AWB Tracking #, or Product..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D84B7E]/30 focus:border-[#D84B7E] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Presets */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {['ALL', 'TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'CUSTOM'].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setDatePreset(preset);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  datePreset === preset
                    ? 'bg-[#D84B7E] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset === 'THIS_WEEK'
                  ? 'This Week'
                  : preset === 'THIS_MONTH'
                  ? 'This Month'
                  : preset.charAt(0) + preset.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers (Shown if CUSTOM selected) */}
        {datePreset === 'CUSTOM' && (
          <div className="p-3 bg-[#FAF0F4] rounded-2xl border border-[#F1BCCE] flex items-center gap-3 flex-wrap text-xs">
            <span className="font-bold text-[#D84B7E]">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-gray-600 font-semibold">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded-xl text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-600 font-semibold">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        )}

        {/* Secondary Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-gray-100">
          {/* Order Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D84B7E]"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING">Pending / New</option>
            <option value="PROCESSING">Processing / Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D84B7E]"
          >
            <option value="ALL">Payment: All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Payment Mode (COD vs Prepaid) */}
          <select
            value={paymentTypeFilter}
            onChange={(e) => {
              setPaymentTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D84B7E]"
          >
            <option value="ALL">Payment Method: All</option>
            <option value="PREPAID">Prepaid Online</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D84B7E]"
          >
            <option value="ALL">Priority: All</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High Priority</option>
            <option value="URGENT">Urgent (VIP)</option>
          </select>

          {/* Courier */}
          <select
            value={courierFilter}
            onChange={(e) => {
              setCourierFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D84B7E]"
          >
            <option value="ALL">Courier: All</option>
            <option value="SHIPROCKET">Shiprocket Express</option>
            <option value="BLUEDART">BlueDart Express</option>
            <option value="DELHIVERY">Delhivery Surface/Air</option>
            <option value="DTDC">DTDC Express</option>
            <option value="DHL">DHL Express Global</option>
          </select>

          {/* City / Location input */}
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by City..."
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-600 focus:outline-none focus:border-[#D84B7E] w-32"
          />

          {/* Clear Filters Button */}
          {(statusFilter !== 'ALL' ||
            paymentFilter !== 'ALL' ||
            courierFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            paymentTypeFilter !== 'ALL' ||
            cityFilter ||
            datePreset !== 'ALL' ||
            searchQuery ||
            selectedCardKey !== 'TOTAL_ORDERS') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setCourierFilter('ALL');
                setPriorityFilter('ALL');
                setPaymentTypeFilter('ALL');
                setCityFilter('');
                setDatePreset('ALL');
                setCustomStartDate('');
                setCustomEndDate('');
                setSearchQuery('');
                setSelectedCardKey('TOTAL_ORDERS');
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING BULK ACTIONS TOOLBAR */}
      {/* ========================================================================= */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#111111] text-white rounded-2xl p-3 px-5 shadow-2xl flex items-center justify-between gap-4 flex-wrap animate-in fade-in slide-in-from-bottom-2 duration-200 sticky top-36 z-30">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#D84B7E]" />
            <span className="text-xs font-bold">
              {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canPerform('PACK') && (
              <button
                onClick={() => handleBulkAction('MARK_PACKED')}
                disabled={isProcessingBulk}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Mark Packed
              </button>
            )}

            {canPerform('DISPATCH') && (
              <button
                onClick={() => handleBulkAction('MARK_SHIPPED')}
                disabled={isProcessingBulk}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Mark Shipped
              </button>
            )}

            <button
              onClick={() => handleBulkAction('EXPORT_CSV')}
              disabled={isProcessingBulk}
              className="px-3 py-1.5 bg-[#D84B7E] hover:bg-[#c23d6d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => handleBulkAction('EXPORT_EXCEL')}
              disabled={isProcessingBulk}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WAREHOUSE STATION MODE (TABLET & TOUCH OPTIMIZED) */}
      {/* ========================================================================= */}
      {viewMode === 'warehouse' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] text-white rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D84B7E] flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">Warehouse Packing &amp; Picking Bench</h3>
                <p className="text-xs text-gray-400">High-touch tablet interface for rapid item picking, QC checks, and box sealing.</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              {filteredOrders.length} Active Station Orders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border-2 border-gray-200 hover:border-[#D84B7E] shadow-sm space-y-4 transition-all"
              >
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">
                      AWB: {order.awb_code || 'Pending'}
                    </span>
                    <span className="font-serif font-bold text-lg text-gray-900">
                      #{order.order_number}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                      order.order_status === 'Packed'
                        ? 'bg-purple-100 text-purple-800'
                        : order.order_status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.order_status}
                  </span>
                </div>

                {/* Items preview */}
                <div className="space-y-2 bg-gray-50 p-3 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Pick List Items ({order.items?.length || 1}):
                  </span>
                  {order.items?.slice(0, 3).map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800 truncate max-w-[200px]">
                        {it.product_name}
                      </span>
                      <span className="font-bold font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900">
                        Qty: {it.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Touch Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setInspectedOrderId(order.id);
                      setActiveDetailTab('packing');
                    }}
                    className="py-3 bg-[#D84B7E] hover:bg-[#c23d6d] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Pack Bench</span>
                  </button>

                  <button
                    onClick={() => setPackingSlipOrderId(order.id)}
                    className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Pick Slip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STANDARD ORDERS DATA TABLE */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl border border-[#F1BCCE]/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF0F4] border-b border-[#F1BCCE]/60 text-[#111111]">
                <tr>
                  <th className="p-3.5 pl-5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedOrders.length > 0 &&
                        paginatedOrders.every((o) => selectedOrderIds.includes(o.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D84B7E] focus:ring-[#D84B7E] cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('order_number')}
                    className="p-3.5 font-bold cursor-pointer hover:text-[#D84B7E]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Order Details</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customer')}
                    className="p-3.5 font-bold cursor-pointer hover:text-[#D84B7E]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Customer</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3.5 font-bold">Items</th>
                  <th
                    onClick={() => handleSort('total_amount')}
                    className="p-3.5 font-bold cursor-pointer hover:text-[#D84B7E]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Total &amp; Payment</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('order_status')}
                    className="p-3.5 font-bold cursor-pointer hover:text-[#D84B7E]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Fulfillment Status</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="p-3.5 font-bold">Courier &amp; AWB</th>
                  <th className="p-3.5 font-bold">Staff &amp; Priority</th>
                  <th className="p-3.5 pr-5 text-right font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="font-bold text-sm text-gray-700">No matching orders found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try resetting your active card filter or search query.</p>
                      {selectedCardKey !== 'TOTAL_ORDERS' && (
                        <button
                          onClick={() => setSelectedCardKey('TOTAL_ORDERS')}
                          className="mt-3 px-4 py-1.5 bg-[#D84B7E] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#c23d6d]"
                        >
                          View All Orders ({orders.length})
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const st = order.order_status;
                    const pst = order.payment_status || 'Pending';
                    const priority = order.priority || 'NORMAL';

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-[#FAF0F4]/40 transition-colors ${
                          isSelected ? 'bg-[#FAF0F4]/70' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 pl-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                            className="w-4 h-4 rounded text-[#D84B7E] focus:ring-[#D84B7E] cursor-pointer"
                          />
                        </td>

                        {/* Order Number & Date */}
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <button
                              onClick={() => setInspectedOrderId(order.id)}
                              className="font-bold text-gray-900 hover:text-[#D84B7E] cursor-pointer text-left block"
                            >
                              #{order.order_number}
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>
                                {order.created_at
                                  ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'Recent'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Customer Details */}
                        <td className="p-3.5">
                          <div className="space-y-0.5 min-w-[150px]">
                            <p className="font-semibold text-gray-900 truncate">
                              {order.user
                                ? `${order.user.first_name} ${order.user.last_name}`
                                : order.address?.name || 'Patron'}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{order.user?.email || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {order.address?.city || 'India'}, {order.address?.state || ''}
                            </p>
                          </div>
                        </td>

                        {/* Items Count & Thumbnails */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                              {order.items?.length || 1} item{order.items?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount & Payment Status */}
                        <td className="p-3.5">
                          <div>
                            <span className="font-serif font-bold text-gray-900 text-sm">
                              {order.currency || 'INR'} {order.total_amount?.toLocaleString('en-IN')}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                  pst === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : pst === 'Failed'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {pst}
                              </span>
                              {order.is_cod && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-50 text-indigo-700">
                                  COD
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Fulfillment Status */}
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              st === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : st === 'Shipped'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : st === 'Packed'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : st === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : st === 'Returned'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                st === 'Delivered'
                                  ? 'bg-emerald-500'
                                  : st === 'Shipped'
                                  ? 'bg-blue-500'
                                  : st === 'Packed'
                                  ? 'bg-purple-500'
                                  : st === 'Cancelled'
                                  ? 'bg-rose-500'
                                  : 'bg-indigo-500'
                              }`}
                            />
                            <span>{st}</span>
                          </span>
                        </td>

                        {/* Courier & AWB */}
                        <td className="p-3.5">
                          <div className="space-y-0.5 min-w-[130px]">
                            <p className="font-semibold text-gray-900 text-[11px]">
                              {order.courier_name || 'Standard Express'}
                            </p>
                            {order.awb_code ? (
                              <span className="font-mono text-[10px] font-bold text-[#D84B7E] bg-[#FAF0F4] px-1.5 py-0.5 rounded border border-[#F1BCCE] block truncate">
                                AWB: {order.awb_code}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No AWB Assigned</span>
                            )}
                          </div>
                        </td>

                        {/* Staff & Priority */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                priority === 'URGENT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {priority === 'URGENT' && <Flame className="w-2.5 h-2.5 text-rose-600" />}
                              <span>{priority}</span>
                            </span>
                            <p className="text-[10px] text-gray-500 truncate">
                              {order.assigned_staff || 'Unassigned'}
                            </p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 360 Inspector */}
                            <button
                              onClick={() => setInspectedOrderId(order.id)}
                              className="p-2 rounded-xl border border-[#F1BCCE] bg-[#FAF0F4] hover:bg-[#D84B7E] text-[#D84B7E] hover:text-white transition-all shadow-2xs cursor-pointer"
                              title="Inspect 360° Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Invoice PDF */}
                            <button
                              onClick={() => setInvoiceModalOrderId(order.id)}
                              className="p-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer"
                              title="GST Tax Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Packing Slip */}
                            <button
                              onClick={() => setPackingSlipOrderId(order.id)}
                              className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all shadow-2xs cursor-pointer"
                              title="Packing Slip / Pick List"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Quick Pack Workbench Trigger */}
                            <button
                              onClick={() => {
                                setInspectedOrderId(order.id);
                                setActiveDetailTab('packing');
                              }}
                              className="p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white transition-all shadow-2xs cursor-pointer"
                              title="Packing Workbench & Checklist"
                            >
                              <Boxes className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 bg-gray-50/50 text-xs">
            <div className="flex items-center gap-2 text-gray-500 font-semibold">
              <span>Showing</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 font-bold text-gray-700"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
              <span>of {sortedOrders.length} orders</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 360° ORDER DETAILS WORKBENCH DRAWER / MODAL */}
      {/* ========================================================================= */}
      {inspectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-200">
          <div
            onClick={() => setInspectedOrderId(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-[#F1BCCE]/60 flex items-start justify-between bg-[#FFF8FA] gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                    Order 360° Inspector
                  </span>
                  <span className="text-xs text-gray-300">•</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      order360Detail?.order.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Priority: {order360Detail?.order.priority || 'NORMAL'}
                  </span>
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#111111] mt-0.5">
                  #{order360Detail?.order.order_number || inspectedOrderId}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCommModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-[#F1BCCE] text-[#D84B7E] hover:bg-[#FAF0F4] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Contact Patron</span>
                </button>

                <button
                  onClick={() => setInspectedOrderId(null)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 border-b border-gray-200 bg-white overflow-x-auto shrink-0 text-xs font-bold text-gray-600">
              {[
                { id: 'overview', label: 'Overview & Customer', icon: UserIcon },
                { id: 'items', label: `Products (${order360Detail?.items.length || 0})`, icon: Package },
                { id: 'packing', label: 'Packing Station', icon: Boxes },
                { id: 'picklist', label: 'Pick List', icon: ClipboardList },
                { id: 'shipping', label: 'Logistics & Labels', icon: Truck },
                { id: 'invoice', label: 'GST Invoice', icon: FileText },
                { id: 'timeline', label: 'Timeline & Notes', icon: History },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-[#D84B7E] text-[#D84B7E]'
                        : 'border-transparent hover:text-gray-900'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-gray-800 touch-scroll">
              {isLoading360 ? (
                <div className="py-20 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#D84B7E] mb-2" />
                  <p className="font-bold">Loading complete 360° order intelligence...</p>
                </div>
              ) : order360Detail ? (
                <>
                  {/* Order Alerts & Fraud Warnings Banner */}
                  {order360Detail.alerts && order360Detail.alerts.length > 0 && (
                    <div className="space-y-2">
                      {order360Detail.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                            alert.severity === 'danger'
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : alert.severity === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
                          <AlertTriangle
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              alert.severity === 'danger'
                                ? 'text-rose-600'
                                : alert.severity === 'warning'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }`}
                          />
                          <div>
                            <p className="font-bold">{alert.title}</p>
                            <p className="text-[11px] opacity-90 mt-0.5">{alert.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 1: OVERVIEW & CUSTOMER 360 */}
                  {activeDetailTab === 'overview' && (
                    <div className="space-y-6">
                      {/* State Machine Status Controller */}
                      <div className="p-4.5 rounded-3xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111111] text-sm">
                            Fulfillment Lifecycle Status
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D84B7E]">
                            Live State Machine
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                              Order Status:
                            </label>
                            <select
                              value={order360Detail.order.order_status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order360Detail.order.id, e.target.value)
                              }
                              className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#D84B7E]"
                            >
                              <option value="Pending">Pending Review</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing / Atelier</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped / In Transit</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Returned">Returned</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                              Payment Status:
                            </label>
                            <span
                              className={`w-full block px-3 py-2 rounded-xl font-bold text-xs border ${
                                order360Detail.order.payment_status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {order360Detail.order.payment_status || 'Pending'} (
                              {order360Detail.order.is_cod ? 'Cash on Delivery' : 'Prepaid Online'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Customer 360 Metrics Card */}
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2 text-gray-800 font-bold">
                            <UserCheck className="w-4 h-4 text-[#D84B7E]" />
                            <span className="text-sm">Patron Intelligence &amp; 360 Profile</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            Member since {order360Detail.customer.account_created_at}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] text-gray-500 block">Total Orders</span>
                            <span className="font-serif font-bold text-base text-gray-900">
                              {order360Detail.customer.total_orders}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] text-gray-500 block">Lifetime Spend</span>
                            <span className="font-serif font-bold text-base text-gray-900">
                              ₹{order360Detail.customer.lifetime_spend.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] text-gray-500 block">Contact Phone</span>
                            <span className="font-mono font-bold text-xs text-gray-900 truncate block">
                              {order360Detail.customer.phone}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] text-gray-500 block">Email Address</span>
                            <span className="font-mono font-bold text-xs text-gray-900 truncate block">
                              {order360Detail.customer.email}
                            </span>
                          </div>
                        </div>

                        {/* Shipping & Billing Addresses */}
                        {order360Detail.order.address && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                            <div className="p-3.5 bg-[#FAF0F4]/50 rounded-2xl border border-[#F1BCCE]/60 space-y-1">
                              <span className="font-bold text-[#D84B7E] text-[11px] flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> Shipping Address
                              </span>
                              <p className="font-bold text-gray-900">
                                {order360Detail.order.address.name}
                              </p>
                              <p className="text-gray-600">
                                {order360Detail.order.address.building_or_flat || ''}{' '}
                                {order360Detail.order.address.address_line1}
                              </p>
                              <p className="text-gray-600">
                                {order360Detail.order.address.city},{' '}
                                {order360Detail.order.address.state} -{' '}
                                <span className="font-bold text-gray-800">
                                  {order360Detail.order.address.postal_code}
                                </span>
                              </p>
                              <p className="text-gray-600">
                                {order360Detail.order.address.country}
                              </p>
                            </div>

                            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                              <span className="font-bold text-gray-700 text-[11px] flex items-center gap-1">
                                <Building className="w-3.5 h-3.5" /> Billing &amp; Tax Info
                              </span>
                              <p className="text-gray-600">
                                Same as Shipping Delivery Address
                              </p>
                              {order360Detail.order.gst_number ? (
                                <p className="font-mono font-bold text-[11px] text-gray-900 pt-1">
                                  GSTIN: {order360Detail.order.gst_number}
                                </p>
                              ) : (
                                <p className="text-[10px] text-gray-400 italic pt-1">
                                  Standard Consumer B2C Invoice
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRODUCTS & LIVE WAREHOUSE STOCK */}
                  {activeDetailTab === 'items' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <span className="font-bold text-sm text-[#111111]">
                            Ordered Products &amp; Live Stock Levels
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            {order360Detail.items.length} Product Line(s)
                          </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {order360Detail.items.map((item) => (
                            <div
                              key={item.id}
                              className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image_url}
                                  alt={item.product_name}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">
                                    {item.product_name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                    <span className="font-mono">SKU: {item.sku}</span>
                                    {item.variant_info && (
                                      <span>• Size: {item.variant_info}</span>
                                    )}
                                    <span>• HSN: {item.hsn_code}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-right self-end sm:self-center">
                                <div>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      item.live_warehouse_stock <= 5
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    Warehouse Stock: {item.live_warehouse_stock}
                                  </span>
                                </div>

                                <div className="min-w-[80px]">
                                  <span className="text-[11px] text-gray-500 block">
                                    {item.quantity} × ₹{item.unit_price}
                                  </span>
                                  <span className="font-serif font-bold text-gray-900 text-sm">
                                    ₹{item.total_price.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Financial Ledger Breakdown */}
                        <div className="pt-4 border-t border-gray-200 space-y-1.5 text-right text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal Amount</span>
                            <span className="font-serif">₹{order360Detail.order.subtotal}</span>
                          </div>
                          {order360Detail.order.discount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>Promotional Discount</span>
                              <span className="font-serif">-₹{order360Detail.order.discount}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-600">
                            <span>Shipping Fee</span>
                            <span className="font-serif">
                              ₹{order360Detail.order.shipping_fee || 0}
                            </span>
                          </div>
                          {order360Detail.order.tax ? (
                            <div className="flex justify-between text-gray-600">
                              <span>GST Tax Included</span>
                              <span className="font-serif">₹{order360Detail.order.tax}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-between font-bold text-base text-[#111111] pt-2 border-t border-gray-200">
                            <span>Grand Total Amount</span>
                            <span className="font-serif text-[#D84B7E]">
                              {order360Detail.order.currency || 'INR'}{' '}
                              {order360Detail.order.total_amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PACKING WORKBENCH & QUALITY CHECKLIST */}
                  {activeDetailTab === 'packing' && (
                    <div className="space-y-5">
                      <div className="p-5 rounded-3xl bg-white border border-purple-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-purple-600" />
                            <span className="font-bold text-sm text-gray-900">
                              Packing Workbench &amp; Checklist Verification
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                            Mandatory Safety Check
                          </span>
                        </div>

                        <p className="text-xs text-gray-600">
                          Warehouse staff must physically verify each item and packing step below.
                          Order status will only be advanced to <strong>Packed</strong> when all
                          items are checked.
                        </p>

                        {/* Product Items Verification */}
                        <div className="space-y-2 pt-2">
                          <span className="font-bold text-xs text-gray-800 block">
                            1. Ordered Formulations &amp; Apparel:
                          </span>
                          <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                            {order360Detail.items.map((item) => {
                              const isChecked = Boolean(
                                packingChecklist.itemsChecked[String(item.id)]
                              );
                              return (
                                <label
                                  key={item.id}
                                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        setPackingChecklist((prev) => ({
                                          ...prev,
                                          itemsChecked: {
                                            ...prev.itemsChecked,
                                            [String(item.id)]: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-gray-900 text-xs">
                                      {item.product_name}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-gray-600">
                                    Qty: {item.quantity} (SKU: {item.sku})
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Packaging Protocol Checklist */}
                        <div className="space-y-2 pt-2">
                          <span className="font-bold text-xs text-gray-800 block">
                            2. Packaging &amp; Brand Inclusions:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 text-xs font-semibold">
                            <label className="flex items-center gap-2 p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={packingChecklist.invoicePrinted}
                                onChange={(e) =>
                                  setPackingChecklist((p) => ({ ...p, invoicePrinted: e.target.checked }))
                                }
                                className="w-4 h-4 rounded text-purple-600"
                              />
                              <span>Tax Invoice Printed &amp; Inserted</span>
                            </label>

                            <label className="flex items-center gap-2 p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={packingChecklist.thankYouCard}
                                onChange={(e) =>
                                  setPackingChecklist((p) => ({ ...p, thankYouCard: e.target.checked }))
                                }
                                className="w-4 h-4 rounded text-purple-600"
                              />
                              <span>Luxury Thank You Card Added</span>
                            </label>

                            <label className="flex items-center gap-2 p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={packingChecklist.samplesAdded}
                                onChange={(e) =>
                                  setPackingChecklist((p) => ({ ...p, samplesAdded: e.target.checked }))
                                }
                                className="w-4 h-4 rounded text-purple-600"
                              />
                              <span>Complimentary Botanical Samples</span>
                            </label>

                            <label className="flex items-center gap-2 p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={packingChecklist.bubbleWrap}
                                onChange={(e) =>
                                  setPackingChecklist((p) => ({ ...p, bubbleWrap: e.target.checked }))
                                }
                                className="w-4 h-4 rounded text-purple-600"
                              />
                              <span>Fragile Bubble Wrap / Velvet Pouch</span>
                            </label>

                            <label className="flex items-center gap-2 p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={packingChecklist.outerBox}
                                onChange={(e) =>
                                  setPackingChecklist((p) => ({ ...p, outerBox: e.target.checked }))
                                }
                                className="w-4 h-4 rounded text-purple-600"
                              />
                              <span>Outer Box Sealed with Security Tape</span>
                            </label>

                            <label className="flex items-center gap-2 p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={packingChecklist.shippingLabel}
                                onChange={(e) =>
                                  setPackingChecklist((p) => ({ ...p, shippingLabel: e.target.checked }))
                                }
                                className="w-4 h-4 rounded text-purple-600"
                              />
                              <span>4x6 Shipping Label Attached</span>
                            </label>
                          </div>
                        </div>

                        {/* Workbench Action Triggers */}
                        <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-3 flex-wrap">
                          <button
                            onClick={() => handleSavePackingChecklist(false)}
                            disabled={isSavingChecklist}
                            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            Save Checklist Draft
                          </button>

                          <button
                            onClick={() => handleSavePackingChecklist(true)}
                            disabled={isSavingChecklist}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Complete Packing &amp; Mark Packed</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: WAREHOUSE PICK LIST */}
                  {activeDetailTab === 'picklist' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <span className="font-bold text-sm text-[#111111] block">
                              Warehouse Pick List &amp; Shelf Coordinates
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              List #{order360Detail.picklist.picklist_number}
                            </span>
                          </div>

                          <button
                            onClick={() => setPackingSlipOrderId(order360Detail.order.id)}
                            className="px-3.5 py-1.5 bg-[#111111] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#D84B7E] transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Pick List</span>
                          </button>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {order360Detail.picklist.items.map((pi) => (
                            <div
                              key={pi.id}
                              className="py-3 flex items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <p className="font-bold text-gray-900 text-xs">
                                  {pi.product_name}
                                </p>
                                <p className="text-[10px] font-mono text-gray-500">
                                  SKU: {pi.sku}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 text-right">
                                <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl font-mono font-bold text-xs text-amber-900">
                                  Rack / Shelf: {pi.shelf_location || 'Zone A-R1-B2'}
                                </span>
                                <span className="font-bold text-sm text-gray-900 min-w-[50px]">
                                  Qty: {pi.quantity_required}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: SHIPPING LOGISTICS & 4x6 THERMAL LABEL */}
                  {activeDetailTab === 'shipping' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#D84B7E]" />
                            <span className="font-bold text-sm text-gray-900">
                              Carrier Logistics, Pickup &amp; Thermal Label
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                            {order360Detail.order.shipping_status || 'SHIPMENT_CREATED'}
                          </span>
                        </div>

                        {/* International Export Customs Banner (if applicable) */}
                        {order360Detail.order.address?.country &&
                          !['india', 'in', 'bharat'].includes(
                            order360Detail.order.address.country.toLowerCase().trim()
                          ) && (
                            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold text-amber-900 text-xs block">
                                  Global Export Shipment ({order360Detail.order.address.country})
                                </span>
                                <p className="text-[11px] text-amber-800">
                                  Cosmetics Export HS Code: <strong className="font-mono">3304.99</strong> • Carrier: <strong>DHL Express Worldwide Priority</strong>. Export Customs Commercial Invoice is automatically generated.
                                </p>
                              </div>
                            </div>
                          )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 bg-gray-50 rounded-2xl space-y-1">
                            <span className="text-[10px] text-gray-500 block">Courier Partner</span>
                            <span className="font-bold text-sm text-gray-900 block">
                              {order360Detail.order.courier_name || 'Shiprocket / Blue Dart'}
                            </span>
                          </div>

                          <div className="p-3.5 bg-gray-50 rounded-2xl space-y-1">
                            <span className="text-[10px] text-gray-500 block">AWB Tracking #</span>
                            <span className="font-mono font-bold text-sm text-[#D84B7E] block truncate">
                              {order360Detail.order.awb_code || 'Pending Assignment'}
                            </span>
                          </div>

                          <div className="p-3.5 bg-gray-50 rounded-2xl space-y-1">
                            <span className="text-[10px] text-gray-500 block">Estimated Delivery</span>
                            <span className="font-bold text-sm text-gray-900 block">
                              {order360Detail.order.estimated_delivery_date || '2-4 Business Days'}
                            </span>
                          </div>
                        </div>

                        {/* Pickup Token & Manifest Status */}
                        {order360Detail.order.pickup_token_number && (
                          <div className="p-3 bg-[#FAF0F4] rounded-2xl border border-[#F1BCCE] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Boxes className="w-4 h-4 text-[#D84B7E]" />
                              <span className="font-bold text-gray-800">
                                Pickup Token: #{order360Detail.order.pickup_token_number}
                              </span>
                            </div>
                            <span className="text-gray-600 font-medium">
                              Scheduled Date: {order360Detail.order.pickup_scheduled_date || 'Today (Daily Slot)'}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons: Request Pickup, 4x6 Label & Tracking */}
                        <div className="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                          {/* Request/Re-trigger Courier Pickup */}
                          <button
                            onClick={handleRequestCourierPickup}
                            disabled={isRequestingPickup}
                            className="px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5 text-[#D84B7E]" />
                            <span>{isRequestingPickup ? 'Dispatching...' : 'Request Courier Pickup & AWB'}</span>
                          </button>

                          <a
                            href={order360Detail.shipping_label_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-[#D84B7E] hover:bg-[#c23d6d] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Download 4x6 Thermal Label (PDF)</span>
                          </a>

                          <button
                            onClick={() => handleUpdateOrderStatus(order360Detail.order.id, 'Shipped')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark as Shipped</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: GST TAX INVOICE */}
                  {activeDetailTab === 'invoice' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <span className="font-bold text-sm text-gray-900 block">
                              GST Compliance Tax Invoice
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">
                              {order360Detail.gst_invoice_number}
                            </span>
                          </div>

                          <button
                            onClick={() => setInvoiceModalOrderId(order360Detail.order.id)}
                            className="px-4 py-2 bg-[#D84B7E] hover:bg-[#c23d6d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View &amp; Print Full Tax Invoice</span>
                          </button>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          Official GST Tax Invoice includes Company GSTIN, Place of Supply, Harmonized System of Nomenclature (HSN) item codes, and CGST/SGST or IGST breakdowns.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 7: TIMELINE & INTERNAL NOTES */}
                  {activeDetailTab === 'timeline' && (
                    <div className="space-y-5">
                      {/* Chronological Event Stepper */}
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-4">
                        <span className="font-bold text-sm text-gray-900 block border-b border-gray-100 pb-2">
                          Order Event Timeline &amp; Audit Log
                        </span>

                        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                          {order360Detail.timeline.map((event, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#D84B7E] border-2 border-white shadow-xs" />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-gray-900">
                                    {event.title}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {event.timestamp}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-600">{event.description}</p>
                                <span className="text-[10px] font-mono text-gray-400 block">
                                  Actor: {event.actor}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Internal Admin Notes Feed */}
                      <div className="p-5 rounded-3xl bg-white border border-gray-200 space-y-3">
                        <span className="font-bold text-sm text-gray-900 block">
                          Internal Staff Notes
                        </span>

                        {order360Detail.internal_notes ? (
                          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs whitespace-pre-wrap text-gray-700 font-mono">
                            {order360Detail.internal_notes}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No internal notes added yet.</p>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={newInternalNote}
                            onChange={(e) => setNewInternalNote(e.target.value)}
                            placeholder="Add administrative or warehouse note..."
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#D84B7E]"
                          />
                          <button
                            onClick={handleAddInternalNote}
                            disabled={isAddingNote || !newInternalNote.trim()}
                            className="px-4 py-2 bg-[#111111] hover:bg-[#D84B7E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                          >
                            Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Danger Zone: Refund & Cancellation Actions */}
                  <div className="p-4 rounded-3xl bg-gray-50 border border-gray-200 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-gray-700">Financial &amp; Lifecycle Overrides:</span>
                    <div className="flex items-center gap-2">
                      {canPerform('REFUND_ISSUE') && order360Detail.order.payment_status === 'Paid' && (
                        <button
                          onClick={() => setIsRefundModalOpen(true)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Issue Refund
                        </button>
                      )}

                      {order360Detail.order.order_status !== 'Cancelled' && (
                        <button
                          onClick={() => setCancelModalOrder(order360Detail.order)}
                          className="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER COMMUNICATION MODAL */}
      {/* ========================================================================= */}
      {isCommModalOpen && order360Detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#F1BCCE]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-bold text-sm text-[#111111]">
                Send Customer Communication
              </span>
              <button
                onClick={() => setIsCommModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                {(['EMAIL', 'SMS', 'WHATSAPP', 'CALL'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setCommChannel(ch)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      commChannel === ch
                        ? 'bg-[#D84B7E] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {commChannel === 'EMAIL' && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Subject Line:</label>
                  <input
                    type="text"
                    value={commSubject}
                    onChange={(e) => setCommSubject(e.target.value)}
                    placeholder={`Update regarding Order #${order360Detail.order.order_number}`}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#D84B7E]"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message Content:</label>
                <textarea
                  rows={4}
                  value={commMessage}
                  onChange={(e) => setCommMessage(e.target.value)}
                  placeholder="Type your message to the customer..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#D84B7E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsCommModalOpen(false)}
                  className="px-3.5 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCommunication}
                  disabled={isSendingComm || !commMessage.trim()}
                  className="px-4 py-2 bg-[#D84B7E] hover:bg-[#c23d6d] text-white rounded-xl font-bold cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {isSendingComm ? 'Sending...' : 'Dispatch Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REFUND ISSUANCE MODAL */}
      {/* ========================================================================= */}
      {isRefundModalOpen && order360Detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-bold text-sm text-gray-900">
                Issue Financial Refund
              </span>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Refund Amount (₹):</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  max={order360Detail.order.total_amount}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-serif font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Reason for Refund:</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-3.5 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRefund}
                  disabled={isProcessingRefund || refundAmount <= 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {isProcessingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORTS & ANALYTICS MODAL */}
      {/* ========================================================================= */}
      {isReportsModalOpen && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#F1BCCE] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                  Enterprise Intelligence
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111]">
                  Order Analytics &amp; Revenue Reports
                </h3>
              </div>
              <button
                onClick={() => setIsReportsModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High Level KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-gray-600 block">Total Revenue</span>
                <span className="font-serif font-bold text-lg text-emerald-800">
                  ₹{analytics.total_revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-gray-600 block">Average Order Value</span>
                <span className="font-serif font-bold text-lg text-blue-800">
                  ₹{analytics.average_order_value}
                </span>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="text-gray-600 block">Repeat Customer Rate</span>
                <span className="font-serif font-bold text-lg text-purple-800">
                  {analytics.repeat_customer_rate}%
                </span>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-gray-600 block">Cancellation Rate</span>
                <span className="font-serif font-bold text-lg text-rose-800">
                  {analytics.cancellation_rate}%
                </span>
              </div>
            </div>

            {/* Top Products & Top Customers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <span className="font-bold text-gray-900 block border-b border-gray-200 pb-1.5">
                  Top Selling Formulations
                </span>
                <div className="divide-y divide-gray-200">
                  {analytics.top_products.map((p, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                        {p.product_name}
                      </span>
                      <span className="font-serif font-bold text-gray-900">
                        ₹{p.revenue.toLocaleString('en-IN')} ({p.quantity} units)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <span className="font-bold text-gray-900 block border-b border-gray-200 pb-1.5">
                  Top VIP Patrons by Spend
                </span>
                <div className="divide-y divide-gray-200">
                  {analytics.top_customers.map((c, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                        {c.customer_name}
                      </span>
                      <span className="font-serif font-bold text-[#D84B7E]">
                        ₹{c.total_spend.toLocaleString('en-IN')} ({c.order_count} orders)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
        message="Cancelling this order will mark its status as Cancelled and restore product quantities back to live warehouse inventory."
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancelOrder}
        onCancel={() => setCancelModalOrder(null)}
      />
    </div>
  );
};

