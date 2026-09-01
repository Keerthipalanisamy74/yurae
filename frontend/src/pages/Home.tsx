import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, ShieldCheck, Heart, Leaf, Award, ExternalLink } from 'lucide-react';
import { InstagramIcon } from '../components/common/Icons';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { SEO } from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoryContext';

export const Home: React.FC = () => {
  const { isAdmin } = useAuth();
  const { categories, getCategoryIcon } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=12')
      .then((prodRes) => {
        setProducts(prodRes.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Find latest uploaded product per category to use as category cover image fallback
  const getCategoryProduct = (slug: string): Product | undefined => {
    return products.find(
      (p) => p.category?.slug?.toLowerCase() === slug.toLowerCase() && p.images && p.images.length > 0
    );
  };

  const heroProduct = products.find((p) => p.images && p.images.length > 0) || products[0];

  // Display categories: if dynamic categories loaded, use them; else fallback
  const displayCategories = categories.length > 0
    ? categories
    : [
        { id: 1, name: 'Skincare', slug: 'skincare', description: 'Korean botanical formulas & glass skin rituals', image: '' },
        { id: 2, name: 'Fashion', slug: 'fashion', description: 'Mulberry silks, soft linens & bespoke silhouettes', image: '' },
        { id: 3, name: 'Accessories', slug: 'accessories', description: 'Freshwater pearls, silk scrunchies & fine jewelry', image: '' },
      ];

  const heroCategories = displayCategories;

  // Gradient presets for cards when no image exists
  const cardGradients = [
    'from-[#D84B7E] to-[#6A1A3A]',
    'from-[#B5426C] to-[#451025]',
    'from-[#8C2C55] to-[#2B0817]',
    'from-[#8A3B60] to-[#360D1E]',
    'from-[#C0527B] to-[#5C1633]',
  ];

  return (
    <div className="space-y-10 sm:space-y-14 bg-[#F8B4CB] pb-24">
      <SEO
        title="YURAE — Luxury Outfits & Korean-Inspired Botanical Skincare"
        description="Discover bespoke minimalist fashion, artisanal jewelry, and Korean-inspired botanical skincare rituals crafted for radiant, timeless elegance."
        image={heroProduct?.images?.[0]?.image_url || '/images/hero-skincare-model.jpg'}
        type="website"
      />
      
      {/* 1. HERO SECTION */}
      <section className="relative flex items-center bg-gradient-to-b from-[#F8B4CB] via-[#F6A2BE] to-[#F48FB1] overflow-hidden border-b-2 border-[#F06292] shadow-xs">
        {/* Soft Background Ambient Gradients */}
        <div className="absolute top-0 right-0 w-56 sm:w-72 h-56 sm:h-72 bg-[#D81B60]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-[#C2185B]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-3 sm:space-y-4"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D84B7E] text-[#FDF4F7] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-[#F1BCCE] shadow-xs">
                <Sparkles className="w-3 h-3 text-[#FDF4F7]" />
                Korean Botanical Rituals • Yurae Beauty
              </div>

              <h1 className="font-serif text-2xl min-[400px]:text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111111] leading-[1.18] tracking-tight">
                The Origin of <span className="italic font-light text-[#D84B7E]">Skincare</span>
              </h1>

              <p className="text-xs sm:text-sm text-gray-700 font-light leading-relaxed max-w-lg">
                Clean, artisanal botanical skincare and modern luxury essentials crafted to nourish, restore, and reveal timeless skin brilliance.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-2">
                <Link
                  to="/shop"
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#D84B7E] hover:bg-[#4A0E2E] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer touch-target min-h-[44px]"
                >
                  Explore All Products
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Brand Highlights */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-[#F1BCCE]/60 max-w-md">
                <div className="space-y-0.5">
                  <span className="font-serif text-sm sm:text-base font-bold text-[#111111] block">100%</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-wider">Authentic</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-serif text-sm sm:text-base font-bold text-[#111111] block">Pure</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-wider">Botanicals</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-serif text-sm sm:text-base font-bold text-[#111111] block">Luxury</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-wider">Formulas</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right: Dynamic All Categories Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className={`lg:col-span-6 flex flex-col justify-center space-y-2.5 sm:space-y-3 ${
                heroCategories.length > 3
                  ? 'max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1.5 py-1 touch-scroll'
                  : ''
              }`}
            >
              {heroCategories.map((cat, idx) => {
                const prod = getCategoryProduct(cat.slug);
                const coverImage = cat.image || prod?.images?.[0]?.image_url;
                const icon = getCategoryIcon(cat);
                const cardHeight = heroCategories.length > 3 ? 'h-18 sm:h-20' : 'h-20 sm:h-24';

                const categoryBadge = cat.slug.toLowerCase().includes('skin')
                  ? 'Hero Rituals'
                  : cat.slug.toLowerCase().includes('fashion')
                  ? 'Fashion Collection'
                  : cat.slug.toLowerCase().includes('access')
                  ? 'Fine Jewelry'
                  : `${cat.name} Collection`;

                return (
                  <Link
                    key={cat.id || cat.slug || idx}
                    to={`/category/${cat.slug}`}
                    className={`group relative ${cardHeight} rounded-xl sm:rounded-2xl overflow-hidden border border-[#F1BCCE] shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between p-3.5 sm:p-4 text-white cursor-pointer touch-target shrink-0`}
                  >
                    {coverImage ? (
                      <>
                        <img
                          src={coverImage}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 group-hover:from-black/90 group-hover:via-black/60 transition-colors" />
                      </>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-r ${cardGradients[idx % cardGradients.length]} opacity-95`} />
                    )}

                    <div className="relative z-10 space-y-0.5">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#F8D7E3] font-bold flex items-center gap-1">
                        <span>{icon}</span>
                        <span>{categoryBadge}</span>
                      </span>
                      <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-white tracking-wide leading-tight">
                        {cat.name.toLowerCase().startsWith('yurae') ? cat.name : `Yurae ${cat.name}`}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-gray-200 font-light line-clamp-1">
                        {cat.description || `Explore ${cat.name} formulations and luxury essentials`}
                      </p>
                    </div>

                    <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 group-hover:bg-[#D84B7E] group-hover:border-[#D84B7E] flex items-center justify-center transition-all duration-300 shrink-0 shadow-xs">
                      <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. DYNAMIC STORE CATEGORIES GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1 mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D84B7E] font-bold block">
            Curated Collections ({displayCategories.length})
          </span>
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#111111]">
            Explore Our Categories
          </h2>
        </div>

        <div className={`grid grid-cols-1 ${
          displayCategories.length === 1
            ? 'max-w-md mx-auto'
            : displayCategories.length === 2
            ? 'md:grid-cols-2'
            : displayCategories.length === 4
            ? 'md:grid-cols-2 lg:grid-cols-4'
            : 'md:grid-cols-3'
        } gap-5 sm:gap-6`}>
          {displayCategories.map((cat, idx) => {
            const prod = getCategoryProduct(cat.slug);
            const coverImage = cat.image || prod?.images?.[0]?.image_url;
            const icon = getCategoryIcon(cat);

            return (
              <motion.div
                key={cat.id || cat.slug || idx}
                whileHover={{ y: -4 }}
                className={`group relative h-[260px] sm:h-[290px] md:h-[310px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-end p-5 sm:p-6 text-white border border-[#F1BCCE] bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} transition-all`}
              >
                {coverImage ? (
                  <>
                    <img
                      src={coverImage}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <div className="space-y-2">
                      <span className="text-4xl block">{icon}</span>
                      <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">
                        {cat.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative z-10 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-[#F8D7E3] font-bold flex items-center gap-1">
                    <span>{icon}</span>
                    <span>{cat.slug === 'skincare' ? 'Hero Category' : 'Department'}</span>
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
                    {cat.name.toLowerCase().startsWith('yurae') ? cat.name : `YURAE ${cat.name}`}
                  </h3>
                  <p className="text-[11px] text-gray-200 font-light italic line-clamp-2">
                    {cat.description || `"The finest essentials for your ritual."`}
                  </p>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-1 cursor-pointer touch-target"
                  >
                    Explore {cat.name} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. UPLOADED PRODUCTS CATALOG */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D84B7E] font-bold block mb-0.5">
              Store Catalog
            </span>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#111111]">
              Available Products
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-[#111111] hover:text-[#D84B7E] transition-colors flex items-center gap-1.5 cursor-pointer touch-target"
          >
            View Full Shop <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 sm:h-80 bg-[#FCE7F0] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 sm:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl sm:rounded-3xl text-center space-y-2.5 shadow-xs">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#111111]">
              {isAdmin ? 'No Products Added Yet' : 'New Formulations Arriving Soon'}
            </h3>
            <p className="text-xs text-gray-600">
              {isAdmin
                ? 'Upload your skincare, fashion, or accessory products from the Admin Dashboard.'
                : 'Our botanical artisans are handcrafting our upcoming signature batch. Explore our categories or connect with our concierge.'}
            </p>
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-block mt-3 px-5 py-2 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#4A0E2E] transition-all touch-target"
              >
                Open Admin Dashboard
              </Link>
            ) : (
              <Link
                to="/skincare"
                className="inline-block mt-3 px-5 py-2 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#4A0E2E] transition-all touch-target"
              >
                Explore Categories
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. BRAND PILLARS / VALUES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-5 sm:p-8 md:p-10 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl sm:rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-center shadow-xs">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center mx-auto shadow-2xs">
              <Leaf className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#111111]">Pure Botanicals</h4>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              Formulated with nutrient-dense active botanicals and barrier-repairing ingredients.
            </p>
          </div>

          <div className="space-y-2 border-y md:border-y-0 md:border-x border-[#F1BCCE]/60 py-4 md:py-0 md:px-5">
            <div className="w-10 h-10 rounded-xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#111111]">Dermatologically Safe</h4>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              Gentle, pH-balanced formulas designed specifically for sensitive and barrier-compromised skin.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center mx-auto shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#111111]">Artisanal Luxury</h4>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              Hand-packaged in signature glass and sustainable materials for a timeless unboxing ritual.
            </p>
          </div>
        </div>
      </section>

      {/* 5. INSTAGRAM COMMUNITY BANNER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="relative overflow-hidden p-6 sm:p-8 md:p-10 bg-gradient-to-r from-[#F8B4CB] via-[#F6A2BE] to-[#F48FB1] border-2 border-[#F06292] rounded-2xl sm:rounded-3xl shadow-sm">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#D84B7E]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-md shrink-0">
                <InstagramIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#D84B7E] font-bold block">
                  Connect With Us On Instagram
                </span>
                <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#111111]">
                  Follow @yuraebeauty
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md">
                  Join our vibrant community for daily glass-skin rituals, behind-the-scenes formulation moments, and exclusive announcements.
                </p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/yuraebeauty/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 bg-[#D84B7E] hover:bg-[#4A0E2E] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 touch-target cursor-pointer"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Visit Instagram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
