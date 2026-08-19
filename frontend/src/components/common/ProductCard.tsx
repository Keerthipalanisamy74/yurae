import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Plus, Trash2, Edit } from 'lucide-react';
import { Product, Category } from '../../types';
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

  // Sync if initialProduct prop updates
  React.useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  const isSaved = isInWishlist(product.id);
  const primaryImage = product.images[0]?.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80';
  const secondaryImage = product.images[1]?.image_url || primaryImage;

  const categorySlug = product.category?.slug?.toLowerCase() || '';
  const categoryName = product.category?.name?.toLowerCase() || '';
  const isFashion = categorySlug === 'fashion' || categoryName.includes('fashion') || categoryName.includes('dress') || categoryName.includes('apparel') || categoryName.includes('kurti') || categoryName.includes('saree') || categoryName.includes('clothing');
  const isAccessories = categorySlug === 'accessories' || categoryName.includes('accessories') || categoryName.includes('jewelry') || categoryName.includes('bag') || categoryName.includes('pendant') || categoryName.includes('ring') || categoryName.includes('earring');

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

  return (
    <>
      <div className="group relative flex flex-col bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl overflow-hidden luxury-card shadow-xs">
        {/* Image Container */}
        <div className="relative aspect-4/5 w-full bg-[#F8D7E3] overflow-hidden">
          <Link to={`/product/${product.slug}`} className="block w-full h-full">
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
          </Link>

          {/* Featured / Sale Badge & Admin Controls */}
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
            {product.featured && (
              <span className="px-2.5 py-1 bg-[#D84B7E] text-[#FDF4F7] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs w-fit">
                {isFashion || isAccessories ? 'Featured' : 'Hero Ritual'}
              </span>
            )}
          {product.sale_price && (
            <span className="px-2.5 py-1 bg-[#111111] text-[#FDF4F7] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xs">
              Offer
            </span>
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

        {/* Quick Add Button on Hover */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={() => addToCart(product)}
            className="w-full py-2.5 bg-[#D84B7E] hover:bg-[#111111] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Info Container */}
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
        </div>

        {/* Price & Skin Type Footer */}
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

          {product.skin_type && !isFashion && !isAccessories && (
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
