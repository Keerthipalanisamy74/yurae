import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useLocation, useParams } from 'react-router-dom';
import {
  Filter, SlidersHorizontal, RefreshCw, Upload, Trash2, X,
  Sparkles, Shirt, Gem
} from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { ProductFormModal } from '../components/common/ProductFormModal';
import { SEO } from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCategories } from '../context/CategoryContext';

interface ShopProps {
  categorySlug?: string;
}

export const Shop: React.FC<ShopProps> = ({ categorySlug: propCategorySlug }) => {
  const { categorySlug: routeCategorySlug } = useParams<{ categorySlug?: string }>();
  const effectiveCategorySlug = propCategorySlug || routeCategorySlug;
  const isDedicatedCategoryPage = Boolean(effectiveCategorySlug);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();
  const { categories, getCategoryIcon } = useCategories();

  const rawCategoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    effectiveCategorySlug ? effectiveCategorySlug.toLowerCase() : (rawCategoryParam ? rawCategoryParam.toLowerCase() : 'all')
  );

  useEffect(() => {
    if (effectiveCategorySlug) {
      setSelectedCategory(effectiveCategorySlug.toLowerCase());
    } else if (rawCategoryParam) {
      setSelectedCategory(rawCategoryParam.toLowerCase());
    } else {
      setSelectedCategory('all');
    }
  }, [effectiveCategorySlug, rawCategoryParam]);

  const currentCategory = selectedCategory;
  const searchSkinType = searchParams.get('skin_type') || '';
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Price & Sorting state
  const rawSortParam = searchParams.get('sort_by') || searchParams.get('sort') || '';
  const isBestsellersParam = searchParams.get('bestsellers') === 'true' || rawSortParam === 'bestsellers' || rawSortParam === 'best_selling' || location.pathname === '/bestsellers';
  const isNewArrivalsParam = searchParams.get('new_arrivals') === 'true' || rawSortParam === 'newest' || location.pathname === '/new-arrivals';

  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>(
    isBestsellersParam
      ? 'bestsellers'
      : isNewArrivalsParam
      ? 'newest'
      : (rawSortParam || 'featured')
  );
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  useEffect(() => {
    if (isBestsellersParam || rawSortParam === 'bestsellers' || rawSortParam === 'best_selling') {
      setSortBy('bestsellers');
    } else if (isNewArrivalsParam || rawSortParam === 'newest') {
      setSortBy('newest');
    } else if (rawSortParam) {
      setSortBy(rawSortParam);
    }
  }, [rawSortParam, isBestsellersParam, isNewArrivalsParam, location.pathname, searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [sortBy, currentCategory, searchParams]);

  // 1. Skincare-Specific Filter States
  const [selectedSkinType, setSelectedSkinType] = useState<string>(searchSkinType);
  const [selectedSkincareRoutine, setSelectedSkincareRoutine] = useState<string>('');
  const [selectedSkincareConcern, setSelectedSkincareConcern] = useState<string>('');

  // 2. Fashion-Specific Filter States
  const [selectedFashionGender, setSelectedFashionGender] = useState<string>('');
  const [selectedFashionApparel, setSelectedFashionApparel] = useState<string>('');
  const [selectedFashionSize, setSelectedFashionSize] = useState<string>('');
  const [selectedFashionFabric, setSelectedFashionFabric] = useState<string>('');

  // 3. Accessories-Specific Filter States
  const [selectedAccessoryType, setSelectedAccessoryType] = useState<string>('');
  const [selectedAccessoryGender, setSelectedAccessoryGender] = useState<string>('');
  const [selectedAccessoryMaterial, setSelectedAccessoryMaterial] = useState<string>('');

  // Admin Upload Product Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Filter Option Constants
  const skinTypeOptions = ['All', 'Sensitive', 'Normal', 'Oily', 'Combination', 'Dry', 'Oily Acne Prone'];
  const skincareRoutineOptions = ['All', 'Cleanser / Face Wash', 'Toner & Essence', 'Serum & Ampoule', 'Moisturizer & Cream', 'Sunscreen', 'Face Mask'];
  const skincareConcernOptions = ['All', 'Hydration & Glass Skin', 'Soothing & Calming', 'Brightening & Glow', 'Pore Clarifying', 'Anti-Aging'];

  const fashionGenderOptions = ['All', 'Women', 'Men', 'Unisex'];
  const fashionApparelOptions = ['All', 'T-Shirts', 'Shirts & Blouses', 'Kurtis & Tops', 'Dresses & Midi', 'Skirts', 'Pants & Trousers', 'Silks & Loungewear'];
  const fashionSizeOptions = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const fashionFabricOptions = ['All', 'Mulberry Silk', 'Organic Cotton', 'Linen', 'Satin', 'Knitwear'];

  const accessoryTypeOptions = ['All', 'Rings', 'Bracelets', 'Earrings', 'Necklaces & Pendants', 'Anklets', 'Hair Accessories & Scrunchies', 'Bags & Pouches'];
  const accessoryGenderOptions = ['All', 'Women', 'Men', 'Unisex'];
  const accessoryMaterialOptions = ['All', '18K Gold Plated', '925 Sterling Silver', 'Freshwater Pearl', 'Rose Gold', 'Silk & Fabric'];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/products?sort_by=${sortBy}&max_price=${maxPrice}`;
      if (currentCategory && currentCategory !== 'all') {
        url += `&category_slug=${currentCategory}`;
      }
      if (currentCategory === 'skincare' && selectedSkinType && selectedSkinType !== 'All') {
        url += `&skin_type=${encodeURIComponent(selectedSkinType)}`;
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
  }, [currentCategory, selectedSkinType, maxPrice, sortBy, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    if (currentCategory === 'skincare') {
      setSelectedSkinType('');
      setSelectedSkincareRoutine('');
      setSelectedSkincareConcern('');
    } else if (currentCategory === 'fashion') {
      setSelectedFashionGender('');
      setSelectedFashionApparel('');
      setSelectedFashionSize('');
      setSelectedFashionFabric('');
    } else if (currentCategory === 'accessories') {
      setSelectedAccessoryType('');
      setSelectedAccessoryGender('');
      setSelectedAccessoryMaterial('');
    } else {
      setSelectedSkinType('');
      setSelectedSkincareRoutine('');
      setSelectedSkincareConcern('');
      setSelectedFashionGender('');
      setSelectedFashionApparel('');
      setSelectedFashionSize('');
      setSelectedFashionFabric('');
      setSelectedAccessoryType('');
      setSelectedAccessoryGender('');
      setSelectedAccessoryMaterial('');
      if (!propCategorySlug) {
        setSearchParams({});
      }
    }
    setMaxPrice(10000);
    setSortBy('featured');
  };

  // Filtered Products with Smart Matching
  const filteredProducts = products.filter((p) => {
    const pName = (p.name || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    const pShortDesc = (p.short_description || '').toLowerCase();
    const pSkinType = (p.skin_type || '').toLowerCase();
    const pIngredients = (p.ingredients || '').toLowerCase();
    const pCombined = `${pName} ${pDesc} ${pShortDesc} ${pSkinType} ${pIngredients}`;
    
    // 1. Skincare Sub-filters
    if (currentCategory === 'skincare') {
      if (selectedSkinType && selectedSkinType !== 'All') {
        const queryTerm = selectedSkinType.toLowerCase();
        const matchesSkin = pSkinType.includes('all') ||
                            pSkinType.includes(queryTerm) ||
                            (queryTerm.includes('acne') && (pSkinType.includes('acne') || pCombined.includes('acne'))) ||
                            pDesc.includes(queryTerm) ||
                            pName.includes(queryTerm);
        if (!matchesSkin) return false;
      }
      if (selectedSkincareRoutine && selectedSkincareRoutine !== 'All') {
        const keyword = selectedSkincareRoutine.toLowerCase().split('/')[0].trim().replace('&', '');
        if (!pCombined.includes(keyword.toLowerCase())) return false;
      }
      if (selectedSkincareConcern && selectedSkincareConcern !== 'All') {
        const concern = selectedSkincareConcern.toLowerCase().split('&')[0].trim();
        if (!pCombined.includes(concern)) return false;
      }
    }

    // 2. Fashion Sub-filters
    if (currentCategory === 'fashion') {
      if (selectedFashionGender && selectedFashionGender !== 'All') {
        const g = selectedFashionGender.toLowerCase();
        if (g === 'women') {
          if (pCombined.includes('men') && !pCombined.includes('women') && !pCombined.includes('woman')) return false;
        } else if (g === 'men') {
          if (!pCombined.includes('men') && !pCombined.includes('man') && !pCombined.includes('male')) return false;
        }
      }
      if (selectedFashionApparel && selectedFashionApparel !== 'All') {
        const target = selectedFashionApparel.toLowerCase();
        if (target.includes('t-shirt') && !pCombined.includes('t-shirt') && !pCombined.includes('tshirt') && !pCombined.includes('tee')) return false;
        if (target.includes('shirt') && !target.includes('t-shirt') && !pCombined.includes('shirt') && !pCombined.includes('blouse')) return false;
        if (target.includes('kurti') && !pCombined.includes('kurti') && !pCombined.includes('top')) return false;
        if (target.includes('skirt') && !pCombined.includes('skirt')) return false;
        if (target.includes('dress') && !pCombined.includes('dress') && !pCombined.includes('midi') && !pCombined.includes('gown')) return false;
        if (target.includes('pant') && !pCombined.includes('pant') && !pCombined.includes('trouser') && !pCombined.includes('bottom')) return false;
        if (target.includes('silk') && !pCombined.includes('silk') && !pCombined.includes('lounge') && !pCombined.includes('robe')) return false;
      }
      if (selectedFashionSize && selectedFashionSize !== 'All') {
        const s = selectedFashionSize.toUpperCase();
        const pTextUpper = `${p.skin_type || ''} ${p.description || ''}`.toUpperCase();
        const hasVariant = p.variants?.some((v) => v.variant_value.toUpperCase().includes(s));
        if (!hasVariant && !pTextUpper.includes(s)) return false;
      }
      if (selectedFashionFabric && selectedFashionFabric !== 'All') {
        const fab = selectedFashionFabric.toLowerCase().split(' ')[0];
        if (!pCombined.includes(fab)) return false;
      }
    }

    // 3. Accessories Sub-filters
    if (currentCategory === 'accessories') {
      if (selectedAccessoryType && selectedAccessoryType !== 'All') {
        const target = selectedAccessoryType.toLowerCase();
        if (target.includes('ring') && !pCombined.includes('ring')) return false;
        if (target.includes('bracelet') && !pCombined.includes('bracelet') && !pCombined.includes('bangle')) return false;
        if (target.includes('earring') && !pCombined.includes('earring') && !pCombined.includes('stud') && !pCombined.includes('hoop')) return false;
        if (target.includes('necklace') && !pCombined.includes('necklace') && !pCombined.includes('pendant') && !pCombined.includes('chain')) return false;
        if (target.includes('anklet') && !pCombined.includes('anklet')) return false;
        if (target.includes('scrunchie') && !pCombined.includes('scrunchie') && !pCombined.includes('hair')) return false;
        if (target.includes('bag') && !pCombined.includes('bag') && !pCombined.includes('pouch') && !pCombined.includes('clutch')) return false;
      }
      if (selectedAccessoryGender && selectedAccessoryGender !== 'All') {
        const g = selectedAccessoryGender.toLowerCase();
        if (g === 'women') {
          if (pCombined.includes('men') && !pCombined.includes('women') && !pCombined.includes('woman')) return false;
        } else if (g === 'men') {
          if (!pCombined.includes('men') && !pCombined.includes('man')) return false;
        }
      }
      if (selectedAccessoryMaterial && selectedAccessoryMaterial !== 'All') {
        const mat = selectedAccessoryMaterial.toLowerCase().split(' ')[0];
        if (!pCombined.includes(mat)) return false;
      }
    }

    return true;
  });

  const isBestsellersActive = (sortBy === 'bestsellers' || sortBy === 'best_selling') && (currentCategory === 'all' || !currentCategory);
  const isNewArrivalsActive = sortBy === 'newest' && (currentCategory === 'all' || !currentCategory);

  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'bestsellers' || sortBy === 'best_selling') {
      const ordersA = a.total_ordered || 0;
      const ordersB = b.total_ordered || 0;
      if (ordersB !== ordersA) return ordersB - ordersA;
      if (b.featured !== a.featured) return b.featured ? 1 : -1;
      return (b.avg_rating || 5) - (a.avg_rating || 5);
    }
    if (sortBy === 'newest') {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    }
    if (sortBy === 'price_low') {
      return (a.sale_price || a.price) - (b.sale_price || b.price);
    }
    if (sortBy === 'price_high') {
      return (b.sale_price || b.price) - (a.sale_price || a.price);
    }
    return 0;
  });

  const activeCategoryObj = categories.find(
    (c) => c.slug.toLowerCase() === currentCategory.toLowerCase()
  );

  const getCategoryTitle = () => {
    if (isBestsellersActive) {
      return 'Bestsellers & Most Loved';
    }
    if (isNewArrivalsActive) {
      return 'New Arrivals & Fresh Creations';
    }
    if (activeCategoryObj) {
      return activeCategoryObj.name.toLowerCase().startsWith('yurae')
        ? activeCategoryObj.name
        : `Yurae ${activeCategoryObj.name}`;
    }
    if (currentCategory === 'skincare') return 'Yurae Skin';
    if (currentCategory === 'fashion') return 'Yurae Fashion';
    if (currentCategory === 'accessories') return 'Yurae Accessories';
    return 'All Products & Collections';
  };

  const getCategoryDescription = () => {
    if (isBestsellersActive) {
      return 'Explore our most ordered iconic creations, ordered chronologically by customer demand from most ordered to emerging essentials.';
    }
    if (isNewArrivalsActive) {
      return 'Discover the latest creations from Yurae Beauty. Ordered chronologically from the most recently uploaded products to older editions.';
    }
    if (activeCategoryObj?.description) {
      return activeCategoryObj.description;
    }
    if (currentCategory === 'skincare') {
      return 'Pure Korean-inspired botanical formulations for radiant, healthy glass skin. From gentle cleansers and potent serums to barrier creams and broad-spectrum sunscreens.';
    }
    if (currentCategory === 'fashion') {
      return 'Effortless modern femininity. Silks, soft French linens, tailored minimal silhouette dresses, and luxury resort apparel.';
    }
    if (currentCategory === 'accessories') {
      return 'Complete your signature look. Hand-crafted freshwater pearl earrings, 18k gold vermeil hoops, and pure mulberry silk scrunchies.';
    }
    return 'Explore the entire Yurae Beauty catalog across botanical skincare, luxury silk fashion, and handcrafted fine jewelry.';
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
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete product', 'error');
    }
  };

  const handleClearAllProducts = async () => {
    if (window.confirm('Are you sure you want to delete ALL uploaded products? This cannot be undone.')) {
      try {
        await api.delete('/products/clear/all');
        setProducts([]);
        showToast('All products deleted successfully', 'success');
      } catch (err: any) {
        showToast(err?.response?.data?.detail || 'Failed to clear products', 'error');
      }
    }
  };

  // Active filter badges list
  const activeFilters = [
    selectedSkinType && { label: `Skin: ${selectedSkinType}`, onRemove: () => setSelectedSkinType('') },
    selectedSkincareRoutine && { label: `Routine: ${selectedSkincareRoutine}`, onRemove: () => setSelectedSkincareRoutine('') },
    selectedSkincareConcern && { label: `Concern: ${selectedSkincareConcern}`, onRemove: () => setSelectedSkincareConcern('') },
    selectedFashionGender && { label: `Department: ${selectedFashionGender}`, onRemove: () => setSelectedFashionGender('') },
    selectedFashionApparel && { label: `Apparel: ${selectedFashionApparel}`, onRemove: () => setSelectedFashionApparel('') },
    selectedFashionSize && { label: `Size: ${selectedFashionSize}`, onRemove: () => setSelectedFashionSize('') },
    selectedFashionFabric && { label: `Fabric: ${selectedFashionFabric}`, onRemove: () => setSelectedFashionFabric('') },
    selectedAccessoryType && { label: `Piece: ${selectedAccessoryType}`, onRemove: () => setSelectedAccessoryType('') },
    selectedAccessoryGender && { label: `For: ${selectedAccessoryGender}`, onRemove: () => setSelectedAccessoryGender('') },
    selectedAccessoryMaterial && { label: `Material: ${selectedAccessoryMaterial}`, onRemove: () => setSelectedAccessoryMaterial('') },
    maxPrice < 10000 && { label: `Max ${formatPrice(maxPrice)}`, onRemove: () => setMaxPrice(10000) },
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSkinType('');
    setSelectedSkincareRoutine('');
    setSelectedSkincareConcern('');
    setSelectedFashionGender('');
    setSelectedFashionApparel('');
    setSelectedFashionSize('');
    setSelectedFashionFabric('');
    setSelectedAccessoryType('');
    setSelectedAccessoryGender('');
    setSelectedAccessoryMaterial('');

    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const renderBannerTabs = () => {
    let icon = '✨';
    if (activeCategoryObj) {
      icon = getCategoryIcon(activeCategoryObj);
    } else if (currentCategory === 'skincare') {
      icon = '🌸';
    } else if (currentCategory === 'fashion') {
      icon = '👗';
    } else if (currentCategory === 'accessories') {
      icon = '💍';
    }

    const buttonLabel = `${icon} All ${activeCategoryObj ? activeCategoryObj.name : 'Products'}`;

    return (
      <div className="flex items-center justify-center pt-3">
        <button
          type="button"
          onClick={handleResetFilters}
          className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D84B7E] text-white shadow-md border border-[#D84B7E] hover:bg-[#4A0E2E] hover:border-[#4A0E2E] transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          title="Display all products in this collection"
        >
          <span>{buttonLabel}</span>
        </button>
      </div>
    );
  };

  const renderCategoryFilters = () => {
    const dynamicCategoryFilters = [
      { id: 'all', label: '✨ All Categories', desc: 'Browse all products & collections' },
      ...categories.map((cat) => ({
        id: cat.slug.toLowerCase(),
        label: `${getCategoryIcon(cat)} ${cat.name}`,
        desc: cat.description || `Explore ${cat.name} catalog`,
      })),
    ];

    return (
      <div className="space-y-6">
        {/* BROWSE BY CATEGORY SELECTOR (ONLY SHOWN IN EXPLORE ALL PRODUCTS /shop) */}
        {!isDedicatedCategoryPage && (
          <div className="space-y-3 pb-4 border-b border-[#F1BCCE]">
            <div className="flex items-center gap-2 pb-1">
              <Sparkles className="w-4 h-4 text-[#D84B7E]" />
              <h4 className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                Browse by Category ({categories.length})
              </h4>
            </div>
            <div className="flex flex-col gap-2">
              {dynamicCategoryFilters.map((cat) => {
                const isActive = currentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col ${
                      isActive
                        ? 'bg-[#F8D7E3] border-[#D84B7E] text-[#D84B7E] shadow-xs font-bold ring-1 ring-[#D84B7E]'
                        : 'bg-[#FDF4F7] border-[#F1BCCE] text-gray-700 hover:border-gray-400 hover:bg-[#FCE7F0]'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#111111]">{cat.label}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SKINCARE FILTERS */}
        {currentCategory === 'skincare' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-[#F1BCCE]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D84B7E]" />
                <h4 className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                  Skincare Ritual Filters
                </h4>
              </div>
              {(selectedSkincareRoutine || selectedSkinType || selectedSkincareConcern) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSkincareRoutine('');
                    setSelectedSkinType('');
                    setSelectedSkincareConcern('');
                  }}
                  className="text-[10px] font-bold text-[#D84B7E] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Clear Ritual Filters
                </button>
              )}
            </div>

            {/* Skincare Routine */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Routine Step
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skincareRoutineOptions.map((r) => {
                  const active = (r === 'All' && !selectedSkincareRoutine) || selectedSkincareRoutine === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedSkincareRoutine(r === 'All' ? '' : r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skin Type Filter */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Skin Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skinTypeOptions.map((type) => {
                  const active = (type === 'All' && !selectedSkinType) || selectedSkinType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedSkinType(type === 'All' ? '' : type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skin Concern */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Skin Concern
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skincareConcernOptions.map((c) => {
                  const active = (c === 'All' && !selectedSkincareConcern) || selectedSkincareConcern === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedSkincareConcern(c === 'All' ? '' : c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FASHION FILTERS */}
        {currentCategory === 'fashion' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-[#F1BCCE]">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#D84B7E]" />
                <h4 className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                  Fashion & Apparel Filters
                </h4>
              </div>
              {(selectedFashionApparel || selectedFashionGender || selectedFashionSize || selectedFashionFabric) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFashionApparel('');
                    setSelectedFashionGender('');
                    setSelectedFashionSize('');
                    setSelectedFashionFabric('');
                  }}
                  className="text-[10px] font-bold text-[#D84B7E] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Clear Apparel Filters
                </button>
              )}
            </div>

            {/* Apparel Item Type */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Apparel Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {fashionApparelOptions.map((app) => {
                  const active = (app === 'All' && !selectedFashionApparel) || selectedFashionApparel === app;
                  return (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setSelectedFashionApparel(app === 'All' ? '' : app)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {app}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender / Department */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Department
              </label>
              <div className="flex flex-wrap gap-1.5">
                {fashionGenderOptions.map((g) => {
                  const active = (g === 'All' && !selectedFashionGender) || selectedFashionGender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedFashionGender(g === 'All' ? '' : g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Size
              </label>
              <div className="flex flex-wrap gap-1.5">
                {fashionSizeOptions.map((s) => {
                  const active = (s === 'All' && !selectedFashionSize) || selectedFashionSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedFashionSize(s === 'All' ? '' : s)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fabric / Material */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Fabric & Material
              </label>
              <div className="flex flex-wrap gap-1.5">
                {fashionFabricOptions.map((fab) => {
                  const active = (fab === 'All' && !selectedFashionFabric) || selectedFashionFabric === fab;
                  return (
                    <button
                      key={fab}
                      type="button"
                      onClick={() => setSelectedFashionFabric(fab === 'All' ? '' : fab)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {fab}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ACCESSORIES FILTERS */}
        {currentCategory === 'accessories' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-[#F1BCCE]">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#D84B7E]" />
                <h4 className="text-xs uppercase tracking-widest font-bold text-[#111111]">
                  Jewelry & Accessory Filters
                </h4>
              </div>
              {(selectedAccessoryType || selectedAccessoryGender || selectedAccessoryMaterial) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccessoryType('');
                    setSelectedAccessoryGender('');
                    setSelectedAccessoryMaterial('');
                  }}
                  className="text-[10px] font-bold text-[#D84B7E] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Clear Piece Filters
                </button>
              )}
            </div>

            {/* Piece Category */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Piece Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {accessoryTypeOptions.map((acc) => {
                  const active = (acc === 'All' && !selectedAccessoryType) || selectedAccessoryType === acc;
                  return (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setSelectedAccessoryType(acc === 'All' ? '' : acc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {acc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender / Audience */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Recipient
              </label>
              <div className="flex flex-wrap gap-1.5">
                {accessoryGenderOptions.map((g) => {
                  const active = (g === 'All' && !selectedAccessoryGender) || selectedAccessoryGender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedAccessoryGender(g === 'All' ? '' : g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metal / Finish */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block">
                Metal & Material
              </label>
              <div className="flex flex-wrap gap-1.5">
                {accessoryMaterialOptions.map((mat) => {
                  const active = (mat === 'All' && !selectedAccessoryMaterial) || selectedAccessoryMaterial === mat;
                  return (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setSelectedAccessoryMaterial(mat === 'All' ? '' : mat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-[#D84B7E] text-white shadow-xs font-bold'
                          : 'bg-[#FDF4F7] text-gray-700 border border-[#F1BCCE] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      {mat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24 bg-[#F8B4CB]">
      <SEO
        title={`${getCategoryTitle()} — YURAE Luxury Collection`}
        description={getCategoryDescription()}
        type="website"
        category={getCategoryTitle()}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: getCategoryTitle(), url: location.pathname + location.search },
        ]}
      />
      {/* Category Banner */}
      <section className="bg-gradient-to-b from-[#F8B4CB] via-[#F6A2BE] to-[#F48FB1] py-8 sm:py-14 px-3 sm:px-4 border-b-2 border-[#F06292] shadow-xs">
        <div className="max-w-7xl mx-auto text-center space-y-2.5 sm:space-y-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D81B60] font-bold">
            Yurae Beauty
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#111111]">
            {getCategoryTitle()}
          </h1>
          <p className="text-xs sm:text-base text-gray-700 font-normal max-w-2xl mx-auto leading-relaxed px-2">
            {getCategoryDescription()}
          </p>

          {/* Interactive Category-Specific Routine / Subcategory Tabs */}
          {renderBannerTabs()}

          {/* Admin Upload Controls Banner */}
          {isAdmin && (
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={openUploadModal}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-md flex items-center gap-2 cursor-pointer touch-target min-h-[40px]"
              >
                <Upload className="w-4 h-4 text-[#FDF4F7]" />
                Upload New Product {currentCategory !== 'all' ? `to ${getCategoryTitle()}` : ''}
              </button>
              <button
                onClick={handleClearAllProducts}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-red-600/90 text-white text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-full hover:bg-red-700 transition-all shadow-md flex items-center gap-2 cursor-pointer touch-target min-h-[40px]"
              >
                <Trash2 className="w-4 h-4" />
                Reset Store Catalog
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Filter Toggle & Sort Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-[#F1BCCE]">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsFilterMobileOpen(true);
              } else {
                setIsFilterSidebarOpen((prev) => !prev);
              }
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-xs touch-target min-h-[40px] active:scale-95 ${
              isFilterSidebarOpen || activeFilters.length > 0
                ? 'bg-[#D84B7E] text-white border-[#D84B7E] shadow-sm'
                : 'bg-[#FFF8FA] text-[#111111] border-[#F1BCCE] hover:border-[#D84B7E]'
            }`}
          >
            <Filter className={`w-4 h-4 ${isFilterSidebarOpen || activeFilters.length > 0 ? 'text-white' : 'text-[#D84B7E]'}`} />
            <span>{isFilterSidebarOpen ? 'Hide Filters' : 'Filters'}</span>
            {activeFilters.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isFilterSidebarOpen ? 'bg-white text-[#D84B7E]' : 'bg-[#D84B7E] text-white'
                }`}
              >
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-bold hidden sm:inline">
              Sort By:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[#FFF8FA] border border-[#F1BCCE] rounded-full px-3.5 sm:px-4 py-2 pr-7 sm:pr-8 text-xs font-bold text-[#111111] outline-none cursor-pointer focus:border-[#D84B7E] min-h-[40px]"
              >
                <option value="featured">Featured</option>
                <option value="bestsellers">Bestsellers (Most Ordered)</option>
                <option value="newest">New Arrivals</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {activeFilters.length > 0 && (
          <div className="pt-3 sm:pt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-gray-500">Active:</span>
            {activeFilters.map((flt, idx) => (
              <button
                key={idx}
                onClick={flt.onRemove}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#F8D7E3] text-[#D84B7E] border border-[#F1BCCE] rounded-full text-[11px] sm:text-xs font-bold hover:bg-[#D84B7E] hover:text-white transition-colors cursor-pointer touch-target min-h-[32px]"
              >
                {flt.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-[#D84B7E] underline font-bold ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="pt-6 sm:pt-8 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          
          {/* SIDEBAR FILTERS (Desktop - Collapsible & Toggleable) */}
          {isFilterSidebarOpen && (
            <aside className="hidden lg:block w-72 lg:w-80 shrink-0 space-y-6 bg-[#FFF8FA] p-6 rounded-3xl border border-[#F1BCCE] h-fit sticky top-24 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300">
              
              {/* Header & Reset / Close */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F1BCCE]">
                <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#D84B7E]" />
                  Filter {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-gray-500 hover:text-[#D84B7E] flex items-center gap-1 cursor-pointer font-bold"
                    title="Reset all filters"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterSidebarOpen(false)}
                    className="p-1 hover:bg-[#F8D7E3] rounded-full text-gray-500 hover:text-[#111111] transition-colors cursor-pointer"
                    title="Hide filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Strictly Category-Specific Filters */}
              {renderCategoryFilters()}

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
          )}

          {/* MOBILE SLIDE-OVER FILTER DRAWER */}
          {isFilterMobileOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                onClick={() => setIsFilterMobileOpen(false)}
              />
              <div className="relative z-50 w-full max-w-sm bg-[#FFF8FA] h-full flex flex-col shadow-2xl border-l border-[#F1BCCE] animate-in slide-in-from-right duration-300">
                {/* Drawer Header */}
                <div className="p-4 sm:p-5 border-b border-[#F1BCCE] flex items-center justify-between bg-[#FDF4F7]">
                  <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#D84B7E]" />
                    Filter Collection
                  </h3>
                  <button
                    onClick={() => setIsFilterMobileOpen(false)}
                    className="p-2 hover:bg-[#F8D7E3] rounded-full transition-colors cursor-pointer touch-target flex items-center justify-center"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5 text-[#111111]" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 touch-scroll">
                  {renderCategoryFilters()}

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
                </div>

                {/* Drawer Sticky Footer Actions */}
                <div className="p-4 border-t border-[#F1BCCE] bg-[#FDF4F7] grid grid-cols-2 gap-3 pb-safe">
                  <button
                    onClick={handleResetFilters}
                    className="w-full py-3 bg-white text-[#111111] border border-[#F1BCCE] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#FCE7F0] transition-colors cursor-pointer touch-target min-h-[44px]"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterMobileOpen(false)}
                    className="w-full py-3 bg-[#D84B7E] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#111111] transition-colors shadow-md cursor-pointer touch-target min-h-[44px]"
                  >
                    Apply ({filteredProducts.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <main className="flex-1 min-w-0 w-full">
            {loading ? (
              <div className={`grid grid-cols-2 ${isFilterSidebarOpen ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-3 sm:gap-6`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-80 sm:h-96 bg-[#FCE7F0] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : sortedAndFilteredProducts.length === 0 ? (
              <div className="text-center py-16 sm:py-24 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-4 p-6 sm:p-8 shadow-xs">
                <h3 className="font-serif text-xl sm:text-2xl text-[#111111] font-bold">
                  No matching {getCategoryTitle().toLowerCase()} found.
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  Try adjusting your filter criteria, or click Reset Filters to view all {currentCategory} items.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 bg-[#D84B7E] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-xs touch-target min-h-[44px]"
                  >
                    Reset All Filters
                  </button>
                  {isAdmin && (
                    <button
                      onClick={openUploadModal}
                      className="px-6 py-2.5 bg-white text-[#111111] border border-[#F1BCCE] text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer shadow-xs touch-target min-h-[44px]"
                    >
                      Upload New Product
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-2 ${isFilterSidebarOpen ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-3 sm:gap-6`}>
                {sortedAndFilteredProducts.map((product) => (
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
          initialCategorySlug={currentCategory === 'all' ? 'skincare' : currentCategory}
          allowCategorySelection={currentCategory === 'all'}
          onSuccess={handleProductSuccess}
        />
      )}
    </div>
  );
};

export default Shop;
