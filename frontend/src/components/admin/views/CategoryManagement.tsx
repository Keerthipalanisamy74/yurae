import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FolderTree,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Upload,
  X,
} from 'lucide-react';
import { Category, Product } from '../../../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useCategories, getCategoryIconHelper } from '../../../context/CategoryContext';

// Helper to compress uploaded category images
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(readerEvent.target?.result as string);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

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
  const { refreshCategories: refreshGlobalCategories } = useCategories();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const compressed = await compressImageFile(files[0]);
      if (compressed) {
        setFormImage(compressed);
        showToast('Banner image selected successfully', 'success');
      }
    } catch {
      showToast('Failed to process image file', 'error');
    } finally {
      setIsUploadingImage(false);
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
          name: formName.trim(),
          slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
          description: formDesc.trim(),
          image: formImage.trim(),
        });
        showToast(`Category "${formName}" updated successfully!`, 'success');
      } else {
        await api.post('/categories', {
          name: formName.trim(),
          slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
          description: formDesc.trim(),
          image: formImage.trim(),
        });
        showToast(`Category "${formName}" created successfully! Visible everywhere across store.`, 'success');
      }
      setIsCreateModalOpen(false);
      onRefreshCategories();
      refreshGlobalCategories();
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
      showToast(`Category "${deleteCategory.name}" deleted successfully`, 'success');
      setDeleteCategory(null);
      onRefreshCategories();
      refreshGlobalCategories();
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
            Categories & Departments ({categories.length})
          </h2>
          <p className="text-xs text-gray-500">
            Structure your store departments. Adding a category here makes it instantly visible across Navigation, Home, Shop Filters, Footer, and Product Uploads.
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
          const icon = getCategoryIconHelper(cat);

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
                      <span className="text-[10px] font-mono text-gray-600 block">/category/{cat.slug}</span>
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

                {cat.image ? (
                  <div className="h-28 rounded-2xl overflow-hidden bg-gray-100 border border-[#F1BCCE]/40">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 rounded-2xl bg-gradient-to-r from-[#FFF5F8] to-[#FCE7F0] border border-[#F1BCCE]/30 flex items-center justify-center text-xs text-gray-500 font-semibold gap-1.5">
                    <span>{icon}</span>
                    <span>Ready for Storefront</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <a
                  href={`/category/${cat.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#D84B7E] hover:underline flex items-center gap-1"
                >
                  <span>View in Store</span>
                  <ArrowRight className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
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

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getCategoryIconHelper(formName || 'Category')}</span>
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  {editingCategory ? `Edit: ${editingCategory.name}` : 'Create New Category'}
                </h3>
              </div>
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
                  placeholder="e.g. Haircare & Scalp Rituals"
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
                  placeholder="e.g. haircare"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
                <p className="text-[10px] text-gray-500">Live URL: /category/{formSlug || 'slug'}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Description & Storefront Tagline</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Nourishing botanical hair and scalp treatments formulated with ancient herbs..."
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              {/* Banner Image: File Upload + URL */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 block">Category Banner Image (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                  <label className="px-3 py-2 bg-[#FAF0F4] hover:bg-[#FCE7F0] border border-[#F1BCCE] text-[#D84B7E] font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Loading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formImage && (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-[#F1BCCE]">
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
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
                  disabled={isSaving || isUploadingImage}
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
        message="Deleting this category will remove it from navigation and storefront. Any attached products will be safely preserved and reassigned."
        confirmLabel="Yes, Delete Category"
        variant="danger"
        isLoading={isSaving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCategory(null)}
      />
    </div>
  );
};

