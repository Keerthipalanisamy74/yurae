import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Heart, ShoppingBag, User as UserIcon, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { itemCount, openCart } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated, isAdmin } = useAuth();

  // Admins do not have customer shopping options (Wishlist / Bag)
  const mobileItems = isAdmin
    ? [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Shop', path: '/shop', icon: Store },
        { name: 'Admin Studio', path: '/admin', icon: Shield },
        { name: 'Account', path: '/account', icon: UserIcon },
      ]
    : [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Shop', path: '/shop', icon: Store },
        { name: 'Wishlist', path: '/wishlist', icon: Heart, badge: wishlist.length },
        { name: 'Bag', action: openCart, icon: ShoppingBag, badge: itemCount },
        { name: 'Account', path: isAuthenticated ? '/account' : '/login', icon: UserIcon },
      ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDF4F7]/95 backdrop-blur-lg border-t border-[#F1BCCE] py-1 px-1.5 pb-safe pl-safe pr-safe flex justify-around items-center shadow-lg"
    >
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.path && location.pathname === item.path;

        if (item.action) {
          return (
            <button
              key={item.name}
              onClick={item.action}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[#111111]/75 hover:text-[#D84B7E] relative py-1 px-1 min-h-[44px] min-w-[44px] max-w-[72px] cursor-pointer touch-target active:scale-95 transition-all"
              aria-label={`Open ${item.name}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#D84B7E] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[9.5px] uppercase tracking-wider font-bold truncate max-w-full">
                {item.name}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.name}
            to={item.path!}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative py-1 px-1 min-h-[44px] min-w-[44px] max-w-[72px] touch-target transition-all active:scale-95 ${
              isActive ? 'text-[#D84B7E] font-bold' : 'text-[#111111]/75 hover:text-[#D84B7E]'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#D84B7E] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className={`text-[9px] sm:text-[9.5px] uppercase tracking-wider truncate max-w-full ${isActive ? 'font-bold' : 'font-semibold'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

