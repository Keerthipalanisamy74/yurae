import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, AlertTriangle, Plus, Trash2, Tag, Globe,
  RefreshCw, Edit, Clock, X, Sparkles, Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { AdminDashboardStats, Product, Order, User as CustomerUser, Coupon, Category, CurrencyInfo } from '../types';
import { ProductFormModal } from '../components/common/ProductFormModal';

export const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { formatRawPrice } = useCurrency();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'inventory' | 'coupons' | 'currencies'>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencyData, setCurrencyData] = useState<{
    base_currency: string;
    rates: Record<string, number>;
    currencies: CurrencyInfo[];
    last_updated: string;
  } | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const [statsRes, prodRes, ordRes, custRes, invRes, coupRes, catRes, curRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/products?limit=100'),
        api.get('/admin/orders'),
        api.get('/admin/customers'),
        api.get('/admin/inventory'),
        api.get('/coupons?include_inactive=true'),
        api.get('/categories'),
        api.get('/currencies/rates'),
      ]);

      setStats(statsRes.data);
      setProducts(prodRes.data);
      setOrders(ordRes.data);
      setCustomers(custRes.data);
      setInventory(invRes.data);
      setCoupons(coupRes.data);
      setCategories(catRes.data);
      setCurrencyData(curRes.data);
    } catch {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAdmin) {
      showToast('Admin authorization required', 'error');
      navigate('/login');
      return;
    }
    loadAdminData();
  }, [isAdmin, navigate, showToast, loadAdminData]);

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
      await api.put(`/orders/${orderId}/status`, { order_status: newStatus });
      showToast(`Order #${orderId} updated to ${newStatus}`, 'success');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, order_status: newStatus as any } : o)));
    } catch {
      showToast('Failed to update order status', 'error');
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
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab('coupons');
                setIsCreateCouponOpen(true);
              }}
              className="px-5 py-3 bg-[#FFF8FA] text-[#D84B7E] border border-[#D84B7E] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#D84B7E] hover:text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Tag className="w-4 h-4" /> Add Coupon
            </button>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-6 py-3 bg-[#D84B7E] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all flex items-center gap-2 shadow-md border border-[#D84B7E] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Product
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
                  : 'text-gray-700 hover:bg-[#FCE7F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}

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
            <h3 className="font-serif text-xl font-bold text-[#111111]">Order Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCE7F0] uppercase text-[#111111] font-bold border-b border-[#F1BCCE]">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer ID</th>
                    <th className="p-3">Currency</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Change Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1BCCE]">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#FDF4F7]">
                      <td className="p-3 font-mono font-bold text-[#111111]">{o.order_number}</td>
                      <td className="p-3 text-gray-700">User #{o.user_id}</td>
                      <td className="p-3 font-bold text-[#D84B7E]">{o.currency || 'INR'}</td>
                      <td className="p-3 font-bold text-[#111111]">
                        {formatRawPrice(o.total_amount, o.currency || 'INR')}
                      </td>
                      <td className="p-3 text-emerald-700 font-bold">{o.payment_status}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-[#FCE7F0] text-[#111111] font-bold rounded-full">
                          {o.order_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={o.order_status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-[#FDF4F7] border border-[#F1BCCE] p-1.5 rounded-lg font-bold outline-none cursor-pointer"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inventory Alerts */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Low Stock Warning Monitor
              </h3>
              <div className="space-y-3">
                {inventory.filter((i) => i.is_low_stock).map((item) => (
                  <div key={item.id} className="p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#111111] block">{item.name}</span>
                      <span className="text-gray-500 font-mono">SKU: {item.sku}</span>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full">
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Coupons Card */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#D84B7E]" />
                  Active Promotions ({coupons.filter((c) => c.active).length})
                </h3>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className="text-xs text-[#D84B7E] font-bold hover:underline"
                >
                  Manage All →
                </button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {coupons.map((c) => {
                  const exp = getCouponExpiryBadge(c.expiry_date);
                  return (
                    <div key={c.id} className="p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#111111]">{c.code}</span>
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                            {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-0.5">{exp.text}</span>
                      </div>
                      <span className="text-gray-500 text-[11px]">
                        {c.times_used} redeemed
                      </span>
                    </div>
                  );
                })}
              </div>
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

    </div>
  );
};
