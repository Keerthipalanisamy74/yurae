import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Share2 } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const Home: React.FC = () => {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then((res) => setBestsellers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const instagramPosts = [
    { id: 1, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', tag: '#YuraeRitual' },
    { id: 2, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', tag: '#GlassSkin' },
    { id: 3, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80', tag: '#YuraeAtelier' },
    { id: 4, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80', tag: '#MinimalLuxury' },
  ];

  return (
    <div className="space-y-20 pb-16 bg-[#FDF4F7]">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center bg-[#FCE7F0] overflow-hidden border-b border-[#F1BCCE]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=2000&q=85"
            alt="Yurae Beauty Hero"
            className="w-full h-full object-cover opacity-20 filter brightness-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FDF4F7] via-[#FDF4F7]/85 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-widest border border-[#F1BCCE]">
              <Sparkles className="w-3.5 h-3.5 text-[#FDF4F7]" />
              Korean Botanical Skincare • Ritual for timeless beauty
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-[#111111] leading-[1.1] tracking-tight">
              The Origin of <span className="italic font-light text-[#D84B7E]">Skincare</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-800 font-normal leading-relaxed max-w-xl">
              Elevate your everyday ritual with clean, luxurious skincare that nourishes, restores, and reveals your skin's natural brilliance.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/shop"
                className="px-8 py-4 bg-[#D84B7E] text-[#FDF4F7] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-xl flex items-center gap-3 border border-[#D84B7E]"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/shop"
                className="px-8 py-4 bg-[#FFF8FA] border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#111111] hover:text-[#FDF4F7] transition-all shadow-xs"
              >
                Explore All Products
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. THREE HERO CATEGORIES (SKINCARE, FASHION, ACCESSORIES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">
            Curated Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
            Explore Our Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* SKINCARE */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative h-[420px] rounded-3xl overflow-hidden shadow-lg flex flex-col justify-end p-8 text-white border border-[#F1BCCE]"
          >
            <img
              src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80"
              alt="Skincare"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">Hero Category</span>
              <h3 className="font-serif text-3xl font-bold text-white">SKINCARE</h3>
              <p className="text-xs text-gray-200 font-light italic">"The ritual your skin deserves."</p>
              <Link
                to="/skincare"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-2"
              >
                Explore Skincare <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* FASHION */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative h-[420px] rounded-3xl overflow-hidden shadow-lg flex flex-col justify-end p-8 text-white border border-[#F1BCCE]"
          >
            <img
              src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=80"
              alt="Fashion"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">Apparel</span>
              <h3 className="font-serif text-3xl font-bold text-white">FASHION</h3>
              <p className="text-xs text-gray-200 font-light italic">"Express your effortless elegance."</p>
              <Link
                to="/fashion"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-2"
              >
                Explore Fashion <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* ACCESSORIES */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative h-[420px] rounded-3xl overflow-hidden shadow-lg flex flex-col justify-end p-8 text-white border border-[#F1BCCE]"
          >
            <img
              src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80"
              alt="Accessories"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#F8D7E3] font-bold">Details</span>
              <h3 className="font-serif text-3xl font-bold text-white">ACCESSORIES</h3>
              <p className="text-xs text-gray-200 font-light italic">"Complete your signature look."</p>
              <Link
                to="/accessories"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#F8D7E3] group-hover:text-white transition-colors pt-2"
              >
                Explore Accessories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. BESTSELLERS / UPLOADED PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
              Available Products
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-bold text-[#111111] hover:text-[#D84B7E] transition-colors flex items-center gap-2"
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
        ) : bestsellers.length === 0 ? (
          <div className="p-12 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl text-center space-y-3 shadow-xs">
            <h3 className="font-serif text-2xl font-bold text-[#111111]">Your Product Catalog is Empty</h3>
            <p className="text-xs text-gray-600">Select any category above (Skincare, Fashion, Accessories) to upload your products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">
            Client Testimonials
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
            Loved by Skincare Enthusiasts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
            <div className="flex text-[#D84B7E]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D84B7E]" />
              ))}
            </div>
            <p className="text-sm font-serif italic text-[#111111] leading-relaxed font-normal">
              "The Centella Cleanser and Niacinamide Serum have transformed my dull combination skin into a calm, hydrated glass skin glow."
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold text-[#111111] block">Elena R.</span>
              <span className="text-[10px] text-gray-500">Verified Buyer — Hyderabad</span>
            </div>
          </div>

          <div className="p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
            <div className="flex text-[#D84B7E]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D84B7E]" />
              ))}
            </div>
            <p className="text-sm font-serif italic text-[#111111] leading-relaxed font-normal">
              "The Mulberry Silk Wrap Dress is stunning! The silk texture feels ultra high-end and luxurious. Worth every rupee."
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold text-[#111111] block">Meera K.</span>
              <span className="text-[10px] text-gray-500">Verified Buyer — Mumbai</span>
            </div>
          </div>

          <div className="p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xs space-y-4">
            <div className="flex text-[#D84B7E]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D84B7E]" />
              ))}
            </div>
            <p className="text-sm font-serif italic text-[#111111] leading-relaxed font-normal">
              "Finally a luxury skincare line that respects sensitive skin barriers! The Ceramide Velvet Daily Moisturizer is a holy grail."
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold text-[#111111] block">Aanvi S.</span>
              <span className="text-[10px] text-gray-500">Verified Buyer — Bengaluru</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INSTAGRAM SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold">
              @YuraeBeauty
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#111111]">
              Follow Our Daily Rituals
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs uppercase tracking-widest font-bold text-[#111111] hover:text-[#D84B7E] flex items-center gap-2"
          >
            <Share2 className="w-4 h-4 text-[#D84B7E]" />
            Follow on Instagram
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {instagramPosts.map((post) => (
            <div key={post.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow-xs border border-[#F1BCCE]">
              <img
                src={post.image}
                alt="Instagram post"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[#D84B7E]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <span className="text-xs font-bold tracking-widest text-[#FDF4F7]">{post.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
