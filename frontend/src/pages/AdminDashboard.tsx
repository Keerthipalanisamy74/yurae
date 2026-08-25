import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, AlertTriangle, Plus, Trash2, Tag, Globe,
  RefreshCw, Edit, Clock, X, Sparkles, Power, LogOut,
  Mail, MessageSquare, Phone, Inbox, CheckCircle2, Eye,
  Truck, FileText, Send, Check, ExternalLink, ShieldCheck, Copy, RotateCcw, Download, Loader2, Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import {
  AdminDashboardStats, Product, Order, User as CustomerUser,
  Coupon, Category, CurrencyInfo, ContactMessage, ShippingSettings
} from '../types';
import { ProductFormModal } from '../components/common/ProductFormModal';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const { formatRawPrice } = useCurrency();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'shipping' | 'contact_messages' | 'order_queries' | 'customers' | 'inventory' | 'coupons' | 'currencies'>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageFilter, setMessageFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REPLIED'>('ALL');
  const [orderQueryFilter, setOrderQueryFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REPLIED'>('ALL');

  // Shipping & Fulfillment Management State
  const [shippingSubTab, setShippingSubTab] = useState<'shipments' | 'settings'>('shipments');
  const [shippingStatusFilter, setShippingStatusFilter] = useState<string>('ALL');
  const [shippingRegionFilter, setShippingRegionFilter] = useState<'ALL' | 'DOMESTIC' | 'INTERNATIONAL'>('ALL');
  const [shippingSearch, setShippingSearch] = useState<string>('');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [isSavingShippingSettings, setIsSavingShippingSettings] = useState<boolean>(false);
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [adminTrackingData, setAdminTrackingData] = useState<any>(null);
  const [isLoadingAdminTracking, setIsLoadingAdminTracking] = useState<boolean>(false);
  const [shippingActionLoading, setShippingActionLoading] = useState<{ [orderId: number]: string }>({});
  const [currencyData, setCurrencyData] = useState<{
    base_currency: string;
    rates: Record<string, number>;
    currencies: CurrencyInfo[];
    last_updated: string;
  } | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // New & Edit Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Coupon Creation State
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponVal, setNewCouponVal] = useState<number>(15);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(1000);
  const [newCouponDurationOption, setNewCouponDurationOption] = useState<string>('7'); // default 7 days
  const [newCouponCustomDays, setNewCouponCustomDays] = useState<number>(14);
  const [newCouponSpecificDate, setNewCouponSpecificDate] = useState<string>('');
  const [newCouponUsageLimit, setNewCouponUsageLimit] = useState<number>(100);
  const [newCouponActive, setNewCouponActive] = useState<boolean>(true);
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState<boolean>(false);

  // Coupon Edit State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCouponCode, setEditCouponCode] = useState('');
  const [editCouponType, setEditCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [editCouponVal, setEditCouponVal] = useState<number>(10);
  const [editCouponMinOrder, setEditCouponMinOrder] = useState<number>(1000);
  const [editCouponDurationOption, setEditCouponDurationOption] = useState<string>('keep');
  const [editCouponCustomDays, setEditCouponCustomDays] = useState<number>(7);
  const [editCouponSpecificDate, setEditCouponSpecificDate] = useState<string>('');
  const [editCouponUsageLimit, setEditCouponUsageLimit] = useState<number>(100);
  const [editCouponActive, setEditCouponActive] = useState<boolean>(true);
  const [isUpdatingCoupon, setIsUpdatingCoupon] = useState<boolean>(false);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, prodRes, ordRes, custRes, invRes, coupRes, catRes, curRes, msgRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/products?limit=100'),
        api.get('/admin/orders'),
        api.get('/admin/customers'),
        api.get('/admin/inventory'),
        api.get('/coupons?include_inactive=true'),
        api.get('/categories'),
        api.get('/currencies/rates'),
        api.get('/contact'),
      ]);

      setStats(statsRes.data);
      setProducts(prodRes.data);
      setOrders(ordRes.data);
      setCustomers(custRes.data);
      setInventory(invRes.data);
      setCoupons(coupRes.data);
      setCategories(catRes.data);
      setCurrencyData(curRes.data);
      setMessages(msgRes.data || []);

      // Fetch Shipping Settings
      api.get('/shipping/settings')
        .then((sRes) => setShippingSettings(sRes.data))
        .catch((err) => console.warn('Could not load shipping settings:', err));

    } catch {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Shipping & Fulfillment Actions
  const handleCreateShipment = async (orderId: number) => {
    setShippingActionLoading((prev) => ({ ...prev, [orderId]: 'creating' }));
    try {
      const res = await api.post(`/shipping/orders/${orderId}/create-shipment`);
      showToast(res.data.message || 'Shipment created successfully!', 'success');
      // Refresh orders
      const ordRes = await api.get('/admin/orders');
      setOrders(ordRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create shipment';
      showToast(msg, 'error');
    } finally {
      setShippingActionLoading((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleDownloadLabel = async (order: Order) => {
    setShippingActionLoading((prev) => ({ ...prev, [order.id]: 'label' }));
    try {
      const res = await api.get(`/shipping/orders/${order.id}/label`);
      if (res.data.label_url) {
        window.open(res.data.label_url, '_blank');
        showToast('Opening Shipping Label PDF...', 'success');
      } else {
        showToast('Shipping label not yet generated by carrier', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to download shipping label';
      showToast(msg, 'error');
    } finally {
      setShippingActionLoading((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    }
  };

  const handleRequestPickup = async (orderId: number) => {
    setShippingActionLoading((prev) => ({ ...prev, [orderId]: 'pickup' }));
    try {
      const res = await api.post(`/shipping/orders/${orderId}/request-pickup`);
      showToast(res.data.message || 'Pickup scheduled successfully!', 'success');
      const ordRes = await api.get('/admin/orders');
      setOrders(ordRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to schedule pickup';
      showToast(msg, 'error');
    } finally {
      setShippingActionLoading((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleTrackShipmentAdmin = async (ord: Order) => {
    setTrackingModalOrder(ord);
    setIsLoadingAdminTracking(true);
    try {
      const res = await api.get(`/shipping/orders/${ord.id}/track`);
      setAdminTrackingData(res.data);
    } catch {
      setAdminTrackingData({
        order_number: ord.order_number,
        awb_code: ord.awb_code,
        courier_name: ord.courier_name || 'Blue Dart Express Air',
        shipping_status: ord.shipping_status || 'PROCESSING',
        current_status: ord.shipping_status || 'PROCESSING',
        estimated_delivery: ord.estimated_delivery_date || '3 Business Days',
        events: []
      });
    } finally {
      setIsLoadingAdminTracking(false);
    }
  };

  const handleRetryShipment = async (orderId: number) => {
    setShippingActionLoading((prev) => ({ ...prev, [orderId]: 'retry' }));
    try {
      const res = await api.post(`/shipping/orders/${orderId}/retry`);
      showToast(res.data.message || 'Shipment retried successfully!', 'success');
      const ordRes = await api.get('/admin/orders');
      setOrders(ordRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to retry shipment';
      showToast(msg, 'error');
    } finally {
      setShippingActionLoading((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleCancelShipment = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this courier shipment?')) return;
    setShippingActionLoading((prev) => ({ ...prev, [orderId]: 'cancel' }));
    try {
      const res = await api.post(`/shipping/orders/${orderId}/cancel`);
      showToast(res.data.message || 'Shipment cancelled', 'info');
      const ordRes = await api.get('/admin/orders');
      setOrders(ordRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to cancel shipment';
      showToast(msg, 'error');
    } finally {
      setShippingActionLoading((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleSaveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingSettings) return;

    setIsSavingShippingSettings(true);
    try {
      const res = await api.put('/shipping/settings', shippingSettings);
      setShippingSettings(res.data);
      showToast('Shipping policy & warehouse settings saved successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save shipping settings';
      showToast(msg, 'error');
    } finally {
      setIsSavingShippingSettings(false);
    }
  };

  const handleUpdateMessageStatus = async (msgId: number, newStatus: 'READ' | 'REPLIED' | 'ARCHIVED') => {
    try {
      const res = await api.put(`/contact/${msgId}`, { status: newStatus });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? res.data : m)));
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage(res.data);
      }
      showToast(`Inquiry marked as ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update message status', 'error');
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (window.confirm('Are you sure you want to delete this customer inquiry?')) {
      try {
        await api.delete(`/contact/${msgId}`);
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (selectedMessage && selectedMessage.id === msgId) {
          setSelectedMessage(null);
        }
        showToast('Customer inquiry deleted', 'success');
      } catch {
        showToast('Failed to delete message', 'error');
      }
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('yurae_user');
    const parsedUser = savedUser ? JSON.parse(savedUser) : null;
    const token = localStorage.getItem('yurae_token');

    if (!token || !parsedUser || parsedUser.role !== 'ADMIN') {
      navigate('/login?redirect=/admin');
      return;
    }

    loadAdminData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdminSignOut = () => {
    logout();
    showToast('Signed out of admin session', 'info');
    navigate('/login');
  };

  const handleRefreshExchangeRates = async () => {
    try {
      setIsRefreshingRates(true);
      const res = await api.post('/currencies/rates/refresh');
      setCurrencyData(res.data);
      showToast('Live exchange rates refreshed successfully!', 'success');
    } catch {
      showToast('Failed to refresh exchange rates', 'error');
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to permanently delete this product?')) {
      try {
        await api.delete(`/products/${productId}`);
        showToast('Product deleted', 'success');
        setProducts(products.filter((p) => p.id !== productId));
      } catch {
        showToast('Failed to delete product', 'error');
      }
    }
  };

  const handleClearAllProducts = async () => {
    if (window.confirm('⚠️ ARE YOU SURE? This will delete ALL uploaded products.')) {
      try {
        for (const p of products) {
          await api.delete(`/products/${p.id}`);
        }
        showToast('All products have been deleted', 'success');
        loadAdminData();
      } catch {
        showToast('Failed to clear all products', 'error');
      }
    }
  };

  // --- COUPON ACTIONS ---

  const calculateExpiryPreview = (option: string, customDays: number, specificDate?: string) => {
    if (option === 'no_expiry') return 'Never (Permanent Offer)';
    if (option === 'date') {
      if (!specificDate) return 'Select a date below';
      const d = new Date(specificDate);
      return `Expires on ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    const days = option === 'custom' ? customDays : Number(option);
    if (isNaN(days) || days <= 0) return 'Never (Permanent Offer)';
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${days} Days from now (${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })})`;
  };

  const getCouponExpiryBadge = (expiryDateStr?: string) => {
    if (!expiryDateStr) {
      return {
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        text: '♾️ No Expiry',
        isExpired: false
      };
    }
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      return {
        badgeClass: 'bg-red-100 text-red-800 border-red-300',
        text: `⚠️ Expired on ${expiry.toLocaleDateString()}`,
        isExpired: true
      };
    }

    if (daysLeft <= 2) {
      return {
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        text: `⏳ Ends Soon: ${daysLeft} day${daysLeft > 1 ? 's' : ''} left`,
        isExpired: false
      };
    }

    return {
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      text: `⏳ ${daysLeft} days left (${expiry.toLocaleDateString()})`,
      isExpired: false
    };
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || newCouponVal <= 0) {
      showToast('Please enter a valid coupon code and discount value', 'error');
      return;
    }

    try {
      setIsSubmittingCoupon(true);
      let durationDays: number | undefined = undefined;
      let specificExpiry: string | undefined = undefined;

      if (newCouponDurationOption === 'no_expiry') {
        durationDays = undefined;
      } else if (newCouponDurationOption === 'custom') {
        durationDays = newCouponCustomDays;
      } else if (newCouponDurationOption === 'date') {
        if (newCouponSpecificDate) {
          specificExpiry = new Date(newCouponSpecificDate + 'T23:59:59').toISOString();
        }
      } else {
        durationDays = Number(newCouponDurationOption);
      }

      const res = await api.post('/coupons', {
        code: newCouponCode.trim().toUpperCase(),
        discount_type: newCouponType,
        discount_value: newCouponVal,
        minimum_order_amount: newCouponMinOrder,
        duration_days: durationDays,
        expiry_date: specificExpiry,
        usage_limit: newCouponUsageLimit,
        active: newCouponActive,
      });

      showToast(`Coupon "${res.data.code}" created successfully!`, 'success');
      setCoupons([res.data, ...coupons]);
      setNewCouponCode('');
      setNewCouponVal(15);
      setNewCouponMinOrder(1000);
      setIsCreateCouponOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create coupon';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const handleOpenEditCoupon = (c: Coupon) => {
    setEditingCoupon(c);
    setEditCouponCode(c.code);
    setEditCouponType(c.discount_type);
    setEditCouponVal(c.discount_value);
    setEditCouponMinOrder(c.minimum_order_amount);
    setEditCouponDurationOption('keep');
    setEditCouponCustomDays(7);
    if (c.expiry_date) {
      setEditCouponSpecificDate(new Date(c.expiry_date).toISOString().split('T')[0]);
    } else {
      setEditCouponSpecificDate('');
    }
    setEditCouponUsageLimit(c.usage_limit);
    setEditCouponActive(c.active);
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      setIsUpdatingCoupon(true);
      let durationPayload: number | undefined = undefined;
      let specificExpiryPayload: string | undefined = undefined;

      if (editCouponDurationOption === 'keep') {
        durationPayload = undefined;
      } else if (editCouponDurationOption === 'no_expiry') {
        durationPayload = 0; // zero indicates remove expiry
      } else if (editCouponDurationOption === 'custom') {
        durationPayload = editCouponCustomDays;
      } else if (editCouponDurationOption === 'date') {
        if (editCouponSpecificDate) {
          specificExpiryPayload = new Date(editCouponSpecificDate + 'T23:59:59').toISOString();
        }
      } else {
        durationPayload = Number(editCouponDurationOption);
      }

      const res = await api.put(`/coupons/${editingCoupon.id}`, {
        code: editCouponCode.trim().toUpperCase(),
        discount_type: editCouponType,
        discount_value: editCouponVal,
        minimum_order_amount: editCouponMinOrder,
        duration_days: durationPayload,
        expiry_date: specificExpiryPayload,
        usage_limit: editCouponUsageLimit,
        active: editCouponActive,
      });

      showToast(`Coupon "${res.data.code}" updated successfully!`, 'success');
      setCoupons((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
      setEditingCoupon(null);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update coupon';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    try {
      const updatedStatus = !coupon.active;
      const res = await api.put(`/coupons/${coupon.id}`, {
        active: updatedStatus,
      });
      setCoupons(coupons.map((c) => (c.id === coupon.id ? res.data : c)));
      showToast(`Coupon "${coupon.code}" ${updatedStatus ? 'activated' : 'paused'}`, 'info');
    } catch {
      showToast('Failed to toggle coupon status', 'error');
    }
  };

  const handleDeleteCoupon = async (couponId: number, code: string) => {
    if (window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      try {
        await api.delete(`/coupons/${couponId}`);
        setCoupons(coupons.filter((c) => c.id !== couponId));
        showToast(`Coupon "${code}" deleted successfully`, 'success');
      } catch {
        showToast('Failed to delete coupon', 'error');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { order_status: newStatus });
      showToast(`Order status updated to ${newStatus}`, 'success');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...res.data } : o)));
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: number, newPaymentStatus: string) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { payment_status: newPaymentStatus });
      showToast(`Payment status updated to ${newPaymentStatus}`, 'success');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...res.data } : o)));
    } catch {
      showToast('Failed to update payment status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#D84B7E] border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-xs uppercase tracking-widest text-[#111111] font-bold">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#F1BCCE] gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Admin Workspace</span>
            <h1 className="font-serif text-3xl font-bold text-[#111111]">Yurae Beauty Management</h1>
            {user && (
              <p className="text-xs text-gray-600 mt-1">
                Logged in as <span className="font-bold text-[#111111]">{user.first_name} {user.last_name}</span> ({user.email})
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setActiveTab('coupons');
                setIsCreateCouponOpen(true);
              }}
              className="px-5 py-2.5 bg-[#FFF8FA] text-[#D84B7E] border border-[#D84B7E] text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#D84B7E] hover:text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Tag className="w-4 h-4" /> Add Coupon
            </button>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-5 py-2.5 bg-[#D84B7E] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] transition-all flex items-center gap-2 shadow-xs border border-[#D84B7E] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
            <button
              onClick={handleAdminSignOut}
              className="px-5 py-2.5 bg-[#FFF8FA] text-[#111111] border border-[#F1BCCE] text-xs uppercase tracking-wider font-bold rounded-full hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
              <span>Total Revenue (INR)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#111111]">₹{stats?.total_sales.toLocaleString()}</p>
          </div>

          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
              <span>Total Orders</span>
              <ShoppingCart className="w-4 h-4 text-[#D84B7E]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#111111]">{stats?.total_orders}</p>
          </div>

          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
              <span>Active Coupons</span>
              <Tag className="w-4 h-4 text-[#D84B7E]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#111111]">
              {coupons.filter((c) => c.active).length} / {coupons.length}
            </p>
          </div>

          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
              <span>Low Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="font-serif text-3xl font-bold text-amber-600">{stats?.low_stock_products}</p>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex overflow-x-auto gap-2 border-b border-[#F1BCCE] pb-1">
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'shipping', label: `🚚 Shipping & Fulfillment (${orders.filter((o) => o.shipping_status && o.shipping_status !== 'NOT_CREATED').length})` },
            {
              id: 'contact_messages',
              label: `📬 Contact Messages (${messages.filter((m) => m.source !== 'ORDER_QUERY').length})${
                messages.filter((m) => m.source !== 'ORDER_QUERY' && m.status === 'UNREAD').length > 0
                  ? ` • ${messages.filter((m) => m.source !== 'ORDER_QUERY' && m.status === 'UNREAD').length} New`
                  : ''
              }`,
            },
            {
              id: 'order_queries',
              label: `🛍️ Order Queries (${messages.filter((m) => m.source === 'ORDER_QUERY').length})${
                messages.filter((m) => m.source === 'ORDER_QUERY' && m.status === 'UNREAD').length > 0
                  ? ` • ${messages.filter((m) => m.source === 'ORDER_QUERY' && m.status === 'UNREAD').length} New`
                  : ''
              }`,
            },
            { id: 'coupons', label: `Coupons & Offers (${coupons.length})` },
            { id: 'products', label: `Products (${products.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'currencies', label: 'Currencies & Rates' },
            { id: 'customers', label: `Customers (${customers.length})` },
            { id: 'inventory', label: 'Inventory Monitor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 text-xs uppercase tracking-widest font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#D84B7E] text-white shadow-xs'
                  : (tab.id === 'contact_messages' && messages.some((m) => m.source !== 'ORDER_QUERY' && m.status === 'UNREAD')) ||
                    (tab.id === 'order_queries' && messages.some((m) => m.source === 'ORDER_QUERY' && m.status === 'UNREAD'))
                  ? 'text-[#D84B7E] font-extrabold bg-[#FCE7F0]/60 hover:bg-[#FCE7F0]'
                  : 'text-gray-700 hover:bg-[#FCE7F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Action Shortcuts */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D84B7E]" />
                  Store Performance & Live Management
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Welcome to Yurae Beauty admin control studio. Track orders, manage inventory, launch promotional deals, and update currency rates.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
                <button
                  onClick={() => { setActiveTab('coupons'); setIsCreateCouponOpen(true); }}
                  className="px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D84B7E] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Tag className="w-4 h-4" /> Create Coupon
                </button>
                <button
                  onClick={handleRefreshExchangeRates}
                  disabled={isRefreshingRates}
                  className="px-4 py-2 bg-white text-[#111111] border border-[#F1BCCE] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#FCE7F0] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingRates ? 'animate-spin' : ''}`} /> Sync Currencies
                </button>
              </div>
            </div>

            {/* Recent Incoming Customer Orders Section */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-[#F1BCCE]">
                <div>
                  <h4 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#D84B7E]" />
                    Recent Customer Orders ({orders.length})
                  </h4>
                  <p className="text-xs text-gray-500">Live feed of received customer orders across all payment channels.</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#D84B7E] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center bg-[#FDF4F7] rounded-xl border border-[#F1BCCE] space-y-2">
                  <p className="font-serif text-base font-bold text-[#111111]">No customer orders received yet.</p>
                  <p className="text-xs text-gray-500">When customers place orders on your store, they will appear here with live notification.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                      <tr>
                        <th className="p-3">Order #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Order Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1BCCE]">
                      {orders.slice(0, 8).map((o) => {
                        const customerName = o.user ? `${o.user.first_name} ${o.user.last_name}` : (o.address?.name || `User #${o.user_id}`);
                        const customerEmail = o.user?.email || o.address?.phone || '';
                        return (
                          <tr key={o.id} className="hover:bg-[#FDF4F7]">
                            <td className="p-3 font-mono font-bold text-[#111111]">
                              <span className="bg-[#F8D7E3] text-[#D84B7E] px-2 py-0.5 rounded border border-[#F1BCCE]">
                                {o.order_number}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-[#111111] block">{customerName}</span>
                              <span className="text-[11px] text-gray-500 block">{customerEmail}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-gray-800">
                                {o.items?.[0]?.product_name}
                                {o.items?.length > 1 && <span className="text-gray-500 font-normal"> +{o.items.length - 1} more</span>}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#111111]">
                              {formatRawPrice(o.total_amount, o.currency || 'INR')}
                            </td>
                            <td className="p-3">
                              <select
                                value={o.payment_status}
                                onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                                className={`p-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer ${
                                  o.payment_status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : o.payment_status === 'Pending'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}
                              >
                                <option value="Pending">Pending (Unpaid)</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={o.order_status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="bg-white border border-[#F1BCCE] p-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-3 text-gray-500">
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2-Column Split: Latest Contact Inquiries vs Latest Order Queries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Latest Contact Inquiries */}
              <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#F1BCCE]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#D84B7E]" />
                    <h3 className="font-serif text-lg font-bold text-[#111111]">
                      Contact Us Inquiries ({messages.filter((m) => m.source !== 'ORDER_QUERY').length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('contact_messages')}
                    className="text-xs font-bold text-[#D84B7E] hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {messages.filter((m) => m.source !== 'ORDER_QUERY').length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No contact inquiries received yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {messages
                      .filter((m) => m.source !== 'ORDER_QUERY')
                      .slice(0, 4)
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#111111]">{msg.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                msg.status === 'UNREAD'
                                  ? 'bg-[#D84B7E] text-white'
                                  : msg.status === 'REPLIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {msg.status}
                            </span>
                          </div>
                          {msg.subject && (
                            <p className="text-[11px] font-bold text-[#D84B7E] truncate">{msg.subject}</p>
                          )}
                          <p className="text-gray-700 line-clamp-2">{msg.message}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Card 2: Latest Order Queries & Feedback */}
              <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#F1BCCE]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#D84B7E]" />
                    <h3 className="font-serif text-lg font-bold text-[#111111]">
                      Order Queries & Feedback ({messages.filter((m) => m.source === 'ORDER_QUERY').length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('order_queries')}
                    className="text-xs font-bold text-[#D84B7E] hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {messages.filter((m) => m.source === 'ORDER_QUERY').length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">No order queries received yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {messages
                      .filter((m) => m.source === 'ORDER_QUERY')
                      .slice(0, 4)
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {msg.order_number && (
                                <span className="px-2 py-0.5 bg-[#111111] text-white font-mono text-[10px] rounded font-bold">
                                  #{msg.order_number}
                                </span>
                              )}
                              <span className="font-bold text-[#111111]">{msg.name}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                msg.status === 'UNREAD'
                                  ? 'bg-[#D84B7E] text-white'
                                  : msg.status === 'REPLIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {msg.status}
                            </span>
                          </div>
                          {msg.rating && (
                            <span className="inline-block px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[10px] font-bold">
                              {msg.rating}
                            </span>
                          )}
                          <p className="text-gray-700 line-clamp-2">{msg.message}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SHIPPING & FULFILLMENT TAB */}
        {activeTab === 'shipping' && (
          <div className="space-y-8">
            
            {/* Header & Mode Status Banner */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#D84B7E]" />
                    Shipping & Order Fulfillment Engine
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    shippingSettings?.is_shiprocket_connected
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {shippingSettings?.is_shiprocket_connected ? '● Shiprocket Live API' : '⚡ High-Fidelity Simulation Sandbox'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Manage domestic courier fulfillment (Blue Dart, Delhivery, Shadowfax, DTDC), generate AWBs, download shipping labels, schedule pickups, and configure warehouse shipping rates.
                </p>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShippingSubTab('shipments')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs ${
                    shippingSubTab === 'shipments'
                      ? 'bg-[#D84B7E] text-white'
                      : 'bg-white border border-[#F1BCCE] text-gray-700 hover:bg-[#FCE7F0]'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5" /> Shipments ({orders.length})
                </button>
                <button
                  onClick={() => setShippingSubTab('settings')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs ${
                    shippingSubTab === 'settings'
                      ? 'bg-[#D84B7E] text-white'
                      : 'bg-white border border-[#F1BCCE] text-gray-700 hover:bg-[#FCE7F0]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 inline mr-1.5" /> Warehouse & Policy Settings
                </button>
              </div>
            </div>

            {shippingSubTab === 'shipments' && (
              <div className="space-y-6">
                
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 text-center">
                  <div className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Total Orders</span>
                    <p className="font-serif text-2xl font-bold text-[#111111] mt-1">{orders.length}</p>
                  </div>
                  <div className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs">
                    <span className="text-[11px] font-bold text-[#D84B7E] uppercase">AWB Assigned</span>
                    <p className="font-serif text-2xl font-bold text-[#D84B7E] mt-1">
                      {orders.filter((o) => o.shipping_status === 'AWB_ASSIGNED').length}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs">
                    <span className="text-[11px] font-bold text-blue-600 uppercase">Pickup Scheduled</span>
                    <p className="font-serif text-2xl font-bold text-blue-600 mt-1">
                      {orders.filter((o) => o.shipping_status === 'PICKUP_SCHEDULED').length}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase">Delivered</span>
                    <p className="font-serif text-2xl font-bold text-emerald-600 mt-1">
                      {orders.filter((o) => o.shipping_status === 'DELIVERED').length}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-rose-600 uppercase">Exceptions / Failed</span>
                    <p className="font-serif text-2xl font-bold text-rose-600 mt-1">
                      {orders.filter((o) => o.shipping_status === 'FAILED').length}
                    </p>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Region Filter */}
                    <div className="flex gap-1 p-1 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl mr-2">
                      {[
                        { id: 'ALL', label: 'All Regions' },
                        { id: 'DOMESTIC', label: '🇮🇳 India' },
                        { id: 'INTERNATIONAL', label: '🌐 International' },
                      ].map((reg) => (
                        <button
                          key={reg.id}
                          type="button"
                          onClick={() => setShippingRegionFilter(reg.id as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            shippingRegionFilter === reg.id
                              ? 'bg-[#111111] text-white shadow-xs'
                              : 'text-gray-600 hover:text-black hover:bg-[#FCE7F0]'
                          }`}
                        >
                          {reg.label}
                        </button>
                      ))}
                    </div>

                    {/* Status Filters */}
                    {[
                      { id: 'ALL', label: 'All Statuses' },
                      { id: 'AWB_ASSIGNED', label: 'AWB Ready' },
                      { id: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
                      { id: 'IN_TRANSIT', label: 'In Transit' },
                      { id: 'DELIVERED', label: 'Delivered' },
                      { id: 'FAILED', label: 'Failed' },
                      { id: 'NOT_CREATED', label: 'Unfulfilled' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setShippingStatusFilter(st.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          shippingStatusFilter === st.id
                            ? 'bg-[#D84B7E] text-white shadow-xs'
                            : 'bg-white border border-[#F1BCCE] text-gray-700 hover:bg-[#FCE7F0]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search by Order #, AWB, Courier, City..."
                    value={shippingSearch}
                    onChange={(e) => setShippingSearch(e.target.value)}
                    className="p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl text-xs outline-none focus:border-[#D84B7E] w-full sm:w-72"
                  />
                </div>

                {/* Shipments Data Table */}
                <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F8D7E3]/60 text-gray-700 border-b border-[#F1BCCE] uppercase tracking-wider text-[11px]">
                          <th className="p-4 font-bold">Order Reference</th>
                          <th className="p-4 font-bold">Customer & Location</th>
                          <th className="p-4 font-bold">Courier & AWB</th>
                          <th className="p-4 font-bold">Shipping Status</th>
                          <th className="p-4 font-bold">Estimated Delivery</th>
                          <th className="p-4 font-bold text-right">Fulfillment Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1BCCE]">
                        {orders
                          .filter((ord) => {
                            if (shippingRegionFilter !== 'ALL') {
                              const isIntl = ord.address?.country && ord.address.country.trim().toLowerCase() !== 'india';
                              if (shippingRegionFilter === 'DOMESTIC' && isIntl) return false;
                              if (shippingRegionFilter === 'INTERNATIONAL' && !isIntl) return false;
                            }
                            if (shippingStatusFilter !== 'ALL') {
                              const s = ord.shipping_status || 'NOT_CREATED';
                              if (s !== shippingStatusFilter) return false;
                            }
                            if (shippingSearch.trim()) {
                              const q = shippingSearch.toLowerCase();
                              const matchNum = ord.order_number?.toLowerCase().includes(q);
                              const matchAwb = ord.awb_code?.toLowerCase().includes(q);
                              const matchCourier = ord.courier_name?.toLowerCase().includes(q);
                              const matchCity = ord.address?.city?.toLowerCase().includes(q);
                              const matchCountry = ord.address?.country?.toLowerCase().includes(q);
                              const matchName = ord.address?.name?.toLowerCase().includes(q);
                              if (!matchNum && !matchAwb && !matchCourier && !matchCity && !matchCountry && !matchName) return false;
                            }
                            return true;
                          })
                          .map((ord) => {
                            const isActionLoading = Boolean(shippingActionLoading[ord.id]);
                            const currentAction = shippingActionLoading[ord.id];
                            const isIntl = ord.address?.country && ord.address.country.trim().toLowerCase() !== 'india';

                            return (
                              <tr key={ord.id} className="hover:bg-white/60 transition-colors">
                                <td className="p-4">
                                  <span className="font-mono font-bold text-[#111111] block text-sm">
                                    {ord.order_number}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(ord.created_at).toLocaleDateString()} • {ord.payment_status}
                                  </span>
                                  <span className="font-bold text-[#D84B7E] block text-[11px] mt-0.5">
                                    {formatRawPrice(ord.total_amount, ord.currency || 'INR')}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <span className="font-bold text-[#111111] block">
                                    {ord.address?.name || (ord.user ? `${ord.user.first_name} ${ord.user.last_name}` : 'Client')}
                                  </span>
                                  <span className="text-gray-500 block text-[11px]">
                                    {ord.address?.phone || ord.user?.phone || 'N/A'}
                                  </span>
                                  <span className="text-gray-600 block text-[11px] mt-0.5">
                                    {ord.address?.city || 'Bengaluru'}, {ord.address?.state || 'Karnataka'} - {ord.address?.postal_code || '560001'}
                                  </span>
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                                    isIntl ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {ord.address?.country || 'India'}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <div className="space-y-1">
                                    <span className="font-bold text-[#111111] block">
                                      {ord.courier_name || 'Blue Dart Express Air'}
                                    </span>
                                    {ord.awb_code ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-[#D84B7E] bg-[#F8D7E3] px-2 py-0.5 rounded text-[10px]">
                                          {ord.awb_code}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(ord.awb_code || '');
                                            showToast('AWB copied', 'info');
                                          }}
                                          className="text-gray-400 hover:text-[#D84B7E] cursor-pointer"
                                          title="Copy AWB"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic text-[11px]">No AWB yet</span>
                                    )}
                                  </div>
                                </td>

                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block ${
                                    ord.shipping_status === 'DELIVERED'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : ord.shipping_status === 'FAILED'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : ord.shipping_status === 'IN_TRANSIT'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : ord.shipping_status === 'PICKUP_SCHEDULED'
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                      : ord.shipping_status === 'AWB_ASSIGNED'
                                      ? 'bg-[#F8D7E3] text-[#D84B7E] border-[#F1BCCE]'
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}>
                                    {ord.shipping_status || 'NOT_CREATED'}
                                  </span>
                                  {ord.shipping_error_log && ord.shipping_status === 'FAILED' && (
                                    <p className="text-[10px] text-rose-600 mt-1 line-clamp-1">
                                      {ord.shipping_error_log}
                                    </p>
                                  )}
                                </td>

                                <td className="p-4 text-gray-700">
                                  <span className="font-bold text-[#111111] block">
                                    {ord.estimated_delivery_date || '2-4 Business Days'}
                                  </span>
                                  {ord.pickup_scheduled_date && (
                                    <span className="text-[10px] text-gray-500 block mt-0.5">
                                      Pickup: {ord.pickup_scheduled_date}
                                    </span>
                                  )}
                                </td>

                                <td className="p-4 text-right">
                                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                                    {/* Create / Assign AWB */}
                                    {(!ord.awb_code || ord.shipping_status === 'NOT_CREATED' || ord.shipping_status === 'FAILED') && (
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleCreateShipment(ord.id)}
                                        className="px-3 py-1.5 bg-[#D84B7E] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-[#111111] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <Truck className="w-3 h-3" />
                                        {currentAction === 'creating' ? 'Creating...' : 'Create Shipment'}
                                      </button>
                                    )}

                                    {/* Download Label PDF */}
                                    {ord.awb_code && (
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleDownloadLabel(ord)}
                                        className="px-3 py-1.5 bg-white border border-[#F1BCCE] text-[#111111] font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-[#FCE7F0] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                        title="Download Carrier Label PDF"
                                      >
                                        <Download className="w-3 h-3 text-[#D84B7E]" /> Label
                                      </button>
                                    )}

                                    {/* Request Pickup */}
                                    {ord.awb_code && ord.shipping_status === 'AWB_ASSIGNED' && (
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleRequestPickup(ord.id)}
                                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                      >
                                        <Clock className="w-3 h-3" />
                                        {currentAction === 'pickup' ? 'Scheduling...' : 'Pickup'}
                                      </button>
                                    )}

                                    {/* Track Shipment Modal */}
                                    {ord.awb_code && (
                                      <button
                                        type="button"
                                        onClick={() => handleTrackShipmentAdmin(ord)}
                                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> Track
                                      </button>
                                    )}

                                    {/* Retry Failed */}
                                    {ord.shipping_status === 'FAILED' && (
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleRetryShipment(ord.id)}
                                        className="px-3 py-1.5 bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-amber-600 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                                      >
                                        <RotateCcw className="w-3 h-3" /> Retry
                                      </button>
                                    )}

                                    {/* Cancel Shipment */}
                                    {ord.awb_code && ord.shipping_status !== 'DELIVERED' && ord.shipping_status !== 'CANCELLED' && (
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleCancelShipment(ord.id)}
                                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Cancel Shipment"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SHIPPING & WAREHOUSE SETTINGS SUB-TAB */}
            {shippingSubTab === 'settings' && shippingSettings && (
              <form onSubmit={handleSaveShippingSettings} className="p-6 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-8 shadow-xs max-w-4xl">
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#D84B7E]" />
                    Domestic Shipping Rules & Warehouse Pickup Origin
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure free shipping thresholds, standard flat domestic shipping rates, Cash on Delivery support, package sizing metrics, and primary warehouse coordinates for courier pickup manifests.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  
                  {/* Shipping Fees & Thresholds */}
                  <div className="space-y-4 sm:col-span-2 lg:col-span-3 pb-4 border-b border-[#F1BCCE]">
                    <h5 className="font-bold text-[#D84B7E] uppercase tracking-wider text-[11px]">
                      1. Domestic Pricing & Free Delivery Threshold
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Standard Flat Shipping Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={shippingSettings.flat_shipping_fee}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, flat_shipping_fee: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Free Shipping Order Threshold (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={shippingSettings.free_shipping_threshold}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, free_shipping_threshold: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Cash on Delivery (COD) Status</label>
                        <select
                          value={shippingSettings.cod_enabled ? 'true' : 'false'}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, cod_enabled: e.target.value === 'true' })}
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E] cursor-pointer"
                        >
                          <option value="true">Enabled (Accept COD)</option>
                          <option value="false">Disabled (Prepaid Only)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Packaging Dimensions */}
                  <div className="space-y-4 sm:col-span-2 lg:col-span-3 pb-4 border-b border-[#F1BCCE]">
                    <h5 className="font-bold text-[#D84B7E] uppercase tracking-wider text-[11px]">
                      2. Default Luxury Package Box Sizing (Skincare & Accessories)
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Default Weight (kg)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={shippingSettings.default_package_weight_kg}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, default_package_weight_kg: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Length (cm)</label>
                        <input
                          type="number"
                          value={shippingSettings.default_package_length_cm}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, default_package_length_cm: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Breadth (cm)</label>
                        <input
                          type="number"
                          value={shippingSettings.default_package_breadth_cm}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, default_package_breadth_cm: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={shippingSettings.default_package_height_cm}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, default_package_height_cm: Number(e.target.value) })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Origin Warehouse Address */}
                  <div className="space-y-4 sm:col-span-2 lg:col-span-3">
                    <h5 className="font-bold text-[#D84B7E] uppercase tracking-wider text-[11px]">
                      3. Warehouse Pickup Origin Coordinates (Shiprocket Pickup Manifest)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Warehouse Contact Person *</label>
                        <input
                          type="text"
                          value={shippingSettings.warehouse_contact_name}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_contact_name: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Contact Phone Number *</label>
                        <input
                          type="text"
                          value={shippingSettings.warehouse_phone}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_phone: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-gray-700 block mb-1">Warehouse Street Address Line 1 *</label>
                        <input
                          type="text"
                          value={shippingSettings.warehouse_address}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_address: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">City *</label>
                        <input
                          type="text"
                          value={shippingSettings.warehouse_city}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_city: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">State *</label>
                        <input
                          type="text"
                          value={shippingSettings.warehouse_state}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_state: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Warehouse 6-Digit PIN Code *</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={shippingSettings.warehouse_pincode}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_pincode: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-mono font-bold outline-none focus:border-[#D84B7E]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Dispatch Email</label>
                        <input
                          type="email"
                          value={shippingSettings.warehouse_email}
                          onChange={(e) => setShippingSettings({ ...shippingSettings, warehouse_email: e.target.value })}
                          required
                          className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#F1BCCE]">
                  <button
                    type="submit"
                    disabled={isSavingShippingSettings}
                    className="px-8 py-3 bg-[#D84B7E] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {isSavingShippingSettings ? 'Saving Settings...' : 'Save Shipping Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-8">
            
            {/* Header / Actions Banner */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#D84B7E]" />
                  Coupons & Promotional Deals Studio
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Create promo codes, configure percentage/flat discounts, set time limits & offer duration (e.g. 24 hours, 7 days, 30 days, or custom expiry), and monitor live customer redemptions.
                </p>
              </div>
              <button
                onClick={() => setIsCreateCouponOpen(!isCreateCouponOpen)}
                className="px-5 py-2.5 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {isCreateCouponOpen ? 'Hide Creator' : 'Create New Coupon'}
              </button>
            </div>

            {/* CREATE COUPON CARD (Collapsible / Active) */}
            {isCreateCouponOpen && (
              <div className="p-6 sm:p-8 bg-[#FFF8FA] border-2 border-[#D84B7E] rounded-3xl shadow-lg space-y-6">
                <div className="flex justify-between items-center border-b border-[#F1BCCE] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D84B7E]" />
                    <h4 className="font-serif text-lg font-bold text-[#111111]">Create Promotional Coupon & Offer</h4>
                  </div>
                  <button
                    onClick={() => setIsCreateCouponOpen(false)}
                    className="p-1 text-gray-400 hover:text-black rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="font-bold text-[#111111] block mb-1">Coupon Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. FESTIVE25, SPRING30"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                        required
                        className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-mono font-bold text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#111111] block mb-1">Discount Type *</label>
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                        className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E] cursor-pointer"
                      >
                        <option value="PERCENTAGE">Percentage Discount (%)</option>
                        <option value="FIXED">Flat Fixed Amount (₹ INR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[#111111] block mb-1">
                        Discount Value ({newCouponType === 'PERCENTAGE' ? '%' : '₹'}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={newCouponType === 'PERCENTAGE' ? 100 : 100000}
                        placeholder={newCouponType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 200'}
                        value={newCouponVal}
                        onChange={(e) => setNewCouponVal(Number(e.target.value))}
                        required
                        className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#111111] block mb-1">Minimum Order Amount (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 1000"
                        value={newCouponMinOrder}
                        onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                        required
                        className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>
                  </div>

                  {/* TIME LIMIT & OFFER DURATION SECTION */}
                  <div className="p-4 bg-[#FCE7F0]/80 border border-[#F1BCCE] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111] flex items-center gap-1.5 text-xs">
                        <Clock className="w-4 h-4 text-[#D84B7E]" />
                        Offer Time Limit & Deal Duration:
                      </span>
                      <span className="text-[11px] font-bold text-[#D84B7E] bg-white px-3 py-1 rounded-full border border-[#F1BCCE]">
                        ⏳ Expiry: {calculateExpiryPreview(newCouponDurationOption, newCouponCustomDays, newCouponSpecificDate)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'no_expiry', label: '♾️ No Expiry (Lifetime)' },
                        { id: '1', label: '24 Hours (1 Day Flash Deal)' },
                        { id: '3', label: '3 Days Weekend Special' },
                        { id: '7', label: '7 Days (1 Week)' },
                        { id: '14', label: '14 Days (2 Weeks)' },
                        { id: '30', label: '30 Days (1 Month)' },
                        { id: '90', label: '90 Days (Quarterly)' },
                        { id: 'custom', label: 'Custom Days' },
                        { id: 'date', label: '📅 Pick Expiry Date' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNewCouponDurationOption(opt.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            newCouponDurationOption === opt.id
                              ? 'bg-[#D84B7E] text-white shadow-xs'
                              : 'bg-white border border-[#F1BCCE] text-gray-700 hover:bg-[#FDF4F7]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {newCouponDurationOption === 'custom' && (
                      <div className="flex items-center gap-3 pt-2">
                        <label className="font-bold text-[#111111] text-xs">Set Number of Days:</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={newCouponCustomDays}
                          onChange={(e) => setNewCouponCustomDays(Number(e.target.value))}
                          className="w-32 p-2 bg-white border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none"
                        />
                        <span className="text-xs text-gray-600 font-medium">days active starting from today</span>
                      </div>
                    )}

                    {newCouponDurationOption === 'date' && (
                      <div className="flex items-center gap-3 pt-2">
                        <label className="font-bold text-[#111111] text-xs">Choose Expiration Date:</label>
                        <input
                          type="date"
                          value={newCouponSpecificDate}
                          onChange={(e) => setNewCouponSpecificDate(e.target.value)}
                          className="p-2 bg-white border border-[#F1BCCE] rounded-xl font-bold text-xs outline-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-[#111111] block mb-1">Total Redemption Limit</label>
                      <input
                        type="number"
                        min="1"
                        value={newCouponUsageLimit}
                        onChange={(e) => setNewCouponUsageLimit(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newCouponActive}
                          onChange={(e) => setNewCouponActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D84B7E]" />
                      </label>
                      <span className="font-bold text-xs text-[#111111]">
                        {newCouponActive ? 'Active Immediately' : 'Save as Inactive Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#F1BCCE]">
                    <button
                      type="button"
                      onClick={() => setIsCreateCouponOpen(false)}
                      className="px-6 py-2.5 border border-[#111111] text-[#111111] uppercase font-bold rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCoupon}
                      className="px-8 py-2.5 bg-[#D84B7E] text-white uppercase font-bold rounded-full hover:bg-[#111111] shadow-md cursor-pointer"
                    >
                      {isSubmittingCoupon ? 'Publishing...' : 'Publish Coupon Offer'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* COUPONS TABLE */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-lg font-bold text-[#111111]">
                  Configured Store Coupons ({coupons.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                    <tr>
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Discount Details</th>
                      <th className="p-3">Min. Spend</th>
                      <th className="p-3">Offer Time Limit / Expiry</th>
                      <th className="p-3">Redemptions</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1BCCE]">
                    {coupons.map((c) => {
                      const expiryInfo = getCouponExpiryBadge(c.expiry_date);
                      return (
                        <tr key={c.id} className="hover:bg-[#FDF4F7]">
                          <td className="p-3 font-mono font-bold text-[#111111]">
                            <span className="bg-[#F8D7E3] text-[#D84B7E] border border-[#F1BCCE] px-2.5 py-1 rounded-lg text-sm">
                              {c.code}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-[#111111]">
                            {c.discount_type === 'PERCENTAGE' ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                {c.discount_value}% OFF
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                ₹{c.discount_value} OFF (Flat)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-gray-700">
                            {c.minimum_order_amount > 0 ? `₹${c.minimum_order_amount.toLocaleString()}` : 'None'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold inline-block ${expiryInfo.badgeClass}`}>
                              {expiryInfo.text}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-700">
                            <span>{c.times_used} / {c.usage_limit}</span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleCouponActive(c)}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                c.active
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              {c.active ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCoupon(c)}
                                className="p-1.5 text-gray-700 hover:text-[#D84B7E] hover:bg-[#FCE7F0] rounded-lg transition-colors cursor-pointer"
                                title="Edit coupon & time limit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(c.id, c.code)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* EDIT COUPON MODAL */}
        {editingCoupon && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFF8FA] border border-[#D84B7E] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-[#F1BCCE] pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#D84B7E]" />
                  <h3 className="font-serif text-2xl font-bold text-[#111111]">
                    Edit Coupon "{editingCoupon.code}"
                  </h3>
                </div>
                <button
                  onClick={() => setEditingCoupon(null)}
                  className="p-1 text-gray-400 hover:text-black rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCoupon} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      value={editCouponCode}
                      onChange={(e) => setEditCouponCode(e.target.value.toUpperCase())}
                      required
                      className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-mono font-bold text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Discount Type *</label>
                    <select
                      value={editCouponType}
                      onChange={(e) => setEditCouponType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                      className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none cursor-pointer"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹ INR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Discount Value *</label>
                    <input
                      type="number"
                      min="1"
                      value={editCouponVal}
                      onChange={(e) => setEditCouponVal(Number(e.target.value))}
                      required
                      className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Minimum Order Amount (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      value={editCouponMinOrder}
                      onChange={(e) => setEditCouponMinOrder(Number(e.target.value))}
                      required
                      className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>
                </div>

                {/* EDIT TIME LIMIT / DURATION SECTION */}
                <div className="p-4 bg-[#FCE7F0]/80 border border-[#F1BCCE] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111] flex items-center gap-1.5 text-xs">
                      <Clock className="w-4 h-4 text-[#D84B7E]" />
                      Update Time Limit / Offer Duration:
                    </span>
                    <span className="text-[11px] font-bold text-[#D84B7E] bg-white px-2.5 py-0.5 rounded-full border border-[#F1BCCE]">
                      {editCouponDurationOption === 'keep'
                        ? `Current: ${editingCoupon.expiry_date ? new Date(editingCoupon.expiry_date).toLocaleDateString() : 'No Expiry'}`
                        : `New Expiry: ${calculateExpiryPreview(editCouponDurationOption, editCouponCustomDays, editCouponSpecificDate)}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'keep', label: 'Keep Current Expiry' },
                      { id: 'no_expiry', label: '♾️ Set No Expiry' },
                      { id: '1', label: '1 Day (24 Hours)' },
                      { id: '3', label: '3 Days' },
                      { id: '7', label: '7 Days (1 Week)' },
                      { id: '14', label: '14 Days (2 Weeks)' },
                      { id: '30', label: '30 Days (1 Month)' },
                      { id: '90', label: '90 Days' },
                      { id: 'custom', label: 'Custom Days' },
                      { id: 'date', label: '📅 Pick Expiry Date' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditCouponDurationOption(opt.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          editCouponDurationOption === opt.id
                            ? 'bg-[#D84B7E] text-white shadow-xs'
                            : 'bg-white border border-[#F1BCCE] text-gray-700 hover:bg-[#FDF4F7]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {editCouponDurationOption === 'custom' && (
                    <div className="flex items-center gap-3 pt-2">
                      <label className="font-bold text-[#111111] text-xs">Set Number of Days:</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={editCouponCustomDays}
                        onChange={(e) => setEditCouponCustomDays(Number(e.target.value))}
                        className="w-32 p-2 bg-white border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none"
                      />
                      <span className="text-xs text-gray-600 font-medium">days active starting from today</span>
                    </div>
                  )}

                  {editCouponDurationOption === 'date' && (
                    <div className="flex items-center gap-3 pt-2">
                      <label className="font-bold text-[#111111] text-xs">Choose Expiration Date:</label>
                      <input
                        type="date"
                        value={editCouponSpecificDate}
                        onChange={(e) => setEditCouponSpecificDate(e.target.value)}
                        className="p-2 bg-white border border-[#F1BCCE] rounded-xl font-bold text-xs outline-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Total Usage Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={editCouponUsageLimit}
                      onChange={(e) => setEditCouponUsageLimit(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCouponActive}
                        onChange={(e) => setEditCouponActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D84B7E]" />
                    </label>
                    <span className="font-bold text-xs text-[#111111]">
                      {editCouponActive ? 'Status: Active' : 'Status: Paused'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#F1BCCE]">
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="px-6 py-2.5 border border-[#111111] text-[#111111] uppercase font-bold rounded-full hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCoupon}
                    className="px-8 py-2.5 bg-[#D84B7E] text-white uppercase font-bold rounded-full hover:bg-[#111111] shadow-md cursor-pointer"
                  >
                    {isUpdatingCoupon ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CURRENCIES & EXCHANGE RATES TAB */}
        {activeTab === 'currencies' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#D84B7E]" />
                    Multi-Currency & Exchange Rate Engine
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-1">
                    Internal Base Currency: <span className="font-bold text-[#111111]">INR (₹ Indian Rupee)</span>. All product prices are stored authoritatively in INR and converted dynamically.
                  </p>
                </div>
                <button
                  onClick={handleRefreshExchangeRates}
                  disabled={isRefreshingRates}
                  className="px-5 py-2.5 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                  {isRefreshingRates ? 'Syncing Rates...' : 'Refresh Live Rates'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                    <tr>
                      <th className="p-3">Currency</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Exchange Rate (1 INR =)</th>
                      <th className="p-3">Inverted (1 Unit =)</th>
                      <th className="p-3">Free Shipping Threshold</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1BCCE]">
                    {currencyData?.currencies.map((c) => {
                      const rate = currencyData.rates[c.code] || 1.0;
                      const inrPerUnit = rate > 0 ? (1.0 / rate).toFixed(2) : '1.0';
                      return (
                        <tr key={c.code} className="hover:bg-[#FDF4F7]">
                          <td className="p-3 font-bold text-[#111111] flex items-center gap-2.5">
                            <span className="text-lg">{c.flag}</span>
                            <div>
                              <span>{c.code}</span>
                              <span className="text-gray-400 font-normal text-[11px] block">{c.name}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#D84B7E] text-sm">{c.symbol}</td>
                          <td className="p-3 font-mono font-bold text-[#111111]">
                            {rate.toFixed(c.decimal_digits === 0 ? 2 : 4)} {c.code}
                          </td>
                          <td className="p-3 font-mono text-gray-700">₹{inrPerUnit} INR</td>
                          <td className="p-3 font-bold text-[#111111]">
                            {c.symbol}{c.free_shipping_threshold} ({c.code})
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {currencyData?.last_updated && (
                <p className="text-[11px] text-gray-500 italic">
                  Last rates sync: {new Date(currencyData.last_updated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h3 className="font-serif text-xl font-bold text-[#111111]">Product Management</h3>
              {products.length > 0 && (
                <button
                  onClick={handleClearAllProducts}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All Products ({products.length})
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Base Price (INR)</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1BCCE]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FDF4F7]">
                      <td className="p-3 font-bold text-[#111111] flex items-center gap-3">
                        <img src={p.images[0]?.image_url} alt="" className="w-10 h-12 object-cover rounded-lg border border-[#F1BCCE]" />
                        {p.name}
                      </td>
                      <td className="p-3 font-mono text-gray-500">{p.sku}</td>
                      <td className="p-3 text-gray-700">{p.category?.name || 'Skincare'}</td>
                      <td className="p-3 font-bold text-[#111111]">₹{(p.sale_price || p.price).toLocaleString()}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2.5 py-0.5 rounded-full ${p.stock_quantity <= 10 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 text-gray-700 hover:text-[#D84B7E] hover:bg-[#FCE7F0] rounded-lg transition-colors cursor-pointer"
                            title="Edit product & photos"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#111111]">
                  Store Received Orders ({orders.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete register of customer purchases, shipping addresses, live payment statuses, and fulfillment tracking.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {['all', 'confirmed', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-[#D84B7E] text-white shadow-xs'
                        : 'bg-[#FFF8FA] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="max-w-md">
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search orders by # reference, customer name, or email..."
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#D84B7E]"
              />
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl space-y-3">
                <p className="font-serif text-lg text-[#111111] font-bold">No orders placed yet.</p>
                <p className="text-xs text-gray-500">Incoming store orders placed by customers will be listed here automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                    <tr>
                      <th className="p-3">Order Reference</th>
                      <th className="p-3">Customer Details</th>
                      <th className="p-3">Ordered Items</th>
                      <th className="p-3">Delivery Address</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3">Placed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1BCCE]">
                    {orders
                      .filter((o) => {
                        const matchesStatus = orderStatusFilter === 'all' ||
                          o.order_status.toLowerCase() === orderStatusFilter.toLowerCase() ||
                          o.payment_status.toLowerCase() === orderStatusFilter.toLowerCase();
                        if (!matchesStatus) return false;
                        if (!orderSearchQuery.trim()) return true;
                        const query = orderSearchQuery.toLowerCase();
                        const custName = `${o.user?.first_name || ''} ${o.user?.last_name || ''} ${o.address?.name || ''}`.toLowerCase();
                        const custEmail = (o.user?.email || '').toLowerCase();
                        const ordNum = (o.order_number || '').toLowerCase();
                        return ordNum.includes(query) || custName.includes(query) || custEmail.includes(query);
                      })
                      .map((o) => {
                        const customerName = o.user ? `${o.user.first_name} ${o.user.last_name}` : (o.address?.name || `Customer #${o.user_id}`);
                        const customerEmail = o.user?.email || o.address?.phone || '';
                        const orderCurrency = o.currency || 'INR';
                        return (
                          <tr key={o.id} className="hover:bg-[#FDF4F7]">
                            <td className="p-3 font-mono font-bold text-[#111111]">
                              <span className="bg-[#F8D7E3] text-[#D84B7E] px-2 py-0.5 rounded border border-[#F1BCCE] inline-block mb-1">
                                {o.order_number}
                              </span>
                              <span className="text-[10px] text-gray-500 block">
                                Pay Method: <span className="font-bold text-gray-700">{o.payments?.[0]?.payment_method || 'Online / COD'}</span>
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="font-bold text-[#111111] block">{customerName}</span>
                              <span className="text-[11px] text-gray-500 block">{customerEmail}</span>
                            </td>

                            <td className="p-3 max-w-[200px]">
                              {o.items?.map((item) => (
                                <div key={item.id} className="text-[11px] text-gray-700">
                                  <span className="font-bold text-[#111111]">{item.product_name}</span> x {item.quantity}
                                </div>
                              ))}
                            </td>

                            <td className="p-3 max-w-[180px] text-[11px] text-gray-600">
                              {o.address ? (
                                <span>{o.address.city}, {o.address.state} - {o.address.postal_code}, {o.address.country}</span>
                              ) : (
                                <span className="text-gray-400">Standard Delivery</span>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold text-[#111111] text-sm">
                              {formatRawPrice(o.total_amount, orderCurrency)}
                            </td>

                            <td className="p-3">
                              <select
                                value={o.payment_status}
                                onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                                className={`p-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                                  o.payment_status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : o.payment_status === 'Pending'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}
                              >
                                <option value="Pending">Pending (Unpaid)</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                              </select>
                            </td>

                            <td className="p-3">
                              <select
                                value={o.order_status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="bg-[#FDF4F7] border border-[#F1BCCE] p-1.5 rounded-lg font-bold text-xs outline-none cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>

                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 1. CONTACT SECTION MESSAGES TAB */}
        {activeTab === 'contact_messages' && (
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#D84B7E]" />
                  Contact Us Inquiries ({messages.filter((m) => m.source !== 'ORDER_QUERY').length})
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  General inquiries, formulation questions, and support messages sent from the Contact Us page.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl">
                {(['ALL', 'UNREAD', 'READ', 'REPLIED'] as const).map((filter) => {
                  const filteredList = messages.filter((m) => m.source !== 'ORDER_QUERY');
                  const count =
                    filter === 'ALL'
                      ? filteredList.length
                      : filteredList.filter((m) => m.status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setMessageFilter(filter)}
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        messageFilter === filter
                          ? 'bg-[#D84B7E] text-white shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {filter} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inquiries List */}
            {messages
              .filter((m) => m.source !== 'ORDER_QUERY')
              .filter((m) => (messageFilter === 'ALL' ? true : m.status === messageFilter)).length === 0 ? (
              <div className="p-12 text-center bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl space-y-2">
                <Inbox className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-[#111111]">No contact messages in this view.</p>
                <p className="text-xs text-gray-500">
                  Customer messages submitted on the Contact page will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages
                  .filter((m) => m.source !== 'ORDER_QUERY')
                  .filter((m) => (messageFilter === 'ALL' ? true : m.status === messageFilter))
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        msg.status === 'UNREAD'
                          ? 'bg-[#FFF0F5] border-[#D84B7E] shadow-sm'
                          : 'bg-[#FDF4F7] border-[#F1BCCE]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          {msg.status === 'UNREAD' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#D84B7E] animate-pulse shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-sm text-[#111111]">{msg.name}</span>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-0.5">
                              <a
                                href={`mailto:${msg.email}`}
                                className="flex items-center gap-1 hover:text-[#D84B7E] transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5 text-[#D84B7E]" />
                                {msg.email}
                              </a>
                              {msg.phone && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  {msg.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                              msg.status === 'UNREAD'
                                ? 'bg-[#D84B7E] text-white'
                                : msg.status === 'REPLIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {msg.status}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Subject & Message */}
                      <div className="space-y-1.5 bg-white/70 p-3.5 rounded-xl border border-[#F1BCCE]/60 mb-3 text-xs">
                        {msg.subject && (
                          <p className="font-bold text-[#111111] flex items-center gap-1.5">
                            <span className="text-gray-500 font-normal uppercase tracking-wider text-[10px]">
                              Subject:
                            </span>
                            {msg.subject}
                          </p>
                        )}
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F1BCCE]/50 text-xs">
                        <div className="flex items-center gap-2">
                          {msg.status === 'UNREAD' && (
                            <button
                              onClick={() => handleUpdateMessageStatus(msg.id, 'READ')}
                              className="px-3 py-1.5 bg-white border border-[#F1BCCE] text-[#111111] font-bold rounded-lg hover:bg-[#FCE7F0] transition-all cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#D84B7E]" /> Mark as Read
                            </button>
                          )}
                          {msg.status !== 'REPLIED' && (
                            <button
                              onClick={() => handleUpdateMessageStatus(msg.id, 'REPLIED')}
                              className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-lg hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark as Replied
                            </button>
                          )}
                          <a
                            href={`mailto:${msg.email}?subject=${encodeURIComponent(
                              `Re: ${msg.subject || 'Your Inquiry with Yurae Beauty'}`
                            )}`}
                            className="px-3 py-1.5 bg-[#D84B7E] text-white font-bold rounded-lg hover:bg-[#111111] transition-all cursor-pointer flex items-center gap-1 text-xs shadow-2xs"
                          >
                            <Mail className="w-3.5 h-3.5" /> Reply via Email
                          </a>
                        </div>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ORDER QUERIES & DELIVERY INSTRUCTIONS TAB */}
        {activeTab === 'order_queries' && (
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#111111] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#D84B7E]" />
                  Order Queries & Post-Checkout Notes ({messages.filter((m) => m.source === 'ORDER_QUERY').length})
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Special delivery instructions, packaging requests, and queries submitted by customers upon placing an order.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl">
                {(['ALL', 'UNREAD', 'READ', 'REPLIED'] as const).map((filter) => {
                  const filteredList = messages.filter((m) => m.source === 'ORDER_QUERY');
                  const count =
                    filter === 'ALL'
                      ? filteredList.length
                      : filteredList.filter((m) => m.status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setOrderQueryFilter(filter)}
                      className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        orderQueryFilter === filter
                          ? 'bg-[#D84B7E] text-white shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {filter} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Queries List */}
            {messages
              .filter((m) => m.source === 'ORDER_QUERY')
              .filter((m) => (orderQueryFilter === 'ALL' ? true : m.status === orderQueryFilter)).length === 0 ? (
              <div className="p-12 text-center bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl space-y-2">
                <Inbox className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-[#111111]">No order queries in this view.</p>
                <p className="text-xs text-gray-500">
                  Notes and queries submitted by clients on the order confirmation screen will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages
                  .filter((m) => m.source === 'ORDER_QUERY')
                  .filter((m) => (orderQueryFilter === 'ALL' ? true : m.status === orderQueryFilter))
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        msg.status === 'UNREAD'
                          ? 'bg-[#FFF0F5] border-[#D84B7E] shadow-sm'
                          : 'bg-[#FDF4F7] border-[#F1BCCE]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          {msg.status === 'UNREAD' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#D84B7E] animate-pulse shrink-0" />
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.order_number && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderSearchQuery(msg.order_number || '');
                                  setActiveTab('orders');
                                }}
                                className="px-3 py-1 bg-[#111111] text-white text-xs font-mono font-bold rounded-lg hover:bg-[#D84B7E] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Click to view full order in Orders tab"
                              >
                                📦 Order #{msg.order_number}
                              </button>
                            )}
                            <span className="font-bold text-sm text-[#111111]">{msg.name}</span>
                            {msg.rating && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold">
                                {msg.rating}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                              msg.status === 'UNREAD'
                                ? 'bg-[#D84B7E] text-white'
                                : msg.status === 'REPLIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {msg.status}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Topic & Query Content */}
                      <div className="space-y-1.5 bg-white p-4 rounded-xl border border-[#F1BCCE] mb-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-gray-100">
                          <span className="font-bold text-[#D84B7E] text-xs">
                            {msg.subject || 'Order Note'}
                          </span>
                          <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                            <a href={`mailto:${msg.email}`} className="hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#D84B7E]" /> {msg.email}
                            </a>
                            {msg.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" /> {msg.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed pt-1">{msg.message}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F1BCCE]/50 text-xs">
                        <div className="flex items-center gap-2">
                          {msg.status === 'UNREAD' && (
                            <button
                              onClick={() => handleUpdateMessageStatus(msg.id, 'READ')}
                              className="px-3 py-1.5 bg-white border border-[#F1BCCE] text-[#111111] font-bold rounded-lg hover:bg-[#FCE7F0] transition-all cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#D84B7E]" /> Mark as Read
                            </button>
                          )}
                          {msg.status !== 'REPLIED' && (
                            <button
                              onClick={() => handleUpdateMessageStatus(msg.id, 'REPLIED')}
                              className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-lg hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark as Replied
                            </button>
                          )}
                          <a
                            href={`mailto:${msg.email}?subject=${encodeURIComponent(
                              `Re: Order #${msg.order_number || ''} Query - Yurae Beauty`
                            )}`}
                            className="px-3 py-1.5 bg-[#D84B7E] text-white font-bold rounded-lg hover:bg-[#111111] transition-all cursor-pointer flex items-center gap-1 text-xs shadow-2xs"
                          >
                            <Mail className="w-3.5 h-3.5" /> Reply to Customer
                          </a>
                        </div>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#111111]">Registered Customers ({customers.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1BCCE]">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-[#FDF4F7]">
                      <td className="p-3 font-bold text-[#111111]">
                        {cust.first_name} {cust.last_name}
                      </td>
                      <td className="p-3 text-gray-600">{cust.email}</td>
                      <td className="p-3 text-gray-600">{cust.phone || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          cust.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cust.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#111111]">Inventory Monitor</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Available Stock</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1BCCE]">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FDF4F7]">
                      <td className="p-3 font-bold text-[#111111]">{item.name}</td>
                      <td className="p-3 font-mono text-gray-500">{item.sku}</td>
                      <td className="p-3 font-bold text-[#111111]">{item.stock_quantity} units</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                          item.is_low_stock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.is_low_stock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      {(isAddProductOpen || !!editingProduct) && (
        <ProductFormModal
          isOpen={isAddProductOpen || !!editingProduct}
          onClose={() => {
            setIsAddProductOpen(false);
            setEditingProduct(null);
          }}
          productToEdit={editingProduct}
          categories={categories}
          allowCategorySelection={true}
          onSuccess={(savedProduct, isNew) => {
            if (isNew) {
              setProducts((prev) => [savedProduct, ...prev]);
            } else {
              setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
            }
            setIsAddProductOpen(false);
            setEditingProduct(null);
            loadAdminData();
          }}
        />
      )}

      {/* ADMIN LIVE TRACKING MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#F1BCCE]">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D84B7E] font-bold flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Real-Time Courier Telemetry
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#111111] mt-0.5">
                  Order #{trackingModalOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => {
                  setTrackingModalOrder(null);
                  setAdminTrackingData(null);
                }}
                className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingAdminTracking ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#D84B7E] animate-spin mx-auto" />
                <p className="text-xs text-gray-600 font-bold">Querying courier carrier telemetry and scan manifests...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-2xl">
                    <span className="text-[11px] text-gray-500 font-bold block mb-0.5">Carrier Partner</span>
                    <span className="font-bold text-[#111111] text-sm block">
                      {adminTrackingData?.courier_name || trackingModalOrder.courier_name || 'Blue Dart Express Air'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-2xl">
                    <span className="text-[11px] text-gray-500 font-bold block mb-0.5">Air Waybill (AWB)</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#D84B7E] text-sm">
                        {adminTrackingData?.awb_code || trackingModalOrder.awb_code || 'Pending'}
                      </span>
                      {(adminTrackingData?.awb_code || trackingModalOrder.awb_code) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(adminTrackingData?.awb_code || trackingModalOrder.awb_code || '');
                            showToast('AWB copied', 'info');
                          }}
                          className="text-gray-400 hover:text-[#D84B7E] p-1 cursor-pointer"
                          title="Copy AWB"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-2xl">
                    <span className="text-[11px] text-gray-500 font-bold block mb-0.5">Estimated Delivery</span>
                    <span className="font-bold text-emerald-700 text-sm block">
                      {adminTrackingData?.estimated_delivery || trackingModalOrder.estimated_delivery_date || '2-4 Business Days'}
                    </span>
                  </div>
                </div>

                {/* Live Scan Events Timeline */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#111111] uppercase tracking-wider">
                    Courier Checkpoint Activity Stream
                  </h4>

                  {(!adminTrackingData?.events || adminTrackingData.events.length === 0) ? (
                    <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl text-xs text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D84B7E]" />
                      <span>Shipment recorded in courier system. Checkpoints will stream automatically upon transit hub scans.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {adminTrackingData.events.map((ev: any, i: number) => (
                        <div
                          key={ev.id || i}
                          className="p-3.5 bg-white border border-[#F1BCCE] rounded-xl flex items-start gap-3 text-xs"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D84B7E] mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[#111111]">{ev.activity}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(ev.event_time).toLocaleDateString()} • {new Date(ev.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {ev.location && (
                              <span className="text-[11px] text-gray-500 block mt-0.5">
                                Location: {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-[#F1BCCE]">
                  <div className="flex items-center gap-2">
                    {trackingModalOrder.shipping_label_url && (
                      <a
                        href={trackingModalOrder.shipping_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white border border-[#F1BCCE] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#FCE7F0] transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#D84B7E]" /> Download Shipping Label PDF
                      </a>
                    )}
                  </div>

                  {adminTrackingData?.tracking_url && (
                    <a
                      href={adminTrackingData.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-[#111111] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#D84B7E] transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      Carrier Web Portal <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
