import { Link, Navigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

export const WishlistPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { wishlist, toggleWishlist, moveToCart } = useWishlist();
  const { formatPrice } = useCurrency();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6 bg-[#F8B4CB] pb-32 xl:pb-20">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F8D7E3] mx-auto flex items-center justify-center">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#D84B7E]" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">Save the pieces you love.</h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Keep track of your favorite skincare formulations, Mulberry silk dresses, and minimal handcrafted pearls.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-[#D81B60] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-colors cursor-pointer shadow-md touch-target min-h-[44px]"
        >
          Discover Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32 xl:pb-24 pt-6 sm:pt-8 bg-[#F8B4CB]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D84B7E] font-bold block mb-1">
            Saved Collection
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">
            Your Wishlist ({wishlist.length} saved)
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="p-3 sm:p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl flex flex-col justify-between space-y-3 sm:space-y-4 shadow-xs">
              <div className="space-y-2.5">
                <div className="relative aspect-4/5 w-full bg-[#F8D7E3] rounded-xl overflow-hidden">
                  <img
                    src={item.product.images[0]?.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    onClick={() => toggleWishlist(item.product)}
                    className="absolute top-2 right-2 p-2 bg-[#FCE7F0] backdrop-blur-xs rounded-full text-gray-500 hover:text-red-500 transition-colors cursor-pointer touch-target min-w-[36px] min-h-[36px] flex items-center justify-center border border-[#F1BCCE]"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold block truncate">
                    {item.product.category?.name}
                  </span>
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] hover:text-[#D84B7E] line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="font-serif text-base sm:text-lg font-bold text-[#111111] mt-0.5">
                    {formatPrice(item.product.sale_price || item.product.price)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => moveToCart(item.product)}
                className="w-full py-2.5 bg-[#D81B60] text-[#FDF4F7] text-[11px] sm:text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-[#4A0E2E] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs touch-target min-h-[40px] active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Move to Bag
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

