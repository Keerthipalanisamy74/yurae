import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { api } from '../../services/api';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const popularSearches = ['Niacinamide', 'Centella Cleanser', 'Vitamin C Serum', 'Silk Wrap Dress', 'Freshwater Pearls'];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products?search=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/shop?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectPopular = (term: string) => {
    setQuery(term);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col"
        >
          {/* Header Bar */}
          <div className="bg-[#FDF4F7] border-b border-[#F1BCCE] p-6 md:p-8 shadow-md">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-4 relative">
                <Search className="w-6 h-6 text-[#D84B7E] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent text-xl md:text-2xl font-serif text-[#111111] placeholder:text-[#111111]/40 outline-none font-bold"
                  autoFocus
                />
                {loading && <Loader2 className="w-5 h-5 text-[#D84B7E] animate-spin" />}
              </form>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F8D7E3] rounded-full transition-colors cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-6 h-6 text-[#111111]" />
              </button>
            </div>
          </div>

          {/* Results Container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              {!query.trim() ? (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold mb-4">
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectPopular(term)}
                        className="px-4 py-2 bg-[#FFF8FA] border border-[#F1BCCE] hover:border-[#D84B7E] text-sm text-[#111111] font-medium rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        {term}
                        <ArrowRight className="w-3.5 h-3.5 text-[#D84B7E]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">
                      {results.length} Result{results.length !== 1 ? 's' : ''} for "{query}"
                    </h3>
                  </div>

                  {results.length === 0 && !loading ? (
                    <div className="text-center py-16">
                      <p className="text-lg font-serif text-[#111111] font-bold">We couldn't find what you're looking for.</p>
                      <p className="text-sm text-gray-600 mt-2">Try searching for ingredients or dress categories.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {results.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          onClick={onClose}
                          className="group flex gap-4 p-3 bg-[#FFF8FA] border border-[#F1BCCE] hover:border-[#D84B7E] rounded-xl transition-all shadow-xs"
                        >
                          <img
                            src={product.images?.[0]?.image_url || ''}
                            alt={product.name}
                            className="w-16 h-20 object-cover rounded-lg shrink-0 bg-[#FCE7F0]"
                          />
                          <div className="flex flex-col justify-center">
                            <span className="text-[10px] uppercase tracking-widest text-[#D84B7E] font-bold">
                              {product.category?.name || 'Skincare'}
                            </span>
                            <h4 className="font-serif text-sm font-bold text-[#111111] group-hover:text-[#D84B7E] transition-colors line-clamp-2">
                              {product.name}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="font-bold text-[#111111]">
                                ₹{(product.sale_price || product.price).toLocaleString()}
                              </span>
                              {product.sale_price && (
                                <span className="line-through text-gray-400">₹{product.price.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
