import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2, Lock, CreditCard, Smartphone, Building2, Wallet, ArrowRight,
  Globe, Tag, Sparkles, X, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order, Coupon, CouponApplyResult } from '../types';

export const CheckoutPage: React.FC = () => {
  const { cart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { currency, convertPrice, formatPrice, formatRawPrice, currentCurrencyInfo } = useCurrency();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<number>(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Address Form State
  const [name, setName] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState(currency === 'INR' ? 'India' : (currentCurrencyInfo.country || 'United States'));

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<string>(
    currency === 'INR' ? 'Razorpay' : 'Stripe'
  );

  // Shipping Calculation State
  const [shippingEstimate, setShippingEstimate] = useState<{
    shipping_fee: number;
    is_free: boolean;
    estimated_delivery: string;
  }>({
    shipping_fee: currency === 'INR' ? 99 : 15,
    is_free: false,
    estimated_delivery: '3-6 Business Days'
  });

  // Coupon / Promo Code State
  const initialCouponFromState = (location.state as any)?.couponCode || '';
  const [couponInput, setCouponInput] = useState<string>(initialCouponFromState);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResult | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  const subtotalInINR = cart ? cart.subtotal : 0;
  const discountInINR = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const shippingInTargetCurrency = shippingEstimate.is_free ? 0 : shippingEstimate.shipping_fee;

  // Currency converted values
  const convertedSubtotal = convertPrice(subtotalInINR, currency);
  const convertedDiscount = convertPrice(discountInINR, currency);
  const totalPayable = Math.max(0, convertedSubtotal - convertedDiscount + shippingInTargetCurrency);

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to complete your order', 'info');
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate, showToast]);

  // Load active public coupons
  useEffect(() => {
    api.get('/coupons')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAvailableCoupons(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch active coupons:', err);
      });
  }, []);

  // Auto-apply initial coupon code if passed from bag
  useEffect(() => {
    if (initialCouponFromState && subtotalInINR > 0 && !appliedCoupon) {
      handleApplyCoupon(initialCouponFromState);
    }
  }, [initialCouponFromState, subtotalInINR]);

  // Fetch Shipping estimate whenever country or currency changes
  useEffect(() => {
    if (!country) return;

    api.post('/currencies/shipping/estimate', {
      country: country,
      subtotal: Math.max(0, subtotalInINR - discountInINR),
      currency: currency,
    })
      .then((res) => {
        setShippingEstimate({
          shipping_fee: res.data.shipping_fee,
          is_free: res.data.is_free,
          estimated_delivery: res.data.estimated_delivery
        });
      })
      .catch((err) => {
        console.warn('Shipping estimate fallback:', err);
      });
  }, [country, currency, subtotalInINR, discountInINR]);

  const handleApplyCoupon = async (codeToUse?: string) => {
    const targetCode = (codeToUse || couponInput).trim().toUpperCase();
    if (!targetCode) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await api.post('/coupons/apply', {
        code: targetCode,
        subtotal: subtotalInINR,
      });

      if (res.data.valid) {
        setAppliedCoupon(res.data);
        setCouponInput(res.data.code);
        showToast(res.data.message || `Coupon "${res.data.code}" applied!`, 'success');
      } else {
        showToast(res.data.message || 'Invalid or expired coupon code.', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to apply coupon';
      showToast(msg, 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    showToast('Coupon removed', 'info');
  };

  const handlePlaceOrder = async () => {
    if (!addressLine1 || !city || !state || !postalCode || !name || !phone) {
      showToast('Please fill in all shipping address fields', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.post('/orders', {
        new_address: {
          name,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          postal_code: postalCode,
          country,
          is_default: true,
        },
        coupon_code: appliedCoupon ? appliedCoupon.code : (initialCouponFromState || undefined),
        currency: currency,
        payment_method: paymentMethod,
      });

      setCreatedOrder(res.data);
      setStep(5); // Confirmation step
      showToast('Order placed successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to place order. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const countriesList = [
    { name: 'India', flag: '🇮🇳' },
    { name: 'United States', flag: '🇺🇸' },
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'France', flag: '🇫🇷' },
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'Australia', flag: '🇦🇺' },
    { name: 'Singapore', flag: '🇸🇬' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'United Arab Emirates', flag: '🇦🇪' },
    { name: 'Other Countries', flag: '🌐' },
  ];

  const paymentOptions = currency === 'INR'
    ? [
        { id: 'Razorpay', label: 'Razorpay / Cards', icon: CreditCard, desc: 'Instant credit/debit card & netbanking' },
        { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', icon: Smartphone, desc: 'Instant UPI ID or scan QR code' },
        { id: 'NetBanking', label: 'Net Banking', icon: Building2, desc: 'All major Indian banks' },
        { id: 'COD', label: 'Cash On Delivery', icon: Wallet, desc: 'Pay cash upon doorstep arrival' },
      ]
    : [
        { id: 'Stripe', label: 'Stripe (Credit / Debit Card)', icon: CreditCard, desc: 'Visa, Mastercard, American Express' },
        { id: 'PayPal', label: 'PayPal Global', icon: Globe, desc: 'Pay with PayPal balance or connected cards' },
        { id: 'Razorpay_International', label: 'International Card Portal', icon: CreditCard, desc: 'Global multi-currency checkout' },
      ];

  if (step === 5 && createdOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-8 bg-[#FDF4F7]">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">Order Confirmed</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
            Thank You For Your Order!
          </h1>
          <p className="text-sm text-gray-600">
            Order Reference Number: <span className="font-mono font-bold text-[#111111]">{createdOrder.order_number}</span>
          </p>
        </div>

        <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl text-left space-y-4 shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-[#F1BCCE]">
            <h3 className="font-serif text-lg font-bold text-[#111111]">Order Summary</h3>
            <span className="text-xs font-bold text-[#D84B7E] bg-[#F8D7E3] px-2.5 py-0.5 rounded-full">
              {createdOrder.currency}
            </span>
          </div>

          <div className="divide-y divide-[#F1BCCE]">
            {createdOrder.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between text-sm">
                <div>
                  <span className="font-bold text-[#111111]">{item.product_name}</span>
                  {item.variant_info && <span className="text-xs text-gray-500 block">{item.variant_info}</span>}
                  <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-[#111111]">
                  {formatRawPrice(item.price * item.quantity, createdOrder.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#F1BCCE] space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-[#111111]">{formatRawPrice(createdOrder.subtotal, createdOrder.currency)}</span>
            </div>

            {createdOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Coupon Savings</span>
                <span>-{formatRawPrice(createdOrder.discount, createdOrder.currency)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee</span>
              <span className="font-bold text-[#111111]">
                {createdOrder.shipping_fee === 0 ? <span className="text-emerald-700">FREE</span> : formatRawPrice(createdOrder.shipping_fee, createdOrder.currency)}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Payment Provider</span>
              <span className="font-bold text-[#111111]">{createdOrder.payments?.[0]?.payment_method || paymentMethod}</span>
            </div>

            <div className="flex justify-between text-gray-600 pt-2 border-t border-[#F1BCCE]">
              <span className="font-serif text-base font-bold text-[#111111]">Total Paid</span>
              <span className="font-serif text-xl font-bold text-[#D84B7E]">
                {formatRawPrice(createdOrder.total_amount, createdOrder.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/account')}
            className="px-8 py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-md"
          >
            Track In Account
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3.5 bg-[#FFF8FA] border border-[#111111] text-[#111111] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#F8D7E3] transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Step Indicator Bar */}
        <div className="max-w-3xl mx-auto mb-12 flex justify-between items-center text-xs uppercase tracking-widest font-bold text-gray-400">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#D84B7E]' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-[#D84B7E] text-white border-[#D84B7E]' : 'border-gray-300'}`}>1</span>
            Customer
          </div>
          <span className="h-0.5 flex-1 bg-[#F1BCCE] mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#D84B7E]' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-[#D84B7E] text-white border-[#D84B7E]' : 'border-gray-300'}`}>2</span>
            Shipping
          </div>
          <span className="h-0.5 flex-1 bg-[#F1BCCE] mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#D84B7E]' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-[#D84B7E] text-white border-[#D84B7E]' : 'border-gray-300'}`}>3</span>
            Payment
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: Checkout Form Steps */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Step 1 & 2: Shipping Address Form */}
            <div className="p-6 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#111111]">Shipping Destination</h2>
                <span className="text-xs text-[#D84B7E] font-bold bg-[#F8D7E3] px-3 py-1 rounded-full border border-[#F1BCCE]">
                  Currency: {currentCurrencyInfo.flag} {currency}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Country / Region</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] cursor-pointer"
                  >
                    {countriesList.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Street Address Line 1</label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House number, flat, building, street..."
                    required
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Landmark, apartment suite..."
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Estimated Delivery</label>
                  <div className="w-full bg-[#FCE7F0] border border-[#F1BCCE] rounded-xl p-3 text-xs font-bold text-[#D84B7E]">
                    {shippingEstimate.estimated_delivery}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Payment Architecture Selection */}
            <div className="p-6 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#111111]">Payment Option</h2>
                <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentOptions.map((pm) => {
                  const Icon = pm.icon;
                  const selected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        selected
                          ? 'border-[#D84B7E] bg-[#F8D7E3]/60 shadow-xs'
                          : 'border-[#F1BCCE] bg-[#FDF4F7] hover:border-gray-400'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${selected ? 'text-[#D84B7E]' : 'text-gray-400'}`} />
                      <div>
                        <span className="text-sm font-bold text-[#111111] block">{pm.label}</span>
                        <span className="text-xs text-gray-600 font-normal">{pm.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-4 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? 'Processing Order...' : `Complete Order — ${formatRawPrice(totalPayable, currency)}`}
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          {/* RIGHT: Order Summary & Coupon Card */}
          <div className="space-y-6">
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-5 shadow-xs sticky top-24">
              <h3 className="font-serif text-lg font-bold text-[#111111] pb-3 border-b border-[#F1BCCE]">
                Order Summary ({cart?.item_count} items)
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs">
                    <img src={item.product.images[0]?.image_url} alt="" className="w-12 h-14 object-cover rounded-md border border-[#F1BCCE]" />
                    <div className="flex-1">
                      <p className="font-bold text-[#111111] line-clamp-1">{item.product.name}</p>
                      {item.variant && <p className="text-[11px] text-gray-500">{item.variant.variant_name}: {item.variant.variant_value}</p>}
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* COUPON & PROMO CODE SECTION */}
              <div className="pt-4 border-t border-[#F1BCCE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#D84B7E] font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon / Promo Code
                  </span>
                  {availableCoupons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                      className="text-[11px] text-[#111111] hover:text-[#D84B7E] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#D84B7E]" />
                      {showAvailableCoupons ? 'Hide Offers' : `Offers (${availableCoupons.length})`}
                      {showAvailableCoupons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* If Coupon Applied */}
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-emerald-900">{appliedCoupon.code}</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Applied</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          You save {formatPrice(discountInINR)} ({appliedCoupon.discount_type === 'PERCENTAGE' ? `${appliedCoupon.discount_value}% off` : 'Flat Discount'})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1.5 text-emerald-800 hover:text-red-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Coupon Input Form */
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="Enter code (e.g. YURAE10)"
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-[#D84B7E] placeholder:font-sans placeholder:normal-case placeholder:font-normal"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#111111] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                    >
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}

                {/* Available Offers Quick Picker */}
                {showAvailableCoupons && availableCoupons.length > 0 && (
                  <div className="p-3 bg-[#FCE7F0]/80 border border-[#F1BCCE] rounded-xl space-y-2.5 max-h-48 overflow-y-auto">
                    <span className="text-[10px] uppercase tracking-widest text-[#111111] font-bold block">
                      Available Store Offers:
                    </span>
                    {availableCoupons.map((c) => {
                      const isEligible = subtotalInINR >= c.minimum_order_amount;
                      const isCurrentlyApplied = appliedCoupon?.code === c.code;
                      return (
                        <div
                          key={c.id}
                          className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                            isCurrentlyApplied
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-white border-[#F1BCCE]'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[#D84B7E] bg-[#F8D7E3] px-2 py-0.5 rounded border border-[#F1BCCE]">
                                {c.code}
                              </span>
                              <span className="text-xs font-bold text-[#111111]">
                                {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                              {c.minimum_order_amount > 0 ? `Min. spend ${formatPrice(c.minimum_order_amount)}` : 'No minimum spend'}
                            </p>
                          </div>

                          {isCurrentlyApplied ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              disabled={!isEligible}
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                                isEligible
                                  ? 'bg-[#111111] text-white hover:bg-[#D84B7E]'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {isEligible ? 'Apply' : `Add ${formatPrice(c.minimum_order_amount - subtotalInINR)}`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-[#F1BCCE] space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-[#111111]">{formatPrice(subtotalInINR)}</span>
                </div>

                {discountInINR > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Discount ({appliedCoupon?.code})
                    </span>
                    <span>-{formatPrice(discountInINR)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Estimated Shipping ({country})</span>
                  <span className="font-bold text-emerald-700">
                    {shippingEstimate.is_free ? 'FREE' : formatRawPrice(shippingEstimate.shipping_fee, currency)}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-serif font-bold text-[#111111] pt-3 border-t border-[#F1BCCE]">
                  <span>Total Payable</span>
                  <span className="text-[#D84B7E] font-bold text-lg">
                    {formatRawPrice(totalPayable, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
