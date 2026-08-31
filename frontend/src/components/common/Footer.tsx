import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { useToast } from '../../context/ToastContext';
import { useCategories } from '../../context/CategoryContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();
  const { categories } = useCategories();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      showToast('Welcome to the Yurae Beauty community! Check your inbox for 10% off.', 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#1F0B14] text-[#FDF4F7] pt-14 pb-28 xl:pb-12 border-t border-[#D84B7E]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8 pb-12 border-b border-[#381423]">
          
          {/* Brand Philosophy */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo/logo-emblem.png"
                alt="Yurae Beauty Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_2px_10px_rgba(248,164,196,0.35)] brightness-110"
              />
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#F8A4C4] leading-tight">
                  YURAE BEAUTY
                </h2>
                <p className="text-[9px] sm:text-[9.5px] uppercase tracking-[0.25em] text-[#F8A4C4]/80 font-semibold mt-0.5">
                  The Origin of Skincare
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed max-w-sm">
              Rooted in ancient Korean botanical wisdom and refined modern science. We curate high-performance formulations encased in luxury rose petal pink and golden aesthetics.
            </p>

            {/* Newsletter */}
            <div className="pt-2 sm:pt-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#F8A4C4] mb-1.5">
                Join the Yurae Beauty Community
              </h3>
              <p className="text-xs text-gray-300 mb-3">
                Subscribe for private rituals, seasonal unveils, and 10% off your first order.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col min-[420px]:flex-row max-w-md gap-2 min-[420px]:gap-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="bg-[#381423] text-sm text-[#FDF4F7] placeholder:text-gray-400 px-4 py-3 rounded-2xl min-[420px]:rounded-r-none min-[420px]:rounded-l-full flex-1 outline-none border border-[#521E34] focus:border-[#F8A4C4]"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#D84B7E] hover:bg-[#F8A4C4] hover:text-[#111111] text-[#FDF4F7] px-6 py-3 rounded-2xl min-[420px]:rounded-l-none min-[420px]:rounded-r-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer touch-target min-h-[44px]"
                >
                  Join
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Shop Categories */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#F8A4C4]">
              Categories
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 font-light">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="hover:text-[#F8A4C4] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/skincare" className="hover:text-[#F8A4C4] transition-colors">
                      Skincare
                    </Link>
                  </li>
                  <li>
                    <Link to="/fashion" className="hover:text-[#F8A4C4] transition-colors">
                      Fashion
                    </Link>
                  </li>
                  <li>
                    <Link to="/accessories" className="hover:text-[#F8A4C4] transition-colors">
                      Accessories
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/shop?sort_by=newest" className="hover:text-[#F8A4C4] transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="hover:text-[#F8A4C4] transition-colors">
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#F8A4C4]">
              Client Care
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 font-light">
              <li>
                <Link to="/contact" className="hover:text-[#F8A4C4] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F8A4C4] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-[#F8A4C4] transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-[#F8A4C4] transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#F8A4C4] transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    const promptEl = document.querySelector('[data-pwa-install]');
                    if (promptEl) (promptEl as HTMLElement).click();
                    else showToast('To install: On iPhone tap Share > "Add to Home Screen". On Android tap browser menu > "Install app".', 'info');
                  }}
                  className="hover:text-[#F8A4C4] transition-colors cursor-pointer text-left font-medium text-[#F8A4C4]"
                >
                  📱 Install Mobile App
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#F8A4C4]">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 font-light">
              <li>
                <Link to="/about" className="hover:text-[#F8A4C4] transition-colors">
                  About Yurae
                </Link>
              </li>
              <li>
                <Link to="/about#story" className="hover:text-[#F8A4C4] transition-colors">
                  Our Philosophy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#F8A4C4] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-[#F8A4C4] transition-colors">
                  Policies & Legal Center
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#F8A4C4] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>

            <div className="pt-3">
              <h4 className="text-[11px] uppercase tracking-widest text-[#F8A4C4] font-bold mb-2.5">
                Follow Us
              </h4>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://www.instagram.com/yuraebeauty/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#381423] hover:bg-gradient-to-r hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F56040] rounded-full text-[#FDF4F7] hover:text-white transition-all duration-300 border border-[#D84B7E]/40 hover:border-transparent group shadow-xs touch-target"
                  title="Follow Yurae Beauty on Instagram @yuraebeauty"
                >
                  <InstagramIcon className="w-4 h-4 text-[#F8A4C4] group-hover:text-white transition-colors" />
                  <span className="text-xs font-semibold tracking-wide">@yuraebeauty</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-300 font-light gap-2">
          <p>© {new Date().getFullYear()} Yurae Beauty. All rights reserved.</p>
          <p className="text-[#F8A4C4]">Pure Korean Botanical Skincare Rituals.</p>
        </div>
      </div>
    </footer>
  );
};

