import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, Users, AlertTriangle, Plus, Trash2, Tag, Globe, RefreshCw, Edit
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
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponVal, setNewCouponVal] = useState<number>(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(1000);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, prodRes, ordRes, custRes, invRes, coupRes, catRes, curRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/products?limit=100'),
        api.get('/admin/orders'),
        api.get('/admin/customers'),
        api.get('/admin/inventory'),
        api.get('/coupons'),
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

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/coupons', {
        code: newCouponCode,
        discount_type: newCouponType,
        discount_value: newCouponVal,
        minimum_order_amount: newCouponMinOrder,
        active: true,
      });
      showToast(`Coupon "${res.data.code}" created!`, 'success');
      setCoupons([...coupons, res.data]);
      setNewCouponCode('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create coupon';
      showToast(msg, 'error');
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
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="px-6 py-3 bg-[#D84B7E] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all flex items-center gap-2 shadow-md border border-[#D84B7E] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
              <span>Total Revenue</span>
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
              <span>Total Customers</span>
              <Users className="w-4 h-4 text-[#D84B7E]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#111111]">{stats?.total_customers}</p>
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
            { id: 'currencies', label: 'Currencies & Rates' },
            { id: 'products', label: `Products (${products.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'customers', label: `Customers (${customers.length})` },
            { id: 'inventory', label: 'Inventory Monitor' },
            { id: 'coupons', label: `Coupons (${coupons.length})` },
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

        {/* OVERVIEW TAB DEFAULT */}
        {(activeTab === 'overview' || activeTab === 'inventory' || activeTab === 'customers' || activeTab === 'coupons') && (
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

            {/* Coupons Control */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#D84B7E]" />
                Create Coupon Code
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="CODE (e.g. SUMMER25)"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    required
                    className="p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl uppercase font-bold outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Discount Value"
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(Number(e.target.value))}
                    required
                    className="p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                    className="p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold outline-none cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Min Order (₹)"
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                    className="p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#D84B7E] text-white uppercase font-bold rounded-xl hover:bg-[#111111] transition-colors cursor-pointer"
                >
                  Save Coupon
                </button>
              </form>
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

