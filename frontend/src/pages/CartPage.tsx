import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

export const CartPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();
  const { formatPrice, currentCurrencyInfo } = useCurrency();
  const navigate = useNavigate();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotalInINR = cart ? cart.subtotal : 0;
  const discountInINR = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const shippingFeeInINR = subtotalInINR > 1500 || subtotalInINR === 0 ? 0 : 99;
  const totalAmountInINR = Math.max(0, subtotalInINR - discountInINR + shippingFeeInINR);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setIsApplyingCoupon(true);
      const res = await api.post('/coupons/apply', {
        code: couponCode,
        subtotal: subtotalInINR,
      });

      if (res.data.valid) {
        setAppliedCoupon({
          code: res.data.code,
          discount_amount: res.data.discount_amount,
        });
        showToast(res.data.message, 'success');
      } else {
        showToast(res.data.message, 'error');
      }
    } catch {
      showToast('Failed to apply coupon', 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6 bg-[#FDF4F7]">
        <div className="w-20 h-20 rounded-full bg-[#F8D7E3] mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-[#D84B7E]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#111111]">Your beauty bag is waiting.</h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Discover pure Korean-inspired skincare rituals, silken fashion, and minimalist accessories.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-md"
        >
          Explore Shop
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32 xl:pb-24 pt-6 sm:pt-8 bg-[#FDF4F7]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">
            Your Beauty Bag ({cart.item_count} items)
          </h1>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#D84B7E] bg-[#F8D7E3] px-3 py-1 rounded-full border border-[#F1BCCE] w-fit">
            Viewing in {currentCurrencyInfo.flag} {currentCurrencyInfo.code}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          
          {/* LEFT: Cart Items List */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="p-3.5 sm:p-5 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl flex flex-col min-[420px]:flex-row gap-3 sm:gap-5 shadow-xs">
                <div className="flex gap-3 min-[420px]:block">
                  <img
                    src={item.product.images?.[0]?.image_url || ''}
                    alt={item.product.name}
                    className="w-20 h-24 min-[420px]:w-24 min-[420px]:h-28 sm:w-28 sm:h-32 object-cover rounded-xl shrink-0 bg-[#FCE7F0]"
                  />
                  {/* Mobile-only header info when stacked */}
                  <div className="min-[420px]:hidden flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase tracking-widest text-[#D84B7E] font-bold truncate">
                          {item.product.category?.name}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer touch-target"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-serif text-sm font-bold text-[#111111] line-clamp-2">
                        {item.product.name}
                      </h3>
                      {item.variant && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.variant.variant_name}: {item.variant.variant_value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  {/* Regular header info for >=420px */}
                  <div className="hidden min-[420px]:block">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold">
                          {item.product.category?.name}
                        </span>
                        <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111]">
                          {item.product.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer touch-target"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.variant.variant_name}: {item.variant.variant_value}
                      </p>
                    )}
                    {item.product.stock_quantity !== undefined && item.product.stock_quantity > 0 && item.product.stock_quantity < 5 && (
                      <p className="text-xs text-amber-700 font-bold mt-1.5 flex items-center gap-1">
                        <span>⚡ Low Stock: Only {item.product.stock_quantity} left!</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 min-[420px]:pt-0 border-t min-[420px]:border-t-0 border-[#F1BCCE]/60">
                    <div className="flex items-center border border-[#F1BCCE] rounded-full bg-[#FDF4F7] px-2.5 py-1 min-h-[36px]">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-600 hover:text-black cursor-pointer touch-target"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-[#111111]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-600 hover:text-black cursor-pointer touch-target"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-serif text-base sm:text-lg font-bold text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Order Summary Card */}
          <div className="space-y-6">
            <div className="p-4 sm:p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4 sm:space-y-6">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#111111] pb-3 sm:pb-4 border-b border-[#F1BCCE]">
                Order Summary
              </h2>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold block">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Try YURAE10"
                    className="flex-1 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl px-3 py-2.5 text-xs uppercase font-bold outline-none focus:border-[#D84B7E] min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-4 py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase font-bold rounded-xl hover:bg-[#111111] transition-colors cursor-pointer touch-target min-h-[44px]"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-700 flex items-center gap-1 font-bold pt-1">
                    <Check className="w-3.5 h-3.5" /> Code "{appliedCoupon.code}" applied!
                  </p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-[#F1BCCE] text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-[#111111]">{formatPrice(subtotalInINR)}</span>
                </div>
                {discountInINR > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discountInINR)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Express Shipping</span>
                  <span>{shippingFeeInINR === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : formatPrice(shippingFeeInINR)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-serif font-bold text-[#111111] pt-3 border-t border-[#F1BCCE]">
                  <span>Total Amount</span>
                  <span>{formatPrice(totalAmountInINR)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
                className="w-full py-3.5 sm:py-4 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer touch-target min-h-[44px] active:scale-98"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
