import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Package,
  Layers,
  Warehouse,
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  Tag,
  Star,
  Sparkles,
  FileText,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Shield,
  Settings,
  Database,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { AdminTab } from './types/admin';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Product, Order, User as CustomerUser } from '../../types';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
  products?: Product[];
  orders?: Order[];
  customers?: CustomerUser[];
  pendingOrdersCount?: number;
  lowStockCount?: number;
  unreadMessagesCount?: number;
  pendingReturnsCount?: number;
  onRefreshAll?: () => void;
  isRefreshingAll?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  products = [],
  orders = [],
  customers = [],
  pendingOrdersCount = 0,
  lowStockCount = 0,
  unreadMessagesCount = 0,
  pendingReturnsCount = 0,
  onRefreshAll,
  isRefreshingAll = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navGroups: NavGroup[] = [
    {
      title: 'Core Commerce',
      items: [
        { id: 'overview', label: 'Dashboard', icon: TrendingUp },
        { id: 'products', label: 'Products', icon: Package, badge: products.length || undefined },
        { id: 'categories', label: 'Categories', icon: Layers },
        {
          id: 'inventory',
          label: 'Inventory & WMS',
          icon: Warehouse,
          badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
      ],
    },
    {
      title: 'Operations & Logistics',
      items: [
        { id: 'shipping', label: 'Shipping & Couriers', icon: Truck },
        {
          id: 'returns',
          label: 'Returns & Exchanges',
          icon: RotateCcw,
          badge: pendingReturnsCount > 0 ? pendingReturnsCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
        {
          id: 'support',
          label: 'Support & Inquiries',
          icon: MessageSquare,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          badgeColor: 'bg-[#FCE7F0] text-[#D84B7E]',
        },
      ],
    },
    {
      title: 'Growth & Customers',
      items: [
        { id: 'customers', label: 'Customers 360', icon: Users, badge: customers.length || undefined },
        { id: 'coupons', label: 'Discount Coupons', icon: Tag },
        { id: 'reviews', label: 'Reviews Moderation', icon: Star },
        { id: 'marketing', label: 'Marketing & Banners', icon: Sparkles },
      ],
    },
    {
      title: 'Intelligence & Content',
      items: [
        { id: 'analytics', label: 'Financial & GST Reports', icon: FileText },
        { id: 'ai_studio', label: 'AI Intelligence Studio', icon: Sparkles },
        { id: 'content', label: 'CMS Content Pages', icon: FileText },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'roles', label: 'Staff Roles & Access', icon: ShieldCheck },
        { id: 'audit', label: 'Audit Trail Logs', icon: Shield },
        { id: 'settings', label: 'Settings & Environment', icon: Settings },
      ],
    },
  ];

  const currentTabLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label || 'Dashboard';

  const totalNotifications = pendingOrdersCount + lowStockCount + unreadMessagesCount + pendingReturnsCount;

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#111111] flex flex-col antialiased selection:bg-[#D84B7E] selection:text-white">
      {/* GLOBAL SEARCH COMMAND PALETTE MODAL */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectTab={onTabChange}
        products={products}
        orders={orders}
        customers={customers}
      />

      <div className="flex-1 flex">
        {/* ========================================================================= */}
        {/* 1. DESKTOP SIDEBAR NAVIGATION */}
        {/* ========================================================================= */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#F1BCCE]/60 transition-all duration-300 z-30 sticky top-0 h-screen ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#F1BCCE]/60 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
              <img
                src="/logo/logo-emblem.png"
                alt="Yurae Emblem"
                className="w-8 h-8 object-contain shrink-0 drop-shadow-xs"
              />
              {!isSidebarCollapsed && (
                <div className="transition-opacity duration-200">
                  <span className="font-serif text-sm font-bold tracking-[0.16em] text-[#111111] block leading-none">
                    YURAE
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#D84B7E] font-bold block mt-0.5">
                    Enterprise Studio
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-[#111111] hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Nav Links Scroll Area */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-[#F1BCCE]">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!isSidebarCollapsed ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 px-3 block mb-1.5">
                    {group.title}
                  </span>
                ) : (
                  <div className="w-4 h-0.5 bg-[#F1BCCE]/60 mx-auto my-2 rounded-full" />
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'text-gray-700 hover:bg-[#FCE7F0] hover:text-[#D84B7E]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </div>

                      {!isSidebarCollapsed && item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : item.badgeColor || 'bg-[#FAF0F4] text-gray-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#F1BCCE]/60 bg-[#FAF0F4]/40">
            <Link
              to="/shop"
              target="_blank"
              className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-[#D84B7E] hover:bg-white transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title="View Public Storefront"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                {!isSidebarCollapsed && <span>View Storefront</span>}
              </div>
            </Link>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 2. MOBILE SLIDE-OVER DRAWER */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-72 bg-white h-full shadow-2xl z-10 flex flex-col"
              >
                <div className="h-16 px-4 border-b border-[#F1BCCE] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/logo/logo-emblem.png" alt="Yurae" className="w-8 h-8" />
                    <div>
                      <span className="font-serif text-sm font-bold tracking-widest text-[#111111]">
                        YURAE
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-[#D84B7E] font-bold block">
                        Admin Suite
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {navGroups.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 block mb-1">
                        {group.title}
                      </span>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                              isActive
                                ? 'bg-[#D84B7E] text-white shadow-xs'
                                : 'text-gray-700 hover:bg-[#FCE7F0]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 3. MAIN WORKSPACE */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Sticky App Header */}
          <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-[#F1BCCE]/60 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Mobile Menu Trigger & Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-500 hidden sm:inline">Admin Studio</span>
                <span className="text-gray-300 hidden sm:inline">/</span>
                <span className="font-bold text-[#111111]">{currentTabLabel}</span>
              </div>
            </div>

            {/* Global Search Trigger Bar */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden md:flex items-center justify-between w-64 lg:w-80 px-3.5 py-2 rounded-xl bg-[#FAF0F4] border border-[#F1BCCE] text-xs text-gray-600 hover:border-[#D84B7E] hover:bg-[#FCE7F0]/40 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#D84B7E]" />
                <span className="truncate">Search products, orders, clients...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-[#F1BCCE]/60 text-gray-600 shadow-2xs">
                Ctrl+K
              </kbd>
            </button>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-[#FCE7F0] transition-colors"
                title="Global Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* 10s Live Telemetry Sync Beacon */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shadow-2xs"
                title="Live Sync: Data automatically updates every 10 seconds"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Sync 10s</span>
              </div>

              {/* Global Manual Refresh Studio Button */}
              {onRefreshAll && (
                <button
                  type="button"
                  onClick={onRefreshAll}
                  disabled={isRefreshingAll}
                  className="px-3 py-1.5 rounded-xl border border-[#F1BCCE] bg-[#FAF0F4] hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 touch-target"
                  title="Manually refresh all store data now"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#D84B7E] transition-transform duration-500 ${
                      isRefreshingAll ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="hidden md:inline">{isRefreshingAll ? 'Refreshing...' : 'Refresh Studio'}</span>
                </button>
              )}

              {/* Notifications Popover Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-xl text-gray-600 hover:text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#D84B7E] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {totalNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#F1BCCE] p-4 space-y-3 z-40"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-xs text-[#111111]">Notifications</span>
                        <span className="text-[10px] text-[#D84B7E] font-bold">
                          {totalNotifications} New
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {pendingOrdersCount > 0 && (
                          <div
                            onClick={() => {
                              onTabChange('orders');
                              setIsNotificationsOpen(false);
                            }}
                            className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100/70 transition-colors flex items-start gap-2.5 cursor-pointer"
                          >
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-rose-900">
                                {pendingOrdersCount} Orders Pending
                              </p>
                              <p className="text-[10px] text-rose-700">Needs packing & dispatch</p>
                            </div>
                          </div>
                        )}

                        {lowStockCount > 0 && (
                          <div
                            onClick={() => {
                              onTabChange('inventory');
                              setIsNotificationsOpen(false);
                            }}
                            className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition-colors flex items-start gap-2.5 cursor-pointer"
                          >
                            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900">
                                {lowStockCount} SKUs Low in Stock
                              </p>
                              <p className="text-[10px] text-amber-700">Restock recommended</p>
                            </div>
                          </div>
                        )}

                        {unreadMessagesCount > 0 && (
                          <div
                            onClick={() => {
                              onTabChange('support');
                              setIsNotificationsOpen(false);
                            }}
                            className="p-2.5 rounded-xl bg-[#FCE7F0] border border-[#F1BCCE] hover:bg-[#F8D7E3] transition-colors flex items-start gap-2.5 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-[#D84B7E] shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[#111111]">
                                {unreadMessagesCount} Unread Inquiries
                              </p>
                              <p className="text-[10px] text-gray-600">Client messages waiting</p>
                            </div>
                          </div>
                        )}

                        {totalNotifications === 0 && (
                          <div className="py-6 text-center text-gray-500 space-y-1">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="font-medium text-xs">All clear! No alerts</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#FCE7F0] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D84B7E] to-[#6A1A3A] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {user?.first_name ? user.first_name[0].toUpperCase() : 'A'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-[#111111] leading-none">
                      {user ? `${user.first_name} ${user.last_name}` : 'Administrator'}
                    </p>
                    <span className="text-[9px] font-bold text-[#D84B7E] uppercase tracking-wider">
                      {user?.role || 'SUPER ADMIN'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#F1BCCE] p-2 space-y-1 z-40 text-xs"
                    >
                      <div className="p-2 border-b border-gray-100">
                        <p className="font-bold text-[#111111]">
                          {user ? `${user.first_name} ${user.last_name}` : 'Admin'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          onTabChange('settings');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FCE7F0] text-gray-700 transition-colors text-left"
                      >
                        <Settings className="w-3.5 h-3.5 text-gray-500" />
                        <span>Studio Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          onTabChange('roles');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FCE7F0] text-gray-700 transition-colors text-left"
                      >
                        <Shield className="w-3.5 h-3.5 text-gray-500" />
                        <span>Staff Access Matrix</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          navigate('/auth');
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Dynamic Content View Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
