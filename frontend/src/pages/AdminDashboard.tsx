import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminTab } from '../components/admin/types/admin';
import { DashboardOverview } from '../components/admin/views/DashboardOverview';
import { ProductManagement } from '../components/admin/views/ProductManagement';
import { CategoryManagement } from '../components/admin/views/CategoryManagement';
import { InventoryManagement } from '../components/admin/views/InventoryManagement';
import { OrderManagement } from '../components/admin/views/OrderManagement';
import { CustomerManagement } from '../components/admin/views/CustomerManagement';
import { PaymentManagement } from '../components/admin/views/PaymentManagement';
import { ShippingManagement } from '../components/admin/views/ShippingManagement';
import { CouponManagement } from '../components/admin/views/CouponManagement';
import { ReviewsManagement } from '../components/admin/views/ReviewsManagement';
import { MarketingManagement } from '../components/admin/views/MarketingManagement';
import { ContentManagement } from '../components/admin/views/ContentManagement';
import { AnalyticsReports } from '../components/admin/views/AnalyticsReports';
import { SupportMessages } from '../components/admin/views/SupportMessages';
import { ReturnsRefunds } from '../components/admin/views/ReturnsRefunds';
import { UserRolesPermissions } from '../components/admin/views/UserRolesPermissions';
import { AuditLogs } from '../components/admin/views/AuditLogs';
import { SettingsManagement } from '../components/admin/views/SettingsManagement';
import { AiStudio } from '../components/admin/views/AiStudio';
import { ProductFormModal } from '../components/common/ProductFormModal';
import { Product, Order, User as CustomerUser, Category, Coupon, ContactMessage, ReturnRequest, AdminDashboardStats } from '../types';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Tab State (with URL hash or query persistence)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Master Data State
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Selected Order for quick inspection from search or overview
  const [selectedOrderForInspect, setSelectedOrderForInspect] = useState<Order | null>(null);

  // Check Admin Authorization
  useEffect(() => {
    if (!isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, navigate]);

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      const [
        statsRes,
        productsRes,
        ordersRes,
        categoriesRes,
        customersRes,
        couponsRes,
        messagesRes,
        returnsRes,
      ] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/products'),
        api.get('/admin/orders'),
        api.get('/categories'),
        api.get('/admin/customers'),
        api.get('/coupons'),
        api.get('/contact'),
        api.get('/returns/all'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (productsRes.status === 'fulfilled') {
        const prodData = productsRes.value.data;
        setProducts(Array.isArray(prodData) ? prodData : prodData.products || []);
      }
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value.data);
      if (customersRes.status === 'fulfilled') setCustomers(customersRes.value.data);
      if (couponsRes.status === 'fulfilled') setCoupons(couponsRes.value.data);
      if (messagesRes.status === 'fulfilled') setMessages(messagesRes.value.data);
      if (returnsRes.status === 'fulfilled') setReturnRequests(returnsRes.value.data);
    } catch {
      // Non-blocking error
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  // Handlers for Products Refresh
  const handleRefreshProducts = async () => {
    try {
      const res = await api.get('/products');
      const data = res.data;
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch {
      // Ignore
    }
  };

  // Handlers for Orders Refresh
  const handleRefreshOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch {
      // Ignore
    }
  };

  // Handlers for Categories Refresh
  const handleRefreshCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {
      // Ignore
    }
  };

  // Handlers for Customers Refresh
  const handleRefreshCustomers = async () => {
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data);
    } catch {
      // Ignore
    }
  };

  // Handlers for Coupons Refresh
  const handleRefreshCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch {
      // Ignore
    }
  };

  // Handlers for Messages Refresh
  const handleRefreshMessages = async () => {
    try {
      const res = await api.get('/contact');
      setMessages(res.data);
    } catch {
      // Ignore
    }
  };

  // Handlers for Returns Refresh
  const handleRefreshReturns = async () => {
    try {
      const res = await api.get('/returns/all');
      setReturnRequests(res.data);
    } catch {
      // Ignore
    }
  };

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  // Compute live badges
  const pendingOrdersCount = orders.filter((o) =>
    ['Pending', 'Confirmed', 'Processing'].includes(o.order_status)
  ).length;

  const lowStockCount = products.filter(
    (p) => (p.stock_quantity || 0) <= 10
  ).length;

  const unreadMessagesCount = messages.filter((m) => m.status === 'UNREAD').length;

  const pendingReturnsCount = returnRequests.filter(
    (r) => r.status === 'PENDING_REVIEW'
  ).length;

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      products={products}
      orders={orders}
      customers={customers}
      pendingOrdersCount={pendingOrdersCount}
      lowStockCount={lowStockCount}
      unreadMessagesCount={unreadMessagesCount}
      pendingReturnsCount={pendingReturnsCount}
    >
      {/* 1. Dashboard Overview */}
      {activeTab === 'overview' && (
        <DashboardOverview
          stats={stats}
          orders={orders}
          products={products}
          onNavigateTab={setActiveTab}
          onOpenAddProduct={handleOpenAddProduct}
          onSelectOrder={(ord) => {
            setSelectedOrderForInspect(ord);
            setActiveTab('orders');
          }}
        />
      )}

      {/* 2. Products Catalog Management */}
      {activeTab === 'products' && (
        <ProductManagement
          products={products}
          categories={categories}
          onRefreshProducts={handleRefreshProducts}
          onOpenAddModal={handleOpenAddProduct}
          onOpenEditModal={handleOpenEditProduct}
        />
      )}

      {/* 3. Categories Tree Management */}
      {activeTab === 'categories' && (
        <CategoryManagement
          categories={categories}
          products={products}
          onRefreshCategories={handleRefreshCategories}
        />
      )}

      {/* 4. Live Inventory & WMS Station */}
      {activeTab === 'inventory' && (
        <InventoryManagement
          products={products}
          onRefreshProducts={handleRefreshProducts}
        />
      )}

      {/* 5. Orders & Fulfillment Board */}
      {activeTab === 'orders' && (
        <OrderManagement
          orders={orders}
          onRefreshOrders={handleRefreshOrders}
          selectedOrderFromSearch={selectedOrderForInspect}
        />
      )}

      {/* 6. Customers 360 CRM */}
      {activeTab === 'customers' && (
        <CustomerManagement
          customers={customers}
          onRefreshCustomers={handleRefreshCustomers}
        />
      )}

      {/* 7. Payment Gateways & Transactions */}
      {activeTab === 'payments' && <PaymentManagement orders={orders} />}

      {/* 8. Shipping & Logistics Hub */}
      {activeTab === 'shipping' && (
        <ShippingManagement
          orders={orders}
          onRefreshOrders={handleRefreshOrders}
        />
      )}

      {/* 9. Discount Promo Coupons */}
      {activeTab === 'coupons' && (
        <CouponManagement
          coupons={coupons}
          onRefreshCoupons={handleRefreshCoupons}
        />
      )}

      {/* 10. Reviews & Reputation Moderation */}
      {activeTab === 'reviews' && <ReviewsManagement />}

      {/* 11. Marketing & Campaign Studio */}
      {activeTab === 'marketing' && <MarketingManagement />}

      {/* 12. CMS Content & Legal Pages */}
      {activeTab === 'content' && <ContentManagement />}

      {/* 13. Financial & GST Reports Center */}
      {activeTab === 'analytics' && <AnalyticsReports />}

      {/* 14. Customer Support & Concierge */}
      {activeTab === 'support' && (
        <SupportMessages
          messages={messages}
          onRefreshMessages={handleRefreshMessages}
        />
      )}

      {/* 15. Returns & Exchanges Claims */}
      {activeTab === 'returns' && (
        <ReturnsRefunds
          returnRequests={returnRequests}
          onRefreshReturns={handleRefreshReturns}
        />
      )}

      {/* 16. Staff RBAC Roles & Permissions */}
      {activeTab === 'roles' && <UserRolesPermissions />}

      {/* 17. Audit Trail Logs */}
      {activeTab === 'audit' && <AuditLogs />}

      {/* 18. Settings & Database Diagnostics */}
      {activeTab === 'settings' && <SettingsManagement />}

      {/* 19. AI Copilot & Generative Studio */}
      {activeTab === 'ai_studio' && <AiStudio />}

      {/* 20. Database Sub-View */}
      {activeTab === 'database' && <SettingsManagement />}

      {/* Product Create / Edit Modal */}
      {isProductModalOpen && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          productToEdit={editingProduct}
          categories={categories}
          onSuccess={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
            handleRefreshProducts();
          }}
        />
      )}
    </AdminLayout>
  );
};
