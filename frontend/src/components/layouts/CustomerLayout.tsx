import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { MobileNav } from '../common/MobileNav';
import { CartDrawer } from '../common/CartDrawer';
import { Footer } from '../common/Footer';
import { InstallAppPrompt } from '../common/InstallAppPrompt';
import { MarketingBannerHub } from '../common/MarketingBannerHub';
import { WelcomeSplashIntro } from '../common/WelcomeSplashIntro';

export const CustomerLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8B4CB] text-[#111111]">
      <WelcomeSplashIntro />
      <Navbar />
      <MarketingBannerHub />
      <CartDrawer />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
      <MobileNav />
      <InstallAppPrompt />
    </div>
  );
};
