import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  moveToCart: (product: Product) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      setWishlist(res.data);
    } catch {
      // Ignore initial unauthenticated / empty wishlist error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.product_id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      showToast('Please log in to save items to your wishlist', 'info');
      return;
    }

    const inList = isInWishlist(product.id);
    if (inList) {
      try {
        await api.delete(`/wishlist/${product.id}`);
        setWishlist((prev) => prev.filter((item) => item.product_id !== product.id));
        showToast('Product removed from wishlist', 'info');
      } catch {
        showToast('Failed to remove from wishlist', 'error');
      }
    } else {
      try {
        const res = await api.post('/wishlist', { product_id: product.id });
        setWishlist((prev) => [...prev, res.data]);
        showToast('Added to wishlist', 'success');
      } catch {
        showToast('Failed to add to wishlist', 'error');
      }
    }
  };

  const moveToCart = async (product: Product) => {
    await addToCart(product);
    await toggleWishlist(product);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        moveToCart,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
