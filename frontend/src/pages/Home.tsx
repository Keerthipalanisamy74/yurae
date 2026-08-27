import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, ShieldCheck, Heart, Leaf, Award } from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { SEO } from '../components/common/SEO';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=12'),
      api.get('/categories')
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Find latest uploaded product per category to use as category cover
  const getCategoryProduct = (slug: string): Product | undefined => {
    return products.find(
      (p) => p.category?.slug?.toLowerCase() === slug.toLowerCase() && p.images && p.images.length > 0
    );
  };

  const skincareProduct = getCategoryProduct('skincare');
  const fashionProduct = getCategoryProduct('fashion');
  const accessoriesProduct = getCategoryProduct('accessories');

  const heroProduct = products.find((p) => p.images && p.images.length > 0) || products[0];

  return (
    <div className="space-y-10 sm:space-y-14">
      <SEO
        title="YURAE — Luxury Outfits & Korean-Inspired Botanical Skincare"
        description="Discover bespoke minimalist fashion, artisanal jewelry, and Korean-inspired botanical skincare rituals crafted for radiant, timeless elegance."
        image={heroProduct?.images?.[0]?.image_url || '/images/hero-skincare-model.jpg'}
        type="website"
      />
      
      {/* 1. HERO SECTION */}
      <section className="relative flex items-center bg-gradient-to-br from-[#FFF5F8] via-[#FCE7F0] to-[#FDF4F7] overflow-hidden border-b border-[#F1BCCE]">
        {/* Soft Background Ambient Gradients */}
        <div className="absolute top-0 right-0 w-56 sm:w-72 h-56 sm:h-72 bg-[#F1BCCE]/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-[#D84B7E]/10 rounded-full blur-2xl pointer-events-none" />

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

              <p className="text-xs sm:text-sm text-gray-700 font-normal leading-relaxed max-w-lg">
                Clean, artisanal botanical skincare and modern luxury essentials crafted to nourish, restore, and reveal timeless skin brilliance.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#111111] transition-all shadow-md flex items-center justify-center gap-2 border border-[#D84B7E] cursor-pointer touch-target active:scale-95"
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

            {/* Hero Right: Three Categories Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="lg:col-span-6 flex flex-col justify-center space-y-2.5 sm:space-y-3"
            >
              {/* 1. SKINCARE */}
              <Link
                to="/skincare"
                className="group relative h-20 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border border-[#F1BCCE] shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between p-3.5 sm:p-4 text-white cursor-pointer touch-target"
              >
                <img
                  src={skincareProduct?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'}
                  alt="Yurae Skin"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 group-hover:from-black/90 group-hover:via-black/60 transition-colors" />

                <div className="relative z-10 space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#F8D7E3] font-bold block">
                    🌸 Hero Rituals
                  </span>
                  <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-white tracking-wide leading-tight">
                    Yurae Skin
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-200 font-light line-clamp-1">
                    Korean botanical formulas &amp; glass skin rituals
                  </p>
                </div>

                <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 group-hover:bg-[#D84B7E] group-hover:border-[#D84B7E] flex items-center justify-center transition-all duration-300 shrink-0 shadow-xs">
                  <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* 2. FASHION */}
              <Link
                to="/fashion"
                className="group relative h-20 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border border-[#F1BCCE] shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between p-3.5 sm:p-4 text-white cursor-pointer touch-target"
              >
                <img
                  src={fashionProduct?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'}
                  alt="Yurae Fashion"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 group-hover:from-black/90 group-hover:via-black/60 transition-colors" />

                <div className="relative z-10 space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#F8D7E3] font-bold block">
                    👗 Luxury Apparel
                  </span>
                  <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-white tracking-wide leading-tight">
                    Yurae Fashion
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-200 font-light line-clamp-1">
                    Mulberry silks, soft linens &amp; bespoke silhouettes
                  </p>
                </div>

                <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 group-hover:bg-[#D84B7E] group-hover:border-[#D84B7E] flex items-center justify-center transition-all duration-300 shrink-0 shadow-xs">
                  <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* 3. ACCESSORIES */}
              <Link
                to="/accessories"
                className="group relative h-20 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border border-[#F1BCCE] shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between p-3.5 sm:p-4 text-white cursor-pointer touch-target"
              >
                <img
                  src={accessoriesProduct?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'}
                  alt="Yurae Accessories"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 group-hover:from-black/90 group-hover:via-black/60 transition-colors" />

                <div className="relative z-10 space-y-0.5">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#F8D7E3] font-bold block">
                    💍 Fine Accents
                  </span>
                  <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-white tracking-wide leading-tight">
                    Yurae Accessories
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-gray-200 font-light line-clamp-1">
                    Freshwater pearls, silk scrunchies &amp; fine jewelry
                  </p>
                </div>

                <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 group-hover:bg-[#D84B7E] group-hover:border-[#D84B7E] flex items-center justify-center transition-all duration-300 shrink-0 shadow-xs">
                  <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. THREE STORE CATEGORIES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1 mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D84B7E] font-bold block">
            Curated Collections
          </span>
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#111111]">
            Explore Our Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* 1. SKINCARE CATEGORY CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            className="group relative h-[260px] sm:h-[290px] md:h-[310px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-end p-5 sm:p-6 text-white border border-[#F1BCCE] bg-gradient-to-br from-[#D84B7E] to-[#6A1A3A] transition-all"
          >
            {skincareProduct?.images?.[0]?.image_url ? (
              <>
                <img
                  src={skincareProduct.images[0].image_url}
                  alt="Yurae Skin"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#D84B7E]/90 via-[#8A244E] to-[#3B0E20] flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <span className="text-3xl block">🌸</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">Botanical Formulas</span>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest text-[#F8D7E3] font-bold block">Hero Category</span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">YURAE SKIN</h3>
              <p className="text-[11px] text-gray-200 font-light italic">"The ritual your skin deserves."</p>
              <Link
                to="/skincare"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-1 cursor-pointer touch-target"
              >
                Explore Yurae Skin <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* 2. FASHION CATEGORY CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            className="group relative h-[260px] sm:h-[290px] md:h-[310px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-end p-5 sm:p-6 text-white border border-[#F1BCCE] bg-gradient-to-br from-[#B5426C] to-[#451025] transition-all"
          >
            {fashionProduct?.images?.[0]?.image_url ? (
              <>
                <img
                  src={fashionProduct.images[0].image_url}
                  alt="Yurae Fashion"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#B5426C]/90 via-[#6E1C3C] to-[#2E0B18] flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <span className="text-3xl block">👗</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">Luxury Apparel</span>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest text-[#F8D7E3] font-bold block">Apparel</span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">YURAE FASHION</h3>
              <p className="text-[11px] text-gray-200 font-light italic">"Express your effortless elegance."</p>
              <Link
                to="/fashion"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-1 cursor-pointer touch-target"
              >
                Explore Yurae Fashion <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* 3. ACCESSORIES CATEGORY CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            className="group relative h-[260px] sm:h-[290px] md:h-[310px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-end p-5 sm:p-6 text-white border border-[#F1BCCE] bg-gradient-to-br from-[#8C2C55] to-[#2B0817] transition-all"
          >
            {accessoriesProduct?.images?.[0]?.image_url ? (
              <>
                <img
                  src={accessoriesProduct.images[0].image_url}
                  alt="Yurae Accessories"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#8C2C55]/90 via-[#54122E] to-[#1C050F] flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <span className="text-3xl block">💍</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">Fine Accents</span>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest text-[#F8D7E3] font-bold block">Details</span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">YURAE ACCESSORIES</h3>
              <p className="text-[11px] text-gray-200 font-light italic">"Complete your signature look."</p>
              <Link
                to="/accessories"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-1 cursor-pointer touch-target"
              >
                Explore Yurae Accessories <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

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
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#111111]">No Products Added Yet</h3>
            <p className="text-xs text-gray-600">Upload your skincare, fashion, or accessory products from the Admin Dashboard.</p>
            <Link
              to="/admin"
              className="inline-block mt-3 px-5 py-2 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#111111] transition-all touch-target"
            >
              Open Admin Dashboard
            </Link>
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

    </div>
  );
};

export default Home;
