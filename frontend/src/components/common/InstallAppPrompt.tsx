import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const InstallAppPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      return;
    }

    // Check if previously dismissed
    const dismissedTime = localStorage.getItem('yurae_pwa_dismissed');
    if (dismissedTime && Date.now() - Number(dismissedTime) < 1000 * 60 * 60 * 24 * 7) {
      setIsDismissed(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Android/Desktop Chrome install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[Yurae PWA] App installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('yurae_pwa_dismissed', Date.now().toString());
  };

  // Only show if installable or on mobile iOS and not dismissed
  const shouldShow = !isDismissed && (isInstallable || isIOS);

  return (
    <>
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#FFF8FA] border border-[#D84B7E]/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D84B7E] to-[#B63564] flex items-center justify-center text-white shrink-0 shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#111111] leading-snug">
                  Install Yurae Beauty App
                </h4>
                <p className="text-[11px] text-gray-600 leading-tight">
                  Enjoy faster checkout & full-screen luxury shopping on your phone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                data-pwa-install
                onClick={handleInstallClick}
                className="px-3.5 py-2 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss app install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FCE7F0] text-[#D84B7E] mx-auto flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Install on iPhone / iPad
              </h3>
              <p className="text-xs text-gray-600">
                Install Yurae Beauty on your home screen in 2 quick steps:
              </p>
            </div>

            <div className="p-4 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl space-y-3 text-left text-xs text-gray-700">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-[#111111] inline-flex items-center gap-1 font-bold">Share <Share className="w-3.5 h-3.5 inline text-[#D84B7E]" /></strong> button at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#D84B7E] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and select <strong className="text-[#111111] inline-flex items-center gap-1 font-bold">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-[#D84B7E]" /></strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-[#D84B7E] text-white text-xs uppercase font-bold tracking-widest rounded-full hover:bg-[#111111] transition-all cursor-pointer shadow-md"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};
