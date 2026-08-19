import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectPath = searchParams.get('redirect') || '/account';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      showToast('Welcome back to Yurae Beauty', 'success');
      navigate(redirectPath);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@yuraebeauty.com');
      setPassword('Admin@123');
    } else {
      setEmail('customer@yuraebeauty.com');
      setPassword('Customer@123');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-[#FDF4F7]">
      <div className="max-w-md w-full p-8 sm:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Client Portal</span>
          <h1 className="font-serif text-3xl font-bold text-[#111111]">Welcome Back</h1>
          <p className="text-xs text-gray-600 font-normal">Sign in to access your luxury beauty bag & order history.</p>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div className="p-3 bg-[#FCE7F0] rounded-2xl border border-[#F1BCCE] space-y-1.5 text-center">
          <span className="text-[10px] uppercase font-bold text-[#D84B7E] block">Login</span>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('customer')}
              className="px-3 py-1 bg-white rounded-full text-[11px] font-bold border border-[#F1BCCE] hover:border-[#D84B7E] cursor-pointer"
            >
              User
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin')}
              className="px-3 py-1 bg-white rounded-full text-[11px] font-bold border border-[#F1BCCE] hover:border-[#D84B7E] cursor-pointer text-[#D84B7E]"
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#D84B7E] font-bold hover:underline">Forgot?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-md cursor-pointer"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600 pt-2">
          New to Yurae Beauty?{' '}
          <Link to="/register" className="font-bold text-[#D84B7E] hover:underline">Create an Account</Link>
        </p>
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
      });
      showToast('Account created successfully! Welcome to Yurae Beauty.', 'success');
      navigate('/account');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create account';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-[#FDF4F7]">
      <div className="max-w-lg w-full p-8 sm:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Join Yurae</span>
          <h1 className="font-serif text-3xl font-bold text-[#111111]">Create an Account</h1>
          <p className="text-xs text-gray-600 font-normal">Enjoy private luxury consultations and complimentary order gifts.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Phone Number (Optional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimum 8 characters"
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-md cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#D84B7E] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('demo-token');
  const [showResetForm, setShowResetForm] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      showToast(res.data.message || 'Password reset instructions sent', 'success');
      setShowResetForm(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to send reset instructions';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email,
        reset_token: resetToken,
        new_password: newPassword,
      });
      showToast(res.data.message || 'Password reset successfully', 'success');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to reset password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-[#FDF4F7]">
      <div className="max-w-md w-full p-8 sm:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Security</span>
          <h1 className="font-serif text-3xl font-bold text-[#111111]">Reset Password</h1>
          <p className="text-xs text-gray-600 font-normal">
            Enter your account email to receive reset instructions.
          </p>
        </div>

        {!showResetForm ? (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-md cursor-pointer"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="p-3 bg-[#FCE7F0] rounded-xl text-xs text-gray-700 border border-[#F1BCCE]">
              Reset token active for <span className="font-bold text-[#111111]">{email}</span>.
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-md cursor-pointer"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-gray-600 pt-2">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-[#D84B7E] hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};
