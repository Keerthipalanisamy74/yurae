import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Printer, Layers, Barcode, MapPin, Package, Check, RefreshCw } from 'lucide-react';
import { PickList, PickListItem } from '../../types';

interface PickListStationModalProps {
  orderId: number;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onPickComplete?: () => void;
}

export const PickListStationModal: React.FC<PickListStationModalProps> = ({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onPickComplete
}) => {
  const [picklist, setPicklist] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);

  const fetchPickList = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/fulfillment/orders/${orderId}/picklist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load WMS pick list.');
      }
      const data = await res.json();
      setPicklist(data);
    } catch (err: any) {
      setError(err.message || 'Error loading pick list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchPickList();
    }
  }, [isOpen, orderId]);

  const handlePickItem = async (item: PickListItem, status: 'PICKED' | 'SHORTAGE' | 'DAMAGED') => {
    if (!picklist) return;
    setProcessingItemId(item.id);
    try {
      const token = localStorage.getItem('token');
      const qty = status === 'PICKED' ? item.quantity_required : 0;
      const res = await fetch(`/api/fulfillment/picklists/${picklist.id}/pick-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_id: item.id,
          quantity_picked: qty,
          status: status,
          notes: status !== 'PICKED' ? `Marked as ${status} by Warehouse Specialist` : undefined
        })
      });
      if (res.ok) {
        fetchPickList();
        if (onPickComplete) onPickComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingItemId(null);
    }
  };

  if (!isOpen) return null;

  const allPicked = picklist?.items.every(i => i.status === 'PICKED');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5D7D0] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-b border-[#E5D7D0] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D84B7E]/10 border border-[#D84B7E]/20 flex items-center justify-center text-[#D84B7E]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  Warehouse Pick List Station
                </h3>
                <span className="px-2 py-0.5 bg-[#FAF1E6] text-[#8C6D62] text-[10px] font-mono font-bold rounded-sm border border-[#E5D7D0]">
                  {picklist?.picklist_number || 'LOADING...'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Order #{orderNumber} • Shelf Location Picking Route & Barcode Checklist
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#D84B7E] mb-3" />
              <p className="font-serif">Retrieving shelf locations and SKU coordinates...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm">
              {error}
            </div>
          ) : picklist ? (
            <>
              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#E5D7D0]">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Assigned Atelier Staff</span>
                  <span className="font-bold text-xs text-[#111111]">{picklist.assigned_staff_name}</span>
                </div>
                <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#E5D7D0]">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Picking Status</span>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    picklist.status === 'PICKED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {picklist.status}
                  </span>
                </div>
                <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#E5D7D0]">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Items to Pick</span>
                  <span className="font-bold text-xs text-[#111111]">
                    {picklist.items.filter(i => i.status === 'PICKED').length} / {picklist.items.length} Picked
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#E5D7D0] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F0] text-[#555] font-serif uppercase tracking-wider text-[10px] border-b border-[#E5D7D0]">
                    <tr>
                      <th className="px-4 py-3">Shelf / Bin Location</th>
                      <th className="px-4 py-3">Product & SKU</th>
                      <th className="px-4 py-3 text-center">Qty Req</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5D7D0]">
                    {picklist.items.map((item) => (
                      <tr key={item.id} className={`hover:bg-[#FAF9F5] transition-colors ${item.status === 'PICKED' ? 'bg-emerald-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[#D84B7E]">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.shelf_location}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#111111]">{item.product_name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <span>SKU: <b className="text-gray-700">{item.sku}</b></span>
                            {item.variant_info && <span>• Size: {item.variant_info}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-sm text-[#111111]">
                          {item.quantity_required}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'PICKED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'PICKED' ? (
                            <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Picked
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                disabled={processingItemId === item.id}
                                onClick={() => handlePickItem(item, 'PICKED')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Mark Picked
                              </button>
                              <button
                                disabled={processingItemId === item.id}
                                onClick={() => handlePickItem(item, 'SHORTAGE')}
                                className="px-2 py-1 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                title="Report Shortage"
                              >
                                Missing
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF6F0] px-6 py-4 border-t border-[#E5D7D0] flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-[#E5D7D0] text-[#111111] hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print Pick Sheet
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#111111] text-white hover:bg-[#D84B7E] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Done & Return
          </button>
        </div>

      </div>
    </div>
  );
};
