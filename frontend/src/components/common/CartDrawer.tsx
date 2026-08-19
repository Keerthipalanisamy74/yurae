import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const { formatPrice, currentCurrencyInfo } = useCurrency();
  const navigate = useNavigate();

  const subtotalInINR = cart ? cart.subtotal : 0;
  const freeShippingThresholdInINR = 1500;
  const progress = Math.min((subtotalInINR / freeShippingThresholdInINR) * 100, 100);
  const remainingInINR = Math.max(freeShippingThresholdInINR - subtotalInINR, 0);

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#FDF4F7] shadow-2xl flex flex-col border-l border-[#F1BCCE]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#F1BCCE] flex items-center justify-between bg-[#FFF8FA]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#D84B7E]" />
                <h2 className="font-serif text-xl tracking-wide text-[#111111] font-bold">Your Beauty Bag</h2>
                <span className="text-xs bg-[#F8D7E3] text-[#D84B7E] px-2.5 py-0.5 rounded-full font-bold">
                  {cart?.item_count || 0}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-[#F8D7E3] rounded-full transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-[#111111]" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            <div className="bg-[#FCE7F0] px-6 py-3 border-b border-[#F1BCCE]">
              {remainingInINR > 0 ? (
                <p className="text-xs text-[#111111]/80 text-center mb-1.5 font-medium">
                  Add <span className="font-bold text-[#111111]">{formatPrice(remainingInINR)}</span> more for <span className="text-[#D84B7E] font-bold">Free Shipping</span>
                </p>
              ) : (
                <p className="text-xs text-emerald-700 text-center mb-1.5 font-bold">
                  🎉 You qualify for Free Shipping!
                </p>
              )}
              <div className="w-full bg-[#F1BCCE] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#D84B7E] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!cart || cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="w-16 h-16 rounded-full bg-[#F8D7E3] flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-[#D84B7E]" />
                  </div>
                  <h3 className="font-serif text-lg text-[#111111] font-bold">Your beauty bag is waiting.</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Explore our botanical Korean skincare, silk apparel, and minimal handcrafted accessories.
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-4 px-6 py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-[#FFF8FA] border border-[#F1BCCE] rounded-xl shadow-xs">
                    <img
                      src={item.product.images[0]?.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80'}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-serif text-sm font-medium text-[#111111] line-clamp-2">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {item.variant && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.variant.variant_name}: {item.variant.variant_value}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-[#F1BCCE] rounded-full bg-[#FDF4F7] px-2 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-600 hover:text-black cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-semibold text-[#111111]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-gray-600 hover:text-black cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-semibold text-sm text-[#111111]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cart && cart.items.length > 0 && (
              <div className="p-6 border-t border-[#F1BCCE] bg-[#FFF8FA] space-y-3">
                <div className="p-2.5 bg-[#FCE7F0] border border-[#F1BCCE] rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#D84B7E] font-bold flex items-center gap-1.5">
                    ✨ Have a coupon?
                  </span>
                  <span className="text-[11px] text-gray-600">Apply on Checkout</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-gray-600">Subtotal ({currentCurrencyInfo.code})</span>
                  <span className="font-serif text-lg font-bold text-[#111111]">
                    {formatPrice(subtotalInINR)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Taxes, discounts, and regional shipping calculated at checkout.</p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="w-full text-center py-3 border border-[#111111] text-[#111111] text-xs tracking-widest uppercase font-bold rounded-full hover:bg-[#F8D7E3] transition-colors"
                  >
                    View Bag
                  </Link>
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full py-3 bg-[#D84B7E] text-[#FDF4F7] text-xs tracking-widest uppercase font-bold rounded-full hover:bg-[#111111] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    Checkout
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
