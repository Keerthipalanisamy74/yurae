import React, { useState, useMemo } from 'react';
import {
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Plus,
  Minus,
  Edit2,
  Package,
  Layers,
  Search,
  Filter,
  DollarSign,
  Download,
} from 'lucide-react';
import { Product } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface InventoryManagementProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  products,
  onRefreshProducts,
}) => {
  const { showToast } = useToast();
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'IN'>('ALL');
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('RESTOCK');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Metrics
  const totalUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  }, [products]);

  const totalValuationMrp = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock_quantity || 0) * (p.price || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10)
      .length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => (p.stock_quantity || 0) === 0).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stock_quantity || 0;
      if (stockFilter === 'OUT') return stock === 0;
      if (stockFilter === 'LOW') return stock > 0 && stock <= 10;
      if (stockFilter === 'IN') return stock > 10;
      return true;
    });
  }, [products, stockFilter]);

  const openAdjustModal = (product: Product) => {
    setAdjustModalProduct(product);
    setAdjustQuantity(product.stock_quantity || 0);
    setAdjustReason('RESTOCK');
    setAdjustNotes('');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    try {
      setIsAdjusting(true);
      await api.put(`/products/${adjustModalProduct.id}`, {
        stock_quantity: adjustQuantity,
      });
      showToast(
        `Inventory for "${adjustModalProduct.name}" adjusted to ${adjustQuantity} units (${adjustReason})`,
        'success'
      );
      setAdjustModalProduct(null);
      onRefreshProducts();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to adjust stock', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'SKU & Name',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-[#F1BCCE]/60 overflow-hidden shrink-0">
            {p.images?.[0]?.image_url ? (
              <img src={p.images[0].image_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 m-auto mt-2 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
            <p className="text-[10px] font-mono text-gray-600">SKU: {p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Department',
      sortable: true,
      render: (p) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0F4] text-gray-700">
          {p.category?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'On-Hand Units',
      sortable: true,
      render: (p) => {
        const qty = p.stock_quantity || 0;
        const isOut = qty === 0;
        const isLow = qty > 0 && qty <= 10;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm font-bold ${
                isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {qty} units
            </span>
            {isOut && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                OUT OF STOCK
              </span>
            )}
            {isLow && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                LOW (≤10)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Inventory Valuation',
      sortable: true,
      render: (p) => {
        const val = (p.stock_quantity || 0) * (p.price || 0);
        return (
          <div>
            <p className="font-serif font-bold text-gray-900">₹{val.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-600">@ ₹{p.price}/unit</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Catalog Status',
      sortable: true,
      render: (p) => (
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {p.status || 'ACTIVE'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Warehouse Management System
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Live Inventory &amp; Stock Station
          </h2>
          <p className="text-xs text-gray-500">
            Real-time shelf inventory allocations, stock adjustments, and low-stock alerts.
          </p>
        </div>

        <button
          onClick={onRefreshProducts}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stock Units"
          value={totalUnits.toLocaleString('en-IN')}
          icon={Package}
          color="from-[#D84B7E] to-[#B5426C]"
          subtext="Across all product SKUs"
        />

        <StatCard
          title="Total Stock Valuation (MRP)"
          value={`₹${totalValuationMrp.toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="from-[#9C2758] to-[#54122E]"
          subtext="Gross retail inventory value"
        />

        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={AlertTriangle}
          color="from-amber-600 to-amber-700"
          subtext="SKUs with ≤ 10 items remaining"
          badge={lowStockCount > 0 ? 'Action Needed' : undefined}
          onClick={() => setStockFilter('LOW')}
        />

        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={TrendingDown}
          color="from-rose-600 to-rose-700"
          subtext="SKUs currently depleted"
          badge={outOfStockCount > 0 ? 'Urgent' : undefined}
          onClick={() => setStockFilter('OUT')}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <select
          value={stockFilter}
          onChange={(e: any) => setStockFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">All Stock Levels ({products.length})</option>
          <option value="LOW">Low Stock (≤10)</option>
          <option value="OUT">Out of Stock (0)</option>
          <option value="IN">Healthy Stock (&gt;10)</option>
        </select>
      </div>

      {/* Main Inventory Table */}
      <DataTable<Product>
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search SKU, product name, or department..."
        searchKeys={['name', 'sku']}
        renderActions={(p) => (
          <button
            type="button"
            onClick={() => openAdjustModal(p)}
            className="px-3 py-1.5 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
          </button>
        )}
      />

      {/* Adjust Stock Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setAdjustModalProduct(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#111111]">Adjust Inventory</h3>
                <p className="text-xs text-gray-500 font-mono">{adjustModalProduct.sku}</p>
              </div>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF0F4] rounded-2xl border border-[#F1BCCE]/60 space-y-1">
                <span className="font-bold text-[#111111]">{adjustModalProduct.name}</span>
                <p className="text-[11px] text-gray-600">
                  Current Stock: <strong>{adjustModalProduct.stock_quantity || 0} units</strong>
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">New Available Quantity *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity((q) => Math.max(0, q - 5))}
                    className="p-2 rounded-xl border bg-gray-50 hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 text-center text-sm font-bold bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity((q) => q + 5)}
                    className="p-2 rounded-xl border bg-gray-50 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                >
                  <option value="RESTOCK">Supplier Restock / Batch Arrival</option>
                  <option value="AUDIT_CORRECTION">Audit Count Variance Correction</option>
                  <option value="DAMAGED">Damaged in Atelier / Expired</option>
                  <option value="RETURN">Customer Return Restock</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Internal Audit Note</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Received shipment batch #LOT-928"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] shadow-xs"
                >
                  {isAdjusting ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
