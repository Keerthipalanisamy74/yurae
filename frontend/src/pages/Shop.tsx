import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, RefreshCw, Upload, Trash2 } from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { ProductFormModal } from '../components/common/ProductFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';

interface ShopProps {
  categorySlug?: string;
}

export const Shop: React.FC<ShopProps> = ({ categorySlug: propCategorySlug }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();

  const searchCategory = propCategorySlug || searchParams.get('category') || '';
  const searchSkinType = searchParams.get('skin_type') || '';
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(searchCategory);
  const [selectedSkinType, setSelectedSkinType] = useState<string>(searchSkinType);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);

  // Admin Upload Product Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const skinTypeOptions = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/products?sort_by=${sortBy}&max_price=${maxPrice}`;
      if (selectedCategory) {
        url += `&category_slug=${selectedCategory}`;
      }
      if (selectedSkinType && selectedSkinType !== 'All') {
        url += `&skin_type=${selectedSkinType}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSkinType, maxPrice, sortBy, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (propCategorySlug) {
      setSelectedCategory(propCategorySlug);
    }
  }, [propCategorySlug]);

  const handleResetFilters = () => {
    setSelectedCategory(propCategorySlug || '');
    setSelectedSkinType('');
    setMaxPrice(10000);
    setSortBy('featured');
    setSearchParams({});
  };

  const getCategoryTitle = () => {
    if (propCategorySlug === 'skincare' || selectedCategory === 'skincare') return 'Botanical Skincare';
    if (propCategorySlug === 'fashion' || selectedCategory === 'fashion') return 'Luxury Fashion & Silks';
    if (propCategorySlug === 'accessories' || selectedCategory === 'accessories') return 'Refined Accessories';
    return 'The Complete Collection';
  };

  const getCategoryDescription = () => {
    if (propCategorySlug === 'skincare' || selectedCategory === 'skincare') {
      return 'Formulated with Korean botanical extracts, niacinamide, and soothing centella for radiant glass skin.';
    }
    if (propCategorySlug === 'fashion' || selectedCategory === 'fashion') {
      return 'Minimalist silhouettes cut from pure mulberry silk, French linen, and tailored luxury cuts.';
    }
    if (propCategorySlug === 'accessories' || selectedCategory === 'accessories') {
      return 'Handcrafted fine jewelry, freshwater pearls, and silk scrunchies that complete your look.';
    }
    return 'Explore all Yurae Beauty product categories—Skincare, Fashion, and Accessories.';
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleProductSuccess = (savedProduct: Product, isNew: boolean) => {
    if (isNew) {
      setProducts((prev) => [savedProduct, ...prev]);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Product deleted successfully', 'success');
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleClearAllProducts = async () => {
    if (window.confirm('Are you sure you want to delete ALL uploaded products? This cannot be undone.')) {
      try {
        await api.delete('/products/clear/all');
        setProducts([]);
        showToast('All products deleted successfully', 'success');
      } catch {
        showToast('Failed to clear products', 'error');
      }
    }
  };

  return (
    <div className="pb-24 bg-[#FDF4F7]">
      {/* Category Banner */}
      <section className="bg-[#FCE7F0] py-16 px-4 border-b border-[#F1BCCE]">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">
            Yurae Beauty
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#111111]">
            {getCategoryTitle()}
          </h1>
          <p className="text-sm sm:text-base text-gray-700 font-normal max-w-2xl mx-auto leading-relaxed">
            {getCategoryDescription()}
          </p>

          {/* Admin Upload Controls Banner */}
          {isAdmin && (
            <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={openUploadModal}
                className="px-6 py-3 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#FDF4F7]" />
                Upload New Product to {getCategoryTitle()}
              </button>
              <button
                onClick={handleClearAllProducts}
                className="px-4 py-3 bg-red-600/90 text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-red-700 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Reset Store Catalog
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Mobile Filter Toggle & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[#F1BCCE]">
          <button
            onClick={() => setIsFilterMobileOpen(!isFilterMobileOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-[#F1BCCE] bg-[#FFF8FA] rounded-full text-xs font-bold uppercase tracking-wider text-[#111111]"
          >
            <Filter className="w-4 h-4 text-[#D84B7E]" />
            Filters
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Showing</span>
            <span className="font-bold text-[#111111]">{products.length}</span>
            <span>rituals & pieces</span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-bold hidden sm:inline">
              Sort By:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[#FFF8FA] border border-[#F1BCCE] rounded-full px-4 py-2 pr-8 text-xs font-bold text-[#111111] outline-none cursor-pointer focus:border-[#D84B7E]"
              >
                <option value="featured">Featured Collection</option>
                <option value="newest">New Arrivals</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
          
          {/* SIDEBAR FILTERS (Desktop) */}
          <aside className={`lg:block ${isFilterMobileOpen ? 'block' : 'hidden'} space-y-8 bg-[#FFF8FA] p-6 rounded-3xl border border-[#F1BCCE] h-fit`}>
            
            {/* Header & Reset */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F1BCCE]">
              <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D84B7E]" />
                Filter Pieces
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-500 hover:text-[#D84B7E] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                Category
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`block w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    !selectedCategory ? 'bg-[#FCE7F0] font-bold text-[#D84B7E]' : 'text-gray-700 hover:bg-[#FCE7F0]/50'
                  }`}
                >
                  All Collections
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'bg-[#FCE7F0] font-bold text-[#D84B7E]'
                        : 'text-gray-700 hover:bg-[#FCE7F0]/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Type Filter (Only show for Skincare) */}
            {(!selectedCategory || selectedCategory === 'skincare') && (
              <div className="space-y-3 pt-4 border-t border-[#F1BCCE]">
                <h4 className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                  Skin Type
                </h4>
                <div className="space-y-1.5">
                  {skinTypeOptions.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedSkinType(type === 'All' ? '' : type)}
                      className={`block w-full text-left text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                        (type === 'All' && !selectedSkinType) || selectedSkinType === type
                          ? 'bg-[#FCE7F0] font-bold text-[#D84B7E]'
                          : 'text-gray-700 hover:bg-[#FCE7F0]/50'
                      }`}
                    >
                      {type} Skin
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Slider */}
            <div className="space-y-3 pt-4 border-t border-[#F1BCCE]">
              <div className="flex justify-between items-center text-xs">
                <h4 className="uppercase tracking-widest font-bold text-[#111111]">Max Price</h4>
                <span className="font-bold text-[#D84B7E]">{formatPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#D84B7E] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                <span>{formatPrice(500)}</span>
                <span>{formatPrice(10000)}</span>
              </div>
            </div>

          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 bg-[#FCE7F0] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-4 p-8 shadow-xs">
                <h3 className="font-serif text-2xl text-[#111111] font-bold">
                  No {getCategoryTitle().toLowerCase()} products uploaded yet.
                </h3>
                <p className="text-xs text-gray-600">
                  {isAdmin ? `Click the "Upload New Product" button above to manually add items to the ${getCategoryTitle()} collection.` : 'Check back soon for new arrivals.'}
                </p>
                {isAdmin && (
                  <button
                    onClick={openUploadModal}
                    className="mt-4 px-6 py-2.5 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-colors cursor-pointer"
                  >
                    Upload {getCategoryTitle()} Product Now
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categories={categories}
                    onDelete={handleDeleteProduct}
                    onUpdate={(updated) => handleProductSuccess(updated, false)}
                  />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* ADMIN MANUAL UPLOAD PRODUCT MODAL */}
      {isUploadModalOpen && (
        <ProductFormModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          categories={categories}
          initialCategorySlug={propCategorySlug || selectedCategory || 'fashion'}
          onSuccess={handleProductSuccess}
        />
      )}
    </div>
  );
};
export default Shop;
