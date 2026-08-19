import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, toggleWishlist, moveToCart } = useWishlist();
  const { formatPrice } = useCurrency();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6 bg-[#FDF4F7]">
        <div className="w-20 h-20 rounded-full bg-[#F8D7E3] mx-auto flex items-center justify-center">
          <Heart className="w-10 h-10 text-[#D84B7E]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#111111]">Save the pieces you love.</h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Keep track of your favorite skincare formulations, Mulberry silk dresses, and minimal handcrafted pearls.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-md"
        >
          Discover Products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] mb-8">
          Your Wishlist ({wishlist.length} saved)
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="relative aspect-4/5 w-full bg-[#F8D7E3] rounded-xl overflow-hidden">
                  <img
                    src={item.product.images[0]?.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleWishlist(item.product)}
                    className="absolute top-2 right-2 p-2 bg-white/85 rounded-full text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold">
                    {item.product.category?.name}
                  </span>
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="font-serif text-base font-bold text-[#111111] hover:text-[#D84B7E] line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="font-serif text-lg font-bold text-[#111111] mt-1">
                    {formatPrice(item.product.sale_price || item.product.price)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => moveToCart(item.product)}
                className="w-full py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-[#111111] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" /> Move to Bag
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
