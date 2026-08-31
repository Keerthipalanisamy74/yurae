import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { api } from '../services/api';

export type CategoryLike = {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  created_at?: string;
};

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
  getCategoryIcon: (category?: CategoryLike | string) => string;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Helper to provide a relevant luxury emoji/icon for any category name or slug
export const getCategoryIconHelper = (category?: CategoryLike | string): string => {
  if (!category) return '✨';
  const nameOrSlug = typeof category === 'string'
    ? category.toLowerCase()
    : `${category.name} ${category.slug || ''}`.toLowerCase();

  if (nameOrSlug.includes('skin') || nameOrSlug.includes('serum') || nameOrSlug.includes('cream') || nameOrSlug.includes('face')) {
    return '🌸';
  }
  if (nameOrSlug.includes('fashion') || nameOrSlug.includes('dress') || nameOrSlug.includes('apparel') || nameOrSlug.includes('cloth')) {
    return '👗';
  }
  if (nameOrSlug.includes('access') || nameOrSlug.includes('jewel') || nameOrSlug.includes('ring') || nameOrSlug.includes('pearl')) {
    return '💍';
  }
  if (nameOrSlug.includes('hair') || nameOrSlug.includes('scalp') || nameOrSlug.includes('shampoo')) {
    return '💇‍♀️';
  }
  if (nameOrSlug.includes('body') || nameOrSlug.includes('bath') || nameOrSlug.includes('soap')) {
    return '🧴';
  }
  if (nameOrSlug.includes('fragrance') || nameOrSlug.includes('perfume') || nameOrSlug.includes('scent')) {
    return '✨';
  }
  if (nameOrSlug.includes('lip') || nameOrSlug.includes('makeup') || nameOrSlug.includes('cosmetic')) {
    return '💄';
  }
  if (nameOrSlug.includes('sun') || nameOrSlug.includes('spf')) {
    return '☀️';
  }
  if (nameOrSlug.includes('men')) {
    return '👔';
  }
  return '🌿';
};

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        refreshCategories,
        getCategoryIcon: getCategoryIconHelper,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
