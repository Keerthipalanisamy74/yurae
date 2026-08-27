import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const AnalyticsReports: React.FC = () => {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'Paid' | 'ALL'>('Paid');
  const [gstSummary, setGstSummary] = useState<any | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExporting, setIsExporting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchGstSummary();
  }, [startDate, endDate, paymentFilter]);

  const fetchGstSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const params: any = { payment_status: paymentFilter };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get('/admin/reports/gst-summary', { params });
      setGstSummary(res.data);
    } catch {
      // Non-blocking error
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const triggerDownload = async (endpoint: string, filename: string, exportKey: string) => {
    try {
      setIsExporting((prev) => ({ ...prev, [exportKey]: true }));
      const params: any = { format: 'csv', payment_status: paymentFilter };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get(endpoint, {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`${filename} downloaded successfully`, 'success');
    } catch (err: any) {
      showToast('Failed to download report', 'error');
    } finally {
      setIsExporting((prev) => ({ ...prev, [exportKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Government Compliance &amp; Accounting
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Financial &amp; GST GSTR-1 Reports Center
          </h2>
          <p className="text-xs text-gray-500">
            Generate audited accounting summaries, CGST, SGST, IGST tax breakdown, and ledger downloads.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs bg-white p-2.5 rounded-2xl border border-[#F1BCCE]/60 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e: any) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
          >
            <option value="Paid">Paid Orders Only</option>
            <option value="ALL">All Orders (Incl. Pending)</option>
          </select>

          <button
            onClick={fetchGstSummary}
            className="p-1.5 rounded-lg border border-[#F1BCCE] text-[#D84B7E] hover:bg-[#FCE7F0] transition-colors"
            title="Refresh summary"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tax & GST KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Invoice Turnover"
          value={`₹${(gstSummary?.gross_invoice_value_inr || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="from-[#D84B7E] to-[#9C2758]"
          subtext={`Across ${gstSummary?.order_count || 0} customer orders`}
        />

        <StatCard
          title="Net Taxable Value"
          value={`₹${(gstSummary?.total_taxable_value_inr || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="from-[#9C2758] to-[#54122E]"
          subtext="Base sales turnover excl. tax"
        />

        <StatCard
          title="Total GST Collected"
          value={`₹${(gstSummary?.total_tax_collected_inr || 0).toLocaleString('en-IN')}`}
          icon={Percent}
          color="from-[#54122E] to-[#111111]"
          subtext={`CGST: ₹${gstSummary?.cgst_inr || 0} | SGST: ₹${gstSummary?.sgst_inr || 0}`}
        />

        <StatCard
          title="IGST (Inter-State)"
          value={`₹${(gstSummary?.igst_inr || 0).toLocaleString('en-IN')}`}
          icon={ShieldCheck}
          color="from-[#B5426C] to-[#D84B7E]"
          subtext="Outside Karnataka shipments"
        />
      </div>

      {/* Official Export Reports Suite */}
      <div className="bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-5">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#111111]">
            Official Accounting &amp; Ledger Exports
          </h3>
          <p className="text-xs text-gray-500">
            Download GSTR-1 compliant CSV ledgers suitable for direct upload to GST Portal or Tally/Zoho Books.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Card 1: GSTR-1 Summary */}
          <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-[#111111] block">GSTR-1 Tax Summary</span>
              <p className="text-[11px] text-gray-600">
                Itemized B2C and B2B taxable turnover, HSN codes, and state POS splits.
              </p>
            </div>
            <button
              onClick={() =>
                triggerDownload('/admin/reports/gstr1-summary', 'yurae_gstr1_summary.csv', 'gstr1')
              }
              disabled={isExporting['gstr1']}
              className="w-full py-2 px-3 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting['gstr1'] ? 'Exporting...' : 'Export GSTR-1 CSV'}</span>
            </button>
          </div>

          {/* Card 2: Sales & GST Detail */}
          <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-[#111111] block">Sales &amp; GST Ledger</span>
              <p className="text-[11px] text-gray-600">
                Detailed transaction register with client GSTIN, CGST (9%), and SGST (9%).
              </p>
            </div>
            <button
              onClick={() =>
                triggerDownload('/admin/reports/sales-gst', 'yurae_sales_gst_ledger.csv', 'sales')
              }
              disabled={isExporting['sales']}
              className="w-full py-2 px-3 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting['sales'] ? 'Exporting...' : 'Export Sales CSV'}</span>
            </button>
          </div>

          {/* Card 3: Orders Master */}
          <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-[#111111] block">Orders Master Register</span>
              <p className="text-[11px] text-gray-600">
                Complete order registry including payment mode, shipping partner, and status.
              </p>
            </div>
            <button
              onClick={() =>
                triggerDownload('/admin/reports/orders', 'yurae_orders_master.csv', 'orders')
              }
              disabled={isExporting['orders']}
              className="w-full py-2 px-3 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting['orders'] ? 'Exporting...' : 'Export Orders CSV'}</span>
            </button>
          </div>

          {/* Card 4: Inventory Valuation */}
          <div className="p-4 rounded-2xl bg-[#FAF0F4] border border-[#F1BCCE] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-[#111111] block">Inventory Valuation (WMS)</span>
              <p className="text-[11px] text-gray-600">
                Real-time stock valuation across all active SKUs (MRP vs Selling Price).
              </p>
            </div>
            <button
              onClick={() =>
                triggerDownload(
                  '/admin/reports/inventory',
                  'yurae_inventory_valuation.csv',
                  'inventory'
                )
              }
              disabled={isExporting['inventory']}
              className="w-full py-2 px-3 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting['inventory'] ? 'Exporting...' : 'Export Stock CSV'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
