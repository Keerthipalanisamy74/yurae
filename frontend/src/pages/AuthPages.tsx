import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const loggedUser = await login(email.trim(), password.trim());
      showToast('Welcome back to Yurae Beauty', 'success');
      
      const customRedirect = searchParams.get('redirect');
      if (customRedirect) {
        navigate(customRedirect);
      } else if (loggedUser?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
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
    <div className="min-h-[75vh] flex items-center justify-center py-10 sm:py-16 px-3 sm:px-4 bg-[#F8B4CB] pb-32 xl:pb-16">
      <div className="max-w-md w-full p-5 sm:p-8 md:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xl space-y-5 sm:space-y-6">
        <div className="text-center space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Client Portal</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">Welcome Back</h1>
          <p className="text-xs text-gray-600 font-normal">Sign in to access your luxury beauty bag & order history.</p>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div className="p-3 bg-[#FCE7F0] rounded-2xl border border-[#F1BCCE] space-y-1.5 text-center">
          <span className="text-[10px] uppercase font-bold text-[#D84B7E] block">Quick Fill Demo</span>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('customer')}
              className="px-3.5 py-1.5 bg-[#F8D7E3] rounded-full text-[11px] font-bold border border-[#F1BCCE] hover:border-[#D84B7E] cursor-pointer touch-target min-h-[36px]"
            >
              User
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin')}
              className="px-3.5 py-1.5 bg-[#F8D7E3] rounded-full text-[11px] font-bold border border-[#F1BCCE] hover:border-[#D84B7E] cursor-pointer text-[#D84B7E] touch-target min-h-[36px]"
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
              placeholder="admin@yuraebeauty.com"
              className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#D84B7E] font-bold hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password (e.g. Admin@123)"
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 pr-10 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs font-semibold cursor-pointer p-1"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-all shadow-md cursor-pointer touch-target min-h-[44px] active:scale-98 disabled:opacity-50"
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
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  const { sendRegistrationOtp, verifyRegistrationOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Real-time email validation on blur
  const validateEmailAddress = async (emailToTest: string) => {
    const clean = emailToTest.trim().toLowerCase();
    if (!clean) {
      setEmailError(null);
      return;
    }
    if (!clean.includes('@') || !clean.includes('.')) {
      setEmailError('Please enter a complete and valid email address.');
      return;
    }

    try {
      setIsValidatingEmail(true);
      const res = await api.post('/auth/validate-email', { email: clean });
      if (!res.data.valid) {
        setEmailError(res.data.message || 'This email address does not exist. Please check your email.');
      } else {
        setEmailError(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'This email address does not exist. Please check your email.';
      setEmailError(msg);
    } finally {
      setIsValidatingEmail(false);
    }
  };

  // Step 1: Send verification OTP to customer's email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      setEmailError(null);
      const res = await sendRegistrationOtp({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: cleanEmail,
        phone: phone.trim() || undefined,
        password: password,
      });

      showToast(res?.message || `Verification code has been dispatched to ${cleanEmail}`, 'success');
      setStep('verify');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'The email address does not exist or cannot receive emails. Please check your email.';
      setEmailError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize account registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      showToast('Please enter the 6-digit verification code from your email', 'error');
      return;
    }

    try {
      setLoading(true);
      await verifyRegistrationOtp(email.trim().toLowerCase(), otp.trim());
      showToast('Email verified and account created successfully! Welcome to Yurae Beauty.', 'success');
      navigate('/account');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid or expired verification code';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const res = await sendRegistrationOtp({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password: password,
      });
      showToast(res?.message || `New verification code sent in real time to ${email.trim()}`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Could not resend verification code';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 sm:py-16 px-3 sm:px-4 bg-[#F8B4CB] pb-32 xl:pb-16">
      <div className="max-w-lg w-full p-5 sm:p-8 md:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xl space-y-5 sm:space-y-6">
        <div className="text-center space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">
            {step === 'form' ? 'Join Yurae' : 'Email Verification'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
            {step === 'form' ? 'Create an Account' : 'Verify Your Email'}
          </h1>
          <p className="text-xs text-gray-600 font-normal leading-relaxed">
            {step === 'form'
              ? 'Enter your details. We will verify your email before activating your account.'
              : `A 6-digit verification code has been dispatched to ${email}. Please check your email inbox to enter the code below.`}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-1">
          <div className={`h-1.5 rounded-full transition-all ${step === 'form' ? 'w-8 bg-[#D84B7E]' : 'w-4 bg-emerald-500'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 'verify' ? 'w-8 bg-[#D84B7E]' : 'w-4 bg-gray-200'}`} />
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="e.g. Elena"
                  className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="e.g. Rao"
                  className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block">Email Address *</label>
                {isValidatingEmail && (
                  <span className="text-[10px] text-[#D84B7E] font-medium animate-pulse">Verifying domain...</span>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onBlur={(e) => validateEmailAddress(e.target.value)}
                required
                placeholder="e.g. yourname@domain.com"
                className={`w-full bg-[#FDF4F7] border ${
                  emailError ? 'border-red-500 bg-red-50/40' : 'border-[#F1BCCE]'
                } rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]`}
              />
              {emailError ? (
                <div className="mt-1.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-1.5 shadow-2xs">
                  <span>⚠️</span>
                  <span>{emailError}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-500 mt-1 block">A real-time 6-digit confirmation code will be sent to this email inbox.</span>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] min-h-[44px] text-[#111111]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || isValidatingEmail}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-all shadow-md cursor-pointer touch-target min-h-[44px] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying & Dispatching Code...' : 'Verify Email & Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-[#FAF0F4] rounded-2xl border border-[#F1BCCE] text-center space-y-1">
              <span className="text-[11px] text-gray-700 block">
                Verification code dispatched to: <strong className="text-[#D84B7E] font-bold">{email}</strong>
              </span>
              <span className="text-[10px] text-gray-500 block">
                Please check your email inbox (and spam/promotions folder) for the 6-digit code.
              </span>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="123456"
                className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl p-3 text-center text-2xl font-mono tracking-[0.4em] font-bold outline-none focus:border-[#D84B7E] text-[#111111] min-h-[48px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2"
            >
              {loading ? 'Activating Account...' : 'Confirm & Activate Account'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-gray-600 hover:text-black font-semibold cursor-pointer underline"
              >
                ← Change Email / Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

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
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // 1. Request OTP Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your account email address', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      showToast(res.data.message || 'Verification code sent in real time to your email', 'success');
      setStep('otp');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to send verification code';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });
      showToast(res.data.message || 'Code verified successfully', 'success');
      setStep('password');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid verification code';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      showToast(res.data.message || 'Password reset successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to reset password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 bg-[#F8B4CB]">
      <div className="max-w-md w-full p-8 sm:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Account Recovery</span>
          <h1 className="font-serif text-3xl font-bold text-[#111111]">
            {step === 'email' ? 'Reset Password' : step === 'otp' ? 'Enter Security Code' : 'Create New Password'}
          </h1>
          <p className="text-xs text-gray-600 font-normal">
            {step === 'email'
              ? 'Enter your registered email to receive a 6-digit one-time verification code.'
              : step === 'otp'
              ? `We sent a 6-digit security code to ${email}. Please check your email inbox.`
              : 'Choose a strong new password for your Yurae luxury account.'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-2">
          <div className={`h-1.5 rounded-full transition-all ${step === 'email' ? 'w-8 bg-[#D84B7E]' : 'w-4 bg-emerald-500'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 'otp' ? 'w-8 bg-[#D84B7E]' : step === 'password' ? 'w-4 bg-emerald-500' : 'w-4 bg-gray-200'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 'password' ? 'w-8 bg-[#D84B7E]' : 'w-4 bg-gray-200'}`} />
        </div>

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                Account Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. yourname@domain.com"
                className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1 text-center">
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="123456"
                className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl p-3 text-center text-2xl font-mono tracking-[0.4em] font-bold outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code & Proceed'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-xs text-[#D84B7E] font-bold hover:underline cursor-pointer"
              >
                Didn't receive code? Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Create New Password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-type new password"
                className="w-full bg-[#F8D7E3] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="w-full py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#4A0E2E] transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Login'}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-gray-600 pt-2 border-t border-[#F1BCCE]">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-[#D84B7E] hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};
