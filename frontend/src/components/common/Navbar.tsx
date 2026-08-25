import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, User as UserIcon, ShoppingBag, Menu, X, LogOut } from 'lucide-react';
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
          isScrolled ? 'glass-nav shadow-xs py-2.5' : 'bg-[#FDF4F7] py-3.5 sm:py-4 border-b border-[#F1BCCE]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Zone: Hamburger (screens < xl) + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Button (screens < xl) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 text-[#111111] hover:text-[#D84B7E] transition-colors cursor-pointer shrink-0 -ml-1 rounded-lg"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Brand Logo & Title: Top-Left Position */}
            <Link
              to="/"
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D84B7E] rounded-xl py-0.5 shrink-0"
              aria-label="Yurae Beauty Home"
            >
              {/* Brand Logo Emblem */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-[#D84B7E]/15 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform scale-110" />
                <img
                  src="/logo/logo-emblem.png"
                  alt="Yurae Beauty Logo Crest"
                  className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 object-contain relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_4px_14px_rgba(216,75,126,0.35)] transition-all duration-300 transform group-hover:scale-105"
                  loading="eager"
                  decoding="async"
                />
              </div>

              {/* Line 1: YURAE BEAUTY (Single Line) | Line 2: The Origin of Skincare (Down) */}
              <div className="flex flex-col justify-center shrink-0">
                <span className="font-serif text-base sm:text-lg lg:text-xl font-bold tracking-[0.16em] text-[#111111] group-hover:text-[#D84B7E] transition-colors duration-300 leading-none whitespace-nowrap block">
                  YURAE BEAUTY
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-[0.24em] text-[#D84B7E] font-semibold mt-1 leading-none whitespace-nowrap block">
                  The Origin of Skincare
                </span>
              </div>
            </Link>
          </div>

          {/* Center Zone: Navigation Links with Equal Balanced Spacing */}
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

          {/* Right Zone: Action Icons with Equal Balanced Spacing */}
          <div className="flex items-center space-x-2 sm:space-x-3 2xl:space-x-3.5 shrink-0">
            {/* Global Currency Selector */}
            <CurrencySelector variant="desktop" />

            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2 text-[#111111] hover:text-[#D84B7E] transition-colors cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-1.5 sm:p-2 text-[#111111] hover:text-[#D84B7E] transition-colors relative cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#D84B7E] text-[#FDF4F7] text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Single Unified Profile / Admin Button */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center text-[10px] sm:text-xs uppercase tracking-wider text-[#FDF4F7] font-bold bg-[#D84B7E] px-3 sm:px-3.5 py-1.5 rounded-full border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-xs shrink-0"
                title="Admin Management Studio"
              >
                Admin
              </Link>
            ) : (
              <Link
                to={isAuthenticated ? '/account' : '/login'}
                className="p-1.5 sm:p-2 text-[#111111] hover:text-[#D84B7E] transition-colors flex items-center gap-1 cursor-pointer rounded-full hover:bg-[#FCE7F0]/60 shrink-0"
                aria-label="Account"
                title="Client Account"
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            )}

            {/* Cart Drawer Toggle */}
            <button
              onClick={openCart}
              className="p-1.5 sm:p-2.5 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all rounded-full flex items-center gap-1.5 sm:gap-2 relative shadow-xs cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FDF4F7]" />
              <span className="text-xs font-bold px-0.5 text-[#FDF4F7]">{itemCount}</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu (screens < xl) */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#FFF8FA] border-b border-[#F1BCCE] px-6 py-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1BCCE]">
              <img
                src="/logo/logo-emblem.png"
                alt="Yurae Beauty"
                className="w-9 h-9 object-contain"
              />
              <div>
                <span className="font-serif text-sm font-bold tracking-[0.2em] text-[#111111] block">
                  YURAE BEAUTY
                </span>
                <span className="text-[8px] uppercase tracking-[0.25em] text-[#D84B7E] font-semibold block">
                  The Origin of Skincare
                </span>
              </div>
            </div>

            <div className="pb-3 border-b border-[#F1BCCE] flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Currency</span>
              <CurrencySelector variant="mobile" />
            </div>

            <div className="space-y-2.5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm uppercase tracking-wider font-bold text-[#111111] hover:text-[#D84B7E] py-1 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="pt-2 border-t border-[#F1BCCE] space-y-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs uppercase tracking-widest font-bold text-[#FDF4F7] bg-[#D84B7E] py-2.5 px-4 rounded-xl text-center shadow-xs"
                  >
                    Admin Management Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-xs uppercase tracking-widest font-bold text-rose-700 bg-rose-50 border border-rose-200 py-2.5 px-4 rounded-xl text-center cursor-pointer hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out ({user?.first_name || 'Account'})
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#F1BCCE]">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-xs uppercase tracking-widest font-bold text-[#111111] bg-[#F8D7E3] py-2.5 px-4 rounded-xl text-center"
                >
                  Sign In / Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
