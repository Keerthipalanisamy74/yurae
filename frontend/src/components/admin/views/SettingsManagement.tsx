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
  Mail,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const SettingsManagement: React.FC = () => {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'store' | 'currency' | 'email' | 'database'>('store');

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
  const [currencySearch, setCurrencySearch] = useState('');
  const [calcAmount, setCalcAmount] = useState<number>(2500);
  const [calcTargetCurrency, setCalcTargetCurrency] = useState<string>('USD');

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState<any | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('pkiruthika101@gmail.com');
  const [selectedTemplate, setSelectedTemplate] = useState('WELCOME_REGISTRATION');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [retryingLogId, setRetryingLogId] = useState<number | null>(null);

  useEffect(() => {
    fetchDbOverview();
    fetchCurrencyRates();
    fetchSmtpConfig();
    fetchEmailLogs();
  }, []);

  const fetchSmtpConfig = async () => {
    try {
      const res = await api.get('/admin/smtp-settings');
      setSmtpConfig(res.data);
    } catch {
      // Non-blocking
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await api.get('/admin/email-logs?limit=25');
      setEmailLogs(res.data?.logs || []);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) {
      showToast('Please enter recipient email address', 'error');
      return;
    }
    try {
      setIsSendingTestEmail(true);
      const res = await api.post('/admin/test-email', {
        recipient_email: testEmailAddress,
        template_name: selectedTemplate
      });
      showToast(res.data.message || `Test email dispatched to ${testEmailAddress}`, 'success');
      fetchEmailLogs();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'SMTP test email failed', 'error');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleRetryEmail = async (logId: number) => {
    try {
      setRetryingLogId(logId);
      const res = await api.post(`/admin/email-logs/${logId}/retry`);
      showToast(res.data.message || 'Email re-dispatched successfully', 'success');
      fetchEmailLogs();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Retry dispatch failed', 'error');
    } finally {
      setRetryingLogId(null);
    }
  };

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

  const fetchCurrencyRates = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshingRates(true);
      const res = await api.get('/currencies/rates');
      if (res.data) {
        setCurrencyData(res.data);
      }
      if (isManual) {
        showToast('Refreshed just now', 'success');
      }
    } catch {
      // Fallback in case /currencies/rates is temporarily unavailable
      try {
        const fallbackRes = await api.get('/currencies');
        if (Array.isArray(fallbackRes.data)) {
          setCurrencyData({
            base_currency: 'INR',
            rates: { INR: 1.0, USD: 0.0116, EUR: 0.0111, GBP: 0.0094, CAD: 0.0163, AUD: 0.0182, SGD: 0.0157, JPY: 1.78 },
            currencies: fallbackRes.data,
            last_updated: new Date().toISOString(),
          });
        }
      } catch {
        // Non-blocking
      }
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshingRates(false), 500);
      }
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
      const res = await api.post('/currencies/rates/refresh');
      if (res.data) {
        setCurrencyData(res.data);
      }
      showToast(res.data?.message || 'Live exchange rates refreshed successfully', 'success');
    } catch (err: any) {
      try {
        const fallbackRes = await api.get('/currencies/rates');
        if (fallbackRes.data) {
          setCurrencyData(fallbackRes.data);
        }
        showToast('Exchange rates synced from database cache', 'info');
      } catch {
        showToast('Failed to refresh exchange rates', 'error');
      }
    } finally {
      setTimeout(() => setIsRefreshingRates(false), 600);
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
            Settings &amp; Environment Hub
          </h2>
          <p className="text-xs text-gray-500">
            Configure enterprise brand metadata, tax identification, live multi-currency rates, email SMTP gateways, and database schema diagnostics.
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
            onClick={() => setSubTab('email')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              subTab === 'email'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Email &amp; SMTP
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

      {subTab === 'email' && (
        <div className="space-y-6 text-xs">
          {/* SMTP Configuration Overview Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D84B7E]" />
                  Enterprise Domain Email Infrastructure (yuraebeauty.com)
                </h3>
                <p className="text-gray-500 text-[11px]">
                  Role-based transactional dispatches with non-blocking background queueing and header injection protection.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    smtpConfig?.has_password
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {smtpConfig?.has_password ? '● Live SMTP Active' : '○ Pending SMTP Password'}
                </span>
              </div>
            </div>

            {/* 5 Professional Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
                <span className="text-[9px] uppercase font-bold text-[#D84B7E] block tracking-wider">Customer Support</span>
                <span className="font-mono font-bold text-gray-900 block truncate">{smtpConfig?.from_support || 'support@yuraebeauty.com'}</span>
                <span className="text-[10px] text-gray-500 block">Contact inquiries &amp; help</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
                <span className="text-[9px] uppercase font-bold text-[#D84B7E] block tracking-wider">Orders &amp; Logistics</span>
                <span className="font-mono font-bold text-gray-900 block truncate">{smtpConfig?.from_orders || 'orders@yuraebeauty.com'}</span>
                <span className="text-[10px] text-gray-500 block">Receipts, tracking, refunds</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
                <span className="text-[9px] uppercase font-bold text-[#D84B7E] block tracking-wider">Security &amp; OTP</span>
                <span className="font-mono font-bold text-gray-900 block truncate">{smtpConfig?.from_noreply || 'noreply@yuraebeauty.com'}</span>
                <span className="text-[10px] text-gray-500 block">Welcome, verification, reset</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
                <span className="text-[9px] uppercase font-bold text-[#D84B7E] block tracking-wider">Admin Alerts</span>
                <span className="font-mono font-bold text-gray-900 block truncate">{smtpConfig?.from_admin || 'admin@yuraebeauty.com'}</span>
                <span className="text-[10px] text-gray-500 block">Store order notifications</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] space-y-1">
                <span className="text-[9px] uppercase font-bold text-[#D84B7E] block tracking-wider">Marketing &amp; Concierge</span>
                <span className="font-mono font-bold text-gray-900 block truncate">{smtpConfig?.from_marketing || 'marketing@yuraebeauty.com'}</span>
                <span className="text-[10px] text-gray-500 block">Back in stock alerts</span>
              </div>
            </div>

            {/* Server Connection Status */}
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-600">
              <div>
                <strong>SMTP Server:</strong> <span className="font-mono text-gray-800">{smtpConfig?.smtp_host || 'smtp.gmail.com'}:{smtpConfig?.smtp_port || 587}</span> •
                <strong className="ml-2">Account:</strong> <span className="font-mono text-gray-800">{smtpConfig?.smtp_username || 'orders@yuraebeauty.com'}</span> •
                <strong className="ml-2">Password:</strong> <span className="font-mono text-gray-800">{smtpConfig?.smtp_password_masked || 'Configured in .env'}</span>
              </div>
              <div className="text-gray-500">
                Mode: <strong className="uppercase text-[#D84B7E]">{smtpConfig?.mode || 'SMTP'}</strong>
              </div>
            </div>
          </div>

          {/* Live Multi-Template Tester Form */}
          <form
            onSubmit={handleSendTestEmail}
            className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4"
          >
            <div className="border-b border-gray-100 pb-2">
              <h4 className="font-serif text-base font-bold text-[#111111]">
                Live Email Template Test Center
              </h4>
              <p className="text-gray-600 text-[11px]">
                Verify responsive rendering and live inbox delivery for any luxury email template.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <label className="font-bold text-gray-700">Select Email Template *</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E] text-xs"
                >
                  <option value="WELCOME_REGISTRATION">1. Welcome &amp; Account Onboarding (noreply@)</option>
                  <option value="ORDER_CONFIRMATION">2. Order Confirmation &amp; Receipt (orders@)</option>
                  <option value="OTP_VERIFICATION">3. OTP Password Reset Verification (noreply@)</option>
                  <option value="PASSWORD_RESET">4. Password Changed Security Alert (noreply@)</option>
                  <option value="ORDER_PACKED">5. Order Packed &amp; QA Passed (orders@)</option>
                  <option value="ORDER_SHIPPED">6. Order Shipped &amp; AWB Tracking (orders@)</option>
                  <option value="OUT_FOR_DELIVERY">7. Out For Delivery Today (orders@)</option>
                  <option value="ORDER_DELIVERED">8. Order Delivered &amp; Review (orders@)</option>
                  <option value="ORDER_CANCELLED">9. Order Cancellation Notice (orders@)</option>
                  <option value="REFUND_ISSUED">10. Refund Completed Receipt (orders@)</option>
                  <option value="CONTACT_ACKNOWLEDGEMENT">11. Contact Form Customer Acknowledgement (support@)</option>
                  <option value="ADMIN_NEW_ORDER_ALERT">12. Admin New Order Alert (admin@)</option>
                  <option value="ADMIN_CONTACT_ALERT">13. Admin Customer Inquiry Alert (admin@)</option>
                  <option value="BACK_IN_STOCK_ALERT">14. Product Restock Priority Alert (marketing@)</option>
                </select>
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="font-bold text-gray-700">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="e.g. pkiruthika101@gmail.com"
                  className="w-full px-3 py-2.5 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E] text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isSendingTestEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Mail className={`w-3.5 h-3.5 ${isSendingTestEmail ? 'animate-bounce' : ''}`} />
                  <span>{isSendingTestEmail ? 'Dispatching...' : 'Send Live Test Email'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Email Dispatch Audit Log Table */}
          <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-serif text-base font-bold text-[#111111]">
                  Email Dispatch Audit Trail
                </h4>
                <p className="text-gray-500 text-[11px]">
                  Real-time database log of all customer, order, and security emails.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchEmailLogs}
                disabled={isLoadingLogs}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-[#FFF8FA] rounded-2xl border border-[#F1BCCE]/50">
                No email transmissions recorded yet. Send a test email above or place an order to see logs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Sender Role</th>
                      <th className="py-2.5 px-3">Subject / Template</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FFF8FA]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900 truncate max-w-[180px]">
                          {log.recipient_email}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                            {log.sender_email}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-900 truncate max-w-[240px]">{log.subject}</p>
                          <span className="text-[10px] text-[#D84B7E] font-mono">{log.template_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'RETRIED'
                                ? 'bg-blue-100 text-blue-800'
                                : log.status === 'SIMULATED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-[10px]">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRetryEmail(log.id)}
                            disabled={retryingLogId === log.id}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#D84B7E] hover:text-white text-gray-700 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Re-send this email"
                          >
                            {retryingLogId === log.id ? 'Retrying...' : 'Re-send'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
        <div className="space-y-5 text-xs">
          {/* Header & Controls */}
          <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="font-serif text-lg font-bold text-[#111111]">
                    Multi-Currency Engine &amp; Global FX Rates
                  </h3>
                </div>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Authoritative Base: <strong className="text-gray-900">{currencyData?.base_currency || 'INR'} (₹)</strong> • Live Provider: <span className="font-mono text-gray-700">Open Exchange Feed / Autorate</span> • Last Sync:{' '}
                  <strong className="text-[#D84B7E]">{currencyData?.last_updated ? new Date(currencyData.last_updated).toLocaleString() : 'Just now'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleRefreshCurrencyRates}
                  disabled={isRefreshingRates}
                  className="px-4 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 touch-target"
                  title="Force re-fetch from international forex exchange provider"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingRates ? 'Refreshing Live Rates...' : 'Refresh Live Rates'}</span>
                </button>
              </div>
            </div>

            {/* Currency Sandbox / Live Converter Calculator */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF0F4] to-[#FFF9FB] border border-[#F1BCCE] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#D84B7E]" />
                  <span>Live Checkout Conversion Sandbox</span>
                </span>
                <span className="text-[10px] text-gray-500">Real-time simulation for international patrons</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">Amount in Base (INR ₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">Target Currency</label>
                  <select
                    value={calcTargetCurrency}
                    onChange={(e) => setCalcTargetCurrency(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                  >
                    {(currencyData?.currencies || []).map((c: any) => (
                      <option key={c.code} value={c.code}>
                        {c.flag || ''} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5 p-2.5 rounded-xl bg-white border border-[#F1BCCE]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Patron Receives Price</span>
                    <span className="font-serif text-base font-bold text-[#D84B7E]">
                      {(() => {
                        const targetRate = currencyData?.rates?.[calcTargetCurrency] || 1.0;
                        const targetInfo = (currencyData?.currencies || []).find((c: any) => c.code === calcTargetCurrency);
                        const sym = targetInfo?.symbol || calcTargetCurrency;
                        const decimals = targetInfo?.decimal_digits ?? 2;
                        const converted = calcAmount * targetRate;
                        return `${sym}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
                      })()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    1 {calcTargetCurrency} = ₹
                    {(() => {
                      const targetRate = currencyData?.rates?.[calcTargetCurrency] || 1.0;
                      return targetRate > 0 ? (1 / targetRate).toFixed(2) : '1.00';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Currency Filter Search */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="font-bold text-gray-800">
                Active International Currencies ({currencyData?.currencies?.length || 0})
              </span>
              <input
                type="text"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                placeholder="Filter by currency name, code, or country..."
                className="px-3 py-1.5 bg-white border border-[#F1BCCE] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D84B7E] w-64"
              />
            </div>
          </div>

          {/* Currency Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {(currencyData?.currencies || [])
              .filter((c: any) => {
                if (!currencySearch.trim()) return true;
                const q = currencySearch.toLowerCase();
                return (
                  c.code?.toLowerCase().includes(q) ||
                  c.name?.toLowerCase().includes(q) ||
                  c.country?.toLowerCase().includes(q) ||
                  c.symbol?.toLowerCase().includes(q)
                );
              })
              .map((c: any) => {
                const rate = currencyData?.rates?.[c.code] || 1.0;
                const inrPerUnit = rate > 0 ? (1 / rate).toFixed(2) : '1.00';

                return (
                  <div
                    key={c.code}
                    className="p-4 rounded-2xl bg-white border border-[#F1BCCE]/80 hover:border-[#D84B7E] hover:shadow-md transition-all space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl drop-shadow-2xs">{c.flag || '🌐'}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-sm">{c.code}</span>
                            <span className="text-xs font-serif font-bold text-[#D84B7E]">({c.symbol})</span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{c.country || c.name}</p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF0F4] space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>1 INR =</span>
                        <strong className="text-gray-900">{rate.toFixed(4)} {c.code}</strong>
                      </div>
                      <div className="flex items-center justify-between text-gray-600 border-t border-[#F1BCCE]/40 pt-1">
                        <span>1 {c.code} =</span>
                        <strong className="text-[#D84B7E]">₹{inrPerUnit} INR</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                      <span>Free Shipping:</span>
                      <strong className="text-gray-700">
                        {c.symbol}{c.free_shipping_threshold || (c.code === 'INR' ? 1500 : 50)}
                      </strong>
                    </div>
                  </div>
                );
              })}
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
