import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Key, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';
import { Order, Address } from '../types';
import { useToast } from '../context/ToastContext';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { formatRawPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'password'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Profile Form
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    api.get('/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err));

    api.get('/auth/addresses')
      .then((res) => setAddresses(res.data))
      .catch((err) => console.error(err));
  }, []);

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
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-[#F1BCCE] mb-10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">Client Dashboard</span>
            <h1 className="font-serif text-3xl font-bold text-[#111111]">
              Welcome, {user?.first_name} {user?.last_name}
            </h1>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-[#FFF8FA] text-[#111111] text-xs uppercase tracking-widest font-bold rounded-full border border-[#F1BCCE] hover:bg-[#D84B7E] hover:text-[#FDF4F7] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="space-y-2 bg-[#FFF8FA] p-4 border border-[#F1BCCE] rounded-2xl h-fit shadow-xs">
            {[
              { id: 'orders', label: 'My Orders', icon: Package },
              { id: 'profile', label: 'Profile Details', icon: User },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'password', label: 'Security & Password', icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
                    active ? 'bg-[#D84B7E] text-[#FDF4F7] shadow-xs' : 'text-gray-700 hover:bg-[#FCE7F0]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main Dashboard Content Area */}
          <div className="lg:col-span-3">
            
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-bold text-[#111111]">Order History</h2>
                
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

                          <div className="space-y-2">
                            {ord.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-xs">
                                <span className="text-[#111111] font-bold">{item.product_name} x {item.quantity}</span>
                                <span className="text-gray-600">
                                  {formatRawPrice(item.price * item.quantity, orderCurrency)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-[#F1BCCE] flex justify-between items-center text-sm">
                            <div>
                              <span className="text-xs text-gray-600">Payment: </span>
                              <span className="text-xs font-bold text-emerald-700">{ord.payment_status}</span>
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

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-bold text-[#111111]">Saved Addresses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-2 relative shadow-xs">
                      {addr.is_default && (
                        <span className="px-2.5 py-0.5 bg-[#D84B7E] text-white text-[9px] uppercase font-bold rounded-full">
                          Default Address
                        </span>
                      )}
                      <h4 className="font-serif text-base font-bold text-[#111111]">{addr.name}</h4>
                      <p className="text-xs text-gray-700 font-normal">{addr.address_line1}, {addr.address_line2}</p>
                      <p className="text-xs text-gray-700 font-normal">{addr.city}, {addr.state} - {addr.postal_code}</p>
                      <p className="text-xs text-gray-700 font-semibold">{addr.country}</p>
                      <p className="text-xs text-gray-500 font-mono">{addr.phone}</p>
                    </div>
                  ))}
                </div>
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
    </div>
  );
};
