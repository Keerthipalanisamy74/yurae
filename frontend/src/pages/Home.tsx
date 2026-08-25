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
    <div className="space-y-16 sm:space-y-24">
      <SEO
        title="YURAE — Luxury Outfits & Korean-Inspired Botanical Skincare"
        description="Discover bespoke minimalist fashion, artisanal jewelry, and Korean-inspired botanical skincare rituals crafted for radiant, timeless elegance."
        image={heroProduct?.images?.[0]?.image_url || '/images/hero-skincare-model.jpg'}
        type="website"
      />
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-[#FFF5F8] via-[#FCE7F0] to-[#FDF4F7] overflow-hidden border-b border-[#F1BCCE]">
        {/* Soft Background Ambient Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F1BCCE]/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#D84B7E]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-widest border border-[#F1BCCE] shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FDF4F7]" />
                Korean Botanical Rituals • Yurae Beauty
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-[#111111] leading-[1.08] tracking-tight">
                The Origin of <span className="italic font-light text-[#D84B7E]">Skincare</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-800 font-normal leading-relaxed max-w-xl">
                Clean, artisanal botanical skincare and modern luxury essentials crafted to nourish, restore, and reveal timeless skin brilliance.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/shop"
                  className="px-8 py-4 bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#111111] transition-all shadow-xl flex items-center gap-3 border border-[#D84B7E] cursor-pointer"
                >
                  Explore All Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Brand Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#F1BCCE]/60 max-w-lg">
                <div className="space-y-0.5">
                  <span className="font-serif text-lg font-bold text-[#111111] block">100%</span>
                  <span className="text-[11px] text-gray-600 uppercase tracking-wider">Authentic</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-serif text-lg font-bold text-[#111111] block">Pure</span>
                  <span className="text-[11px] text-gray-600 uppercase tracking-wider">Botanicals</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-serif text-lg font-bold text-[#111111] block">Luxury</span>
                  <span className="text-[11px] text-gray-600 uppercase tracking-wider">Formulas</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Right: Model Applying Skincare Picture Alone */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative max-w-md w-full">
                {/* Glow & Backdrop Accents */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#D84B7E]/30 to-[#F1BCCE]/60 rounded-[2.5rem] blur-xl opacity-70" />
                
                {/* Image Container */}
                <div className="relative rounded-[2rem] overflow-hidden border-2 border-[#F1BCCE] bg-[#FFF8FA] shadow-2xl aspect-[3/4]">
                  <img
                    src="/images/hero-skincare-model.jpg"
                    alt="Yurae Beauty Glass Skincare Ritual"
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle glassmorphism bottom badge */}
                  <div className="absolute bottom-4 inset-x-4 p-3 bg-white/75 backdrop-blur-md rounded-2xl border border-white/60 shadow-md text-center">
                    <span className="text-[11px] font-serif font-bold text-[#111111] uppercase tracking-widest block">
                      The Glass Skin Ritual
                    </span>
                    <span className="text-[10px] text-gray-600 font-light">
                      Nourish • Hydrate • Radiate
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. THREE STORE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
            Explore Our Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. SKINCARE CATEGORY CARD */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative h-[400px] rounded-3xl overflow-hidden shadow-lg flex flex-col justify-end p-8 text-white border border-[#F1BCCE] bg-gradient-to-br from-[#D84B7E] to-[#6A1A3A]"
          >
            {skincareProduct?.images?.[0]?.image_url ? (
              <>
                <img
                  src={skincareProduct.images[0].image_url}
                  alt="Skincare"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#D84B7E]/90 via-[#8A244E] to-[#3B0E20] flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <span className="text-4xl block">🌸</span>
                  <span className="text-xs uppercase tracking-widest text-[#F8D7E3] font-bold">Botanical Formulas</span>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold block">Hero Category</span>
              <h3 className="font-serif text-3xl font-bold text-white">SKINCARE</h3>
              <p className="text-xs text-gray-200 font-light italic">"The ritual your skin deserves."</p>
              <Link
                to="/skincare"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-2 cursor-pointer"
              >
                Explore Skincare <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* 2. FASHION CATEGORY CARD */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative h-[400px] rounded-3xl overflow-hidden shadow-lg flex flex-col justify-end p-8 text-white border border-[#F1BCCE] bg-gradient-to-br from-[#B5426C] to-[#451025]"
          >
            {fashionProduct?.images?.[0]?.image_url ? (
              <>
                <img
                  src={fashionProduct.images[0].image_url}
                  alt="Fashion"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#B5426C]/90 via-[#6E1C3C] to-[#2E0B18] flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <span className="text-4xl block">👗</span>
                  <span className="text-xs uppercase tracking-widest text-[#F8D7E3] font-bold">Luxury Apparel</span>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold block">Apparel</span>
              <h3 className="font-serif text-3xl font-bold text-white">FASHION</h3>
              <p className="text-xs text-gray-200 font-light italic">"Express your effortless elegance."</p>
              <Link
                to="/fashion"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-2 cursor-pointer"
              >
                Explore Fashion <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* 3. ACCESSORIES CATEGORY CARD */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative h-[400px] rounded-3xl overflow-hidden shadow-lg flex flex-col justify-end p-8 text-white border border-[#F1BCCE] bg-gradient-to-br from-[#8C2C55] to-[#2B0817]"
          >
            {accessoriesProduct?.images?.[0]?.image_url ? (
              <>
                <img
                  src={accessoriesProduct.images[0].image_url}
                  alt="Accessories"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#8C2C55]/90 via-[#54122E] to-[#1C050F] flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <span className="text-4xl block">💍</span>
                  <span className="text-xs uppercase tracking-widest text-[#F8D7E3] font-bold">Fine Accents</span>
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-2.5">
              <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold block">Details</span>
              <h3 className="font-serif text-3xl font-bold text-white">ACCESSORIES</h3>
              <p className="text-xs text-gray-200 font-light italic">"Complete your signature look."</p>
              <Link
                to="/accessories"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-2 cursor-pointer"
              >
                Explore Accessories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. UPLOADED PRODUCTS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold block mb-1">
              Store Catalog
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
              Available Products
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-bold text-[#111111] hover:text-[#D84B7E] transition-colors flex items-center gap-2 cursor-pointer"
          >
            View Full Shop <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-[#FCE7F0] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl text-center space-y-3 shadow-xs">
            <h3 className="font-serif text-2xl font-bold text-[#111111]">No Products Added Yet</h3>
            <p className="text-xs text-gray-600">Upload your skincare, fashion, or accessory products from the Admin Dashboard.</p>
            <Link
              to="/admin"
              className="inline-block mt-4 px-6 py-2.5 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#111111] transition-all"
            >
              Open Admin Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center shadow-xs">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center mx-auto">
              <Leaf className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#111111]">Pure Botanicals</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Formulated with nutrient-dense active botanicals and barrier-repairing ingredients.
            </p>
          </div>

          <div className="space-y-3 border-y md:border-y-0 md:border-x border-[#F1BCCE]/60 py-6 md:py-0 md:px-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#111111]">Dermatologically Safe</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Gentle, pH-balanced formulas designed specifically for sensitive and barrier-compromised skin.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE7F0] text-[#D84B7E] flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#111111]">Artisanal Luxury</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Hand-packaged in signature glass and sustainable materials for a timeless unboxing ritual.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
