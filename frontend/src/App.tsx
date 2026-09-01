import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CategoryProvider } from './context/CategoryContext';

import { Navbar } from './components/common/Navbar';
import { MobileNav } from './components/common/MobileNav';
import { CartDrawer } from './components/common/CartDrawer';
import { Footer } from './components/common/Footer';
import { InstallAppPrompt } from './components/common/InstallAppPrompt';
import { MarketingBannerHub } from './components/common/MarketingBannerHub';
import { WelcomeSplashIntro } from './components/common/WelcomeSplashIntro';

import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { Login, Register, ForgotPassword } from './pages/AuthPages';
import { AdminDashboard } from './pages/AdminDashboard';
import { AboutPage, ContactPage } from './pages/InfoPages';
import {
  ReturnRefundPolicyPage, ShippingPolicyPage, PrivacyPolicyPage,
  TermsConditionsPage, FAQHelpPage, PoliciesHubPage
} from './pages/PolicyPages';
import { TrackingPage } from './pages/TrackingPage';

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <CategoryProvider>
                  <div className="min-h-screen flex flex-col bg-[#F8B4CB] text-[#111111]">
                    <WelcomeSplashIntro />
                    <Navbar />
                    <MarketingBannerHub />
                    <CartDrawer />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/category/:categorySlug" element={<Shop />} />
                        <Route path="/skincare" element={<Shop categorySlug="skincare" />} />
                        <Route path="/fashion" element={<Shop categorySlug="fashion" />} />
                        <Route path="/accessories" element={<Shop categorySlug="accessories" />} />
                        <Route path="/product/:slug" element={<ProductDetails />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/track" element={<TrackingPage />} />
                        <Route path="/track/:orderNumber" element={<TrackingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FAQHelpPage />} />
                        <Route path="/help" element={<FAQHelpPage />} />
                        <Route path="/policies" element={<PoliciesHubPage />} />
                        <Route path="/legal" element={<PoliciesHubPage />} />
                        <Route path="/shipping" element={<ShippingPolicyPage />} />
                        <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                        <Route path="/returns" element={<ReturnRefundPolicyPage />} />
                        <Route path="/return-policy" element={<ReturnRefundPolicyPage />} />
                        <Route path="/refund-policy" element={<ReturnRefundPolicyPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms" element={<TermsConditionsPage />} />
                        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
                        <Route path="*" element={<Home />} />
                      </Routes>
                    </main>
                    <Footer />
                    <MobileNav />
                    <InstallAppPrompt />
                  </div>
                </CategoryProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
