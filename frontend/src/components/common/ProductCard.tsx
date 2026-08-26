import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Plus, Trash2, Edit, X } from 'lucide-react';
import { Product, Category, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ProductFormModal } from './ProductFormModal';

interface ProductCardProps {
  product: Product;
  categories?: Category[];
  onDelete?: (productId: number) => void;
  onUpdate?: (updatedProduct: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product: initialProduct, categories = [], onDelete, onUpdate }) => {
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
        } catch {
          showToast('Failed to delete product', 'error');
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
        className="group relative flex flex-col bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl overflow-hidden luxury-card shadow-xs"
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
                />
                <img
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:scale-105 transform duration-700"
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
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEditClick}
                  className="px-2.5 py-1 bg-[#111111] hover:bg-[#D84B7E] text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  title="Edit product details, price, or photos"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  title="Delete this product"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}

            {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? (
              <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs w-fit">
                Sold Out
              </span>
            ) : (
              <>
                {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 5 && (
                  <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md animate-pulse w-fit flex items-center gap-1">
                    <span>⚡ Only {product.stock_quantity} Left</span>
                  </span>
                )}
                {product.featured && (
                  <span className="px-2.5 py-1 bg-[#D84B7E] text-[#FDF4F7] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs w-fit">
                    {isFashion || isAccessories ? 'Featured' : 'Hero Ritual'}
                  </span>
                )}
                {product.sale_price && (
                  <span className="px-2.5 py-1 bg-[#111111] text-[#FDF4F7] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs w-fit">
                    Offer
                  </span>
                )}
              </>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            onClick={() => toggleWishlist(product)}
            className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-300 shadow-md cursor-pointer z-10 ${
              isSaved
                ? 'bg-[#D84B7E] text-[#FDF4F7]'
                : 'bg-white/85 backdrop-blur-md text-[#111111] hover:bg-white hover:scale-110'
            }`}
            aria-label="Add to Wishlist"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#FDF4F7]' : ''}`} />
          </button>

          {/* Quick Add Button or Size Selection Pop-up */}
          {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? (
            <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
              <button
                disabled
                className="w-full py-2.5 bg-gray-500/90 text-white text-xs uppercase tracking-widest font-bold rounded-xl backdrop-blur-md shadow-lg cursor-not-allowed"
              >
                Out of Stock
              </button>
            </div>
          ) : isSelectingSize ? (
            <div
              className="absolute inset-x-0 bottom-0 bg-[#FFF8FA]/98 backdrop-blur-lg p-3.5 pt-3 rounded-b-2xl border-t-2 border-[#F1BCCE] z-20 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-serif font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D84B7E] inline-block animate-pulse" />
                  Select Size: <span className="text-[#D84B7E] font-bold">{selectedSize}</span>
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
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {availableSizes.map((sizeItem) => (
                  <button
                    key={sizeItem.label}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(sizeItem.label);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer shadow-2xs flex-1 min-w-[36px] text-center ${
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
                className="w-full py-2 bg-[#D84B7E] hover:bg-[#111111] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAdding ? 'Adding to Bag...' : `Quick Add • Size ${selectedSize}`}
              </button>
            </div>
          ) : (
            <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
              <button
                onClick={handleQuickAddClick}
                className="w-full py-2.5 bg-[#D84B7E] hover:bg-[#111111] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Quick Add
              </button>
            </div>
          )}
        </div>

        {/* 2. Info Container */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold">
                {product.category?.name || 'Skincare'}
              </span>
              {product.avg_rating && product.avg_rating > 0 && (
                <div className="flex items-center gap-1 text-xs text-[#D84B7E]">
                  <Star className="w-3.5 h-3.5 fill-[#D84B7E]" />
                  <span className="font-bold text-[#111111] text-[11px]">{product.avg_rating}</span>
                  <span className="text-gray-400 text-[10px]">({product.review_count})</span>
                </div>
              )}
            </div>

            <Link to={`/product/${product.slug}`}>
              <h3 className="font-serif text-base font-bold text-[#111111] hover:text-[#D84B7E] transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>

            <p className="text-xs text-gray-600 font-light mt-1 line-clamp-2 leading-relaxed">
              {product.short_description || product.description}
            </p>

            {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 5 && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                <span>⚡ Only {product.stock_quantity} left in stock!</span>
              </div>
            )}
          </div>

          {/* Price & Weight/Skin Type Footer */}
          <div className="mt-4 pt-3 border-t border-[#F1BCCE] flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg font-bold text-[#111111]">
                {formatPrice(product.sale_price || product.price)}
              </span>
              {product.sale_price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {product.weight && (!product.variants || product.variants.length === 0) && (
                <span className="text-[10px] bg-[#FFF0F5] text-[#D84B7E] px-2 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  {product.weight}
                </span>
              )}
              {product.skin_type && !isFashion && !isAccessories && !product.skin_type.toLowerCase().includes('size') && !product.weight && (
                <span className="text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-2 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  {product.skin_type.split(',')[0]}
                </span>
              )}
              {isFashion && (
                <span className="text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-2 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  Apparel
                </span>
              )}
              {isAccessories && (
                <span className="text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-2 py-0.5 rounded-md font-bold border border-[#F1BCCE]">
                  Fine Jewelry
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
