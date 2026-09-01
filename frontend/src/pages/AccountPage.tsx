import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Package, MapPin, Key, LogOut, Star, X, CheckCircle2,
  MessageSquare, Truck, Copy, ExternalLink, Clock, ChevronRight,
  Calendar, Check, ShieldCheck, Loader2, FileText, Plus, Trash2, Edit, Home, Building2, Users,
  Camera, Upload, Sparkles, Image as ImageIcon, RefreshCw, Undo2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { Order, Address, TrackingResponse, ReturnRequest } from '../types';
import { useToast } from '../context/ToastContext';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ReturnRequestModal } from '../components/common/ReturnRequestModal';

export const AccountPage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { formatRawPrice } = useCurrency();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'password'>(isAdmin ? 'profile' : 'orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<string | number | null>(null);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null);
  const [userReturnRequests, setUserReturnRequests] = useState<ReturnRequest[]>([]);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addrType, setAddrType] = useState<string>('Home');
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrBuilding, setAddrBuilding] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState<boolean>(false);

  // Product Review Modal State
  const [reviewingItem, setReviewingItem] = useState<{ productId: number; productName: string; orderId: number } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<number[]>([]);

  // Profile Form
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'orders' || activeTab === 'addresses') {
        setActiveTab('profile');
      }
      return;
    }

    // Fetch personal orders for customers
    api.get('/orders')
      .then((res) => {
        setOrders(res.data);
        // Check if navigated with ?order=... to automatically open tracking
        const orderParam = searchParams.get('order');
        if (orderParam && Array.isArray(res.data)) {
          const matched = res.data.find((o: Order) => o.order_number === orderParam);
          if (matched) {
            handleOpenTracking(matched);
          }
        }
      })
      .catch((err) => console.error(err));

    api.get('/auth/addresses')
      .then((res) => setAddresses(res.data))
      .catch((err) => console.error(err));

    api.get('/shipping/returns')
      .then((res) => setUserReturnRequests(res.data))
      .catch(() => {});
  }, [searchParams, isAdmin]);

  const handleOpenTracking = async (ord: Order) => {
    setTrackingOrder(ord);
    setIsLoadingTracking(true);
    try {
      const res = await api.get(`/shipping/track/${ord.order_number}`);
      setTrackingData(res.data);
    } catch {
      // Fallback
      setTrackingData({
        order_number: ord.order_number,
        awb_code: ord.awb_code,
        courier_name: ord.courier_name || 'Blue Dart Express Air',
        current_status: ord.shipping_status || 'PROCESSING',
        shipping_status: ord.shipping_status || 'PROCESSING',
        estimated_delivery: ord.estimated_delivery_date || '3 Business Days',
        tracking_url: ord.tracking_url || undefined,
        events: []
      });
    } finally {
      setIsLoadingTracking(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/auth/profile?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&phone=${encodeURIComponent(phone)}`);
      showToast('Profile updated successfully', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please fill in both current and new password', 'error');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast(res.data.message || 'Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update password';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrType('Home');
    setAddrName(user ? `${user.first_name} ${user.last_name}` : '');
    setAddrPhone(user?.phone || '');
    setAddrBuilding('');
    setAddrLine1('');
    setAddrLine2('');
    setAddrLandmark('');
    setAddrCity('');
    setAddrState('Karnataka');
    setAddrPostalCode('');
    setAddrCountry('India');
    setAddrIsDefault(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrType(addr.address_type || 'Home');
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrBuilding(addr.building_or_flat || '');
    setAddrLine1(addr.address_line1);
    setAddrLine2(addr.address_line2 || '');
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city);
    setAddrState(addr.state || 'Karnataka');
    setAddrPostalCode(addr.postal_code);
    setAddrCountry(addr.country || 'India');
    setAddrIsDefault(addr.is_default);
    setIsAddressModalOpen(true);
  };

  const handleSetDefaultAddress = async (addrId: number) => {
    try {
      await api.put(`/auth/addresses/${addrId}/set-default`);
      setAddresses((prev) =>
        prev
          .map((a) => ({ ...a, is_default: a.id === addrId }))
          .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
      );
      showToast('Default delivery address updated', 'success');
    } catch {
      showToast('Failed to set default address', 'error');
    }
  };

  const handleDeleteAddress = async (addrId: number) => {
    if (window.confirm('Are you sure you want to remove this saved address?')) {
      try {
        await api.delete(`/auth/addresses/${addrId}`);
        setAddresses((prev) => prev.filter((a) => a.id !== addrId));
        showToast('Address removed successfully', 'success');
      } catch {
        showToast('Failed to delete address', 'error');
      }
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim() || !addrPhone.trim() || !addrLine1.trim() || !addrCity.trim() || !addrPostalCode.trim()) {
      showToast('Please fill in all mandatory address fields', 'error');
      return;
    }

    const payload = {
      address_type: addrType,
      name: addrName.trim(),
      phone: addrPhone.trim(),
      building_or_flat: addrBuilding.trim() || undefined,
      address_line1: addrLine1.trim(),
      address_line2: addrLine2.trim() || undefined,
      landmark: addrLandmark.trim() || undefined,
      city: addrCity.trim(),
      state: addrState.trim() || 'Karnataka',
      postal_code: addrPostalCode.trim(),
      country: addrCountry.trim() || 'India',
      is_default: addrIsDefault,
    };

    try {
      setIsSavingAddress(true);
      if (editingAddressId) {
        const res = await api.put(`/auth/addresses/${editingAddressId}`, payload);
        setAddresses((prev) =>
          prev
            .map((a) => (a.id === editingAddressId ? res.data : addrIsDefault ? { ...a, is_default: false } : a))
            .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
        );
        showToast('Address updated successfully', 'success');
      } else {
        const res = await api.post('/auth/addresses', payload);
        setAddresses((prev) =>
          addrIsDefault
            ? [res.data, ...prev.map((a) => ({ ...a, is_default: false }))]
            : [...prev, res.data]
        );
        showToast('New address saved to your address book', 'success');
      }
      setIsAddressModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save address';
      showToast(msg, 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleOpenReviewModal = async (item: { product_id: number; product_name: string }, orderId: number) => {
    setReviewingItem({ productId: item.product_id, productName: item.product_name, orderId });
    setReviewRating(5);
    setReviewText('');
    setReviewPhotoUrl('');

    try {
      const res = await api.get(`/products/${item.product_id}/review-eligibility`);
      if (res.data.existing_review) {
        setReviewRating(res.data.existing_review.rating);
        setReviewText(res.data.existing_review.review);
        if (res.data.existing_review.photo_url) {
          setReviewPhotoUrl(res.data.existing_review.photo_url);
        }
      }
    } catch {
      // use defaults
    }
  };

  const handleAccountPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB', 'error');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/reviews/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReviewPhotoUrl(res.data.photo_url);
      showToast('📸 Glow / Look photo attached successfully!', 'success');
    } catch (err: any) {
      console.warn('File upload fallback to data URL:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhotoUrl(reader.result as string);
        showToast('📸 Photo attached successfully!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    if (!reviewText.trim()) {
      showToast('Please enter your written review thoughts.', 'error');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await api.post(`/products/${reviewingItem.productId}/reviews`, {
        product_id: reviewingItem.productId,
        rating: reviewRating,
        review: reviewText.trim(),
        photo_url: reviewPhotoUrl || undefined,
      });
      showToast(`✨ Thank you! Your review for ${reviewingItem.productName} has been published.`, 'success');
      setReviewedProductIds((prev) => [...prev, reviewingItem.productId]);
      setReviewingItem(null);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit review. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-[#FCE7F0] text-[#D84B7E] border-[#F1BCCE]';
    }
  };

  return (
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-[#F1BCCE] mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">
              {isAdmin ? '👑 Administrator Account' : 'Client Dashboard'}
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#111111]">
              Welcome, {user?.first_name} {user?.last_name}
            </h1>
            {isAdmin && (
              <p className="text-xs text-gray-600 mt-1">
                You have Administrator privileges. Store customer orders & management are located in the <a href="/admin" className="text-[#D84B7E] font-bold hover:underline">Admin Dashboard</a>.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <a
                href="/admin"
                className="px-6 py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-xs flex items-center gap-2"
              >
                Store Admin Dashboard →
              </a>
            )}
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-[#FFF8FA] text-[#111111] text-xs uppercase tracking-widest font-bold rounded-full border border-[#F1BCCE] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Navigation Sidebar / Mobile Tab Bar */}
          <div className="grid grid-cols-2 min-[500px]:grid-cols-4 lg:grid-cols-1 gap-2 bg-[#FFF8FA] p-2.5 sm:p-4 border border-[#F1BCCE] rounded-2xl h-fit shadow-xs">
            {(isAdmin
              ? [
                  { id: 'profile', label: 'Admin Profile', icon: User },
                  { id: 'password', label: 'Security & Password', icon: Key },
                ]
              : [
                  { id: 'orders', label: 'My Orders', icon: Package },
                  { id: 'profile', label: 'Profile Details', icon: User },
                  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                  { id: 'password', label: 'Security & Password', icon: Key },
                ]
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all cursor-pointer touch-target min-h-[44px] ${
                    active ? 'bg-[#D84B7E] text-[#FDF4F7] shadow-xs' : 'text-gray-700 hover:bg-[#FCE7F0]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Dashboard Content Area */}
          <div className="lg:col-span-3">
            
            {/* MY ORDERS TAB - Customer Only */}
            {activeTab === 'orders' && !isAdmin && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <h2 className="font-serif text-2xl font-bold text-[#111111]">Order History</h2>
                  {isAdmin && (
                    <a
                      href="/admin"
                      className="text-xs font-bold text-[#D84B7E] hover:underline uppercase tracking-wider"
                    >
                      View All Store Customer Orders in Admin →
                    </a>
                  )}
                </div>

                {/* Delivered Order Review & Feedback Prompt Banner */}
                {orders.some((o) => o.order_status?.toLowerCase() === 'delivered') && (
                  <div className="p-4 bg-[#FCE7F0] border border-[#F1BCCE] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-xl text-[#D84B7E] shadow-2xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#111111]">
                          Share Your Skincare Glow & Fashion Styling!
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Your delivered items are ready for verified reviews. Upload photos of your glow or look to inspire fellow shoppers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {orders.length === 0 ? (
                  <div className="p-12 text-center bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-3 shadow-xs">
                    <p className="font-serif text-lg text-[#111111] font-bold">No orders placed yet.</p>
                    <p className="text-xs text-gray-600">Your completed purchases will appear here with live tracking.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => {
                      const orderCurrency = ord.currency || 'INR';
                      return (
                        <div key={ord.id} className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-4 shadow-xs">
                          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-[#F1BCCE] text-xs">
                            <div>
                              <span className="text-gray-600 font-medium">Order Reference: </span>
                              <span className="font-mono font-bold text-[#111111]">{ord.order_number}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-[#F8D7E3] text-[#D84B7E] border border-[#F1BCCE]">
                                {orderCurrency}
                              </span>
                              <span className="text-gray-500 font-medium">{new Date(ord.created_at).toLocaleDateString()}</span>
                              <span className={`px-3 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getStatusBadge(ord.order_status)}`}>
                                {ord.order_status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {ord.items.map((item) => {
                              const isDelivered = ord.order_status?.toLowerCase() === 'delivered';
                              const hasReviewed = reviewedProductIds.includes(item.product_id);
                              return (
                                <div
                                  key={item.id}
                                  className="p-3.5 bg-[#FDF4F7] border border-[#F1BCCE]/60 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                                >
                                  <div>
                                    <span className="text-[#111111] font-bold block text-sm">{item.product_name}</span>
                                    <span className="text-gray-500 mt-0.5 block">
                                      Qty: {item.quantity} • {formatRawPrice(item.price * item.quantity, orderCurrency)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReviewModal(item, ord.id)}
                                      className="px-3.5 py-1.5 bg-[#D84B7E] text-white font-bold rounded-full hover:bg-[#111111] transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-white" />
                                      {hasReviewed ? 'Edit Your Review' : 'Write Product Review'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Shipping & Courier Status Banner */}
                          <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#FDF4F7] border border-[#F1BCCE] flex items-center justify-center text-[#D84B7E]">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#111111]">{ord.courier_name || 'Blue Dart Express Air'}</span>
                                  {ord.awb_code && (
                                    <span className="font-mono text-[10px] bg-[#F8D7E3] text-[#D84B7E] px-2 py-0.5 rounded-md font-bold">
                                      AWB: {ord.awb_code}
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-500 text-[11px]">
                                  Status: <strong className="text-emerald-700">{ord.shipping_status || 'Processing'}</strong>
                                  {ord.estimated_delivery_date && ` • Est. Delivery: ${ord.estimated_delivery_date}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedReturnOrder(ord)}
                                className="px-3.5 py-1.5 bg-[#FFF8FA] border border-[#F1BCCE] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-full hover:border-[#D84B7E] hover:text-[#D84B7E] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                title="Request 7-Day Size Exchange or Full Refund"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" /> 7-Day Exchange / Return
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(ord.order_number || ord.id)}
                                className="px-3.5 py-1.5 bg-white border border-[#D84B7E] text-[#D84B7E] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#FCE7F0] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                title="Download Official Tax Invoice PDF"
                              >
                                <FileText className="w-3.5 h-3.5" /> Download Invoice (PDF)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenTracking(ord)}
                                className="px-4 py-1.5 bg-[#D84B7E] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                              >
                                <Truck className="w-3.5 h-3.5" /> Track Shipment
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#F1BCCE] flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Payment:</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                ord.payment_status === 'Paid' || ord.order_status?.toLowerCase() === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : ord.payment_status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}>
                                {ord.payment_status === 'Paid' || ord.order_status?.toLowerCase() === 'delivered'
                                  ? (ord.is_cod || ord.payments?.[0]?.payment_method?.toUpperCase() === 'COD'
                                    ? 'Paid (Cash on Delivery)'
                                    : 'Paid')
                                  : (ord.is_cod || ord.payments?.[0]?.payment_method?.toUpperCase() === 'COD'
                                    ? 'Pending (Cash on Delivery)'
                                    : 'Pending Payment')}
                              </span>
                            </div>
                            <span className="font-serif font-bold text-[#111111]">
                              Total: {formatRawPrice(ord.total_amount, orderCurrency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-6 shadow-xs max-w-xl">
                <h2 className="font-serif text-2xl font-bold text-[#111111]">Personal Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full bg-gray-100 border border-[#F1BCCE] rounded-xl p-3 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </form>
            )}

            {/* ADDRESSES TAB - Customer Only */}
            {activeTab === 'addresses' && !isAdmin && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#111111]">Saved Delivery Addresses</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Manage your multi-destination address book (Home, Office, Parents) for seamless 1-click checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="px-5 py-2.5 bg-[#D84B7E] hover:bg-[#111111] text-white text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add New Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-12 text-center bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-4">
                    <MapPin className="w-8 h-8 text-[#D84B7E] mx-auto opacity-50" />
                    <h3 className="font-serif text-lg font-bold text-[#111111]">No Saved Addresses Yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Save your primary delivery locations to speed up your luxury orders.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="px-6 py-2.5 bg-[#D84B7E] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-sm"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {addresses.map((addr) => {
                      const typeLabel = addr.address_type || 'Home';
                      const typeIcon = typeLabel === 'Office' ? '🏢' : typeLabel === 'Parents' ? '👨‍👩‍👧' : typeLabel === 'Other' ? '📍' : '🏠';

                      return (
                        <div
                          key={addr.id}
                          className={`p-6 bg-[#FFF8FA] border rounded-3xl space-y-4 relative shadow-2xs transition-all flex flex-col justify-between ${
                            addr.is_default ? 'border-[#D84B7E] ring-1 ring-[#F1BCCE]' : 'border-[#F1BCCE] hover:border-[#D84B7E]/60'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start">
                              <span className="px-3 py-1 bg-white border border-[#F1BCCE] rounded-full text-xs font-bold text-[#111111] flex items-center gap-1.5 shadow-2xs">
                                <span>{typeIcon}</span>
                                <span>{typeLabel}</span>
                              </span>

                              {addr.is_default ? (
                                <span className="px-3 py-1 bg-[#D84B7E] text-white text-[10px] uppercase tracking-wider font-bold rounded-full flex items-center gap-1 shadow-2xs">
                                  <Check className="w-3 h-3" /> Default Address
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[11px] text-gray-500 hover:text-[#D84B7E] font-bold underline cursor-pointer"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>

                            <div>
                              <h4 className="font-serif text-base font-bold text-[#111111]">{addr.name}</h4>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{addr.phone}</p>
                            </div>

                            <div className="text-xs text-gray-700 leading-relaxed">
                              {addr.building_or_flat && <p className="font-medium">{addr.building_or_flat}</p>}
                              <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                              {addr.landmark && <p className="text-gray-500 italic">Landmark: {addr.landmark}</p>}
                              <p className="font-semibold text-[#111111] pt-1">
                                {addr.city}, {addr.state} - {addr.postal_code}
                              </p>
                              <p className="text-gray-600 uppercase text-[10px] font-bold">{addr.country}</p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#F1BCCE]/60 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="px-3.5 py-1.5 bg-white border border-[#F1BCCE] text-[#111111] hover:border-[#D84B7E] hover:text-[#D84B7E] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-6 shadow-xs max-w-xl">
                <h2 className="font-serif text-2xl font-bold text-[#111111]">Update Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Enter current password"
                      className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-8 py-3 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-md"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}

          </div>

        </div>
      </div>

      {/* DELIVERED PRODUCT REVIEW MODAL */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-[#F1BCCE] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold block">
                  Verified Purchase Review
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111] mt-0.5">
                  {reviewingItem.productName}
                </h3>
              </div>
              <button
                onClick={() => setReviewingItem(null)}
                className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-2">
                  Select Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-[#D84B7E] text-[#D84B7E]'
                            : 'text-gray-300 hover:text-pink-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-[#111111]">
                    {reviewRating === 5
                      ? '5/5 (Loved it!)'
                      : reviewRating === 4
                      ? '4/5 (Great)'
                      : reviewRating === 3
                      ? '3/5 (Average)'
                      : reviewRating === 2
                      ? '2/5 (Disappointed)'
                      : '1/5 (Poor)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                  Your Thoughts & Experience *
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share how this product felt on your skin, the fragrance, results, or fit details..."
                  required
                  className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-xs outline-none focus:border-[#D84B7E] placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-3 bg-[#D84B7E] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="px-5 py-3 bg-white border border-[#F1BCCE] text-[#111111] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE SHIPMENT TRACKING MODAL */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#F1BCCE]">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D84B7E] font-bold flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Live Shipment Tracking
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#111111] mt-0.5">
                  Order #{trackingOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => {
                  setTrackingOrder(null);
                  setTrackingData(null);
                }}
                className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingTracking ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#D84B7E] animate-spin mx-auto" />
                <p className="text-xs text-gray-600 font-bold">Querying courier network for real-time tracking coordinates...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-2xl">
                    <span className="text-[11px] text-gray-500 font-bold block mb-0.5">Carrier Partner</span>
                    <span className="font-bold text-[#111111] text-sm block">
                      {trackingData?.courier_name || trackingOrder.courier_name || 'Blue Dart Express Air'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-2xl">
                    <span className="text-[11px] text-gray-500 font-bold block mb-0.5">Air Waybill (AWB)</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#D84B7E] text-sm">
                        {trackingData?.awb_code || trackingOrder.awb_code || 'Pending'}
                      </span>
                      {(trackingData?.awb_code || trackingOrder.awb_code) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(trackingData?.awb_code || trackingOrder.awb_code || '');
                            showToast('AWB copied to clipboard', 'info');
                          }}
                          className="text-gray-400 hover:text-[#D84B7E] p-1 cursor-pointer"
                          title="Copy AWB"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-[#F1BCCE] rounded-2xl">
                    <span className="text-[11px] text-gray-500 font-bold block mb-0.5">Estimated Delivery</span>
                    <span className="font-bold text-emerald-700 text-sm block">
                      {trackingData?.estimated_delivery || trackingOrder.estimated_delivery_date || '2-4 Business Days'}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Stepper */}
                <div className="p-6 bg-white border border-[#F1BCCE] rounded-2xl space-y-6">
                  <h4 className="font-serif text-sm font-bold text-[#111111] uppercase tracking-wider">
                    Fulfillment Progress
                  </h4>

                  {(() => {
                    const statusStr = (trackingData?.current_status || trackingOrder.shipping_status || 'ORDER_CONFIRMED').toUpperCase();
                    let currentStepIndex = 1;
                    if (statusStr.includes('DELIVERED')) currentStepIndex = 5;
                    else if (statusStr.includes('OUT_FOR_DELIVERY') || statusStr.includes('OUT FOR DELIVERY')) currentStepIndex = 4;
                    else if (statusStr.includes('IN_TRANSIT') || statusStr.includes('IN TRANSIT') || statusStr.includes('SHIPPED')) currentStepIndex = 3;
                    else if (statusStr.includes('PICKED_UP') || statusStr.includes('PICKUP_SCHEDULED')) currentStepIndex = 2;
                    else if (statusStr.includes('AWB_ASSIGNED') || statusStr.includes('PACKED')) currentStepIndex = 1;

                    const steps = [
                      { label: 'Confirmed', desc: 'Order Verified' },
                      { label: 'Packed & AWB', desc: 'Label Printed' },
                      { label: 'Picked Up', desc: 'With Courier' },
                      { label: 'In Transit', desc: 'Airport/Hub' },
                      { label: 'Out for Delivery', desc: 'Final Mile' },
                      { label: 'Delivered', desc: 'Doorstep Arrival' },
                    ];

                    return (
                      <div className="relative">
                        <div className="hidden sm:flex justify-between items-start relative">
                          <div className="absolute top-3.5 left-6 right-6 h-1 bg-[#F1BCCE] -z-0">
                            <div
                              className="h-full bg-[#D84B7E] transition-all duration-500"
                              style={{ width: `${(currentStepIndex / 5) * 100}%` }}
                            />
                          </div>

                          {steps.map((st, idx) => {
                            const isDone = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                              <div key={st.label} className="flex flex-col items-center text-center relative z-10 w-24">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all shadow-xs ${
                                    isDone
                                      ? 'bg-[#D84B7E] text-white border-[#D84B7E]'
                                      : 'bg-white text-gray-400 border-[#F1BCCE]'
                                  } ${isCurrent ? 'ring-4 ring-[#F8D7E3]' : ''}`}
                                >
                                  {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-[11px] font-bold mt-2 ${isDone ? 'text-[#111111]' : 'text-gray-400'}`}>
                                  {st.label}
                                </span>
                                <span className="text-[10px] text-gray-500">{st.desc}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Live Activity Timeline */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-bold text-[#111111] uppercase tracking-wider">
                    Courier Scan History & Events
                  </h4>

                  {(!trackingData?.events || trackingData.events.length === 0) ? (
                    <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl text-xs text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D84B7E]" />
                      <span>Shipment registered. Live scan events will appear automatically as the courier scans the package at each transit hub.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {trackingData.events.map((ev, i) => (
                        <div
                          key={ev.id || i}
                          className="p-3 bg-white border border-[#F1BCCE] rounded-xl flex items-start gap-3 text-xs"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D84B7E] mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[#111111]">{ev.activity}</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(ev.event_time).toLocaleDateString()} • {new Date(ev.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {ev.location && (
                              <span className="text-[11px] text-gray-500 block mt-0.5">
                                Location: {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-[#F1BCCE]">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tamper-evident luxury packaging verified
                  </span>
                  {trackingData?.tracking_url && (
                    <a
                      href={trackingData.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-[#111111] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#D84B7E] transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      Open Carrier Portal <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          orderIdentifier={selectedInvoiceOrder}
        />
      )}

      {/* Add / Edit Saved Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#F1BCCE] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold block">
                  Delivery Destination
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111] mt-0.5">
                  {editingAddressId ? 'Edit Saved Address' : 'Add New Saved Address'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Address Type Pill Selector */}
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
                      onClick={() => setAddrType(item.type)}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        addrType === item.type
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

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    required
                    placeholder="Recipient Name"
                    className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>
              </div>

              {/* Building & Street */}
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                  Flat / House / Building Name
                </label>
                <input
                  type="text"
                  value={addrBuilding}
                  onChange={(e) => setAddrBuilding(e.target.value)}
                  placeholder="e.g. Villa 12, Palm Meadows"
                  className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                  Street Address / Area *
                </label>
                <input
                  type="text"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  required
                  placeholder="Street name, Sector, Cross"
                  className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addrLandmark}
                  onChange={(e) => setAddrLandmark(e.target.value)}
                  placeholder="e.g. Near Botanical Garden"
                  className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                />
              </div>

              {/* City, State & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    required
                    placeholder="Bengaluru"
                    className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    required
                    placeholder="Karnataka"
                    className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                    Pincode / Postal *
                  </label>
                  <input
                    type="text"
                    value={addrPostalCode}
                    onChange={(e) => setAddrPostalCode(e.target.value)}
                    required
                    placeholder="560001"
                    className="w-full bg-white border border-[#F1BCCE] rounded-xl p-2.5 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                  />
                </div>
              </div>

              {/* Country & Default Checkbox */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#D84B7E] accent-[#D84B7E] rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 font-bold">Set as Default Delivery Address</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#F1BCCE]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-[#F1BCCE] text-gray-700 text-xs uppercase tracking-wider font-bold rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-8 py-2.5 bg-[#D84B7E] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isSavingAddress ? 'Saving...' : editingAddressId ? 'Done — Update Address' : 'Done — Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Review & Glow / Look Photo Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#F1BCCE] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold block">
                  Delivered Order Verified Review
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111] mt-0.5">
                  {reviewingItem.productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="p-1.5 text-gray-500 hover:text-black rounded-full hover:bg-[#FCE7F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1.5">
                  Your Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating ? 'fill-[#D84B7E] text-[#D84B7E]' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">
                    {reviewRating === 5
                      ? 'Exceptional (5/5)'
                      : reviewRating === 4
                      ? 'Great (4/5)'
                      : reviewRating === 3
                      ? 'Good (3/5)'
                      : reviewRating === 2
                      ? 'Fair (2/5)'
                      : 'Poor (1/5)'}
                  </span>
                </div>
              </div>

              {/* Review */}
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                  Review *
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about formulation results, skincare glow, fabric elegance, or styling..."
                  className="w-full bg-white border border-[#F1BCCE] rounded-xl p-3 text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                  required
                />
              </div>

              {/* Upload Glow / Look Photo */}
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#D84B7E]" />
                    Upload Skincare Glow / Fashion Look Photo (Optional)
                  </span>
                  {isUploadingPhoto && (
                    <span className="text-[10px] text-[#D84B7E] font-bold animate-pulse">
                      Uploading photo...
                    </span>
                  )}
                </label>

                {reviewPhotoUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-white border border-[#F1BCCE] rounded-2xl">
                    <div className="relative group">
                      <img
                        src={reviewPhotoUrl}
                        alt="Look Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-[#F1BCCE]"
                      />
                      <button
                        type="button"
                        onClick={() => setReviewPhotoUrl('')}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-[#D84B7E] text-white rounded-full hover:bg-black transition-colors cursor-pointer shadow-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-gray-800">📸 Photo Attached</p>
                      <p className="text-[11px] text-gray-500">
                        Your photo will be showcased in the verified client review gallery.
                      </p>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-[#F1BCCE] hover:border-[#D84B7E] rounded-2xl cursor-pointer transition-colors text-xs font-bold text-gray-700">
                    <Upload className="w-4 h-4 text-[#D84B7E]" />
                    <span>Upload photo of your glow or look</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAccountPhotoFileChange}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                  </label>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#F1BCCE]">
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="px-6 py-2.5 bg-white border border-[#F1BCCE] text-gray-700 text-xs uppercase tracking-wider font-bold rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || isUploadingPhoto}
                  className="px-8 py-2.5 bg-[#D84B7E] text-white text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmittingReview ? 'Publishing...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Exchange Modal */}
      {selectedReturnOrder && (
        <ReturnRequestModal
          order={selectedReturnOrder}
          onClose={() => setSelectedReturnOrder(null)}
          onSuccess={() => {
            api.get('/shipping/returns').then((res) => setUserReturnRequests(res.data)).catch(() => {});
          }}
        />
      )}
    </div>
  );
};
