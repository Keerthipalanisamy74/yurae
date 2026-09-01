import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Heart, User as UserIcon, ShoppingBag, Menu, X, LogOut,
  Sparkles, ChevronRight, Package, Truck, RotateCcw, HelpCircle,
  Phone, ArrowRight, Layers, Shield, ExternalLink
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../context/CategoryContext';
import { SearchOverlay } from './SearchOverlay';
import { AnnouncementBar } from './AnnouncementBar';
import { CurrencySelector } from './CurrencySelector';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  const { itemCount, openCart } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const { categories, getCategoryIcon } = useCategories();

  const handleProfileMouseEnter = () => {
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
    }
    setIsProfileMenuOpen(true);
  };

  const handleProfileMouseLeave = () => {
    profileTimeoutRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 250);
  };

  // Close menus on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  interface NavLinkItem {
    name: string;
    path: string;
    slug?: string;
    icon?: string;
  }

  const dynamicCategoryLinks: NavLinkItem[] = categories.length > 0
    ? categories.map((cat) => ({
        name: cat.name,
        path: `/category/${cat.slug}`,
        slug: cat.slug,
        icon: getCategoryIcon(cat),
      }))
    : [
        { name: 'Skincare', path: '/skincare', slug: 'skincare', icon: '🌸' },
        { name: 'Fashion', path: '/fashion', slug: 'fashion', icon: '👗' },
        { name: 'Accessories', path: '/accessories', slug: 'accessories', icon: '💍' },
      ];

  const desktopNavLinks: NavLinkItem[] = [
    { name: 'Home', path: '/' },
    ...dynamicCategoryLinks,
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <AnnouncementBar />
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? 'glass-nav shadow-md py-2 sm:py-2.5' : 'bg-[#F8B4CB] py-2.5 sm:py-4 border-b-2 border-[#F06292] shadow-xs'
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
          <nav className="hidden xl:flex items-center justify-center gap-3 2xl:gap-6 shrink-0 px-2 lg:px-4">
            {desktopNavLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.slug &&
                  (location.pathname === `/${link.slug}` ||
                    location.pathname === `/category/${link.slug}` ||
                    (location.pathname === '/shop' && location.search.includes(`category=${link.slug}`))));
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

            {/* Wishlist - ONLY for non-admins */}
            {!isAdmin && (
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
            )}

            {/* Myntra-Style Luxury Profile Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 p-2 text-[#111111] hover:text-[#D84B7E] transition-colors cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0 touch-target group"
                aria-label="Profile Menu"
                aria-expanded={isProfileMenuOpen}
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#111111] group-hover:text-[#D84B7E] transition-colors" />
                <span className="hidden lg:inline text-[10px] uppercase font-bold tracking-wider text-[#111111] group-hover:text-[#D84B7E] transition-colors">
                  {isAuthenticated && user?.first_name ? user.first_name : 'Profile'}
                </span>
              </button>

              {/* Profile Dropdown Menu Flyout */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-[#F1BCCE] py-4 px-5 z-50 text-left"
                  >
                    {/* Top Header Section */}
                    {isAuthenticated ? (
                      <div className="pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#FAF0F4] border border-[#F1BCCE] text-[#D84B7E] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-xs text-[#111111] leading-tight truncate">
                              Hello, {user?.first_name || 'Valued Patron'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono truncate">{user?.email}</p>
                          </div>
                        </div>
                        <Link
                          to={isAdmin ? '/admin' : '/account'}
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block w-full py-2 px-3 bg-[#FAF0F4] hover:bg-[#FCE7F0] text-[#D84B7E] text-xs font-bold text-center rounded-xl border border-[#F1BCCE] transition-colors"
                        >
                          {isAdmin ? 'Open Store Admin Studio' : 'View Account & Orders'}
                        </Link>
                      </div>
                    ) : (
                      <div className="pb-3.5 border-b border-gray-100 space-y-2">
                        <div>
                          <p className="font-bold text-xs text-[#111111]">Welcome</p>
                          <p className="text-[10px] text-gray-500">To access account and manage orders</p>
                        </div>
                        <Link
                          to="/login"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block w-full py-2.5 px-4 bg-[#D84B7E] hover:bg-[#111111] text-white text-xs font-bold uppercase tracking-wider text-center rounded-xl transition-all shadow-xs"
                        >
                          Login / Signup
                        </Link>
                      </div>
                    )}

                    {/* Quick E-Commerce Links */}
                    <div className="py-2 border-b border-gray-100 space-y-0.5 text-xs font-semibold">
                      {!isAdmin ? (
                        <Link
                          to={isAuthenticated ? '/account' : '/track'}
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>Orders &amp; Tracking</span>
                          </div>
                        </Link>
                      ) : (
                        <Link
                          to="/account"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            <span>Admin Profile &amp; Settings</span>
                          </div>
                        </Link>
                      )}

                      {!isAdmin && (
                        <Link
                          to="/wishlist"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Heart className="w-4 h-4 text-gray-400" />
                            <span>Wishlist</span>
                          </div>
                          {wishlist.length > 0 && (
                            <span className="text-[10px] font-bold bg-[#D84B7E] text-white px-1.5 py-0.2 rounded-full">
                              {wishlist.length}
                            </span>
                          )}
                        </Link>
                      )}

                      <Link
                        to="/contact"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                      >
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>Contact Us</span>
                      </Link>

                      <Link
                        to="/about"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-700 hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-[#D84B7E]" />
                          <span>Yurae Insider</span>
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-[#FAF0F4] text-[#D84B7E] px-1.5 py-0.5 rounded border border-[#F1BCCE]">
                          New
                        </span>
                      </Link>
                    </div>

                    {/* Customer Support & Policies */}
                    <div className="pt-2 space-y-0.5 text-[11px] text-gray-600">
                      <Link
                        to="/shipping-policy"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block py-1 px-2 rounded-md hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                      >
                        Shipping &amp; Delivery
                      </Link>
                      <Link
                        to="/return-policy"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block py-1 px-2 rounded-md hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                      >
                        Returns &amp; Exchanges
                      </Link>
                      <Link
                        to="/faq"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block py-1 px-2 rounded-md hover:text-[#D84B7E] hover:bg-[#FAF0F4] transition-colors"
                      >
                        Help &amp; FAQs
                      </Link>

                      {/* Admin Management Link - ONLY for Authenticated Admins */}
                      {isAdmin && (
                        <div className="pt-2 mt-1.5 border-t border-gray-100">
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[#FAF0F4] text-[#D84B7E] font-bold hover:bg-[#111111] hover:text-white transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Admin Management Studio</span>
                          </Link>
                        </div>
                      )}

                      {/* Sign Out (if logged in) */}
                      {isAuthenticated && (
                        <div className="pt-1.5 mt-1 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2 py-1 px-2 rounded-md text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Drawer Toggle or Admin Studio Button */}
            {!isAdmin ? (
              <button
                onClick={openCart}
                className="p-2 sm:px-3 sm:py-2 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all rounded-full flex items-center gap-1.5 sm:gap-2 relative shadow-xs cursor-pointer shrink-0 touch-target active:scale-95"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FDF4F7]" />
                <span className="text-xs font-bold px-0.5 text-[#FDF4F7]">{itemCount}</span>
              </button>
            ) : (
              <Link
                to="/admin"
                className="p-2 sm:px-3.5 sm:py-2 bg-[#111111] text-white hover:bg-[#D84B7E] transition-all rounded-full flex items-center gap-1.5 shadow-xs shrink-0 touch-target font-bold text-xs uppercase tracking-wider"
                title="Open Admin Management Studio"
              >
                <Shield className="w-3.5 h-3.5 text-[#D84B7E]" />
                <span className="hidden sm:inline">Admin Studio</span>
              </Link>
            )}
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
              className="relative z-50 w-full max-w-sm sm:max-w-md bg-[#FAD2E1] h-full shadow-2xl flex flex-col border-r-2 border-[#F06292] overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-[#F06292] bg-[#F8BED3] flex items-center justify-between">
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
                
                {/* 1. MAIN STORE NAVIGATION & DYNAMIC CATEGORIES */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 block mb-1">
                      Store Navigation
                    </span>
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold py-2.5 px-3 rounded-xl transition-colors ${
                        location.pathname === '/'
                          ? 'bg-[#D84B7E] text-white shadow-xs'
                          : 'text-[#111111] hover:bg-[#FCE7F0] hover:text-[#D84B7E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span>✨</span>
                        <span>Home</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>

                    <Link
                      to="/shop"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold py-2.5 px-3 rounded-xl transition-colors ${
                        location.pathname === '/shop' && !location.search
                          ? 'bg-[#D84B7E] text-white shadow-xs'
                          : 'text-[#111111] hover:bg-[#FCE7F0] hover:text-[#D84B7E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 text-[#D84B7E]" />
                        <span>All Products</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  </div>

                  {/* DYNAMIC CATEGORIES LIST */}
                  <div className="space-y-1 pt-2 border-t border-[#F1BCCE]/50">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 block mb-1">
                      Shop By Category ({categories.length || 3})
                    </span>
                    {dynamicCategoryLinks.map((cat) => {
                      const isActive =
                        location.pathname === cat.path ||
                        location.pathname === `/${cat.slug}` ||
                        (location.pathname === '/shop' && location.search.includes(`category=${cat.slug}`));
                      return (
                        <Link
                          key={cat.slug}
                          to={cat.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between text-xs uppercase tracking-wider font-bold py-2.5 px-3 rounded-xl transition-colors ${
                            isActive
                              ? 'bg-[#D84B7E] text-white shadow-xs'
                              : 'text-[#111111] hover:bg-[#FCE7F0] hover:text-[#D84B7E]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">{cat.icon}</span>
                            <span>{cat.name}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </Link>
                      );
                    })}
                  </div>

                  {/* Info Pages */}
                  <div className="space-y-1 pt-2 border-t border-[#F1BCCE]/50">
                    <Link
                      to="/about"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between text-xs uppercase tracking-wider font-bold py-2 px-3 rounded-xl text-gray-700 hover:bg-[#FCE7F0] hover:text-[#D84B7E] transition-colors"
                    >
                      <span>About Us</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between text-xs uppercase tracking-wider font-bold py-2 px-3 rounded-xl text-gray-700 hover:bg-[#FCE7F0] hover:text-[#D84B7E] transition-colors"
                    >
                      <span>Contact & Concierge</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  </div>
                </div>

                {/* 3. QUICK SERVICES & DISCOVERY */}
                <div className="pt-2 border-t border-[#F1BCCE]/60 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2 block mb-1">
                    Discovery &amp; Services
                  </span>
                  {!isAdmin && (
                    <Link
                      to="/track"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 text-xs text-[#111111] hover:text-[#D84B7E] py-2 px-3 rounded-xl hover:bg-[#FCE7F0] transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#D84B7E]" />
                      <span className="font-semibold">Track Your Order</span>
                    </Link>
                  )}
                  {!isAdmin && (
                    <>
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
                    </>
                  )}
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

                {/* 5. INSTAGRAM COMMUNITY */}
                <div className="pt-2 border-t border-[#F1BCCE]/60">
                  <a
                    href="https://www.instagram.com/yuraebeauty/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#FFF5F8] to-[#FCE7F0] border border-[#F1BCCE] text-[#111111] hover:text-[#D84B7E] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
                        <InstagramIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block leading-tight">Follow on Instagram</span>
                        <span className="text-[10px] text-[#D84B7E] font-semibold block">@yuraebeauty</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D84B7E] transition-colors" />
                  </a>
                </div>

                {/* 6. CURRENCY SELECTOR */}
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
