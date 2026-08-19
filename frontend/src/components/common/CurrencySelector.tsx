import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface CurrencySelectorProps {
  variant?: 'desktop' | 'mobile';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ variant = 'desktop' }) => {
  const { currency, currencies, setCurrency, currentCurrencyInfo } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8FA] border border-[#F1BCCE] text-xs font-bold text-[#111111] hover:border-[#D84B7E] transition-all cursor-pointer shadow-xs"
        >
          <span className="text-sm">{currentCurrencyInfo?.flag || '🌐'}</span>
          <span>{currentCurrencyInfo?.symbol}</span>
          <span className="font-mono text-[11px]">{currency}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#D84B7E] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#D84B7E] font-bold border-b border-[#F1BCCE] mb-1 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Select Currency
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 py-1">
              {currencies.map((c) => {
                const isSelected = c.code === currency;
                return (
                  <button
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#FCE7F0] text-[#D84B7E] font-bold' : 'text-gray-700 hover:bg-[#FDF4F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span className="font-semibold">{c.symbol} {c.code}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D84B7E]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8FA]/90 hover:bg-[#FFF8FA] border border-[#F1BCCE] text-xs font-bold text-[#111111] hover:border-[#D84B7E] transition-all cursor-pointer shadow-xs"
        aria-label="Change currency"
      >
        <span className="text-sm">{currentCurrencyInfo?.flag || '🌐'}</span>
        <span className="text-xs text-[#D84B7E] font-bold">{currentCurrencyInfo?.symbol}</span>
        <span className="font-mono text-[11px] font-semibold">{currency}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-[#D84B7E] font-bold border-b border-[#F1BCCE] mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Regional Currency
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 py-1">
            {currencies.map((c) => {
              const isSelected = c.code === currency;
              return (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected ? 'bg-[#FCE7F0] text-[#D84B7E] font-bold' : 'text-gray-700 hover:bg-[#FDF4F7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{c.flag}</span>
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <span>{c.symbol}</span>
                        <span>{c.code}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-normal">{c.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#D84B7E]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
