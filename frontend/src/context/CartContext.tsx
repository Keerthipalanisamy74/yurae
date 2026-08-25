import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, Product, ProductVariant } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: Cart | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
    } catch {
      // Ignore initial unauthenticated / empty cart error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to your beauty bag', 'info');
      return;
    }
    try {
      const res = await api.post('/cart/items', {
        product_id: product.id,
        variant_id: variant ? variant.id : undefined,
        quantity,
      });
      setCart(res.data);
      showToast('Added to your beauty bag', 'success');
      openCart();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add item to bag';
      showToast(msg, 'error');
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      setCart(res.data);
    } catch {
      showToast('Failed to update quantity', 'error');
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      setCart(res.data);
      showToast('Product removed', 'info');
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.delete('/cart');
      setCart(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        itemCount: cart ? cart.item_count : 0,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
