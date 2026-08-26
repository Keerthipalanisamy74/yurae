import React, { useState, useEffect } from 'react';
import {
  X, Printer, Download, Package, Check, ShieldCheck,
  Building, User, Calendar, Truck, Barcode, Loader2, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { PackingSlipData } from '../../types';
import { useToast } from '../../context/ToastContext';

interface PackingSlipModalProps {
  orderId: number | null;
  onClose: () => void;
}

export const PackingSlipModal: React.FC<PackingSlipModalProps> = ({ orderId, onClose }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<PackingSlipData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      setError(null);
      api.get(`/shipping/orders/${orderId}/packing-slip`)
        .then((res) => setData(res.data))
        .catch((err) => {
          const msg = err.response?.data?.detail || 'Failed to fetch packing slip details';
          setError(msg);
          showToast(msg, 'error');
        })
        .finally(() => setIsLoading(false));
    }
  }, [orderId, showToast]);

  if (!orderId) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/shipping/orders/${orderId}/packing-slip/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `packing_slip_${data?.order_number || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showToast('Could not download PDF packing slip', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F1BCCE] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#FFF8FA] print:hidden">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#D84B7E]" />
            <h2 className="font-serif text-lg font-bold text-[#111111]">
              Warehouse Packing Slip & Dispatch Manifest
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !data}
              className="px-3.5 py-1.5 bg-[#111111] text-white rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-[#D84B7E] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print Manifest
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isLoading || !data}
              className="px-3.5 py-1.5 border border-[#F1BCCE] text-[#111111] bg-white rounded-full text-xs font-bold flex items-center gap-1.5 hover:border-[#D84B7E] hover:text-[#D84B7E] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Document */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-800 print:p-0 print:m-0">
          {isLoading && (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#D84B7E] animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">Generating packing slip & barcode manifest...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6 print:space-y-4">
              
              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-gray-900">
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-widest text-[#111111]">Y U R A E</h1>
                  <p className="text-[10px] uppercase tracking-wider text-[#D84B7E] font-bold">
                    Botanical Skincare & Luxury Apparel Atelier
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Order Ref: <span className="font-bold text-black">#{data.order_number}</span> • Date: {data.order_date}
                  </p>
                </div>

                {/* Barcode & Routing Badge */}
                <div className="text-right sm:text-right w-full sm:w-auto bg-[#FDF4F7] p-3 rounded-xl border border-[#F1BCCE] text-center">
                  <div className="font-mono text-sm tracking-widest font-bold text-[#111111]">
                    ||| | |||| ||| ||||| |||| || ||||||
                  </div>
                  <div className="font-mono text-[11px] font-bold text-gray-700">
                    {data.order_number}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Carrier: <span className="font-bold text-black">{data.courier_name}</span> (AWB: <span className="font-bold text-[#D84B7E]">{data.awb_code}</span>)
                  </div>
                </div>
              </div>

              {/* Address Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ship To */}
                <div className="p-4 bg-[#FFF8FA] rounded-xl border border-[#F1BCCE] space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#D84B7E] block">
                    Ship To (Patron):
                  </span>
                  <p className="font-bold text-sm text-[#111111]">{data.recipient.name}</p>
                  <p className="text-gray-600 leading-tight">
                    {data.recipient.address_line1}
                    {data.recipient.address_line2 ? `, ${data.recipient.address_line2}` : ''}
                  </p>
                  <p className="text-gray-600">
                    {data.recipient.city}, {data.recipient.state} - <span className="font-bold text-black">{data.recipient.postal_code}</span>
                  </p>
                  <p className="text-gray-600">{data.recipient.country}</p>
                  <p className="text-gray-600 font-medium pt-1">Phone: {data.recipient.phone}</p>
                </div>

                {/* Dispatch Origin */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 block">
                    Dispatch From:
                  </span>
                  <p className="font-bold text-sm text-[#111111]">{data.sender.company_name}</p>
                  <p className="text-gray-600">{data.sender.warehouse}</p>
                  <p className="text-gray-600 leading-tight">{data.sender.address}</p>
                  <p className="text-gray-600 font-medium pt-1">Origin PIN: {data.sender.pincode} • Helpline: {data.sender.contact}</p>
                </div>
              </div>

              {/* Payment & Routing Bar */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="text-gray-600 font-medium">Payment Mode: </span>
                  <span className="font-bold text-amber-900">{data.payment_method}</span> ({data.payment_status})
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Collection Instruction: </span>
                  <span className="font-bold text-amber-900">
                    {data.is_cod ? `COLLECT ${data.currency} ${data.cod_amount}` : 'PREPAID — DO NOT COLLECT CASH'}
                  </span>
                </div>
              </div>

              {/* Items Manifest Table */}
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-900 text-white font-bold text-[11px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Variant / Size</th>
                      <th className="py-2.5 px-3 text-center">HSN</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-center">QC Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#111111]">{it.sku}</td>
                        <td className="py-2.5 px-3 font-bold text-[#111111]">{it.product_name}</td>
                        <td className="py-2.5 px-3 text-gray-600">{it.variant_info || 'Standard'}</td>
                        <td className="py-2.5 px-3 font-mono text-center text-gray-600">{it.hsn_code}</td>
                        <td className="py-2.5 px-3 font-bold text-center text-black text-sm">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-center">
                          <input type="checkbox" className="w-4 h-4 rounded text-[#D84B7E] cursor-pointer" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quality Checklist */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Luxury Quality Assurance & Packaging Protocol
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-emerald-800">
                  {data.luxury_packaging_checklist.map((chk, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{chk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-gray-300 grid grid-cols-3 gap-4 text-[11px] text-gray-600">
                <div>
                  <span className="font-bold">Packed By:</span> ___________________
                </div>
                <div>
                  <span className="font-bold">Verified By QC:</span> ___________________
                </div>
                <div className="text-right">
                  <span className="font-bold">Total Units:</span> <span className="text-black font-bold text-sm">{data.total_quantity}</span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
