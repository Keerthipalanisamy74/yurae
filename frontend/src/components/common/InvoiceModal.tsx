import React, { useState, useEffect } from 'react';
import { X, Printer, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderIdentifier: string | number;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  orderIdentifier,
}) => {
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && orderIdentifier) {
      setIsLoading(true);
      api.get(`/orders/${orderIdentifier}/invoice`)
        .then((res) => {
          setInvoice(res.data);
        })
        .catch((err) => {
          console.error('Could not fetch invoice:', err);
          showToast('Could not load invoice data', 'error');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, orderIdentifier]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const invoiceNum = invoice?.invoice_number || `INV-${orderIdentifier}`;
      const filename = `Yurae-Tax-Invoice-${invoiceNum}.pdf`;

      const res = await api.get(`/orders/${orderIdentifier}/invoice/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`Tax invoice PDF downloaded: ${filename}`, 'success');
    } catch (err: any) {
      console.error('PDF download error:', err);
      showToast('Could not download PDF file. Please try printing.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-[#F1BCCE] rounded-3xl max-w-3xl w-full p-4 sm:p-10 space-y-4 sm:space-y-6 shadow-2xl my-3 sm:my-4 max-h-[92vh] overflow-y-auto touch-scroll print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:rounded-none">
        {/* Modal Action Bar (Hidden when Printing) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 border-b border-[#F1BCCE] pb-3 sm:pb-4 print:hidden">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D84B7E] font-bold">Tax Invoice</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-mono font-bold text-gray-700 truncate max-w-[150px] sm:max-w-none">{invoice?.invoice_number}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || isLoading || !invoice}
              className="px-3.5 sm:px-4 py-2 bg-[#D84B7E] hover:bg-[#111111] text-white text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 touch-target min-h-[38px]"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !invoice}
              className="px-3 sm:px-3.5 py-2 bg-[#FFF8FA] border border-[#F1BCCE] hover:border-[#D84B7E] text-[#111111] text-[11px] sm:text-xs uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-target min-h-[38px]"
            >
              <Printer className="w-4 h-4 text-[#D84B7E]" /> Print
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors cursor-pointer touch-target min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INVOICE DOCUMENT BODY */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#D84B7E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-serif">Generating official luxury tax invoice...</p>
          </div>
        ) : invoice ? (
          <div id="printable-invoice-body" className="space-y-6 text-[#111111] font-sans bg-white p-2 sm:p-4 rounded-xl">
            {/* Header / Brand Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-[#111111] pb-6">
              <div>
                <h1 className="font-serif text-3xl font-bold tracking-widest text-[#111111] uppercase">
                  Y U R A E
                </h1>
                <p className="text-[10px] tracking-widest uppercase text-[#D84B7E] font-bold mt-0.5">
                  The Origin of Skincare & Luxury Apparel
                </p>
                <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                  <p className="font-bold text-black">{invoice.seller.company_name}</p>
                  <p>{invoice.seller.address}, {invoice.seller.city} - {invoice.seller.postal_code}</p>
                  <p>{invoice.seller.state}, {invoice.seller.country}</p>
                  <p className="font-mono text-[11px] font-bold text-gray-800">GSTIN: {invoice.seller.gstin}</p>
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-[#FCE7F0] border border-[#F1BCCE] text-[#D84B7E] text-xs font-bold uppercase tracking-wider rounded-lg">
                  Original Tax Invoice
                </div>
                <div className="pt-2 text-xs space-y-0.5">
                  <p><span className="text-gray-500">Invoice No:</span> <strong className="font-mono text-black">{invoice.invoice_number}</strong></p>
                  <p><span className="text-gray-500">Invoice Date:</span> <strong className="text-black">{invoice.invoice_date}</strong></p>
                  <p><span className="text-gray-500">Order Ref:</span> <strong className="font-mono text-black">#{invoice.order_details.order_number}</strong></p>
                  <p><span className="text-gray-500">Payment:</span> <strong className="text-emerald-700">{invoice.order_details.payment_method} ({invoice.order_details.payment_status})</strong></p>
                </div>
              </div>
            </div>

            {/* Billed To / Shipped To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D84B7E] block mb-1">
                  Billed & Shipped To:
                </span>
                <p className="font-bold text-sm text-[#111111]">{invoice.buyer.name}</p>
                <p className="text-gray-600 mt-1">{invoice.buyer.address_line1}</p>
                {invoice.buyer.address_line2 && <p className="text-gray-600">{invoice.buyer.address_line2}</p>}
                <p className="text-gray-600">{invoice.buyer.city}, {invoice.buyer.state} - {invoice.buyer.postal_code}</p>
                <p className="text-gray-600">{invoice.buyer.country}</p>
                <p className="text-gray-600 mt-1 font-mono text-[11px]">📞 {invoice.buyer.phone} • ✉️ {invoice.buyer.email}</p>
              </div>

              <div className="sm:border-l sm:border-[#F1BCCE] sm:pl-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D84B7E] block mb-1">
                    Dispatch & Logistics
                  </span>
                  <p className="text-gray-700"><strong>Place of Supply:</strong> {invoice.buyer.state}, {invoice.buyer.country}</p>
                  <p className="text-gray-700"><strong>Fulfillment Mode:</strong> Express Luxury Surface Logistics</p>
                  <p className="text-gray-700"><strong>Order Timestamp:</strong> {invoice.order_details.order_date}</p>
                </div>
                <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Authentic Luxury Guarantee
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111111] text-[#FDF4F7] uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 rounded-l-lg">#</th>
                    <th className="p-2.5">Product Description</th>
                    <th className="p-2.5 text-center">HSN</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right rounded-r-lg">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1BCCE]">
                  {invoice.order_details.items.map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#FFF8FA]">
                      <td className="p-2.5 font-mono text-gray-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <strong className="text-[#111111]">{it.product_name}</strong>
                        {it.variant && (
                          <span className="block text-[11px] text-[#D84B7E] font-medium">
                            {it.variant}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono text-gray-600">{it.hsn_code}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{invoice.order_details.currency} {it.unit_price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#111111]">
                        {invoice.order_details.currency} {it.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Totals & Tax Split */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              <div className="p-3.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-[11px] text-gray-600 w-full sm:max-w-xs space-y-1">
                <p className="font-bold text-[#111111] uppercase tracking-wider text-[10px]">Terms & Conditions</p>
                <p>1. Goods once sold are eligible for return/exchange within 7 days under standard conditions.</p>
                <p>2. This is a computer generated invoice and does not require physical signature.</p>
              </div>

              <div className="w-full sm:max-w-xs space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{invoice.order_details.currency} {invoice.order_details.subtotal.toFixed(2)}</span>
                </div>
                {invoice.order_details.discount > 0 && (
                  <div className="flex justify-between text-[#D84B7E] font-medium">
                    <span>Coupon Savings:</span>
                    <span className="font-mono">-{invoice.order_details.currency} {invoice.order_details.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping & Handling:</span>
                  <span className="font-mono">
                    {invoice.order_details.shipping > 0
                      ? `${invoice.order_details.currency} ${invoice.order_details.shipping.toFixed(2)}`
                      : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>CGST (Included):</span>
                  <span className="font-mono">{invoice.order_details.currency} {invoice.order_details.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>SGST (Included):</span>
                  <span className="font-mono">{invoice.order_details.currency} {invoice.order_details.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#111111] border-t-2 border-[#111111] pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[#D84B7E]">{invoice.order_details.currency} {invoice.order_details.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Official Seal / Signature Footer */}
            <div className="border-t border-[#F1BCCE] pt-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
              <div className="text-[11px] text-gray-500">
                <p>Thank you for choosing Yurae. May your skincare ritual and luxury wardrobe bring you timeless grace.</p>
                <p className="text-[10px] text-gray-400 mt-1">Authorized Signatory: Yurae Beauty & Apparel PVT LTD</p>
              </div>

              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#D84B7E] flex flex-col items-center justify-center p-2 text-center text-[#D84B7E] opacity-80 shrink-0">
                <span className="text-[8px] font-bold uppercase tracking-widest">YURAE</span>
                <span className="text-[12px] font-serif font-bold">AUTHENTIC</span>
                <span className="text-[7px] uppercase tracking-tighter">OFFICIAL SEAL</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
