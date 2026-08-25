import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();
  const { formatPrice, currentCurrencyInfo } = useCurrency();
  const navigate = useNavigate();

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
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
            Your Beauty Bag ({cart.item_count} items)
          </h1>
          <span className="text-xs uppercase tracking-wider font-bold text-[#D84B7E] bg-[#F8D7E3] px-3 py-1 rounded-full border border-[#F1BCCE]">
            Viewing in {currentCurrencyInfo.flag} {currentCurrencyInfo.code}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl flex gap-4 sm:gap-6 shadow-xs">
                <img
                  src={item.product.images?.[0]?.image_url || ''}
                  alt={item.product.name}
                  className="w-24 h-28 sm:w-28 sm:h-32 object-cover rounded-xl shrink-0 bg-[#FCE7F0]"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold">
                          {item.product.category?.name}
                        </span>
                        <h3 className="font-serif text-base font-bold text-[#111111]">
                          {item.product.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
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
                        <span>⚡ Low Stock Alert: Only {item.product.stock_quantity} left in stock!</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-[#F1BCCE] rounded-full bg-[#FDF4F7] px-3 py-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-600 hover:text-black cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-[#111111]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-600 hover:text-black cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-serif text-lg font-bold text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Order Summary Card */}
          <div className="space-y-6">
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#111111] pb-4 border-b border-[#F1BCCE]">
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
                    placeholder="Try YURAE10 or WELCOME100"
                    className="flex-1 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl px-3 py-2 text-xs uppercase font-bold outline-none focus:border-[#D84B7E]"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-4 py-2 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase font-bold rounded-xl hover:bg-[#111111] transition-colors cursor-pointer"
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
              <div className="space-y-3 pt-4 border-t border-[#F1BCCE] text-sm">
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
                <div className="flex justify-between text-base font-serif font-bold text-[#111111] pt-3 border-t border-[#F1BCCE]">
                  <span>Total Amount</span>
                  <span>{formatPrice(totalAmountInINR)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
                className="w-full py-4 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
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
