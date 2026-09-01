import React, { useState } from 'react';
import {
  DollarSign,
  ClipboardList,
  Package,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Layers,
  FileText,
  Truck,
  Eye,
  Plus,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AdminTab } from '../types/admin';
import { Product, Order, AdminDashboardStats } from '../../../types';

interface DashboardOverviewProps {
  stats: AdminDashboardStats | null;
  orders: Order[];
  products: Product[];
  onNavigateTab: (tab: AdminTab) => void;
  onOpenAddProduct: () => void;
  onSelectOrder?: (order: Order) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  orders,
  products,
  onNavigateTab,
  onOpenAddProduct,
  onSelectOrder,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR'>('MONTH');

  const totalSales = stats?.total_sales || 0;
  const totalOrders = stats?.total_orders || orders.length;
  const pendingOrders =
    stats?.pending_orders ||
    orders.filter((o) => ['Pending', 'Processing', 'Confirmed'].includes(o.order_status)).length;
  const lowStockProducts =
    stats?.low_stock_products || products.filter((p) => (p.stock_quantity || 0) <= 10).length;
  const totalCustomers = stats?.total_customers || 0;
  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Recent 6 Orders
  const recentOrders = orders.slice(0, 6);

  // Top Selling Products (sorted by stock or simulation)
  const topProducts = products.slice(0, 5);

  // Category counts
  const skincareCount = products.filter((p) =>
    p.category?.name?.toLowerCase().includes('skin')
  ).length;
  const fashionCount = products.filter((p) =>
    p.category?.name?.toLowerCase().includes('fashion')
  ).length;
  const accessoriesCount = products.filter((p) =>
    p.category?.name?.toLowerCase().includes('access')
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Actions */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#D84B7E] via-[#B5426C] to-[#54122E] p-6 sm:p-8 text-white shadow-md overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              👑 Atelier Command Center
            </span>
            <span className="text-xs text-[#FCE7F0]">Live Store Status: Active</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide">
            Welcome back to Yurae Beauty Studio
          </h2>
          <p className="text-xs text-[#FCE7F0] font-light leading-relaxed">
            Monitor real-time sales performance, manage luxury inventory, dispatch orders, and generate GST accounting ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 bg-white text-[#111111] hover:bg-[#FCE7F0] text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D84B7E]" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2.5 bg-black/30 hover:bg-black/40 border border-white/30 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Orders Board</span>
          </button>

          <button
            onClick={() => onNavigateTab('analytics')}
            className="px-4 py-2.5 bg-black/30 hover:bg-black/40 border border-white/30 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>GST Reports</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Gross Revenue"
          value={`₹${totalSales.toLocaleString('en-IN')}`}
          change="+18.4% vs last month"
          isPositive={true}
          icon={DollarSign}
          color="from-[#D84B7E] to-[#9C2758]"
          subtext="Net Paid Invoices"
          onClick={() => onNavigateTab('analytics')}
        />

        <StatCard
          title="Total Orders"
          value={totalOrders}
          change="+12.5% this week"
          isPositive={true}
          icon={ClipboardList}
          color="from-[#9C2758] to-[#54122E]"
          subtext={`${pendingOrders} awaiting fulfillment`}
          badge={pendingOrders > 0 ? `${pendingOrders} Pending` : undefined}
          onClick={() => onNavigateTab('orders')}
        />

        <StatCard
          title="Total Catalog Products"
          value={products.length}
          change={lowStockProducts > 0 ? `${lowStockProducts} Low Stock` : 'All Healthy'}
          isPositive={lowStockProducts === 0}
          icon={Package}
          color="from-[#B5426C] to-[#D84B7E]"
          subtext="Active SKUs in Store"
          badge={lowStockProducts > 0 ? `${lowStockProducts} Low` : undefined}
          onClick={() => onNavigateTab('products')}
        />

        <StatCard
          title="Average Order Value"
          value={`₹${Math.round(aov).toLocaleString('en-IN')}`}
          change="+6.2% vs target"
          isPositive={true}
          icon={TrendingUp}
          color="from-[#54122E] to-[#111111]"
          subtext="Across all paid clients"
          onClick={() => onNavigateTab('analytics')}
        />
      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart (SVG simulation) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#F1BCCE]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#D84B7E] block">
                Financial Velocity
              </span>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Revenue & Sales Trajectory
              </h3>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#FAF0F4] border border-[#F1BCCE]/60 rounded-xl text-xs">
              {(['WEEK', 'MONTH', 'YEAR'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                    chartPeriod === p
                      ? 'bg-[#D84B7E] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-[#D84B7E]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic SVG Area Chart */}
          <div className="h-64 w-full relative flex items-end justify-between pt-6 px-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D84B7E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#D84B7E" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#F1BCCE" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#F1BCCE" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#F1BCCE" strokeWidth="0.5" strokeDasharray="3 3" />

              {/* Area path */}
              <path
                d="M 0 140 Q 80 120 150 70 T 300 90 T 420 30 T 500 45 L 500 180 L 0 180 Z"
                fill="url(#salesGrad)"
              />
              {/* Line path */}
              <path
                d="M 0 140 Q 80 120 150 70 T 300 90 T 420 30 T 500 45"
                fill="none"
                stroke="#D84B7E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="150" cy="70" r="4.5" fill="#D84B7E" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="300" cy="90" r="4.5" fill="#D84B7E" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="420" cy="30" r="5" fill="#D84B7E" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
          </div>

          {/* Chart timeline labels */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 px-2 pt-2 border-t border-gray-100">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug (Current)</span>
          </div>
        </div>

        {/* Category Revenue Distribution & Top Departments */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#F1BCCE]/60 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#D84B7E] block">
              Department Split
            </span>
            <h3 className="font-serif text-lg font-bold text-[#111111]">
              Category Performance
            </h3>
          </div>

          {/* Visual Category Progress Bars */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  🌸 <span>Yurae Skin</span>
                </span>
                <span className="font-bold text-[#D84B7E]">{skincareCount} Products</span>
              </div>
              <div className="h-2.5 w-full bg-[#FCE7F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D84B7E] rounded-full"
                  style={{ width: `${products.length ? (skincareCount / products.length) * 100 : 50}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  👗 <span>Yurae Fashion</span>
                </span>
                <span className="font-bold text-[#B5426C]">{fashionCount} Products</span>
              </div>
              <div className="h-2.5 w-full bg-[#FCE7F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B5426C] rounded-full"
                  style={{ width: `${products.length ? (fashionCount / products.length) * 100 : 30}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  💍 <span>Yurae Accessories</span>
                </span>
                <span className="font-bold text-[#8C2C55]">{accessoriesCount} Products</span>
              </div>
              <div className="h-2.5 w-full bg-[#FCE7F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8C2C55] rounded-full"
                  style={{ width: `${products.length ? (accessoriesCount / products.length) * 100 : 20}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => onNavigateTab('categories')}
              className="w-full py-2 px-3 text-xs font-bold text-[#D84B7E] bg-[#FCE7F0] hover:bg-[#F8D7E3] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Manage Categories Tree</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders & Top Selling Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Ticker */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#F1BCCE]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#D84B7E] block">
                Live Fulfillment
              </span>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Recent Client Orders
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#D84B7E] hover:underline flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-600 text-xs">
              No orders registered yet. New customer orders will appear here automatically.
            </div>
          ) : (
            <div className="divide-y divide-[#F1BCCE]/40">
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    if (onSelectOrder) onSelectOrder(ord);
                    onNavigateTab('orders');
                  }}
                  className="py-3 flex items-center justify-between hover:bg-[#FDF4F7] px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FCE7F0] border border-[#F1BCCE] text-[#D84B7E] flex items-center justify-center font-bold text-xs shrink-0">
                      #{ord.id}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#111111] group-hover:text-[#D84B7E] transition-colors">
                        {ord.order_number}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {ord.user ? `${ord.user.first_name} ${ord.user.last_name}` : 'Client'} •{' '}
                        {ord.items?.length || 1} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="font-serif font-bold text-xs text-[#111111]">
                      {ord.currency || 'INR'} {ord.total_amount}
                    </p>
                    <span
                      className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        ord.order_status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.order_status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products Leaderboard */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#F1BCCE]/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#D84B7E] block">
                Catalog Star List
              </span>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Top Products
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-[#D84B7E] hover:underline"
            >
              Catalog
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 font-mono font-bold text-gray-600 text-[11px]">
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 border border-[#F1BCCE]/60 overflow-hidden shrink-0">
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
                  <div className="truncate">
                    <p className="font-semibold text-[#111111] truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-600">{p.category?.name || 'Yurae'}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-serif font-bold text-gray-800">₹{p.price}</span>
                  <span
                    className={`block text-[9px] font-semibold ${
                      (p.stock_quantity || 0) <= 5 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {p.stock_quantity} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
