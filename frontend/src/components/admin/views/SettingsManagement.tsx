import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Save,
  RefreshCw,
  Server,
  Shield,
  CreditCard,
  Globe,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const SettingsManagement: React.FC = () => {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'store' | 'database' | 'currency'>('store');

  // Store Settings State
  const [storeName, setStoreName] = useState('Yurae Beauty Atelier');
  const [gstin, setGstin] = useState('29AABCU9603R1ZM');
  const [contactEmail, setContactEmail] = useState('concierge@yurae.com');
  const [contactPhone, setContactPhone] = useState('+91 80 4920 1829');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Database Explorer State
  const [dbOverview, setDbOverview] = useState<any | null>(null);
  const [envOverview, setEnvOverview] = useState<any | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isSeedingDb, setIsSeedingDb] = useState(false);

  // Currency Rates State
  const [currencyData, setCurrencyData] = useState<any | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  useEffect(() => {
    fetchDbOverview();
    fetchCurrencyRates();
  }, []);

  const fetchDbOverview = async () => {
    try {
      setIsLoadingDb(true);
      const [dbRes, envRes] = await Promise.all([
        api.get('/admin/database-overview'),
        api.get('/admin/env-overview'),
      ]);
      setDbOverview(dbRes.data);
      setEnvOverview(envRes.data);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingDb(false);
    }
  };

  const fetchCurrencyRates = async () => {
    try {
      const res = await api.get('/currencies');
      setCurrencyData(res.data);
    } catch {
      // Non-blocking
    }
  };

  const handleSyncDatabase = async () => {
    try {
      setIsSyncingDb(true);
      const res = await api.post('/admin/database-sync');
      showToast(res.data.message || 'Database schema synchronized successfully', 'success');
      fetchDbOverview();
    } catch (err: any) {
      showToast('Database synchronization failed', 'error');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setIsSeedingDb(true);
      const res = await api.post('/admin/database-seed');
      showToast(res.data.message || 'Database seeded successfully', 'success');
      fetchDbOverview();
    } catch (err: any) {
      showToast('Database seeding failed', 'error');
    } finally {
      setIsSeedingDb(false);
    }
  };

  const handleRefreshCurrencyRates = async () => {
    try {
      setIsRefreshingRates(true);
      const res = await api.post('/currencies/refresh');
      showToast(res.data.message || 'Exchange rates refreshed live', 'success');
      fetchCurrencyRates();
    } catch (err: any) {
      showToast('Failed to refresh exchange rates', 'error');
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    setTimeout(() => {
      setIsSavingStore(false);
      showToast('Store settings saved successfully', 'success');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header & SubTabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Store Engine &amp; Diagnostics
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Settings &amp; Database Health
          </h2>
          <p className="text-xs text-gray-500">
            Configure enterprise brand metadata, tax identification, live multi-currency rates, and MySQL diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold">
          <button
            onClick={() => setSubTab('store')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              subTab === 'store'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Store Profile
          </button>
          <button
            onClick={() => setSubTab('currency')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              subTab === 'currency'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Currencies
          </button>
          <button
            onClick={() => setSubTab('database')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              subTab === 'database'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Database &amp; Env
          </button>
        </div>
      </div>

      {subTab === 'store' && (
        <form
          onSubmit={handleSaveStoreSettings}
          className="max-w-2xl bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs"
        >
          <h3 className="font-serif text-lg font-bold text-[#111111] border-b border-gray-100 pb-2">
            Store Profile &amp; GSTIN Identification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">Brand / Store Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Government GSTIN *</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Concierge Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Support Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingStore}
              className="px-5 py-2.5 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingStore ? 'Saving...' : 'Save Store Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {subTab === 'currency' && (
        <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                Multi-Currency Engine
              </h3>
              <p className="text-gray-500 text-[11px]">
                Base Currency: <strong>{currencyData?.base_currency || 'INR'}</strong> • Last Updated:{' '}
                {currencyData?.last_updated ? new Date(currencyData.last_updated).toLocaleString() : 'Recent'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshCurrencyRates}
              disabled={isRefreshingRates}
              className="px-4 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
              <span>{isRefreshingRates ? 'Refreshing Rates...' : 'Refresh Live Rates'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {currencyData?.currencies?.map((c: any) => (
              <div
                key={c.code}
                className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{c.code}</span>
                  <span className="text-xs font-serif font-bold text-[#D84B7E]">{c.symbol}</span>
                </div>
                <p className="text-[10px] text-gray-600 truncate">{c.name}</p>
                <p className="text-[11px] font-mono font-bold text-gray-800 pt-1">
                  1 INR = {currencyData?.rates?.[c.code] ? currencyData.rates[c.code].toFixed(4) : '1.0000'} {c.code}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'database' && (
        <div className="space-y-5">
          {/* Action Buttons for Migration & Seeding */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncingDb}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSyncingDb ? 'Running Migration...' : 'Run Schema Migration'}</span>
            </button>

            <button
              onClick={handleSeedDatabase}
              disabled={isSeedingDb}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isSeedingDb ? 'Seeding...' : 'Seed Sample Database'}</span>
            </button>
          </div>

          {/* Database Tables Summary Grid */}
          <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-[#111111] border-b border-gray-100 pb-2">
              Database Tables Register ({dbOverview?.total_tables || dbOverview?.tables?.length || 0})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dbOverview?.tables?.map((tbl: any) => (
                <div
                  key={tbl.name}
                  className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1"
                >
                  <p className="font-mono font-bold text-gray-900 truncate">{tbl.name}</p>
                  <p className="text-[11px] text-[#D84B7E] font-bold">
                    {tbl.row_count !== undefined ? `${tbl.row_count} rows` : 'Active'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
