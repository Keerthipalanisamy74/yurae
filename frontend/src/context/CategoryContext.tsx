import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, Subcategory } from '../types';
import { api } from '../services/api';

export type CategoryLike = {
  id?: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  created_at?: string;
};

export const getSubcategoryIconHelper = (sub?: Subcategory | string): string => {
  if (!sub) return '✨';
  const text = typeof sub === 'string'
    ? sub.toLowerCase()
    : `${sub.name} ${sub.slug || ''}`.toLowerCase();

  if (text.includes('skincare') || text.includes('facial')) return '🌸';
  if (text.includes('bodycare') || text.includes('body wash') || text.includes('body lotion') || text.includes('body scrub') || text.includes('body oil')) return '🧴';
  if (text.includes('haircare') || text.includes('scalp') || text.includes('shampoo') || text.includes('conditioner')) return '💇‍♀️';
  if (text.includes('ring')) return '💍';
  if (text.includes('neck') || text.includes('pendant') || text.includes('chain') || text.includes('choker')) return '📿';
  if (text.includes('bag') || text.includes('pouch') || text.includes('clutch') || text.includes('tote')) return '👜';
  if (text.includes('watch') || text.includes('time')) return '⌚';
  if (text.includes('ear') || text.includes('stud') || text.includes('hoop')) return '💎';
  if (text.includes('brace') || text.includes('bangle') || text.includes('cuff')) return '💫';
  if (text.includes('hair') || text.includes('scrunchie') || text.includes('pin') || text.includes('clip')) return '🎀';
  if (text.includes('cleanse') || text.includes('wash') || text.includes('foam')) return '🫧';
  if (text.includes('toner') || text.includes('essence') || text.includes('mist')) return '💧';
  if (text.includes('serum') || text.includes('ampoule') || text.includes('elixir')) return '🧪';
  if (text.includes('cream') || text.includes('moistur') || text.includes('lotion')) return '🧴';
  if (text.includes('sun') || text.includes('spf')) return '☀️';
  if (text.includes('mask') || text.includes('peel')) return '🧖‍♀️';
  if (text.includes('lip') || text.includes('balm')) return '💄';
  if (text.includes('eye')) return '👁️';
  if (text.includes('hand') || text.includes('foot')) return '✨';
  if (text.includes('dress') || text.includes('gown')) return '👗';
  if (text.includes('kurti') || text.includes('tunic') || text.includes('ethnic')) return '🥻';
  if (text.includes('top') || text.includes('blouse') || text.includes('shirt')) return '👚';
  if (text.includes('skirt') || text.includes('pant') || text.includes('trouser')) return '👖';
  if (text.includes('silk') || text.includes('lounge') || text.includes('robe') || text.includes('sleep') || text.includes('kimono')) return '👘';
  return '✨';
};

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
  getCategoryIcon: (category?: CategoryLike | string) => string;
  getSubcategoryIcon: (sub?: Subcategory | string) => string;
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
        getSubcategoryIcon: getSubcategoryIconHelper,
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
