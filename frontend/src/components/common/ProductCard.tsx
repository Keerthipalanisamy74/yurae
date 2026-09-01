import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Plus, X, Edit, Trash2 } from 'lucide-react';
import { Product, Category, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { ProductFormModal } from './ProductFormModal';

interface ProductCardProps {
  product: Product;
  categories?: Category[];
  onDelete?: (productId: number) => void;
  onUpdate?: (updatedProduct: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product: initialProduct,
  categories = [],
  onDelete,
  onUpdate,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState<Product>(initialProduct);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSelectingSize, setIsSelectingSize] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [isAdding, setIsAdding] = useState(false);

  // Sync if initialProduct prop updates
  React.useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  const isSaved = isInWishlist(product.id);
  const primaryImage = product.images?.[0]?.image_url || '';
  const secondaryImage = product.images?.[1]?.image_url || primaryImage;

  const categorySlug = product.category?.slug?.toLowerCase() || '';
  const categoryName = product.category?.name?.toLowerCase() || '';
  const isFashion = categorySlug === 'fashion' || categoryName.includes('fashion') || categoryName.includes('dress') || categoryName.includes('apparel') || categoryName.includes('kurti') || categoryName.includes('saree') || categoryName.includes('clothing');
  const isAccessories = categorySlug === 'accessories' || categoryName.includes('accessories') || categoryName.includes('jewelry') || categoryName.includes('bag') || categoryName.includes('pendant') || categoryName.includes('ring') || categoryName.includes('earring');
  const isSkincare = !isFashion && !isAccessories;

  const sizeVariants = product.variants?.filter((v) => v.variant_name?.toLowerCase() === 'size') || [];
  const parsedSizesFromSkinType = product.skin_type && product.skin_type.includes('Sizes:')
    ? product.skin_type.replace(/.*Sizes:\s*/i, '').split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const availableSizes: { label: string; variant?: ProductVariant }[] = sizeVariants.length > 0
    ? sizeVariants.map((v) => ({ label: v.variant_value, variant: v }))
    : parsedSizesFromSkinType.length > 0
    ? parsedSizesFromSkinType.map((s) => ({ label: s, variant: undefined }))
    : isFashion
    ? ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => ({ label: s, variant: undefined }))
    : [];

  const hasSizeVariants = availableSizes.length > 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      if (onDelete) {
        onDelete(product.id);
      } else {
        try {
          await api.delete(`/products/${product.id}`);
          showToast(`Product "${product.name}" deleted successfully`, 'success');
          window.location.reload();
        } catch (err: any) {
          showToast(err?.response?.data?.detail || 'Failed to delete product', 'error');
        }
      }
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (savedProduct: Product) => {
    setProduct(savedProduct);
    if (onUpdate) {
      onUpdate(savedProduct);
    }
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasSizeVariants) {
      if (!selectedSize && availableSizes.length > 0) {
        setSelectedSize(availableSizes[0].label);
      }
      setIsSelectingSize(true);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedSize) {
      showToast('Please choose a size first', 'info');
      return;
    }

    setIsAdding(true);
    try {
      const foundSizeItem = availableSizes.find((s) => s.label === selectedSize);
      await addToCart(product, foundSizeItem?.variant);
      setIsSelectingSize(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div
        className="group relative flex flex-col bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl overflow-hidden luxury-card shadow-xs h-full"
        onMouseLeave={() => setIsSelectingSize(false)}
      >
        {/* 1. Image Container */}
        <div className="relative aspect-4/5 w-full bg-[#F8D7E3] overflow-hidden">
          <Link to={`/product/${product.slug}`} className="block w-full h-full">
            {primaryImage ? (
              <>
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  loading="lazy"
                />
                <img
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:scale-105 transform duration-700"
                  loading="lazy"
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#FCE7F0] p-4 text-center">
                <span className="font-serif text-3xl font-bold text-[#D84B7E]/60 mb-1">YB</span>
                <span className="text-xs font-serif font-bold text-[#111111] line-clamp-1">{product.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{product.category?.name || 'Yurae'}</span>
              </div>
            )}
          </Link>

          {/* Top Badges & Admin Controls */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-1.5 z-10 max-w-[70%]">
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEditClick}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#111111] hover:bg-[#D84B7E] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  title="Edit product details, price, or photos"
                >
                  <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  title="Delete this product"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Delete
                </button>
              </div>
            )}

            {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-red-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs w-fit">
                Sold Out
              </span>
            ) : (
              <>
                {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 5 && (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md animate-pulse w-fit flex items-center gap-1">
                    <span>⚡ Only {product.stock_quantity} Left</span>
                  </span>
                )}
                {product.sale_price && (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#111111] text-[#FDF4F7] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs w-fit">
                    Offer
                  </span>
                )}
              </>
            )}
          </div>

          {/* Wishlist Heart Button - Customer Only */}
          {!isAdmin && (
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-2 sm:p-2.5 rounded-full transition-all duration-300 shadow-md cursor-pointer z-10 touch-target min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center ${
                isSaved
                  ? 'bg-[#D84B7E] text-[#FDF4F7]'
                  : 'bg-white/85 backdrop-blur-md text-[#111111] hover:bg-white hover:scale-110'
              }`}
              aria-label="Add to Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-[#FDF4F7]' : ''}`} />
            </button>
          )}

          {/* Quick Add Button or Size Selection Pop-up - Customer Only */}
          {!isAdmin && (
            product.stock_quantity !== undefined && product.stock_quantity <= 0 ? (
              <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 z-10">
                <button
                  disabled
                  className="w-full min-h-[40px] sm:min-h-[44px] py-2 sm:py-2.5 bg-gray-500/90 text-white text-[11px] sm:text-xs uppercase tracking-widest font-bold rounded-xl backdrop-blur-md shadow-md cursor-not-allowed"
                >
                  Out of Stock
                </button>
              </div>
            ) : isSelectingSize ? (
              <div
                className="absolute inset-x-0 bottom-0 bg-[#FFF8FA]/98 backdrop-blur-lg p-2.5 sm:p-3.5 pt-2.5 rounded-b-2xl border-t-2 border-[#F1BCCE] z-20 shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-serif font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D84B7E] inline-block animate-pulse" />
                    Size: <span className="text-[#D84B7E] font-bold">{selectedSize}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsSelectingSize(false);
                    }}
                    className="p-1 text-gray-400 hover:text-black rounded-full transition-colors cursor-pointer"
                    title="Close size selector"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sizes Grid */}
                <div className="flex flex-wrap gap-1 max-h-20 sm:max-h-24 overflow-y-auto touch-scroll">
                  {availableSizes.map((sizeItem) => (
                    <button
                      key={sizeItem.label}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedSize(sizeItem.label);
                      }}
                      className={`px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs border transition-all cursor-pointer shadow-2xs flex-1 min-w-[32px] text-center touch-target min-h-[36px] ${
                        selectedSize === sizeItem.label
                          ? 'bg-[#D84B7E] text-white border-[#D84B7E] shadow-sm scale-105'
                          : 'bg-white text-[#111111] border-[#F1BCCE] hover:bg-[#FCE7F0] hover:border-[#D84B7E]'
                      }`}
                    >
                      {sizeItem.label}
                    </button>
                  ))}
                </div>

                {/* Quick Add Button inside the popup */}
                <button
                  type="button"
                  disabled={isAdding || !selectedSize}
                  onClick={handleConfirmQuickAdd}
                  className="w-full py-2 bg-[#D84B7E] hover:bg-[#4A0E2E] text-[#FDF4F7] text-[10px] sm:text-xs uppercase tracking-widest font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 min-h-[38px]"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {isAdding ? 'Adding...' : `Add Size ${selectedSize}`}
                </button>
              </div>
            ) : (
              <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 transform translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 z-10">
                <button
                  onClick={handleQuickAddClick}
                  className="w-full min-h-[40px] sm:min-h-[44px] py-2 sm:py-2.5 bg-[#D84B7E] hover:bg-[#4A0E2E] text-[#FDF4F7] text-[11px] sm:text-xs uppercase tracking-widest font-bold rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 touch-target"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Quick Add
                </button>
              </div>
            )
          )}
        </div>

        {/* 2. Info Container */}
        <div className="p-3 min-[400px]:p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Category header & Rating */}
            <div className="flex items-center justify-between gap-1 mb-1 min-h-[16px]">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold truncate">
                {product.category?.name || 'Skincare'}
              </span>
              {product.avg_rating && product.avg_rating > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-[#D84B7E] shrink-0 ml-auto">
                  <Star className="w-3 h-3 fill-[#D84B7E]" />
                  <span className="font-bold text-[#111111] text-[10px] sm:text-[11px]">{product.avg_rating}</span>
                  <span className="text-gray-400 text-[9px] sm:text-[10px]">({product.review_count})</span>
                </div>
              )}
            </div>

            <Link to={`/product/${product.slug}`}>
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] hover:text-[#D84B7E] transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>

            {/* Target Skin Types below product name */}
            {product.skin_type && product.skin_type.trim().length > 0 && product.skin_type.trim().toLowerCase() !== 'none' && !product.skin_type.toLowerCase().includes('size') && isSkincare && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {product.skin_type.trim().toLowerCase() === 'all' || product.skin_type.trim().toLowerCase() === 'all skin types' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-[#D84B7E] bg-[#FFF0F5] border border-[#F1BCCE] px-2 py-0.5 rounded-full shadow-2xs">
                    <span>🌟</span>
                    <span>All Skin Types</span>
                  </span>
                ) : (
                  product.skin_type.split(',').map((st) => st.trim()).filter(Boolean).map((st) => {
                    const lower = st.toLowerCase();
                    const icon = lower.includes('sensitive') ? '🌿'
                      : lower.includes('normal') ? '✨'
                      : lower.includes('acne') ? '🛡️'
                      : lower.includes('oily') ? '💧'
                      : lower.includes('combination') ? '⚖️'
                      : lower.includes('dry') ? '🌸'
                      : '✨';
                    return (
                      <span
                        key={st}
                        className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-[#111111] bg-[#FFF0F5] border border-[#F1BCCE] px-1.5 py-0.5 rounded-md shadow-2xs"
                      >
                        <span className="text-[10px]">{icon}</span>
                        <span>{st}</span>
                      </span>
                    );
                  })
                )}
              </div>
            )}

            <p className="text-[11px] sm:text-xs text-gray-600 font-light mt-1 line-clamp-2 leading-relaxed">
              {product.short_description || product.description}
            </p>

            {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 5 && (
              <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[9px] sm:text-[10px] font-bold">
                <span>⚡ Only {product.stock_quantity} left!</span>
              </div>
            )}
          </div>

          {/* Price & Weight/Category Footer */}
          <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-[#F1BCCE] flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-serif text-base sm:text-lg font-bold text-[#111111]">
                {formatPrice(product.sale_price || product.price)}
              </span>
              {product.sale_price && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {product.weight && (!product.variants || product.variants.length === 0) ? (
                <span className="text-[9px] sm:text-[10px] bg-[#FFF0F5] text-[#D84B7E] px-1.5 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  {product.weight}
                </span>
              ) : isSkincare ? (
                <span className="text-[9px] sm:text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-1.5 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  Skincare
                </span>
              ) : null}
              {isFashion && (
                <span className="text-[9px] sm:text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-1.5 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  Apparel
                </span>
              )}
              {isAccessories && (
                <span className="text-[9px] sm:text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-1.5 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  Jewelry
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Edit Modal */}
      {isEditModalOpen && (
        <ProductFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          productToEdit={product}
          categories={categories}
          initialCategorySlug={product.category?.slug}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};
