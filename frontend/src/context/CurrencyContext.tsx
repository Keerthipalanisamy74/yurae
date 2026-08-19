import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyInfo } from '../types';
import { api } from '../services/api';

interface CurrencyContextType {
  currency: string;
  currencies: CurrencyInfo[];
  rates: Record<string, number>;
  currentCurrencyInfo: CurrencyInfo;
  setCurrency: (code: string) => void;
  convertPrice: (amountInINR: number, targetCurrency?: string) => number;
  formatPrice: (amountInINR: number, targetCurrency?: string) => string;
  formatRawPrice: (amount: number, currencyCode?: string) => string;
  isLoading: boolean;
  refreshRates: () => Promise<void>;
}

const DEFAULT_CURRENCIES: CurrencyInfo[] = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbol_native: '₹',
    decimal_digits: 2,
    flag: '🇮🇳',
    country: 'India',
    default_shipping_fee: 99,
    free_shipping_threshold: 1500,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbol_native: '$',
    decimal_digits: 2,
    flag: '🇺🇸',
    country: 'United States',
    default_shipping_fee: 15,
    free_shipping_threshold: 50,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbol_native: '€',
    decimal_digits: 2,
    flag: '🇪🇺',
    country: 'European Union',
    default_shipping_fee: 14,
    free_shipping_threshold: 45,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbol_native: '£',
    decimal_digits: 2,
    flag: '🇬🇧',
    country: 'United Kingdom',
    default_shipping_fee: 12,
    free_shipping_threshold: 40,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    symbol_native: '$',
    decimal_digits: 2,
    flag: '🇨🇦',
    country: 'Canada',
    default_shipping_fee: 18,
    free_shipping_threshold: 60,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    symbol_native: '$',
    decimal_digits: 2,
    flag: '🇦🇺',
    country: 'Australia',
    default_shipping_fee: 20,
    free_shipping_threshold: 70,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    symbol_native: '$',
    decimal_digits: 2,
    flag: '🇸🇬',
    country: 'Singapore',
    default_shipping_fee: 18,
    free_shipping_threshold: 60,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbol_native: '￥',
    decimal_digits: 0,
    flag: '🇯🇵',
    country: 'Japan',
    default_shipping_fee: 2000,
    free_shipping_threshold: 7000,
  },
];

const DEFAULT_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.0116,
  EUR: 0.0111,
  GBP: 0.0094,
  CAD: 0.0163,
  AUD: 0.0182,
  SGD: 0.0157,
  JPY: 1.78,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    const saved = localStorage.getItem('yurae_currency');
    if (saved) return saved.toUpperCase();

    // Automatic suggestion detection based on browser timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return 'INR';
      if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago') || tz.includes('Denver')) return 'USD';
      if (tz.includes('London')) return 'GBP';
      if (tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome') || tz.includes('Madrid') || tz.includes('Amsterdam')) return 'EUR';
      if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'CAD';
      if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'AUD';
      if (tz.includes('Singapore')) return 'SGD';
      if (tz.includes('Tokyo')) return 'JPY';
    } catch {
      // ignore
    }

    return 'INR';
  });

  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(DEFAULT_CURRENCIES);
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRates = async () => {
    try {
      const res = await api.get('/currencies/rates');
      if (res.data?.rates) {
        setRates(res.data.rates);
      }
      if (res.data?.currencies && res.data.currencies.length > 0) {
        setCurrencies(res.data.currencies);
      }
    } catch (err) {
      console.warn('Failed to fetch live exchange rates, using local cached rates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const setCurrency = (code: string) => {
    const clean = code.toUpperCase();
    setCurrencyState(clean);
    localStorage.setItem('yurae_currency', clean);
  };

  const currentCurrencyInfo =
    currencies.find((c) => c.code === currency) ||
    DEFAULT_CURRENCIES[0];

  const convertPrice = (amountInINR: number, targetCurrency?: string): number => {
    if (amountInINR === undefined || amountInINR === null || isNaN(amountInINR)) return 0;
    const target = (targetCurrency || currency).toUpperCase();
    if (target === 'INR') return amountInINR;

    const rate = rates[target] || DEFAULT_RATES[target] || 1.0;
    const converted = amountInINR * rate;
    const meta = currencies.find((c) => c.code === target) || DEFAULT_CURRENCIES.find((c) => c.code === target);
    const digits = meta ? meta.decimal_digits : 2;

    if (digits === 0) {
      return Math.round(converted);
    }
    return Number(converted.toFixed(digits));
  };

  const formatPrice = (amountInINR: number, targetCurrency?: string): string => {
    if (amountInINR === undefined || amountInINR === null || isNaN(amountInINR)) return '₹0';
    const target = (targetCurrency || currency).toUpperCase();
    const meta = currencies.find((c) => c.code === target) || DEFAULT_CURRENCIES.find((c) => c.code === target) || DEFAULT_CURRENCIES[0];
    const symbol = meta.symbol;
    const digits = meta.decimal_digits;

    const converted = convertPrice(amountInINR, target);

    if (digits === 0) {
      return `${symbol}${converted.toLocaleString()}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  };

  const formatRawPrice = (amount: number, currencyCode?: string): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0';
    const target = (currencyCode || currency).toUpperCase();
    const meta = currencies.find((c) => c.code === target) || DEFAULT_CURRENCIES.find((c) => c.code === target) || DEFAULT_CURRENCIES[0];
    const symbol = meta.symbol;
    const digits = meta.decimal_digits;

    if (digits === 0) {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies,
        rates,
        currentCurrencyInfo,
        setCurrency,
        convertPrice,
        formatPrice,
        formatRawPrice,
        isLoading,
        refreshRates: fetchRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
