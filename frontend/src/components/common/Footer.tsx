import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      showToast('Welcome to the Yurae Beauty community! Check your inbox for 10% off.', 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#1F0B14] text-[#FDF4F7] pt-16 pb-24 md:pb-12 border-t border-[#D84B7E]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#381423]">
          
          {/* Brand Philosophy */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo/logo-emblem.png"
                alt="Yurae Beauty Logo"
                className="w-13 h-13 sm:w-14 sm:h-14 object-contain drop-shadow-[0_2px_10px_rgba(248,164,196,0.35)] brightness-110"
              />
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-[#F8A4C4] leading-tight">
                  YURAE BEAUTY
                </h2>
                <p className="text-[9.5px] uppercase tracking-[0.25em] text-[#F8A4C4]/80 font-semibold mt-0.5">
                  The Origin of Skincare
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-300 font-light leading-relaxed max-w-sm">
              Rooted in ancient Korean botanical wisdom and refined modern science. We curate high-performance formulations encased in luxury rose petal pink and golden aesthetics.
            </p>

            {/* Newsletter */}
            <div className="pt-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#F8A4C4] mb-2">
                Join the Yurae Beauty Community
              </h3>
              <p className="text-xs text-gray-300 mb-3">
                Subscribe for private rituals, seasonal unveils, and 10% off your first order.
              </p>
              <form onSubmit={handleSubscribe} className="flex max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="bg-[#381423] text-sm text-[#FDF4F7] placeholder:text-gray-400 px-4 py-3 rounded-l-full flex-1 outline-none border border-[#521E34] focus:border-[#F8A4C4]"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#D84B7E] hover:bg-[#F8A4C4] hover:text-[#111111] text-[#FDF4F7] px-6 py-3 rounded-r-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  Join
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#F8A4C4]">
              Categories
            </h3>
            <ul className="space-y-2 text-sm text-gray-300 font-light">
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
                <Link to="/terms" className="hover:text-[#F8A4C4] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>

            <div className="pt-3">
              <h4 className="text-[11px] uppercase tracking-widest text-[#F8A4C4] font-bold mb-2">
                Follow Us
              </h4>
              <div className="flex gap-3">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2.5 bg-[#381423] rounded-full text-[#FDF4F7] hover:text-[#111111] hover:bg-[#F8A4C4] transition-all">
                  <Share2 className="w-4 h-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2.5 bg-[#381423] rounded-full text-[#FDF4F7] hover:text-[#111111] hover:bg-[#F8A4C4] transition-all">
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-300 font-light">
          <p>© {new Date().getFullYear()} Yurae Beauty. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-[#F8A4C4]">Pure Korean Botanical Skincare Rituals.</p>
        </div>
      </div>
    </footer>
  );
};
