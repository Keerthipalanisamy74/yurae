import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Lock, CreditCard, Smartphone, Building2, Wallet, ArrowRight, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order } from '../types';

export const CheckoutPage: React.FC = () => {
  const { cart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { currency, formatPrice, formatRawPrice, currentCurrencyInfo } = useCurrency();
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

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to complete your order', 'info');
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate, showToast]);

  const couponCode = (location.state as any)?.couponCode || '';
  const subtotalInINR = cart ? cart.subtotal : 0;

  // Fetch Shipping estimate whenever country or currency changes
  useEffect(() => {
    if (!country) return;

    api.post('/currencies/shipping/estimate', {
      country: country,
      subtotal: subtotalInINR,
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
  }, [country, currency, subtotalInINR]);

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
        coupon_code: couponCode,
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
              <span>Payment Provider</span>
              <span className="font-bold text-[#111111]">{createdOrder.payments?.[0]?.payment_method || 'Verified Checkout'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Paid</span>
              <span className="font-serif text-lg font-bold text-[#D84B7E]">
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
              {isProcessing ? 'Processing Order...' : `Complete Order — ${formatPrice(subtotalInINR)}`}
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          {/* RIGHT: Order Summary */}
          <div>
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-4 shadow-xs sticky top-24">
              <h3 className="font-serif text-lg font-bold text-[#111111] pb-3 border-b border-[#F1BCCE]">
                Your Order Items ({cart?.item_count})
              </h3>

              <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs">
                    <img src={item.product.images[0]?.image_url} alt="" className="w-12 h-14 object-cover rounded-md border border-[#F1BCCE]" />
                    <div className="flex-1">
                      <p className="font-bold text-[#111111] line-clamp-1">{item.product.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#111111]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#F1BCCE] space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#111111]">{formatPrice(subtotalInINR)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping ({country})</span>
                  <span className="font-bold text-emerald-700">
                    {shippingEstimate.is_free ? 'FREE' : formatRawPrice(shippingEstimate.shipping_fee, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-serif font-bold text-[#111111] pt-2 border-t border-[#F1BCCE]">
                  <span>Total Payable</span>
                  <span className="text-[#D84B7E] font-bold text-base">
                    {formatPrice(subtotalInINR)}
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
