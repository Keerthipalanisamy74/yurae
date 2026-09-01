import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Package,
  ClipboardList,
  CreditCard,
  Users,
  Layers,
  Sparkles,
  TrendingUp,
  Settings,
  ArrowRight,
  Shield,
  FileText,
  Tag,
  Warehouse,
  Truck,
  MessageSquare,
} from 'lucide-react';
import { AdminTab } from '../types/admin';
import { Product, Order, User as CustomerUser } from '../../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AdminTab) => void;
  products?: Product[];
  orders?: Order[];
  customers?: CustomerUser[];
  onSelectProduct?: (product: Product) => void;
  onSelectOrder?: (order: Order) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  products = [],
  orders = [],
  customers = [],
  onSelectProduct,
  onSelectOrder,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickNav = [
    { label: 'Dashboard Overview', tab: 'overview' as AdminTab, icon: TrendingUp, section: 'Core' },
    { label: 'Products Catalog', tab: 'products' as AdminTab, icon: Package, section: 'Core' },
    { label: 'Categories Tree', tab: 'categories' as AdminTab, icon: Layers, section: 'Core' },
    { label: 'Inventory & Warehouses', tab: 'inventory' as AdminTab, icon: Warehouse, section: 'Core' },
    { label: 'Orders & Fulfillment', tab: 'orders' as AdminTab, icon: ClipboardList, section: 'Operations' },
    { label: 'Payment Ledgers & Gateways', tab: 'payments' as AdminTab, icon: CreditCard, section: 'Operations' },
    { label: 'Shipping & Logistics Hub', tab: 'shipping' as AdminTab, icon: Truck, section: 'Operations' },
    { label: 'Customers 360', tab: 'customers' as AdminTab, icon: Users, section: 'Growth' },
    { label: 'Marketing Banners & Promos', tab: 'marketing' as AdminTab, icon: Sparkles, section: 'Growth' },
    { label: 'Discount Coupons', tab: 'coupons' as AdminTab, icon: Tag, section: 'Growth' },
    { label: 'Financial & GST Reports', tab: 'analytics' as AdminTab, icon: FileText, section: 'Intelligence' },
    { label: 'AI Intelligence Studio', tab: 'ai_studio' as AdminTab, icon: Sparkles, section: 'Intelligence' },
    { label: 'Support & Enquiries Inbox', tab: 'support' as AdminTab, icon: MessageSquare, section: 'Operations' },
    { label: 'Audit Trail Ledger', tab: 'audit' as AdminTab, icon: Shield, section: 'Admin' },
    { label: 'Settings & Gateways', tab: 'settings' as AdminTab, icon: Settings, section: 'Admin' },
  ];

  const filteredNav = useMemo(() => {
    if (!query.trim()) return quickNav;
    const q = query.toLowerCase();
    return quickNav.filter((n) => n.label.toLowerCase().includes(q));
  }, [query]);

  const filteredProducts = useMemo(() => {
    if (!query.trim() || !products.length) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, products]);

  const filteredOrders = useMemo(() => {
    if (!query.trim() || !orders.length) return [];
    const q = query.toLowerCase();
    return orders
      .filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (o.user && `${o.user.first_name} ${o.user.last_name}`.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [query, orders]);

  const filteredCustomers = useMemo(() => {
    if (!query.trim() || !customers.length) return [];
    const q = query.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, customers]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#F1BCCE] overflow-hidden z-10 flex flex-col max-h-[80vh]"
        >
          {/* Top Search Input */}
          <div className="p-4 border-b border-[#F1BCCE]/60 flex items-center gap-3 bg-[#FAF0F4]">
            <Search className="w-5 h-5 text-[#D84B7E] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search navigation, products, orders, or customers..."
              className="w-full text-sm bg-transparent border-none focus:outline-none text-[#111111] placeholder:text-gray-600"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 hover:text-[#111111] hover:bg-white/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Quick Navigation Section */}
            {filteredNav.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2 block">
                  Quick Navigation ({filteredNav.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => {
                          onSelectTab(item.tab);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FCE7F0] text-gray-700 hover:text-[#D84B7E] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-white border border-[#F1BCCE] flex items-center justify-center text-[#D84B7E] group-hover:bg-[#D84B7E] group-hover:text-white transition-colors">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold">{item.label}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products Match */}
            {filteredProducts.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2 block">
                  Matching Products
                </span>
                <div className="space-y-1">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(p);
                        onSelectTab('products');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FCE7F0] transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden border border-[#F1BCCE]/60 shrink-0">
                          {p.images?.[0]?.image_url ? (
                            <img
                              src={p.images[0].image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 m-auto mt-2 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-[#D84B7E] truncate max-w-sm">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">{p.sku}</p>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-gray-700">₹{p.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Match */}
            {filteredOrders.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2 block">
                  Matching Orders
                </span>
                <div className="space-y-1">
                  {filteredOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        if (onSelectOrder) onSelectOrder(o);
                        onSelectTab('orders');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FCE7F0] transition-colors text-left group cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-gray-800 group-hover:text-[#D84B7E]">
                          #{o.order_number}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {o.user ? `${o.user.first_name} ${o.user.last_name}` : 'Client'} •{' '}
                          {o.order_status}
                        </p>
                      </div>
                      <span className="font-serif font-bold text-gray-700">
                        {o.currency} {o.total_amount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Match */}
            {filteredCustomers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2 block">
                  Matching Customers
                </span>
                <div className="space-y-1">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectTab('customers');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FCE7F0] transition-colors text-left group cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-gray-800 group-hover:text-[#D84B7E]">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-[10px] text-gray-500">{c.email}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
            <span>Navigation Command Center</span>
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px] shadow-2xs">ESC</kbd> to
                close
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px] shadow-2xs">Ctrl+K</kbd> to
                toggle
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
