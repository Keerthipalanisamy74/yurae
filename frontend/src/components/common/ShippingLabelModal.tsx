import React from 'react';
import { X, Printer, Download, Tag, QrCode, MapPin, Truck, Check } from 'lucide-react';
import { Order } from '../../types';

interface ShippingLabelModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const awb = order.awb_code || `BD${order.order_number.replace(/\D/g, '').slice(-8) || '20268800'}`;
  const carrier = order.courier_name || 'Blue Dart Express Air Priority';
  const isCod = order.is_cod || order.payments?.[0]?.payment_method?.toUpperCase() === 'COD';
  const recipientName = order.address?.name || (order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Patron');

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/fulfillment/shipping-labels/${order.id}/pdf?token=${token || ''}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5D7D0] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-b border-[#E5D7D0] flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D84B7E]/10 border border-[#D84B7E]/20 flex items-center justify-center text-[#D84B7E]">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#111111]">
                4x6 Thermal Shipping Label
              </h3>
              <p className="text-xs text-gray-500">
                Carrier Manifest & AWB Barcode for Order #{order.order_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label View */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 flex justify-center">
          <div className="w-[360px] bg-white border-2 border-black p-4 text-black font-sans text-xs space-y-3 shadow-md print:border-none print:shadow-none print:w-full">
            
            {/* Header: Carrier & Brand */}
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <div>
                <span className="font-serif font-black tracking-widest text-base block">Y U R A E</span>
                <span className="text-[9px] uppercase tracking-wider text-gray-600">Luxury Botanical Atelier</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-[#D84B7E] block uppercase">{carrier}</span>
                <span className="text-[10px] font-mono font-bold bg-gray-100 px-1.5 py-0.5 border border-gray-300 rounded-xs">
                  BLR-MAA-AIR
                </span>
              </div>
            </div>

            {/* Barcode & AWB */}
            <div className="text-center py-2 bg-gray-50 border border-black rounded-xs">
              <div className="font-mono text-xl tracking-[0.25em] font-black scale-y-125 mb-1">
                ||| | |||| ||| ||||| |||| || |||||| ||||| ||||
              </div>
              <div className="font-mono font-bold text-sm tracking-wider">
                AWB: <b>{awb}</b>
              </div>
            </div>

            {/* Payment Callout */}
            <div className={`p-2 border-2 text-center rounded-xs font-bold text-xs uppercase ${
              isCod ? 'bg-amber-50 border-amber-600 text-amber-900' : 'bg-emerald-50 border-emerald-600 text-emerald-900'
            }`}>
              {isCod ? `CASH ON DELIVERY (COD): COLLECT ₹${order.total_amount.toLocaleString()}` : 'PREPAID — DO NOT COLLECT CASH'}
            </div>

            {/* Consignee (Deliver To) */}
            <div className="border border-black p-2.5 rounded-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Deliver To (Consignee):</div>
              <div className="font-bold text-sm">{recipientName}</div>
              <div className="text-xs leading-relaxed text-gray-800">
                {order.address?.address_line1}
                {order.address?.address_line2 ? `, ${order.address.address_line2}` : ''}
              </div>
              <div className="font-bold text-xs">
                {order.address?.city || 'Chennai'}, {order.address?.state || 'Tamil Nadu'} - <span className="text-sm font-mono">{order.address?.postal_code || '600028'}</span>
              </div>
              <div className="text-xs font-bold text-gray-900">
                Phone: <span className="font-mono">{order.address?.phone || '+91 98401 23456'}</span>
              </div>
            </div>

            {/* Shipper (Return To) */}
            <div className="bg-gray-100 border border-gray-400 p-2 text-[10px] space-y-0.5 rounded-xs">
              <div className="font-bold uppercase text-gray-700">Shipper / Return Center:</div>
              <div><b>YURAE Bengaluru Atelier & Fulfillment Hub</b></div>
              <div>Plot 42, EPIP Industrial Zone, Whitefield, Bengaluru, KA - 560066</div>
              <div>GSTIN: <b>33AABCY1234F1Z5</b> | Ph: +91 80 4123 4567</div>
            </div>

            {/* Package Details & Dims */}
            <div className="grid grid-cols-3 gap-1 border border-black p-1.5 text-center text-[10px] font-mono">
              <div>
                <span className="text-gray-500 block">Order</span>
                <span className="font-bold">#{order.order_number}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Weight</span>
                <span className="font-bold">0.45 KG</span>
              </div>
              <div>
                <span className="text-gray-500 block">Dims</span>
                <span className="font-bold">15x10x8 CM</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-t border-[#E5D7D0] flex justify-between items-center print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#111111] text-white hover:bg-[#D84B7E] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" /> Thermal Print (4x6)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-white border border-[#E5D7D0] text-[#111111] hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
