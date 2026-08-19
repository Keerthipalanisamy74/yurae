import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, RefreshCw, Upload, X, CheckCircle, Trash2 } from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
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
  const [targetUploadCategory, setTargetUploadCategory] = useState<string>('skincare');
  const [newProdName, setNewProdName] = useState('');
  const [newProdSlug, setNewProdSlug] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(1290);
  const [newProdSalePrice, setNewProdSalePrice] = useState<number | undefined>(undefined);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdImgUrl, setNewProdImgUrl] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdShortDesc, setNewProdShortDesc] = useState('');
  const [newProdIngredients, setNewProdIngredients] = useState('');
  const [newProdSkinType, setNewProdSkinType] = useState('All');
  const [newProdSubCategory, setNewProdSubCategory] = useState('Maxi & Midi Dresses');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableFashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const skinTypeOptions = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];

  const dressCategories = [
    'Maxi & Midi Dresses',
    'Mini & Cocktail Dresses',
    'Silk Robes & Kimonos',
    'Co-ord Sets & Jumpsuits',
    'Evening & Party Gowns',
    'Summer & Casual Dresses',
    'Tops & Blouses',
    'Skirts & Bottoms',
    'Loungewear & Nightwear',
    'Ethnic & Fusion Wear',
  ];

  const skincareCategories = [
    'Cleansers & Face Wash',
    'Toners & Essences',
    'Serums & Treatments',
    'Moisturizers & Creams',
    'Masks & Exfoliators',
    'Sunscreens & UV Defense',
    'Eye & Lip Care',
  ];

  const accessoryCategories = [
    'Ring',
    'Necklace',
    'Bracelet',
    'Earrings',
  ];

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
    const activeCat = propCategorySlug || selectedCategory || 'fashion';
    setTargetUploadCategory(activeCat);
    if (activeCat === 'fashion') {
      setNewProdSubCategory('Maxi & Midi Dresses');
    } else if (activeCat === 'skincare') {
      setNewProdSubCategory('Serums & Treatments');
    } else {
      setNewProdSubCategory('Ring');
    }
    setIsUploadModalOpen(true);
  };

  const getCategoryIdBySlug = (slug: string): number => {
    const found = categories.find((c) => c.slug === slug.toLowerCase());
    if (found) return found.id;
    if (slug === 'fashion') return 2;
    if (slug === 'accessories') return 3;
    return 1; // skincare default
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setNewProdImgUrl(reader.result as string);
          showToast('Product image loaded!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminUploadProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showToast('Please fill in product name and price', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const isFashion = targetUploadCategory === 'fashion';
      const catId = getCategoryIdBySlug(targetUploadCategory);
      const slugVal = newProdSlug.trim() || newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const defaultImg = newProdImgUrl.trim() || (isFashion
        ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80'
        : 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80'
      );

      const variantsPayload = isFashion && selectedSizes.length > 0
        ? selectedSizes.map((size) => ({
            variant_name: 'Size',
            variant_value: size,
            additional_price: 0,
            stock_quantity: Math.max(1, Math.floor(newProdStock / selectedSizes.length)),
          }))
        : [];

      const skinTypeVal = isFashion
        ? (selectedSizes.length > 0 ? `Sizes: ${selectedSizes.join(', ')}` : (newProdSkinType || 'Standard Fit'))
        : (newProdSkinType || 'All');

      const shortDescVal = newProdShortDesc.trim() || (isFashion ? `${newProdSubCategory} • Premium Fashion` : newProdName);
      const descVal = newProdDesc.trim() || (isFashion
        ? `${newProdName} - Luxury ${newProdSubCategory} designed with premium fabrics and tailored silhouette by Yurae.`
        : `${newProdName} - Premium ${targetUploadCategory} item by Yurae Beauty.`
      );

      const res = await api.post('/products', {
        category_id: catId,
        name: newProdName,
        slug: slugVal,
        description: descVal,
        short_description: shortDescVal,
        price: newProdPrice,
        sale_price: newProdSalePrice || undefined,
        stock_quantity: newProdStock,
        brand: 'Yurae Beauty',
        ingredients: newProdIngredients,
        skin_type: skinTypeVal,
        status: 'ACTIVE',
        featured: true,
        images: [defaultImg],
        variants: variantsPayload,
      });

      if (!selectedCategory || selectedCategory === targetUploadCategory) {
        setProducts((prev) => [res.data, ...prev]);
      }
      setIsUploadModalOpen(false);
      showToast(`Product "${newProdName}" successfully uploaded to ${targetUploadCategory.toUpperCase()}!`, 'success');

      // Reset form
      setNewProdName('');
      setNewProdSlug('');
      setNewProdPrice(1290);
      setNewProdSalePrice(undefined);
      setNewProdImgUrl('');
      setNewProdDesc('');
      setNewProdShortDesc('');
      setNewProdIngredients('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload product';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
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

          {/* Admin Upload & Clear Actions */}
          {isAdmin && (
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={openUploadModal}
                className="px-6 py-3 bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-xl flex items-center gap-2 border border-[#D84B7E] cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#FDF4F7]" />
                Upload New Product
              </button>
              {products.length > 0 && (
                <button
                  onClick={handleClearAllProducts}
                  className="px-6 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-red-700 transition-all shadow-xl flex items-center gap-2 border border-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Products ({products.length})
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[#F1BCCE]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterMobileOpen(!isFilterMobileOpen)}
              className="lg:hidden px-4 py-2 bg-[#FFF8FA] border border-[#F1BCCE] text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-2 text-[#111111]"
            >
              <Filter className="w-4 h-4 text-[#D84B7E]" />
              Filters
            </button>
            <span className="text-xs text-gray-700 font-medium">
              Showing <span className="font-bold text-[#111111]">{products.length}</span> products in {getCategoryTitle()}
            </span>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold hidden sm:inline">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FFF8FA] border border-[#F1BCCE] text-xs uppercase tracking-wider font-bold text-[#111111] px-4 py-2 rounded-full outline-none focus:border-[#D84B7E] cursor-pointer"
            >
              <option value="featured">Featured / Hero Items</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pt-8">
          
          {/* Sidebar Filters */}
          <aside className={`space-y-8 lg:block ${isFilterMobileOpen ? 'block bg-[#FDF4F7] p-6 border border-[#F1BCCE] rounded-2xl mb-6' : 'hidden'}`}>
            
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F1BCCE]">
              <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#D84B7E]" />
                Filter Products
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-600 hover:text-[#D84B7E] flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Category Filter */}
            {!propCategorySlug && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">
                  Category
                </h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`block w-full text-left text-xs uppercase tracking-wider font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === '' ? 'bg-[#D84B7E] text-[#FDF4F7]' : 'text-gray-800 hover:bg-[#FCE7F0]'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`block w-full text-left text-xs uppercase tracking-wider font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                        selectedCategory === cat.slug ? 'bg-[#D84B7E] text-[#FDF4F7]' : 'text-gray-800 hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Type Filter (Only for Skincare or All) */}
            {(!selectedCategory || selectedCategory === 'skincare') && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">
                  Skin Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skinTypeOptions.map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedSkinType(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        selectedSkinType === st
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E]'
                          : 'bg-[#FFF8FA] border-[#F1BCCE] text-[#111111] hover:border-[#111111]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Max Price Filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="uppercase tracking-widest text-[#D84B7E] font-bold">Max Price</span>
                <span className="font-bold text-[#111111]">{formatPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#D84B7E] cursor-pointer"
              />
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
                  <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* ADMIN MANUAL UPLOAD PRODUCT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8FA] border border-[#D84B7E] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#F1BCCE] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold">Admin Controls</span>
                <h2 className="font-serif text-2xl font-bold text-[#111111]">
                  Upload Product to {targetUploadCategory.toUpperCase()}
                </h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-gray-500 hover:text-black rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAdminUploadProduct} className="space-y-4 text-xs">
              {(!selectedCategory && !propCategorySlug) && (
                <div className="flex gap-2 p-1 bg-[#FCE7F0] border border-[#F1BCCE] rounded-2xl mb-3">
                  {(['fashion', 'skincare', 'accessories'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setTargetUploadCategory(cat);
                        if (cat === 'fashion') setNewProdSubCategory('Maxi & Midi Dresses');
                        else if (cat === 'skincare') setNewProdSubCategory('Serums & Treatments');
                        else setNewProdSubCategory('Ring');
                      }}
                      className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
                        targetUploadCategory === cat
                          ? 'bg-[#D84B7E] text-[#FDF4F7] shadow-md scale-[1.02]'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      {cat === 'fashion' ? 'Fashion (Dresses)' : cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    required
                    placeholder={
                      targetUploadCategory === 'fashion'
                        ? 'e.g. Mulberry Silk Wrap Dress'
                        : targetUploadCategory === 'accessories'
                        ? 'e.g. Baroque Freshwater Pearl Earrings'
                        : 'e.g. Centella Cleansing Foam'
                    }
                    className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">
                    {targetUploadCategory === 'fashion'
                      ? 'Dress & Apparel Category *'
                      : targetUploadCategory === 'accessories'
                      ? 'Accessory Category *'
                      : 'Skincare Category *'}
                  </label>
                  {targetUploadCategory === 'fashion' ? (
                    <select
                      value={newProdSubCategory}
                      onChange={(e) => setNewProdSubCategory(e.target.value)}
                      className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
                    >
                      {dressCategories.map((dressCat) => (
                        <option key={dressCat} value={dressCat}>
                          {dressCat}
                        </option>
                      ))}
                    </select>
                  ) : targetUploadCategory === 'accessories' ? (
                    <select
                      value={newProdSubCategory}
                      onChange={(e) => setNewProdSubCategory(e.target.value)}
                      className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
                    >
                      {accessoryCategories.map((accCat) => (
                        <option key={accCat} value={accCat}>
                          {accCat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={newProdSubCategory}
                      onChange={(e) => setNewProdSubCategory(e.target.value)}
                      className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
                    >
                      {skincareCategories.map((skinCat) => (
                        <option key={skinCat} value={skinCat}>
                          {skinCat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Regular Price (₹) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    required
                    className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Sale Offer Price (₹)</label>
                  <input
                    type="number"
                    value={newProdSalePrice || ''}
                    onChange={(e) => setNewProdSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    required
                    className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>
              </div>

              {/* UPLOAD PRODUCT IMAGE FIELD */}
              <div>
                <label className="font-bold text-[#111111] block mb-1">Upload Product Image *</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none text-[#111111] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#D84B7E] file:text-[#FDF4F7] hover:file:bg-[#111111] cursor-pointer"
                  />

                  {newProdImgUrl && (
                    <div className="flex items-center gap-3 p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl">
                      <img src={newProdImgUrl} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-[#D84B7E]" />
                      <div className="flex-1 overflow-hidden">
                        <span className="text-xs font-bold text-[#D84B7E] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Image Prepared
                        </span>
                        <span className="text-[10px] text-gray-500 truncate block mt-0.5">{newProdImgUrl.slice(0, 45)}...</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProdImgUrl('')}
                        className="text-xs text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="text-[10px] text-gray-500 block mb-1">Or paste direct image web URL:</span>
                    <input
                      type="text"
                      value={newProdImgUrl}
                      onChange={(e) => setNewProdImgUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or image web address"
                      className="w-full p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* FASHION SIZE SELECTOR PILLS */}
              {targetUploadCategory === 'fashion' && (
                <div className="p-4 bg-[#F8D7E3]/80 border border-[#F1BCCE] rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-[#111111] text-xs flex items-center gap-2">
                      <span>Available Sizes</span>
                      <span className="px-2 py-0.5 bg-[#D84B7E] text-white text-[10px] rounded-full">
                        {selectedSizes.length} selected
                      </span>
                    </label>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedSizes([...availableFashionSizes])}
                        className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSizes([])}
                        className="text-gray-500 font-bold hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {availableFashionSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizes(selectedSizes.filter((s) => s !== size));
                            } else {
                              setSelectedSizes([...selectedSizes, size]);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                              : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-600 leading-normal">
                    Select the sizes in stock (XS, S, M, L, XL, XXL, XXXL). Customers will choose from these sizes on the product page.
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  {targetUploadCategory === 'fashion'
                    ? 'Fit / Size Guide'
                    : targetUploadCategory === 'accessories'
                    ? 'Material & Finish'
                    : 'Suitable Skin Type'}
                </label>
                <input
                  type="text"
                  value={newProdSkinType}
                  onChange={(e) => setNewProdSkinType(e.target.value)}
                  placeholder={
                    targetUploadCategory === 'fashion'
                      ? 'e.g. S, M, L, XL / Standard Fit'
                      : targetUploadCategory === 'accessories'
                      ? 'e.g. 18k Gold Plated Sterling Silver'
                      : 'e.g. Sensitive, Combination, Normal'
                  }
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">
                  {targetUploadCategory === 'fashion'
                    ? 'Fabric Composition'
                    : targetUploadCategory === 'accessories'
                    ? 'Material Details'
                    : 'Key Botanical Ingredients'}
                </label>
                <input
                  type="text"
                  value={newProdIngredients}
                  onChange={(e) => setNewProdIngredients(e.target.value)}
                  placeholder={
                    targetUploadCategory === 'fashion'
                      ? 'e.g. 100% Organic Mulberry Silk, French Linen'
                      : targetUploadCategory === 'accessories'
                      ? 'e.g. Natural Freshwater Pearl, Silk Satin'
                      : 'Centella Asiatica, Niacinamide, Ceramides...'
                  }
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Short Description (Optional)</label>
                <input
                  type="text"
                  value={newProdShortDesc}
                  onChange={(e) => setNewProdShortDesc(e.target.value)}
                  placeholder="Brief 1-line product highlight..."
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Full Description (Optional)</label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder={
                    targetUploadCategory === 'fashion'
                      ? 'Detailed garment story, styling advice, and fit information...'
                      : targetUploadCategory === 'accessories'
                      ? 'Detailed accessory story, craftsmanship, and styling notes...'
                      : 'Detailed product story, botanical benefits, and ritual guide...'
                  }
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#FDF4F7]" />
                {isSubmitting ? 'Uploading Product...' : `Upload Product to ${targetUploadCategory.toUpperCase()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
