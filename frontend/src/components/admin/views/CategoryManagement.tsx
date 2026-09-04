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
  ArrowLeft,
  Upload,
  X,
  ExternalLink,
  Search,
  Tag,
  Hash,
  ShoppingBag,
  Sliders,
} from 'lucide-react';
import { Category, Subcategory, Product } from '../../../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useCategories, getCategoryIconHelper, getSubcategoryIconHelper } from '../../../context/CategoryContext';

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

  // Navigation State (Drill-down to Subcategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Category Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  // Subcategory Modal State
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deleteSubcategory, setDeleteSubcategory] = useState<Subcategory | null>(null);
  const [subcategorySearch, setSubcategorySearch] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Category Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');

  // Subcategory Form State
  const [subFormName, setSubFormName] = useState('');
  const [subFormSlug, setSubFormSlug] = useState('');
  const [subFormDesc, setSubFormDesc] = useState('');
  const [subFormImage, setSubFormImage] = useState('');
  const [subFormOrder, setSubFormOrder] = useState<number>(0);

  // Currently Active Category Object (if drilled down)
  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || null;

  // Category CRUD Handlers
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSub: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const compressed = await compressImageFile(files[0]);
      if (compressed) {
        if (isSub) {
          setSubFormImage(compressed);
        } else {
          setFormImage(compressed);
        }
        showToast('Image uploaded successfully', 'success');
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
      await refreshGlobalCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategory) return;
    try {
      setIsSaving(true);
      await api.delete(`/categories/${deleteCategory.id}`);
      showToast(`Category "${deleteCategory.name}" deleted successfully`, 'success');
      setDeleteCategory(null);
      if (selectedCategoryId === deleteCategory.id) {
        setSelectedCategoryId(null);
      }
      onRefreshCategories();
      await refreshGlobalCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Subcategory CRUD Handlers
  const openCreateSubcategoryModal = (presetName?: string) => {
    if (!activeCategory) return;
    setEditingSubcategory(null);
    const initialName = presetName || '';
    setSubFormName(initialName);
    setSubFormSlug(initialName ? initialName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
    setSubFormDesc('');
    setSubFormImage('');
    setSubFormOrder((activeCategory.subcategories?.length || 0) + 1);
    setIsSubcategoryModalOpen(true);
  };

  const openEditSubcategoryModal = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setSubFormName(sub.name);
    setSubFormSlug(sub.slug);
    setSubFormDesc(sub.description || '');
    setSubFormImage(sub.image || '');
    setSubFormOrder(sub.display_order || 0);
    setIsSubcategoryModalOpen(true);
  };

  const handleSubNameChange = (val: string) => {
    setSubFormName(val);
    if (!editingSubcategory) {
      setSubFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) return;
    if (!subFormName.trim()) {
      showToast('Subcategory name is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: subFormName.trim(),
        slug: subFormSlug || subFormName.toLowerCase().replace(/\s+/g, '-'),
        description: subFormDesc.trim(),
        image: subFormImage.trim(),
        display_order: Number(subFormOrder) || 0,
        category_id: activeCategory.id,
      };

      if (editingSubcategory) {
        await api.put(`/categories/${activeCategory.id}/subcategories/${editingSubcategory.id}`, payload);
        showToast(`Subcategory "${subFormName}" updated successfully!`, 'success');
      } else {
        await api.post(`/categories/${activeCategory.id}/subcategories`, payload);
        showToast(`Subcategory "${subFormName}" created under ${activeCategory.name}!`, 'success');
      }

      setIsSubcategoryModalOpen(false);
      onRefreshCategories();
      await refreshGlobalCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save subcategory', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteSubcategory = async () => {
    if (!deleteSubcategory || !activeCategory) return;
    try {
      setIsSaving(true);
      await api.delete(`/categories/${activeCategory.id}/subcategories/${deleteSubcategory.id}`);
      showToast(`Subcategory "${deleteSubcategory.name}" removed successfully`, 'success');
      setDeleteSubcategory(null);
      onRefreshCategories();
      await refreshGlobalCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete subcategory', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick presets by Department
  const getDepartmentPresets = (catName: string): string[] => {
    const nameLower = catName.toLowerCase();
    if (nameLower.includes('access')) {
      return ['Rings', 'Necklaces & Pendants', 'Bags & Pouches', 'Watches', 'Earrings', 'Bracelets & Bangles', 'Hair Accessories', 'Sunglasses', 'Brooches'];
    }
    if (nameLower.includes('skin')) {
      return ['Cleansers & Face Washes', 'Toners & Essences', 'Serums & Ampoules', 'Moisturizers & Creams', 'Sunscreens & SPF', 'Face Masks & Peels', 'Lip Care', 'Eye Creams', 'Body Lotions'];
    }
    if (nameLower.includes('fashion')) {
      return ['Dresses & Gowns', 'Kurtis & Tunics', 'Tops & Blouses', 'Skirts & Pants', 'Silks & Loungewear', 'Co-ord Sets', 'Sarees & Dupattas', 'Jackets & Shrugs'];
    }
    return ['Bestsellers', 'Classic Collection', 'Seasonal Specials', 'Gift Sets', 'Limited Editions'];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View 1: Top-Level Categories View */}
      {!activeCategory ? (
        <>
          {/* Clean Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                Store Catalog
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#111111]">
                Categories & Collections ({categories.length})
              </h2>
              <p className="text-xs text-gray-500">
                Manage your product collections. Click on any category to view and organize its subcategories.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Clean & Minimal Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const catProducts = products.filter((p) => p.category_id === cat.id);
              const subcats = cat.subcategories || [];
              const icon = getCategoryIconHelper(cat);

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="group relative p-5 sm:p-6 rounded-3xl bg-white border border-[#F1BCCE]/70 shadow-xs hover:shadow-lg transition-all duration-300 space-y-4 flex flex-col justify-between cursor-pointer hover:border-[#D84B7E]"
                >
                  <div className="space-y-3.5">
                    {/* Header with Icon and Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-[#FFF5F8] border border-[#F1BCCE] shadow-2xs group-hover:scale-105 transition-transform">
                          {icon}
                        </span>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#111111] group-hover:text-[#D84B7E] transition-colors">
                            {cat.name}
                          </h3>
                          <span className="text-[10px] font-mono text-gray-500 block">/category/{cat.slug}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE]/60">
                          {catProducts.length} Products
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                          {subcats.length} Subcategories
                        </span>
                      </div>
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-16 rounded-2xl bg-gradient-to-r from-[#FFF5F8] to-[#FCE7F0] border border-[#F1BCCE]/30 flex items-center justify-center text-xs text-gray-500 font-semibold gap-2">
                        <span>{icon}</span>
                        <span>{subcats.length > 0 ? `${subcats.length} Subcategories inside` : 'Ready for products'}</span>
                      </div>
                    )}
                  </div>

                  {/* Clean Footer Actions */}
                  <div
                    className="pt-3 border-t border-gray-100 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="text-xs font-bold text-[#D84B7E] hover:text-[#111111] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Subcategories ({subcats.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/category/${cat.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:text-[#D84B7E] hover:border-[#F1BCCE] transition-colors"
                        title="View in store"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3 h-3" />
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
        </>
      ) : (
        /* View 2: Dedicated Subcategories Drill-Down Workbench */
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb Navigation & Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F1BCCE]/60 shadow-2xs">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Categories</span>
              </button>
              <span className="text-gray-300">/</span>
              <span className="font-bold text-[#D84B7E] flex items-center gap-1">
                <span>{getCategoryIconHelper(activeCategory)}</span>
                <span>{activeCategory.name}</span>
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600 font-medium">Subcategories Workbench</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openCreateSubcategoryModal()}
                className="px-4 py-2 rounded-xl bg-[#D84B7E] hover:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subcategory</span>
              </button>
            </div>
          </div>

          {/* Department Highlight Banner */}
          <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#FFF5F8] via-[#FAF0F4] to-[#FCE7F0] border border-[#F1BCCE] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="text-4xl p-2 rounded-2xl bg-white border border-[#F1BCCE] shadow-xs">
                  {getCategoryIconHelper(activeCategory)}
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#D84B7E]">
                    Department Sub-Taxonomy
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#111111]">
                    {activeCategory.name} Subcategories
                  </h2>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {activeCategory.description || `Manage all nested subcategories and collections for ${activeCategory.name}. Products assigned to these subcategories can be filtered by customers on the storefront.`}
              </p>
            </div>

            <div className="flex md:flex-col gap-2 shrink-0">
              <div className="px-4 py-2 bg-white rounded-2xl border border-[#F1BCCE]/80 text-center shadow-2xs">
                <span className="block text-[10px] text-gray-500 font-medium uppercase tracking-wider">Subcategories</span>
                <span className="font-serif text-xl font-bold text-[#D84B7E]">{activeCategory.subcategories?.length || 0}</span>
              </div>
              <div className="px-4 py-2 bg-white rounded-2xl border border-[#F1BCCE]/80 text-center shadow-2xs">
                <span className="block text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Products</span>
                <span className="font-serif text-xl font-bold text-gray-800">
                  {products.filter((p) => p.category_id === activeCategory.id).length}
                </span>
              </div>
            </div>
          </div>

          {/* 1-Click Quick Add Presets */}
          <div className="p-4 rounded-2xl bg-white border border-[#F1BCCE]/60 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D84B7E]" />
                <span>1-Click Popular Presets for {activeCategory.name}</span>
              </span>
              <span className="text-[10px] text-gray-500">Click any pill to instantly create:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {getDepartmentPresets(activeCategory.name).map((preset) => {
                const alreadyExists = (activeCategory.subcategories || []).some(
                  (s) => s.name.toLowerCase() === preset.toLowerCase()
                );
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => !alreadyExists && openCreateSubcategoryModal(preset)}
                    disabled={alreadyExists}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      alreadyExists
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-default'
                        : 'bg-[#FAF0F4] hover:bg-[#D84B7E] text-[#D84B7E] hover:text-white border border-[#F1BCCE] cursor-pointer shadow-2xs'
                    }`}
                  >
                    <span>{getSubcategoryIconHelper(preset)}</span>
                    <span>{preset}</span>
                    {alreadyExists ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategories Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subcategorySearch}
                onChange={(e) => setSubcategorySearch(e.target.value)}
                placeholder={`Search ${activeCategory.name} subcategories (e.g. ring, bag, serum)...`}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#F1BCCE] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <span className="text-xs text-gray-500 font-medium">
              Showing {(activeCategory.subcategories || []).filter((s) => s.name.toLowerCase().includes(subcategorySearch.toLowerCase())).length} of {activeCategory.subcategories?.length || 0} subcategories
            </span>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeCategory.subcategories || [])
              .filter((sub) => sub.name.toLowerCase().includes(subcategorySearch.toLowerCase()))
              .map((sub) => {
                const subProds = products.filter((p) => p.subcategory_id === sub.id);
                const count = sub.product_count !== undefined ? sub.product_count : subProds.length;
                const icon = getSubcategoryIconHelper(sub);

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-white border border-[#F1BCCE]/80 hover:border-[#D84B7E] shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-xl bg-[#FAF0F4] border border-[#F1BCCE]">
                            {icon}
                          </span>
                          <div>
                            <h4 className="font-serif text-base font-bold text-[#111111]">{sub.name}</h4>
                            <span className="text-[10px] font-mono text-gray-500 block">
                              ?subcategory={sub.slug}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          {count} Products
                        </span>
                      </div>

                      {sub.description && (
                        <p className="text-xs text-gray-600 font-light line-clamp-2">
                          {sub.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded-md">Order #{sub.display_order || 0}</span>
                        <span>ID: {sub.id}</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <a
                        href={`/category/${activeCategory.slug}?subcategory=${sub.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-[#D84B7E] hover:underline flex items-center gap-1"
                      >
                        <span>View Products</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditSubcategoryModal(sub)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#F1BCCE] text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteSubcategory(sub)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete subcategory"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {(activeCategory.subcategories || []).length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-white border-2 border-dashed border-[#F1BCCE] space-y-3">
              <span className="text-4xl block">✨</span>
              <h3 className="font-serif text-lg font-bold text-gray-800">No Subcategories Created Yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Create subcategories like <strong>Rings</strong>, <strong>Necklaces</strong>, or <strong>Bags</strong> to give your customers seamless boutique filtering.
              </p>
              <button
                type="button"
                onClick={() => openCreateSubcategoryModal()}
                className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#111111] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Subcategory</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Modal (Create / Edit) */}
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
                  {editingCategory ? `Edit Department: ${editingCategory.name}` : 'Create New Department'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Accessories, Skincare, Fine Jewelry"
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
                  placeholder="e.g. accessories"
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
                  placeholder="Complete your signature look. Hand-crafted pearl earrings, bags, and luxury accessories..."
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              {/* Banner Image */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 block">Department Banner Image (Optional)</label>
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
                      onChange={(e) => handleFileUpload(e, false)}
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
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-colors shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcategory Modal (Create / Edit) */}
      {isSubcategoryModalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsSubcategoryModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getSubcategoryIconHelper(subFormName || 'Subcategory')}</span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#111111]">
                    {editingSubcategory ? `Edit Subcategory: ${editingSubcategory.name}` : `Add Subcategory under ${activeCategory.name}`}
                  </h3>
                  <span className="text-[10px] text-gray-500 block">
                    Category: <strong>{activeCategory.name}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={subFormName}
                  onChange={(e) => handleSubNameChange(e.target.value)}
                  placeholder="e.g. Rings, Necklaces, Bags, Watches, Serums"
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={subFormSlug}
                    onChange={(e) => setSubFormSlug(e.target.value)}
                    placeholder="e.g. rings"
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Display Order</label>
                  <input
                    type="number"
                    value={subFormOrder}
                    onChange={(e) => setSubFormOrder(parseInt(e.target.value) || 0)}
                    placeholder="1, 2, 3..."
                    className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Short Tagline or Description</label>
                <textarea
                  rows={2}
                  value={subFormDesc}
                  onChange={(e) => setSubFormDesc(e.target.value)}
                  placeholder="Handcrafted statement and minimal luxury rings designed with 18k gold vermeil..."
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              {/* Optional Subcategory Image */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 block">Subcategory Icon/Image (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={subFormImage}
                    onChange={(e) => setSubFormImage(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  />
                  <label className="px-3 py-2 bg-[#FAF0F4] hover:bg-[#FCE7F0] border border-[#F1BCCE] text-[#D84B7E] font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Loading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>

                {subFormImage && (
                  <div className="relative h-20 rounded-xl overflow-hidden border border-[#F1BCCE]">
                    <img
                      src={subFormImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSubFormImage('')}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-colors shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategory)}
        title={`Delete Department "${deleteCategory?.name}"?`}
        message="Deleting this department will remove it and unassign its nested subcategories. Products will be safely preserved."
        confirmLabel="Yes, Delete Department"
        variant="danger"
        isLoading={isSaving}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeleteCategory(null)}
      />

      {/* Delete Subcategory Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteSubcategory)}
        title={`Delete Subcategory "${deleteSubcategory?.name}"?`}
        message="Are you sure you want to delete this subcategory? Products attached to it will be safely kept and unlinked."
        confirmLabel="Yes, Delete Subcategory"
        variant="danger"
        isLoading={isSaving}
        onConfirm={handleConfirmDeleteSubcategory}
        onCancel={() => setDeleteSubcategory(null)}
      />
    </div>
  );
};
