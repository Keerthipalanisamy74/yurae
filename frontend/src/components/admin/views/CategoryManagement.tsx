import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Image,
  FolderTree,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Category, Product } from '../../../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface CategoryManagementProps {
  categories: Category[];
  products: Product[];
  onRefreshCategories: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  products,
  onRefreshCategories,
}) => {
  const { showToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormImage('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description || '');
    setFormImage(cat.image || '');
    setIsCreateModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          name: formName,
          slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
          description: formDesc,
          image: formImage,
        });
        showToast('Category updated successfully', 'success');
      } else {
        await api.post('/categories', {
          name: formName,
          slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
          description: formDesc,
          image: formImage,
        });
        showToast('Category created successfully', 'success');
      }
      setIsCreateModalOpen(false);
      onRefreshCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategory) return;
    try {
      setIsSaving(true);
      await api.delete(`/categories/${deleteCategory.id}`);
      showToast('Category deleted successfully', 'success');
      setDeleteCategory(null);
      onRefreshCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Taxonomy & Catalog Architecture
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Categories & Subcategories
          </h2>
          <p className="text-xs text-gray-500">
            Structure your store departments: Yurae Skin rituals, Yurae Fashion apparel, and Fine Accessories.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Category Grid Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category_id === cat.id);
          const icon = cat.name.toLowerCase().includes('skin')
            ? '🌸'
            : cat.name.toLowerCase().includes('fashion')
            ? '👗'
            : '💍';

          return (
            <div
              key={cat.id}
              className="relative p-5 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-[#FCE7F0] border border-[#F1BCCE]">
                      {icon}
                    </span>
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#111111]">{cat.name}</h3>
                      <span className="text-[10px] font-mono text-gray-600 block">/{cat.slug}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE]/60">
                    {catProducts.length} Items
                  </span>
                </div>

                {cat.description && (
                  <p className="text-xs text-gray-600 font-light leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                )}

                {cat.image && (
                  <div className="h-28 rounded-2xl overflow-hidden bg-gray-100 border border-[#F1BCCE]/40">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(cat)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#F1BCCE] text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteCategory(cat)}
                  className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Category Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-600 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Yurae Skin Rituals"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. skincare"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Korean-inspired botanical formulas for glass skin..."
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Banner Image URL</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-colors shadow-xs"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategory)}
        title={`Delete Category "${deleteCategory?.name}"?`}
        message="Deleting this category will remove it from navigation. Products assigned to this category will need re-categorization."
        confirmLabel="Yes, Delete Category"
        variant="danger"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCategory(null)}
      />
    </div>
  );
};
