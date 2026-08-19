import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingCart, Users, AlertTriangle, Plus, Trash2, Tag, X, Globe, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { AdminDashboardStats, Product, Order, User as CustomerUser, Coupon, Category, CurrencyInfo } from '../types';

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

  // New Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSlug, setNewProdSlug] = useState('');
  const [newProdCatId, setNewProdCatId] = useState<number>(1);
  const [newProdPrice, setNewProdPrice] = useState<number>(1290);
  const [newProdSalePrice, setNewProdSalePrice] = useState<number | undefined>(1090);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdSkinType, setNewProdSkinType] = useState('Sensitive, Combination');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdShortDesc, setNewProdShortDesc] = useState('');
  const [newProdIngredients, setNewProdIngredients] = useState('');
  const [newProdImgUrl, setNewProdImgUrl] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
  const [newProdDressType, setNewProdDressType] = useState('Maxi & Midi Dresses');
  const [newProdAccessoryType, setNewProdAccessoryType] = useState('Ring');

  const availableFashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const dressCategories = [
    'Maxi & Midi Dresses',
    'Mini & Cocktail Dresses',
    'Silk Robes & Kimonos',
    'Co-ord Sets & Jumpsuits',
    'Evening & Party Gowns',
    'Summer & Casual Dresses',
    'Tops & Blouses',
    'Skirts & Bottoms',
    'Loungewear & Nightwear',
    'Ethnic & Fusion Wear',
  ];

  const accessoryCategories = [
    'Ring',
    'Necklace',
    'Bracelet',
    'Earrings',
  ];

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewProdImgUrl(reader.result as string);
          showToast('Product image loaded successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugVal = newProdSlug || newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const defaultImg = newProdImgUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80';

      const selectedCat = categories.find((c) => c.id === newProdCatId);
      const isFashionCat = selectedCat?.slug === 'fashion' || selectedCat?.name?.toLowerCase().includes('fashion');

      const variantsPayload = isFashionCat && selectedSizes.length > 0
        ? selectedSizes.map((size) => ({
            variant_name: 'Size',
            variant_value: size,
            additional_price: 0,
            stock_quantity: Math.max(1, Math.floor(newProdStock / selectedSizes.length)),
          }))
        : [];

      const skinTypeVal = isFashionCat
        ? (selectedSizes.length > 0 ? `Sizes: ${selectedSizes.join(', ')}` : (newProdSkinType || 'Standard Fit'))
        : (newProdSkinType || 'All');

      const isAccessoryCat = selectedCat?.slug === 'accessories' || selectedCat?.name?.toLowerCase().includes('accessories');

      const shortDescVal = newProdShortDesc || (
        isFashionCat ? `${newProdDressType} • Premium Fashion` :
        isAccessoryCat ? `${newProdAccessoryType} • Luxury Accessories` :
        newProdName
      );

      const descVal = newProdDesc || (
        isFashionCat ? `Handcrafted luxury silhouette designed for effortless elegance. Style: ${newProdDressType}.` :
        isAccessoryCat ? `Artisanal minimal jewelry crafted with delicate craftsmanship. Category: ${newProdAccessoryType}.` :
        'Botanical formulation designed to nourish and balance skin.'
      );

      const ingredientsVal = newProdIngredients || (
        isFashionCat ? '100% Mulberry Silk / Pure Linen Weave' :
        isAccessoryCat ? '18K Gold Vermeil, Freshwater Pearl, Sterling Silver 925' :
        'Madagascar Centella Asiatica, Hyaluronic Acid, Niacinamide'
      );

      await api.post('/products', {
        category_id: newProdCatId,
        name: newProdName,
        slug: slugVal,
        price: newProdPrice,
        sale_price: newProdSalePrice || null,
        stock_quantity: newProdStock,
        skin_type: skinTypeVal,
        short_description: shortDescVal,
        description: descVal,
        ingredients: ingredientsVal,
        how_to_use: isFashionCat ? 'Dry clean or gentle hand wash cold with mild silk detergent.' : isAccessoryCat ? 'Store in dry velvet pouch. Avoid direct contact with perfume.' : 'Apply 2-3 drops after cleansing.',
        images: [defaultImg],
        variants: variantsPayload,
      });

      showToast('Product published successfully!', 'success');
      setIsAddProductOpen(false);
      resetProductForm();
      loadAdminData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create product';
      showToast(msg, 'error');
    }
  };

  const resetProductForm = () => {
    setNewProdName('');
    setNewProdSlug('');
    setNewProdPrice(1290);
    setNewProdSalePrice(1090);
    setNewProdStock(50);
    setNewProdDesc('');
    setNewProdShortDesc('');
    setNewProdIngredients('');
    setNewProdImgUrl('');
    setSelectedSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
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
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8FA] border border-[#D84B7E] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#F1BCCE] pb-4">
              <h2 className="font-serif text-2xl font-bold text-[#111111]">Upload New Product</h2>
              <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-black font-bold p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    required
                    placeholder="e.g. Silk Evening Gown or Hydrating Cleanser"
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Category *</label>
                  <select
                    value={newProdCatId}
                    onChange={(e) => setNewProdCatId(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Base Price in INR (₹) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Sale / Offer Price in INR (₹)</label>
                  <input
                    type="number"
                    value={newProdSalePrice || ''}
                    onChange={(e) => setNewProdSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional discounted price"
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#111111] block mb-1">Total Stock Quantity *</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>
              </div>

              {/* Dynamic Subcategories */}
              {categories.find((c) => c.id === newProdCatId)?.slug === 'fashion' && (
                <div className="space-y-3 p-4 bg-[#FCE7F0]/70 border border-[#F1BCCE] rounded-2xl">
                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Dress / Apparel Category *</label>
                    <select
                      value={newProdDressType}
                      onChange={(e) => setNewProdDressType(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none cursor-pointer"
                    >
                      {dressCategories.map((dc) => (
                        <option key={dc} value={dc}>{dc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#111111] block mb-1.5">Available Size Options</label>
                    <div className="flex flex-wrap gap-2">
                      {availableFashionSizes.map((size) => {
                        const isSelected = selectedSizes.includes(size);
                        return (
                          <button
                            type="button"
                            key={size}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSizes(selectedSizes.filter((s) => s !== size));
                              } else {
                                setSelectedSizes([...selectedSizes, size]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected ? 'bg-[#D84B7E] text-white shadow-xs' : 'bg-white border border-[#F1BCCE] text-gray-700'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {categories.find((c) => c.id === newProdCatId)?.slug === 'skincare' && (
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Target Skin Type</label>
                  <input
                    type="text"
                    value={newProdSkinType}
                    onChange={(e) => setNewProdSkinType(e.target.value)}
                    placeholder="e.g. Sensitive, Dry, Combination, All"
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>
              )}

              {categories.find((c) => c.id === newProdCatId)?.slug === 'accessories' && (
                <div className="p-4 bg-[#FCE7F0]/70 border border-[#F1BCCE] rounded-2xl">
                  <label className="font-bold text-[#111111] block mb-1">Accessory Category *</label>
                  <select
                    value={newProdAccessoryType}
                    onChange={(e) => setNewProdAccessoryType(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none cursor-pointer"
                  >
                    {accessoryCategories.map((ac) => (
                      <option key={ac} value={ac}>{ac}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-[#111111] block mb-1">Short Description (Optional)</label>
                <input
                  type="text"
                  value={newProdShortDesc}
                  onChange={(e) => setNewProdShortDesc(e.target.value)}
                  placeholder="Brief 1-line product highlight..."
                  className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Full Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Detailed product story, care instructions, and ritual guide..."
                  className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl font-bold text-sm outline-none focus:border-[#D84B7E]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Product Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#F1BCCE]">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-6 py-2.5 border border-[#111111] text-[#111111] uppercase font-bold rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#D84B7E] text-white uppercase font-bold rounded-full hover:bg-[#111111] shadow-md cursor-pointer"
                >
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
