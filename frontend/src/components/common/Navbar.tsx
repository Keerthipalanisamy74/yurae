import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, User as UserIcon, ShoppingBag, Menu, X } from 'lucide-react';
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
  const { isAuthenticated, user, isAdmin } = useAuth();

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
          isScrolled ? 'glass-nav shadow-xs py-3' : 'bg-[#FDF4F7] py-5 border-b border-[#F1BCCE]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#111111] hover:text-[#D84B7E] cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Left Brand Title */}
          <Link to="/" className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.25em] text-[#111111] hover:text-[#D84B7E] transition-colors">
              YURAE BEAUTY
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#D84B7E] font-semibold hidden sm:block">
              The Origin of Skincare
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs uppercase tracking-widest transition-all duration-200 font-bold ${
                    isActive
                      ? 'text-[#D84B7E] border-b-2 border-[#D84B7E] pb-1'
                      : 'text-[#111111]/85 hover:text-[#D84B7E] hover:border-b-2 hover:border-[#F1BCCE] pb-1'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-xs uppercase tracking-widest text-[#FDF4F7] font-bold bg-[#D84B7E] px-3.5 py-1 rounded-full border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-xs"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Global Currency Selector */}
            <CurrencySelector variant="desktop" />

            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#111111] hover:text-[#D84B7E] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-[#111111] hover:text-[#D84B7E] transition-colors relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#D84B7E] text-[#FDF4F7] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="p-2 text-[#111111] hover:text-[#D84B7E] transition-colors flex items-center gap-1 cursor-pointer"
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5" />
              {isAuthenticated && (
                <span className="text-xs font-bold text-[#111111] hidden xl:inline">
                  {user?.first_name}
                </span>
              )}
            </Link>

            {/* Cart Drawer Toggle */}
            <button
              onClick={openCart}
              className="p-2.5 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] hover:bg-[#111111] hover:text-[#FDF4F7] transition-all rounded-full flex items-center gap-2 relative shadow-xs cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#FDF4F7]" />
              <span className="text-xs font-bold px-1 text-[#FDF4F7]">{itemCount}</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#FDF4F7] border-b border-[#F1BCCE] px-6 py-6 space-y-4">
            <div className="pb-3 border-b border-[#F1BCCE] flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Currency</span>
              <CurrencySelector variant="mobile" />
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm uppercase tracking-wider font-bold text-[#111111] hover:text-[#D84B7E]"
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm uppercase tracking-wider font-bold text-[#D84B7E]"
              >
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
