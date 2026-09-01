import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  CheckCircle2, Lock, CreditCard, Smartphone, Building2, Wallet, ArrowRight,
  Globe, Tag, Sparkles, X, ChevronDown, ChevronUp, Check, MessageSquare, Send, Heart,
  Truck, ShieldCheck, AlertTriangle, Loader2, Navigation, FileText, Home, Users, MapPin, Plus, Edit
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Order, Coupon, CouponApplyResult, ServiceabilityResult, Address } from '../types';
import { InvoiceModal } from '../components/common/InvoiceModal';

export const CheckoutPage: React.FC = () => {
  const { cart, fetchCart } = useCart();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { currency, convertPrice, formatPrice, formatRawPrice, currentCurrencyInfo } = useCurrency();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const [step, setStep] = useState<number>(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Saved Addresses for Multi-Address 1-Click Selection
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isSavingAddressInline, setIsSavingAddressInline] = useState(false);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);
  const [addressType, setAddressType] = useState<string>('Home');

  // Address Form State
  const [name, setName] = useState(user ? `${user.first_name} ${user.last_name}` : 'Elena Rao');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'elena.rao@yuraebeauty.com');
  const [buildingOrFlat, setBuildingOrFlat] = useState('Flat 4B, Lotus Luxury Residency');
  const [addressLine1, setAddressLine1] = useState('MG Road, Prestige Tech Park Area');
  const [landmark, setLandmark] = useState('Opposite Botanical Garden Gate 2');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560001');
  const [country, setCountry] = useState(currency === 'INR' ? 'India' : (currentCurrencyInfo.country || 'United States'));

  // Live Pincode Serviceability State (India)
  const [isCheckingServiceability, setIsCheckingServiceability] = useState<boolean>(false);
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>({
    pincode: '560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    is_serviceable: true,
    delivery_status_message: '✓ Delivery Available (1-2 Days via Blue Dart Express Air)',
    estimated_delivery: '1-2 Days (Local Atelier)',
    shipping_fee: 0,
    is_free: true,
    free_shipping_threshold: 1500,
    recommended_courier: 'Blue Dart Express Air',
    available_couriers: []
  });

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<string>('Razorpay');

  // Shipping Method Tier State (Standard vs Express)
  const [selectedShippingTier, setSelectedShippingTier] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');

  // Shipping Calculation State
  const [shippingEstimate, setShippingEstimate] = useState<{
    shipping_fee: number;
    is_free: boolean;
    estimated_delivery: string;
  }>({
    shipping_fee: currency === 'INR' ? 99 : 15,
    is_free: false,
    estimated_delivery: '2-4 Business Days'
  });

  // Coupon / Promo Code State
  const initialCouponFromState = (location.state as any)?.couponCode || '';
  const [couponInput, setCouponInput] = useState<string>(initialCouponFromState);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResult | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  // Online Payment Form States
  const [upiId, setUpiId] = useState('elena.rao@okhdfcbank');
  const [showQrCode, setShowQrCode] = useState(false);
  const [cardNumber, setCardNumber] = useState('4532 8900 1234 5678');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('892');
  const [cardName, setCardName] = useState(user ? `${user.first_name} ${user.last_name}` : 'Elena Rao');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Optional Post-Order Feedback & Query State
  const [feedbackCategory, setFeedbackCategory] = useState<string>('Delivery Instructions');
  const [feedbackRating, setFeedbackRating] = useState<string>('😍 Exceptional');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const subtotalInINR = cart ? cart.subtotal : 0;
  const discountInINR = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const shippingInTargetCurrency = shippingEstimate.is_free ? 0 : shippingEstimate.shipping_fee;

  const handlePostOrderFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      showToast('Please enter your note or query before submitting.', 'info');
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      await api.post('/contact', {
        name: name || (user ? `${user.first_name} ${user.last_name}` : 'Valued Client'),
        email: user?.email || 'client@yuraebeauty.com',
        phone: phone || user?.phone || undefined,
        source: 'ORDER_QUERY',
        order_number: createdOrder?.order_number,
        rating: feedbackRating,
        subject: `Order Query [${feedbackCategory}]`,
        message: feedbackMessage.trim(),
      });
      setFeedbackSubmitted(true);
      showToast('Thank you! Your note has been forwarded to our client concierge.', 'success');
    } catch {
      setFeedbackSubmitted(true);
      showToast('Thank you! Your feedback has been noted.', 'success');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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

  const applyAddressToForm = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setEditingAddressId(null);
    setName(addr.name || '');
    setPhone(addr.phone || '');
    setBuildingOrFlat(addr.building_or_flat || '');
    setAddressLine1(addr.address_line1 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setState(addr.state || 'Karnataka');
    setPostalCode(addr.postal_code || '');
    setCountry(addr.country || 'India');
    setAddressType(addr.address_type || 'Home');
    setIsAddingNewAddress(false);
  };

  const handleStartEditSavedAddress = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setSelectedAddressId(addr.id);
    setName(addr.name || '');
    setPhone(addr.phone || '');
    setBuildingOrFlat(addr.building_or_flat || '');
    setAddressLine1(addr.address_line1 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setState(addr.state || 'Karnataka');
    setPostalCode(addr.postal_code || '');
    setCountry(addr.country || 'India');
    setAddressType(addr.address_type || 'Home');
    setIsAddingNewAddress(true);
  };

  const handleFinishAddressDone = async () => {
    const finalName = name.trim() || (user ? `${user.first_name} ${user.last_name}` : 'Customer');
    const finalPhone = phone.trim() || user?.phone || '+91 98765 43210';
    const finalAddress1 = addressLine1.trim();
    const finalCity = city.trim();
    const finalState = state.trim() || 'Karnataka';
    const finalPostal = postalCode.trim();

    if (!finalName || !finalPhone || !finalAddress1 || !finalCity || !finalPostal) {
      showToast('Please fill in all required address fields (Name, Phone, Street, City, PIN Code)', 'error');
      return;
    }

    const payload = {
      address_type: addressType,
      name: finalName,
      phone: finalPhone,
      building_or_flat: buildingOrFlat.trim() || undefined,
      address_line1: finalAddress1,
      address_line2: landmark.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: finalCity,
      state: finalState,
      postal_code: finalPostal,
      country: country || 'India',
      is_default: false,
    };

    try {
      setIsSavingAddressInline(true);
      if (editingAddressId && isAuthenticated) {
        const res = await api.put(`/auth/addresses/${editingAddressId}`, payload);
        setSavedAddresses((prev) =>
          prev.map((a) => (a.id === editingAddressId ? res.data : a))
        );
        setSelectedAddressId(editingAddressId);
        showToast('✓ Address updated & selected for delivery!', 'success');
      } else if (saveAddressToAccount && isAuthenticated) {
        const res = await api.post('/auth/addresses', payload);
        setSavedAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data.id);
        showToast('✓ New address saved & selected for delivery!', 'success');
      } else {
        showToast('✓ Delivery coordinates saved for this order!', 'success');
      }
      setEditingAddressId(null);
      setIsAddingNewAddress(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save address';
      showToast(msg, 'error');
    } finally {
      setIsSavingAddressInline(false);
    }
  };

  const handleCancelAddressEdit = () => {
    setEditingAddressId(null);
    if (savedAddresses.length > 0) {
      const target = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
      applyAddressToForm(target);
    } else {
      setIsAddingNewAddress(false);
    }
  };

  // Fetch saved customer addresses
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/addresses')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSavedAddresses(res.data);
            const defaultAddr = res.data.find((a: Address) => a.is_default) || res.data[0];
            if (defaultAddr) {
              applyAddressToForm(defaultAddr);
            }
          } else {
            setIsAddingNewAddress(true);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch saved addresses:', err);
          setIsAddingNewAddress(true);
        });
    }
  }, [isAuthenticated]);

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

  // Auto-switch payment methods when country changes (strictly disable COD for non-India)
  useEffect(() => {
    const isInd = country.trim().toLowerCase() === 'india';
    if (!isInd && paymentMethod === 'COD') {
      setPaymentMethod('Stripe');
    } else if (isInd && !['Razorpay', 'UPI', 'NetBanking', 'COD'].includes(paymentMethod)) {
      setPaymentMethod('Razorpay');
    }
  }, [country]);

  // Live Multi-Region Serviceability & Courier Rate Calculation (India & International)
  useEffect(() => {
    if (!country) return;

    const isIndia = country.toLowerCase() === 'india';
    const cleanPin = postalCode.replace(/\D/g, '');

    setIsCheckingServiceability(true);
    const isCod = isIndia && paymentMethod.toUpperCase() === 'COD';
    
    const timer = setTimeout(() => {
      api.post('/shipping/serviceability', {
        pincode: cleanPin || undefined,
        postal_code: postalCode || undefined,
        country: country,
        is_cod: isCod,
        service_tier: selectedShippingTier,
        subtotal: Math.max(0, subtotalInINR - discountInINR),
        currency: currency,
      })
        .then((res) => {
          setServiceability(res.data);
          setShippingEstimate({
            shipping_fee: res.data.shipping_fee,
            is_free: res.data.is_free,
            estimated_delivery: res.data.estimated_delivery
          });
          if (res.data.city && !city) setCity(res.data.city);
          if (res.data.state && !state) setState(res.data.state);
        })
        .catch((err) => {
          console.warn('Serviceability check failed:', err);
        })
        .finally(() => {
          setIsCheckingServiceability(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [country, postalCode, currency, subtotalInINR, discountInINR, paymentMethod, selectedShippingTier]);

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

  const handleAutoFillAddress = () => {
    setName(user ? `${user.first_name} ${user.last_name}` : 'Elena Rao');
    setPhone(user?.phone || '+91 98765 43210');
    setEmail(user?.email || 'elena.rao@yuraebeauty.com');
    setBuildingOrFlat('Flat 4B, Lotus Luxury Residency');
    setAddressLine1('MG Road, Prestige Tech Park Area');
    setLandmark('Opposite Botanical Garden Gate 2');
    setCity('Bengaluru');
    setState('Karnataka');
    setPostalCode('560001');
    showToast('Demo shipping address auto-filled', 'info');
  };

  const handleAutoFillCard = () => {
    setCardNumber('4532 8900 1234 5678');
    setCardExpiry('12/28');
    setCardCvv('892');
    setCardName(user ? `${user.first_name} ${user.last_name}` : 'Elena Rao');
    showToast('Demo Card details auto-filled', 'info');
  };

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    const finalName = name.trim() || (user ? `${user.first_name} ${user.last_name}` : 'Customer');
    const finalPhone = phone.trim() || user?.phone || '+91 98765 43210';
    const finalBuilding = buildingOrFlat.trim();
    const finalAddress1 = addressLine1.trim() || 'MG Road';
    const finalLandmark = landmark.trim();
    const finalCity = city.trim() || 'Bengaluru';
    const finalState = state.trim() || 'Karnataka';
    const finalPostal = postalCode.trim() || '560001';

    // Strict validation for Indian addresses
    const isIndia = country.toLowerCase() === 'india';
    if (isIndia) {
      const pinClean = finalPostal.replace(/\D/g, '');
      if (pinClean.length !== 6) {
        showToast('Please enter a valid 6-digit Indian PIN code', 'error');
        return;
      }
      const phoneDigits = finalPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
      }
      if (serviceability && !serviceability.is_serviceable) {
        showToast('Delivery is currently unavailable to this PIN code. Please check your delivery address.', 'error');
        return;
      }
    }

    const isCod = paymentMethod.toUpperCase() === 'COD';

    if (isCod && !isIndia) {
      showToast('Cash on Delivery (COD) is available only for Indian domestic deliveries. Please select an online payment option.', 'error');
      return;
    }

    const submitOrderToBackend = async (paymentPayload: {
      is_paid: boolean;
      payment_id?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      stripe_payment_intent_id?: string;
    }) => {
      const res = await api.post('/orders', {
        new_address: {
          name: finalName,
          phone: finalPhone,
          building_or_flat: finalBuilding || undefined,
          address_line1: finalAddress1,
          address_line2: finalLandmark || undefined,
          landmark: finalLandmark || undefined,
          city: finalCity,
          state: finalState,
          postal_code: finalPostal,
          country,
          is_default: true,
        },
        coupon_code: appliedCoupon ? appliedCoupon.code : (initialCouponFromState || undefined),
        currency: currency,
        payment_method: paymentMethod,
        ...paymentPayload,
      });

      setCreatedOrder(res.data);

      if (isAddingNewAddress && saveAddressToAccount && isAuthenticated) {
        try {
          await api.post('/auth/addresses', {
            address_type: addressType,
            name: finalName,
            phone: finalPhone,
            building_or_flat: finalBuilding || undefined,
            address_line1: finalAddress1,
            address_line2: finalLandmark || undefined,
            landmark: finalLandmark || undefined,
            city: finalCity,
            state: finalState,
            postal_code: finalPostal,
            country,
            is_default: false,
          });
        } catch {
          // non-blocking
        }
      }

      setStep(5); // Confirmation step
      await fetchCart();

      if (isCod) {
        showToast('Order placed! Amount due upon doorstep delivery.', 'success');
      } else {
        showToast(`Payment of ${formatRawPrice(totalPayable, currency)} successful! Order confirmed as Paid.`, 'success');
      }
    };

    try {
      setIsProcessing(true);

      if (!isCod) {
        // Step A: Initiate Payment on Server
        const initRes = await api.post('/orders/initiate-payment', {
          payment_method: paymentMethod,
          currency: currency,
          country: country,
          coupon_code: appliedCoupon ? appliedCoupon.code : (initialCouponFromState || undefined),
        });

        const initData = initRes.data;

        // Step B: If live Razorpay is available, launch live Razorpay Modal
        if (paymentMethod === 'Razorpay' && !initData.is_sandbox && initData.key_id) {
          const scriptLoaded = await loadRazorpaySDK();
          if (scriptLoaded && (window as any).Razorpay) {
            const options = {
              key: initData.key_id,
              amount: Math.round(initData.amount * 100),
              currency: initData.currency,
              name: 'Yurae Beauty Atelier',
              description: `Order #${initData.order_number}`,
              order_id: initData.gateway_order_id,
              prefill: {
                name: finalName,
                email: email || user?.email,
                contact: finalPhone,
              },
              theme: { color: '#D84B7E' },
              handler: async (response: any) => {
                try {
                  await submitOrderToBackend({
                    is_paid: true,
                    payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                } catch (err: any) {
                  showToast(err.response?.data?.detail || 'Order creation failed after payment', 'error');
                  setIsProcessing(false);
                }
              },
              modal: {
                ondismiss: () => {
                  setIsProcessing(false);
                  showToast('Payment window was dismissed.', 'info');
                }
              }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            return;
          }
        }

        // Sandbox / Simulated Card or UPI authorization
        await new Promise((r) => setTimeout(r, 600));
        const paymentId = `${paymentMethod.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}`;
        await submitOrderToBackend({
          is_paid: true,
          payment_id: paymentId,
          razorpay_order_id: initData.gateway_order_id,
          stripe_payment_intent_id: initData.client_secret ? initData.gateway_order_id : undefined,
        });
      } else {
        // COD Order
        await submitOrderToBackend({
          is_paid: false,
          payment_id: undefined,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to place order. Please try again.';
      showToast(msg, 'error');
    } finally {
      if (paymentMethod !== 'Razorpay' || isCod) {
        setIsProcessing(false);
      }
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

  const isIndia = country.trim().toLowerCase() === 'india';

  const paymentOptions = isIndia
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
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-8 bg-[#F8B4CB]">
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

        {/* SHIPMENT & FULFILLMENT STATUS CARD */}
        <div className="p-6 bg-white border border-emerald-200 rounded-3xl text-left space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-serif text-base font-bold text-gray-900">Shipment & Courier Status</h3>
                <p className="text-xs text-gray-500">Fulfilled via YURAE Logistics & Shiprocket Network</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {createdOrder.shipping_status === 'AWB_ASSIGNED' || createdOrder.awb_code ? 'AWB Assigned & Ready' : 'Processing for Dispatch'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#FDF4F7] rounded-xl border border-[#F1BCCE]">
              <span className="text-gray-500 font-bold block mb-0.5">Courier Partner</span>
              <span className="font-bold text-[#111111] text-sm">{createdOrder.courier_name || 'Blue Dart Express Air'}</span>
            </div>
            <div className="p-3 bg-[#FDF4F7] rounded-xl border border-[#F1BCCE]">
              <span className="text-gray-500 font-bold block mb-0.5">Air Waybill (AWB)</span>
              <span className="font-mono font-bold text-[#D84B7E] text-sm">{createdOrder.awb_code || 'Pending Generation'}</span>
            </div>
            <div className="p-3 bg-[#FDF4F7] rounded-xl border border-[#F1BCCE]">
              <span className="text-gray-500 font-bold block mb-0.5">Estimated Delivery</span>
              <span className="font-bold text-emerald-700 text-sm">{createdOrder.estimated_delivery_date || shippingEstimate.estimated_delivery}</span>
            </div>
          </div>
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

            <div className="flex justify-between items-center text-gray-600">
              <span>Payment Method</span>
              <span className="font-bold text-[#111111]">{createdOrder.payments?.[0]?.payment_method || paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600">
              <span>Payment Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                createdOrder.payment_status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {createdOrder.payment_status === 'Paid'
                  ? 'Paid'
                  : ((createdOrder.payments?.[0]?.payment_method?.toUpperCase() === 'COD' || paymentMethod === 'COD')
                    ? 'Pending (Pay on Delivery)'
                    : 'Pending')}
              </span>
            </div>

            <div className="flex justify-between text-gray-600 pt-2 border-t border-[#F1BCCE]">
              <span className="font-serif text-base font-bold text-[#111111]">
                {createdOrder.payment_status === 'Paid' ? 'Total Paid' : 'Amount Due on Delivery'}
              </span>
              <span className="font-serif text-xl font-bold text-[#D84B7E]">
                {formatRawPrice(createdOrder.total_amount, createdOrder.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* OPTIONAL POST-ORDER FEEDBACK & SPECIAL QUERY CARD */}
        <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl text-left space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1BCCE]">
            <MessageSquare className="w-5 h-5 text-[#D84B7E]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Special Instructions, Queries or Feedback (Optional)
              </h3>
              <p className="text-xs text-gray-600">
                Have special delivery notes, packaging requests, or routine questions? Let our atelier team know.
              </p>
            </div>
          </div>

          {feedbackSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Thank you! Your note has been received.</span>
                <span className="text-gray-600">Our client concierge team will review your instructions for Order #{createdOrder.order_number}.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePostOrderFeedback} className="space-y-4">
              {/* Category Pills */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block mb-1.5">
                  Select Topic
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Delivery Instructions',
                    'Gift & Packaging Request',
                    'Skincare / Routine Query',
                    'Checkout Experience Feedback',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        feedbackCategory === cat
                          ? 'bg-[#D84B7E] text-white shadow-xs'
                          : 'bg-white border border-[#F1BCCE] text-gray-700 hover:border-[#D84B7E]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Rating */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block mb-1.5">
                  How was your checkout experience?
                </label>
                <div className="flex flex-wrap gap-2">
                  {['😍 Exceptional', '😊 Seamless & Fast', '👍 Good', '😐 Could be Better'].map((rat) => (
                    <button
                      key={rat}
                      type="button"
                      onClick={() => setFeedbackRating(rat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        feedbackRating === rat
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'bg-white border border-[#F1BCCE] text-gray-700 hover:border-black'
                      }`}
                    >
                      {rat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600 block mb-1">
                  Your Note or Question
                </label>
                <textarea
                  rows={3}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="e.g. Please leave package at reception / Can you include extra Centella samples? / What order should I use the products?"
                  className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-xs outline-none focus:border-[#D84B7E] placeholder:text-gray-400"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-gray-500 italic">
                  * This step is completely optional.
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                  className="px-5 py-2.5 bg-[#D84B7E] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Note & Query'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3.5">
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-7 py-3.5 bg-white border border-[#D84B7E] text-[#D84B7E] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Download Tax Invoice (PDF)
          </button>
          <button
            type="button"
            onClick={() => navigate(`/account?tab=orders&order=${createdOrder.order_number}`)}
            className="px-7 py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <Truck className="w-4 h-4" /> Track Shipment Live
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-7 py-3.5 bg-[#FFF8FA] border border-[#111111] text-[#111111] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#F8D7E3] transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>

        {/* Invoice Modal for Immediate Download */}
        {showInvoiceModal && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => setShowInvoiceModal(false)}
            orderIdentifier={createdOrder.order_number || createdOrder.id}
          />
        )}
      </div>
    );
  }

  // Reusable Order Summary, Items, Coupon, & Price Breakdown Box
  const renderOrderSummaryAndCoupon = (isMobile: boolean = false) => (
    <div className={`p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-5 shadow-xs ${!isMobile ? 'sticky top-24' : ''}`}>
      <h3 className="font-serif text-lg font-bold text-[#111111] pb-3 border-b border-[#F1BCCE] flex items-center justify-between">
        <span>Order Summary ({cart?.item_count || 0} items)</span>
        {isMobile && (
          <span className="text-xs font-bold text-[#D84B7E] font-serif">
            {formatRawPrice(totalPayable, currency)}
          </span>
        )}
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
              <Sparkles className="w-3.5 h-3.5 text-[#D84B7E]" />
              {showAvailableCoupons ? 'Hide Offers' : `Offers (${availableCoupons.length})`}
              {showAvailableCoupons ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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

        <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
          <span>
            {isIndia
              ? `GST (18% Included • ${state.trim().toLowerCase() === 'tamil nadu' ? 'CGST 9% + SGST 9%' : 'IGST 18%'})`
              : 'Taxes & Duties (Zero-Rated Export)'}
          </span>
          <span className="font-semibold text-emerald-700">Taxes Included</span>
        </div>

        <div className="flex justify-between text-sm font-serif font-bold text-[#111111] pt-3 border-t border-[#F1BCCE]">
          <span>Total Payable</span>
          <span className="text-[#D84B7E] font-bold text-lg">
            {formatRawPrice(totalPayable, currency)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-32 xl:pb-24 pt-6 sm:pt-8 bg-[#F8B4CB]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Step Indicator Bar */}
        <div className="max-w-3xl mx-auto mb-6 sm:mb-12 flex justify-between items-center text-[10px] sm:text-xs uppercase tracking-wider font-bold text-gray-400">
          <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 1 ? 'text-[#D84B7E]' : ''}`}>
            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs border ${step >= 1 ? 'bg-[#D84B7E] text-white border-[#D84B7E]' : 'border-gray-300'}`}>1</span>
            <span>Customer</span>
          </div>
          <span className="h-0.5 flex-1 bg-[#F1BCCE] mx-2 sm:mx-4" />
          <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 2 ? 'text-[#D84B7E]' : ''}`}>
            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs border ${step >= 2 ? 'bg-[#D84B7E] text-white border-[#D84B7E]' : 'border-gray-300'}`}>2</span>
            <span>Shipping</span>
          </div>
          <span className="h-0.5 flex-1 bg-[#F1BCCE] mx-2 sm:mx-4" />
          <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 3 ? 'text-[#D84B7E]' : ''}`}>
            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs border ${step >= 3 ? 'bg-[#D84B7E] text-white border-[#D84B7E]' : 'border-gray-300'}`}>3</span>
            <span>Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* LEFT: Checkout Form Steps */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* Step 1 & 2: Shipping Address Form */}
            <div className="p-6 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#111111] flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#D84B7E]" /> Shipping & Delivery Address
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select a saved destination or add a new delivery location
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillAddress}
                    className="text-xs text-[#D84B7E] font-bold hover:underline cursor-pointer flex items-center gap-1 bg-[#F8D7E3] px-3 py-1.5 rounded-full border border-[#F1BCCE]"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-fill Demo
                  </button>
                  <span className="text-xs text-[#D84B7E] font-bold bg-[#F8D7E3] px-3 py-1.5 rounded-full border border-[#F1BCCE]">
                    {currentCurrencyInfo.flag} {currency}
                  </span>
                </div>
              </div>

              {/* Saved Addresses 1-Click Selector */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 pb-2 border-b border-[#F1BCCE]">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-widest text-[#111111] font-bold block">
                      Saved Delivery Locations ({savedAddresses.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewAddress(!isAddingNewAddress);
                        if (!isAddingNewAddress) {
                          setSelectedAddressId(null);
                        }
                      }}
                      className="text-xs text-[#D84B7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isAddingNewAddress ? '✕ Choose From Saved Addresses' : '+ Deliver to a New Address'}
                    </button>
                  </div>

                  {!isAddingNewAddress && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        const typeLabel = addr.address_type || 'Home';
                        const typeIcon = typeLabel === 'Office' ? '🏢' : typeLabel === 'Parents' ? '👨‍👩‍👧' : typeLabel === 'Other' ? '📍' : '🏠';

                        return (
                          <div
                            key={addr.id}
                            onClick={() => applyAddressToForm(addr)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2.5 ${
                              isSelected
                                ? 'bg-[#F8D7E3] border-[#D84B7E] ring-2 ring-[#F1BCCE] shadow-sm'
                                : 'bg-[#FDF4F7] border-[#F1BCCE] hover:border-[#D84B7E]/60'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="px-2.5 py-0.5 bg-[#F8D7E3] border border-[#F1BCCE] rounded-full text-[11px] font-bold text-[#111111] flex items-center gap-1 shadow-2xs">
                                  <span>{typeIcon}</span>
                                  <span>{typeLabel}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {addr.is_default && (
                                    <span className="px-2 py-0.5 bg-[#D84B7E] text-white text-[9px] uppercase font-bold rounded-full">
                                      Default
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleStartEditSavedAddress(addr, e)}
                                    className="px-2 py-0.5 bg-[#F8D7E3] hover:bg-[#FCE7F0] text-gray-700 hover:text-[#D84B7E] border border-[#F1BCCE] rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  >
                                    <Edit className="w-2.5 h-2.5" /> Edit
                                  </button>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-1.5">
                                  {addr.name}
                                  {isSelected && <Check className="w-3.5 h-3.5 text-[#D84B7E]" />}
                                </h4>
                                <p className="text-[11px] text-gray-500 font-mono">{addr.phone}</p>
                              </div>

                              <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                {addr.building_or_flat ? `${addr.building_or_flat}, ` : ''}
                                {addr.address_line1}, {addr.city} - {addr.postal_code}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-[#F1BCCE]/50 flex justify-between items-center text-[10px]">
                              <span className="text-gray-500 font-bold uppercase">{addr.country}</span>
                              <span className={`font-bold ${isSelected ? 'text-[#D84B7E]' : 'text-gray-400'}`}>
                                {isSelected ? '✓ 1-Click Selected' : 'Click to Select'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Address Input Form (Shown when Adding New or Editing) */}
              {(isAddingNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4 pt-1">
                  {/* Form Header */}
                  <div className="flex justify-between items-center bg-[#FCE7F0] px-4 py-2.5 rounded-2xl border border-[#F1BCCE]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D84B7E]" />
                      <span className="text-xs font-bold text-[#111111]">
                        {editingAddressId ? `Editing Address (${addressType})` : 'Add New Delivery Destination'}
                      </span>
                    </div>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCancelAddressEdit}
                        className="text-[11px] text-gray-600 hover:text-black font-bold cursor-pointer underline"
                      >
                        Cancel & Return
                      </button>
                    )}
                  </div>

                  {/* Address Label Selector */}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-2">
                      Address Label *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { type: 'Home', icon: '🏠' },
                        { type: 'Office', icon: '🏢' },
                        { type: 'Parents', icon: '👨‍👩‍👧' },
                        { type: 'Other', icon: '📍' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setAddressType(item.type)}
                          className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            addressType === item.type
                              ? 'bg-[#D84B7E] text-white border-[#D84B7E] shadow-sm'
                              : 'bg-white border-[#F1BCCE] text-[#111111] hover:border-[#D84B7E]'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Full Recipient Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Recipient's legal full name"
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Contact Mobile Number *</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210 (10 digits)"
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Contact Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="For courier dispatch updates"
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
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
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Flat / House No., Apartment, Building *</label>
                      <input
                        type="text"
                        value={buildingOrFlat}
                        onChange={(e) => setBuildingOrFlat(e.target.value)}
                        placeholder="e.g. Flat 4B, Lotus Luxury Residency"
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Street Address, Colony, Sector *</label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="e.g. MG Road, Near Botanical Garden, Whitefield"
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Prominent Landmark (Optional)</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Opposite Metro Pillar 140, Behind Grand Hotel"
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">City / District *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">State / Province *</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs uppercase tracking-widest text-gray-600 font-bold">
                          Postal / 6-Digit PIN Code *
                        </label>
                        {isCheckingServiceability && (
                          <span className="text-[11px] text-[#D84B7E] font-bold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Verifying Courier Network...
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit Indian PIN (e.g. 560001, 110001)"
                        required
                        className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm font-mono outline-none focus:border-[#D84B7E]"
                      />
                    </div>
                  </div>

                  {/* Save to Account Checkbox */}
                  {isAuthenticated && !editingAddressId && (
                    <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveAddressToAccount}
                        onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                        className="w-4 h-4 text-[#D84B7E] accent-[#D84B7E] rounded cursor-pointer"
                      />
                      <span className="text-xs text-gray-800 font-bold">
                        Save this address to my account for 1-click checkout next time
                      </span>
                    </label>
                  )}

                  {/* Done / Finish Address Button */}
                  <div className="pt-3 border-t border-[#F1BCCE] flex flex-col sm:flex-row justify-end items-center gap-3">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCancelAddressEdit}
                        className="w-full sm:w-auto px-6 py-2.5 bg-white border border-[#F1BCCE] text-gray-700 text-xs uppercase tracking-wider font-bold rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSavingAddressInline}
                      onClick={handleFinishAddressDone}
                      className="w-full sm:w-auto px-8 py-3 bg-[#D84B7E] hover:bg-[#111111] text-white text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {isSavingAddressInline
                        ? 'Saving Address...'
                        : editingAddressId
                        ? 'Done — Update Address'
                        : 'Done & Deliver to this Address'}
                    </button>
                  </div>
                </div>
              )}

              {/* Live PIN Code Serviceability Banner */}
              {country.toLowerCase() === 'india' && postalCode.length === 6 && serviceability && (
                <div className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                      serviceability.is_serviceable
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}>
                      {serviceability.is_serviceable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold flex flex-wrap items-center gap-2">
                          <span>{serviceability.delivery_status_message}</span>
                          {serviceability.recommended_courier && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[10px]">
                              Carrier: {serviceability.recommended_courier}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {serviceability.is_free
                            ? '✨ You qualify for Free Domestic Shipping!'
                            : `Standard Domestic Shipping: ${formatRawPrice(serviceability.shipping_fee, 'INR')} (Free on orders above ${formatRawPrice(serviceability.free_shipping_threshold, 'INR')})`}
                        </p>
                      </div>
                    </div>
                  )}
            </div>

            {/* Step 3: Shipping Method Selection */}
            <div className="p-6 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#D84B7E]" />
                  <h2 className="font-serif text-2xl font-bold text-[#111111]">Shipping Method</h2>
                </div>
                <span className="text-xs font-bold text-gray-500">Step 3 of 4</span>
              </div>

              {/* International Customs Notice */}
              {country.trim().toLowerCase() !== 'india' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                  <Globe className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">International Customs & Import Taxes Notice</span>
                    <p className="text-gray-600 mt-0.5 leading-relaxed">
                      International deliveries outside India may be subject to customs inspection, import duties, and destination brokerage fees levied by your country's customs authority.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Shipping Tier */}
                <button
                  type="button"
                  onClick={() => setSelectedShippingTier('STANDARD')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedShippingTier === 'STANDARD'
                      ? 'border-[#D84B7E] bg-[#F8D7E3]/60 shadow-xs'
                      : 'border-[#F1BCCE] bg-[#FDF4F7] hover:border-gray-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#111111]">
                        {country.trim().toLowerCase() === 'india' ? 'Standard Domestic Air' : 'International Standard Air'}
                      </span>
                      <span className="text-xs font-bold text-[#D84B7E]">
                        {shippingEstimate.is_free && selectedShippingTier === 'STANDARD' ? 'FREE' : formatRawPrice(shippingEstimate.shipping_fee, currency)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Estimated Delivery: <span className="font-semibold text-gray-900">{shippingEstimate.estimated_delivery}</span>
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#F1BCCE]/60 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{serviceability?.recommended_courier || (country.trim().toLowerCase() === 'india' ? 'Blue Dart / Delhivery' : 'International Air Post')}</span>
                  </div>
                </button>

                {/* Priority Express Tier */}
                <button
                  type="button"
                  onClick={() => setSelectedShippingTier('EXPRESS')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedShippingTier === 'EXPRESS'
                      ? 'border-[#D84B7E] bg-[#F8D7E3]/60 shadow-xs'
                      : 'border-[#F1BCCE] bg-[#FDF4F7] hover:border-gray-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#111111] flex items-center gap-1.5">
                        ✨ {country.trim().toLowerCase() === 'india' ? 'Atelier Priority Express' : 'DHL Express Worldwide'}
                      </span>
                      <span className="text-xs font-bold text-[#111111]">
                        {country.trim().toLowerCase() === 'india' ? '+₹100.00' : '+$15.00 Priority'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {country.trim().toLowerCase() === 'india' ? '1-2 Business Days (Same-day dispatch)' : '2-4 Business Days (Express Air Cargo)'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#F1BCCE]/60 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D84B7E]" />
                    <span>Priority flight handling & fast-track customs</span>
                  </div>
                </button>
              </div>
            </div>

            {/* MOBILE ONLY: Order Summary & Coupon / Promo Code (Before Payment Selection) */}
            <div className="block lg:hidden">
              {renderOrderSummaryAndCoupon(true)}
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

              {/* Dynamic Payment Details Drawer */}
              {paymentMethod === 'COD' && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs text-amber-900 animate-in fade-in duration-200">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Wallet className="w-4 h-4" />
                    Cash on Delivery (Pending Payment at Doorstep)
                  </div>
                  <p className="text-[11px] text-amber-700">
                    No upfront online payment required today. Your order will be placed in <span className="font-bold">Pending Payment</span> status. Please hand over the exact cash amount of <span className="font-bold">{formatRawPrice(totalPayable, currency)}</span> to the courier partner upon arrival.
                  </p>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="p-5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl space-y-4 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#D84B7E]" />
                      Pay Instantly via UPI App
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="text-[11px] text-[#D84B7E] font-bold hover:underline cursor-pointer"
                    >
                      {showQrCode ? 'Enter UPI ID instead' : 'Scan QR Code instead'}
                    </button>
                  </div>

                  {showQrCode ? (
                    <div className="p-4 bg-[#FCE7F0] rounded-xl border border-[#F1BCCE] text-center space-y-2">
                      <div className="w-36 h-36 mx-auto bg-gray-900 text-white rounded-lg flex items-center justify-center font-mono text-xs p-2 text-center">
                        [QR Code for {formatRawPrice(totalPayable, currency)}]
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">Scan with Google Pay, PhonePe, Paytm, or BHIM to pay instantly.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-gray-600">Enter UPI ID / VPA</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobileNumber@okhdfcbank or yourname@upi"
                        className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#D84B7E]"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['@okhdfcbank', '@okicici', '@paytm', '@ybl', '@axl'].map((sfx) => (
                          <button
                            key={sfx}
                            type="button"
                            onClick={() => setUpiId((prev) => (prev ? prev.split('@')[0] + sfx : sfx))}
                            className="px-2 py-0.5 bg-[#F8D7E3] border border-[#F1BCCE] rounded text-[10px] font-mono text-gray-600 hover:border-[#D84B7E]"
                          >
                            {sfx}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Order will be marked as <b>Paid</b> upon successful authorization.
                  </p>
                </div>
              )}

              {(paymentMethod === 'Razorpay' || paymentMethod === 'Stripe' || paymentMethod === 'Razorpay_International') && (
                <div className="p-5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#D84B7E]" />
                      Credit / Debit Card Details
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFillCard}
                      className="text-[11px] text-[#D84B7E] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-fill Demo Card
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Card Number (e.g. 4532 •••• •••• 8892)"
                      maxLength={19}
                      className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#D84B7E] font-mono"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        maxLength={5}
                        className="bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#D84B7E]"
                      />
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="CVV"
                        maxLength={4}
                        className="bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#D84B7E]"
                      />
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name on Card"
                        className="col-span-2 sm:col-span-1 bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#D84B7E]"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Order will be marked as <b>Paid</b> upon 3D Secure completion.
                  </p>
                </div>
              )}

              {paymentMethod === 'NetBanking' && (
                <div className="p-5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
                  <span className="font-bold text-[#111111] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#D84B7E]" />
                    Select Your Bank
                  </span>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#D84B7E]"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Other Indian Bank">Other Major Indian Bank</option>
                  </select>
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Order will be marked as <b>Paid</b> upon NetBanking authorization.
                  </p>
                </div>
              )}
            </div>

            {/* Place Order CTA Button (Payment Completion as Last Action) */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-4 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing
                ? (paymentMethod === 'COD' ? 'Placing COD Order...' : 'Processing Payment...')
                : (paymentMethod === 'COD'
                    ? `Place Order with COD (${formatRawPrice(totalPayable, currency)} Due on Delivery)`
                    : `Pay Now & Complete Order — ${formatRawPrice(totalPayable, currency)}`
                  )
              }
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          {/* RIGHT: Order Summary & Coupon Card (Desktop Only) */}
          <div className="hidden lg:block space-y-6">
            {renderOrderSummaryAndCoupon(false)}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
