import React, { useState, useMemo } from 'react';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  AlertCircle,
  Archive,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Product, Category } from '../../../types';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onRefreshProducts: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onRefreshProducts,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stockHealthFilter, setStockHealthFilter] = useState<string>('ALL');
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // In-line Quick Stock Editing state: { [productId]: number }
  const [quickStockValues, setQuickStockValues] = useState<{ [id: number]: number }>({});
  const [savingStockId, setSavingStockId] = useState<number | null>(null);

  // Delete Confirm Dialog state
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Delete Confirm Dialog state
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Filtered Products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'ALL' && String(p.category_id) !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && (p.status || 'ACTIVE').toUpperCase() !== statusFilter) {
        return false;
      }
      const stock = p.stock_quantity || 0;
      if (stockHealthFilter === 'OUT' && stock > 0) return false;
      if (stockHealthFilter === 'LOW' && (stock > 10 || stock === 0)) return false;
      if (stockHealthFilter === 'IN' && stock === 0) return false;

      return true;
    });
  }, [products, categoryFilter, statusFilter, stockHealthFilter]);

  // Handle Quick Stock Update
  const handleSaveQuickStock = async (product: Product) => {
    const newStock = quickStockValues[product.id];
    if (newStock === undefined || newStock === product.stock_quantity) return;

    try {
      setSavingStockId(product.id);
      await api.put(`/products/${product.id}`, { stock_quantity: newStock });
      showToast(`Stock updated to ${newStock} for "${product.name}"`, 'success');
      onRefreshProducts();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update stock quantity', 'error');
    } finally {
      setSavingStockId(null);
    }
  };

  // Single Product Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    try {
      setIsDeleting(true);
      await api.delete(`/products/${deleteModalProduct.id}`);
      showToast(`Product "${deleteModalProduct.name}" deleted successfully`, 'success');
      setDeleteModalProduct(null);
      onRefreshProducts();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Operations
  const handleBulkAction = async (action: string, restockQty?: number) => {
    if (selectedIds.length === 0) return;

    try {
      setIsBulkOperating(true);
      const res = await api.post('/admin/products/bulk-action', {
        product_ids: selectedIds,
        action,
        restock_quantity: restockQty,
      });
      showToast(res.data.message || `Bulk ${action} completed successfully`, 'success');
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      onRefreshProducts();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Bulk operation failed', 'error');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const exportData = filteredProducts.map((p) => ({
      ID: p.id,
      SKU: p.sku,
      Name: p.name,
      Category: p.category?.name || 'Uncategorized',
      Price_INR: p.price,
      Sale_Price_INR: p.sale_price || p.price,
      Stock_Quantity: p.stock_quantity,
      Status: p.status || 'ACTIVE',
    }));

    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yurae_products_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Catalog exported to CSV successfully', 'success');
  };

  // Table Columns Definition
  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product & SKU',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="w-11 h-11 rounded-xl bg-gray-100 border border-[#F1BCCE]/60 overflow-hidden shrink-0 flex items-center justify-center">
            {p.images?.[0]?.image_url ? (
              <img
                src={p.images[0].image_url}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-gray-900 line-clamp-1 hover:text-[#D84B7E] transition-colors cursor-pointer" onClick={() => onOpenEditModal(p)}>
              {p.name}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <span>{p.sku}</span>
              {p.brand && <span>• {p.brand}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0F4] text-gray-700 border border-[#F1BCCE]/60">
          {p.category?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price (INR)',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-serif font-bold text-gray-900">
            ₹{p.sale_price ? p.sale_price : p.price}
          </span>
          {p.sale_price && p.sale_price < p.price && (
            <span className="block text-[10px] text-gray-600 line-through">
              ₹{p.price}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Live Stock',
      sortable: true,
      render: (p) => {
        const currentStock =
          quickStockValues[p.id] !== undefined ? quickStockValues[p.id] : p.stock_quantity || 0;
        const isModified =
          quickStockValues[p.id] !== undefined && quickStockValues[p.id] !== p.stock_quantity;
        const isLow = currentStock > 0 && currentStock <= 10;
        const isOut = currentStock === 0;

        return (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={currentStock}
              onChange={(e) =>
                setQuickStockValues((prev) => ({
                  ...prev,
                  [p.id]: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold focus:outline-none focus:ring-1 ${
                isOut
                  ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500'
                  : isLow
                  ? 'bg-amber-50 border-amber-300 text-amber-700 focus:ring-amber-500'
                  : 'bg-white border-gray-200 text-gray-800 focus:ring-[#D84B7E]'
              }`}
            />

            {isModified && (
              <button
                type="button"
                onClick={() => handleSaveQuickStock(p)}
                disabled={savingStockId === p.id}
                className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                title="Save stock update"
              >
                {savingStockId === p.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {isOut && <span className="text-[9px] text-rose-600 font-bold">OUT</span>}
            {isLow && <span className="text-[9px] text-amber-600 font-bold">LOW</span>}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => {
        const st = (p.status || 'ACTIVE').toUpperCase();
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
              st === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : st === 'DRAFT'
                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {st}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Product Inventory System
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">Catalog & SKUs</h2>
          <p className="text-xs text-gray-500">
            Manage product variations, descriptions, live warehouse stock, and SEO metadata.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#D84B7E]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">All Categories ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active (Published)</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Stock Health Filter */}
        <select
          value={stockHealthFilter}
          onChange={(e) => setStockHealthFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
        >
          <option value="ALL">Stock Health: All</option>
          <option value="IN">In Stock</option>
          <option value="LOW">Low Stock (≤10)</option>
          <option value="OUT">Out of Stock (0)</option>
        </select>

        <button
          onClick={onRefreshProducts}
          className="p-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-gray-600 transition-colors"
          title="Refresh products list"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Data Table */}
      <DataTable<Product>
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search product by name, SKU, or brand..."
        searchKeys={['name', 'sku', 'brand', 'ingredients']}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleBulkAction('PUBLISH')}
              disabled={isBulkOperating}
              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200 transition-colors"
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('DRAFT')}
              disabled={isBulkOperating}
              className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-[10px] border border-gray-300 transition-colors"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkAction('RESTOCK_ALL', 10)}
              disabled={isBulkOperating}
              className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg text-[10px] border border-blue-200 transition-colors"
            >
              +10 Stock
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={isBulkOperating}
              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition-colors"
            >
              Delete
            </button>
          </div>
        }
        renderActions={(p) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onOpenEditModal(p)}
              className="p-1.5 rounded-lg border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] transition-colors cursor-pointer"
              title="Edit product"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setDeleteModalProduct(p)}
              className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
              title="Delete product"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteModalProduct)}
        title={`Delete "${deleteModalProduct?.name}"?`}
        message="This action will permanently delete this product, remove associated inventory locations, and clear references. This cannot be undone."
        confirmLabel="Yes, Delete Product"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalProduct(null)}
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        title={`Delete ${selectedIds.length} Products?`}
        message={`Are you sure you want to permanently delete all ${selectedIds.length} selected products from the catalog?`}
        confirmLabel="Yes, Delete All Selected"
        variant="danger"
        isLoading={isBulkOperating}
        onConfirm={() => handleBulkAction('DELETE')}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
    </div>
  );
};
