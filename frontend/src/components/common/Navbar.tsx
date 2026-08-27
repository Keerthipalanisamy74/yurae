import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Heart, User as UserIcon, ShoppingBag, Menu, X, LogOut,
  Sparkles, ChevronRight, Package, Truck, RotateCcw, HelpCircle,
  Phone, ArrowRight, Layers
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { SearchOverlay } from './SearchOverlay';
import { AnnouncementBar } from './AnnouncementBar';
import { CurrencySelector } from './CurrencySelector';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const { itemCount, openCart } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated, user, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Skincare', path: '/skincare' },
    { name: 'Fashion', path: '/fashion' },
    { name: 'Accessories', path: '/accessories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <AnnouncementBar />
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? 'glass-nav shadow-xs py-2 sm:py-2.5' : 'bg-[#FDF4F7] py-2.5 sm:py-4 border-b border-[#F1BCCE]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Left Zone: Hamburger Menu Toggle + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Three Lines (Hamburger) Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-[#111111] hover:text-[#D84B7E] hover:bg-[#FCE7F0]/60 transition-all cursor-pointer shrink-0 -ml-1 rounded-xl touch-target flex items-center justify-center border border-transparent hover:border-[#F1BCCE]"
              aria-label="Open Navigation Menu"
              title="Explore Menu & Categories"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Brand Logo & Title */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D84B7E] rounded-xl py-0.5 shrink-0"
              aria-label="Yurae Beauty Home"
            >
              {/* Brand Logo Emblem */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-[#D84B7E]/15 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform scale-110" />
                <img
                  src="/logo/logo-emblem.png"
                  alt="Yurae Beauty Logo Crest"
                  className="w-8 h-8 min-[400px]:w-9 min-[400px]:h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 object-contain relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_4px_14px_rgba(216,75,126,0.35)] transition-all duration-300 transform group-hover:scale-105"
                  loading="eager"
                  decoding="async"
                />
              </div>

              {/* Line 1: YURAE BEAUTY | Line 2: The Origin of Skincare */}
              <div className="flex flex-col justify-center shrink-0">
                <span className="font-serif text-sm min-[400px]:text-base sm:text-lg lg:text-xl font-bold tracking-[0.12em] min-[400px]:tracking-[0.16em] text-[#111111] group-hover:text-[#D84B7E] transition-colors duration-300 leading-none whitespace-nowrap block">
                  YURAE BEAUTY
                </span>
                <span className="text-[7px] min-[400px]:text-[7.5px] sm:text-[8.5px] uppercase tracking-[0.18em] sm:tracking-[0.24em] text-[#D84B7E] font-semibold mt-0.5 sm:mt-1 leading-none whitespace-nowrap block">
                  The Origin of Skincare
                </span>
              </div>
            </Link>
          </div>

          {/* Center Zone: Navigation Links for Desktop */}
          <nav className="hidden xl:flex items-center justify-center gap-3.5 2xl:gap-7 shrink-0 px-2 lg:px-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-[11px] 2xl:text-xs uppercase tracking-wider 2xl:tracking-widest transition-all duration-200 font-bold whitespace-nowrap py-1 ${
                    isActive
                      ? 'text-[#D84B7E] border-b-2 border-[#D84B7E]'
                      : 'text-[#111111]/85 hover:text-[#D84B7E] hover:border-b-2 hover:border-[#F1BCCE]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Zone: Action Icons with Touch Targets */}
          <div className="flex items-center space-x-1 sm:space-x-2.5 2xl:space-x-3.5 shrink-0">
            {/* Global Currency Selector */}
            <CurrencySelector variant="desktop" />

            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#111111] hover:text-[#D84B7E] transition-colors cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0 touch-target"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-[#111111] hover:text-[#D84B7E] transition-colors relative cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0 touch-target"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#D84B7E] text-[#FDF4F7] text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Single Unified Profile / Admin Button */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center text-[10px] sm:text-xs uppercase tracking-wider text-[#FDF4F7] font-bold bg-[#D84B7E] px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-xs shrink-0 min-h-[36px]"
                title="Admin Management Studio"
              >
                Admin
              </Link>
            ) : (
              <Link
                to={isAuthenticated ? '/account' : '/login'}
                className="p-2 text-[#111111] hover:text-[#D84B7E] transition-colors flex items-center gap-1 cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0 touch-target"
                aria-label="Account"
                title="Client Account"
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )}

            {/* Cart Drawer Toggle */}
            <button
              onClick={openCart}
              className="p-2 sm:px-3 sm:py-2 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all rounded-full flex items-center gap-1.5 sm:gap-2 relative shadow-xs cursor-pointer shrink-0 touch-target active:scale-95"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FDF4F7]" />
              <span className="text-xs font-bold px-0.5 text-[#FDF4F7]">{itemCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* LUXURY SIDE NAVIGATION DRAWER (Opens when clicking the Three Lines icon) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-50 w-full max-w-sm sm:max-w-md bg-[#FFF8FA] h-full shadow-2xl flex flex-col border-r border-[#F1BCCE] overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-[#F1BCCE] bg-[#FDF4F7] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo/logo-emblem.png"
                    alt="Yurae Beauty Emblem"
                    className="w-9 h-9 object-contain drop-shadow-xs"
                  />
                  <div>
                    <span className="font-serif text-sm font-bold tracking-[0.16em] text-[#111111] block">
                      YURAE BEAUTY
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-[#D84B7E] font-semibold block">
                      The Origin of Skincare
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#F8D7E3] text-gray-700 hover:text-[#111111] rounded-full transition-colors cursor-pointer touch-target flex items-center justify-center"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                
                {/* 1. MAIN STORE NAVIGATION */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 block mb-1">
                    Store Navigation
                  </span>
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold py-2.5 px-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-[#D84B7E] text-white shadow-xs'
                            : 'text-[#111111] hover:bg-[#FCE7F0] hover:text-[#D84B7E]'
                        }`}
                      >
                        <span>{link.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </Link>
                    );
                  })}

                  <Link
                    to="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Explore Full Store Catalog
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* 3. QUICK SERVICES & DISCOVERY */}
                <div className="pt-2 border-t border-[#F1BCCE]/60 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 block mb-1">
                    Discovery &amp; Orders
                  </span>
                  <Link
                    to="/track"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs text-[#111111] hover:text-[#D84B7E] py-2 px-3 rounded-xl hover:bg-[#FCE7F0] transition-colors"
                  >
                    <Package className="w-4 h-4 text-[#D84B7E]" />
                    <span className="font-semibold">Track Your Order</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between text-xs text-[#111111] hover:text-[#D84B7E] py-2 px-3 rounded-xl hover:bg-[#FCE7F0] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-[#D84B7E]" />
                      <span className="font-semibold">Saved Wishlist</span>
                    </div>
                    {wishlist.length > 0 && (
                      <span className="text-[10px] font-bold bg-[#D84B7E] text-white px-2 py-0.5 rounded-full">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openCart();
                    }}
                    className="w-full flex items-center justify-between text-xs text-[#111111] hover:text-[#D84B7E] py-2 px-3 rounded-xl hover:bg-[#FCE7F0] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4 text-[#D84B7E]" />
                      <span className="font-semibold">Shopping Bag</span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#D84B7E] text-white px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  </button>
                </div>

                {/* 4. CUSTOMER CARE & POLICIES */}
                <div className="pt-2 border-t border-[#F1BCCE]/60 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 block mb-1">
                    Customer Care &amp; Policies
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <Link
                      to="/shipping-policy"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#D84B7E]" />
                      <span>Shipping</span>
                    </Link>
                    <Link
                      to="/return-policy"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D84B7E]" />
                      <span>Returns</span>
                    </Link>
                    <Link
                      to="/faq"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#D84B7E]" />
                      <span>FAQs</span>
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#D84B7E]" />
                      <span>Concierge</span>
                    </Link>
                  </div>
                </div>

                {/* 5. CURRENCY SELECTOR */}
                <div className="pt-2 border-t border-[#F1BCCE]/60 flex items-center justify-between px-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-gray-600">
                    Store Currency
                  </span>
                  <CurrencySelector variant="mobile" />
                </div>

              </div>

              {/* Drawer Footer: User Account / Sign In */}
              <div className="p-4 border-t border-[#F1BCCE] bg-[#FDF4F7]">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#D84B7E] text-white flex items-center justify-center text-xs font-bold">
                          {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <span className="text-[11px] font-bold text-[#111111] block leading-tight truncate">
                            {user?.first_name || user?.email}
                          </span>
                          <span className="text-[9px] text-gray-500 block">Logged In</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-[10px] uppercase tracking-wider font-bold text-white bg-[#111111] px-2.5 py-1 rounded-full hover:bg-[#D84B7E] transition-colors"
                        >
                          Admin Studio
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center py-2 px-3 bg-white border border-[#F1BCCE] text-[#111111] text-xs font-bold rounded-xl hover:bg-[#FCE7F0] transition-colors"
                      >
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="py-2 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-wider rounded-xl text-center hover:bg-[#111111] transition-all shadow-xs cursor-pointer"
                    >
                      Sign In / Register
                    </Link>
                    <p className="text-[10px] text-center text-gray-500">
                      Create an account to track orders &amp; unlock member benefits
                    </p>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;
