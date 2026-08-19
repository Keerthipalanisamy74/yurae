import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Heart, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { itemCount, openCart } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const mobileItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shop', path: '/shop', icon: Store },
    { name: 'Wishlist', path: '/wishlist', icon: Heart, badge: wishlist.length },
    { name: 'Cart', action: openCart, icon: ShoppingBag, badge: itemCount },
    { name: 'Account', path: isAuthenticated ? '/account' : '/login', icon: UserIcon },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDF4F7]/95 backdrop-blur-md border-t border-[#F1BCCE] py-2 px-4 flex justify-around items-center shadow-lg">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.path && location.pathname === item.path;

        if (item.action) {
          return (
            <button
              key={item.name}
              onClick={item.action}
              className="flex flex-col items-center gap-1 text-[#111111]/70 hover:text-[#D84B7E] relative py-1 px-3 cursor-pointer"
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D84B7E] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold">{item.name}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.name}
            to={item.path!}
            className={`flex flex-col items-center gap-1 relative py-1 px-3 transition-colors ${
              isActive ? 'text-[#D84B7E] font-bold' : 'text-[#111111]/70 hover:text-[#D84B7E]'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#D84B7E] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};
