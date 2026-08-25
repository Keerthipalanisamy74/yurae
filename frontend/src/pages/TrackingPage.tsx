import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Truck, Search, Package, Check, Clock, Copy, ExternalLink,
  ShieldCheck, AlertCircle, Sparkles, MapPin, Calendar, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { TrackingResponse } from '../types';
import { useToast } from '../context/ToastContext';

export const TrackingPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [queryInput, setQueryInput] = useState<string>(orderNumber || '');
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTrackingInfo = async (identifier: string) => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      showToast('Please enter an Order Reference Number or AWB Code', 'info');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.get(`/shipping/track/${cleanId}`);
      setTrackingData(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || `No active shipment found for '${cleanId}'. Please verify the number.`;
      setErrorMessage(msg);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      setQueryInput(orderNumber);
      fetchTrackingInfo(orderNumber);
    }
  }, [orderNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryInput.trim()) {
      navigate(`/track/${queryInput.trim()}`);
      fetchTrackingInfo(queryInput.trim());
    }
  };

  const getStepIndex = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s.includes('DELIVERED')) return 5;
    if (s.includes('OUT_FOR_DELIVERY') || s.includes('OUT FOR DELIVERY')) return 4;
    if (s.includes('IN_TRANSIT') || s.includes('IN TRANSIT') || s.includes('SHIPPED')) return 3;
    if (s.includes('PICKED_UP') || s.includes('PICKUP_SCHEDULED')) return 2;
    if (s.includes('AWB_ASSIGNED') || s.includes('PACKED') || s.includes('SHIPMENT_CREATED')) return 1;
    return 0;
  };

  const steps = [
    { label: 'Confirmed', desc: 'Order Verified' },
    { label: 'Packed & AWB', desc: 'Label Generated' },
    { label: 'Picked Up', desc: 'Handed to Courier' },
    { label: 'In Transit', desc: 'Logistics Hub' },
    { label: 'Out for Delivery', desc: 'Final Destination' },
    { label: 'Delivered', desc: 'Doorstep Arrival' },
  ];

  return (
    <div className="min-h-[80vh] py-16 bg-[#FDF4F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#D84B7E] font-bold flex items-center justify-center gap-1.5">
            <Truck className="w-4 h-4" /> Yurae Logistics Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#111111]">
            Track Your Shipment
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Enter your order reference number or carrier AWB tracking number to follow your luxury beauty package in real time.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
          <div className="p-2 bg-[#FFF8FA] border border-[#F1BCCE] rounded-full flex items-center gap-2 shadow-sm focus-within:border-[#D84B7E] transition-all">
            <Search className="w-5 h-5 text-gray-400 ml-4 shrink-0" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. YUR-XXXXXXXX or BD202619842"
              className="w-full bg-transparent p-2 text-sm outline-none font-mono text-[#111111] placeholder:font-sans placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-6 py-3 bg-[#D84B7E] text-white text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-xs flex items-center gap-1.5"
            >
              {isLoading ? 'Searching...' : 'Track'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Error Notification */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs shadow-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Shipment Search Note</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Tracking Details Card */}
        {trackingData && (
          <div className="p-6 sm:p-8 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-8 shadow-sm animate-in fade-in duration-300">
            
            {/* Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#F1BCCE]">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D84B7E] font-bold block">
                  Official Shipment Record
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#111111] mt-0.5">
                  Order #{trackingData.order_number}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {trackingData.shipping_status || 'In Transit'}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl">
                <span className="text-xs text-gray-500 font-bold block mb-1">Carrier Partner</span>
                <span className="font-bold text-[#111111] text-base block">
                  {trackingData.courier_name || 'Blue Dart Express Air'}
                </span>
              </div>

              <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl">
                <span className="text-xs text-gray-500 font-bold block mb-1">Air Waybill (AWB)</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#D84B7E] text-base">
                    {trackingData.awb_code || 'Pending'}
                  </span>
                  {trackingData.awb_code && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(trackingData.awb_code || '');
                        showToast('AWB copied to clipboard', 'info');
                      }}
                      className="text-gray-400 hover:text-[#D84B7E] p-1 cursor-pointer"
                      title="Copy AWB"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl">
                <span className="text-xs text-gray-500 font-bold block mb-1">Estimated Delivery</span>
                <span className="font-bold text-emerald-700 text-base block">
                  {trackingData.estimated_delivery || '2-4 Business Days'}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="p-6 sm:p-8 bg-white border border-[#F1BCCE] rounded-2xl space-y-6">
              <h3 className="font-serif text-base font-bold text-[#111111] uppercase tracking-wider">
                Fulfillment Journey
              </h3>

              {(() => {
                const currentIdx = getStepIndex(trackingData.current_status || trackingData.shipping_status);

                return (
                  <div className="relative">
                    <div className="hidden sm:flex justify-between items-start relative">
                      <div className="absolute top-4 left-8 right-8 h-1 bg-[#F1BCCE] -z-0">
                        <div
                          className="h-full bg-[#D84B7E] transition-all duration-500"
                          style={{ width: `${(currentIdx / 5) * 100}%` }}
                        />
                      </div>

                      {steps.map((st, idx) => {
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div key={st.label} className="flex flex-col items-center text-center relative z-10 w-28">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border text-xs font-bold transition-all shadow-xs ${
                                isDone
                                  ? 'bg-[#D84B7E] text-white border-[#D84B7E]'
                                  : 'bg-white text-gray-400 border-[#F1BCCE]'
                              } ${isCurrent ? 'ring-4 ring-[#F8D7E3]' : ''}`}
                            >
                              {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-xs font-bold mt-2.5 ${isDone ? 'text-[#111111]' : 'text-gray-400'}`}>
                              {st.label}
                            </span>
                            <span className="text-[11px] text-gray-500 mt-0.5">{st.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Live Scan Activities */}
            <div className="space-y-4">
              <h3 className="font-serif text-base font-bold text-[#111111] uppercase tracking-wider">
                Live Courier Scan History
              </h3>

              {(!trackingData.events || trackingData.events.length === 0) ? (
                <div className="p-4 bg-white border border-[#F1BCCE] rounded-2xl text-xs text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D84B7E]" />
                  <span>Shipment registered in courier manifest. Live checkpoint scans will appear here as package moves across fulfillment centers.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingData.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 bg-white border border-[#F1BCCE] rounded-2xl flex items-start gap-3.5 text-xs shadow-2xs"
                    >
                      <div className="w-3 h-3 rounded-full bg-[#D84B7E] mt-1 shrink-0 ring-4 ring-[#F8D7E3]" />
                      <div className="flex-1">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <span className="font-bold text-[#111111] text-sm">{ev.activity}</span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(ev.event_time).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} • {new Date(ev.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#D84B7E]" />
                            <span>Location: {ev.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Notice & External Carrier Link */}
            <div className="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-[#F1BCCE] text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>All YURAE packages are shipped under temperature-controlled cosmetic logistics.</span>
              </div>

              {trackingData.tracking_url && (
                <a
                  href={trackingData.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-[#111111] text-white font-bold rounded-full hover:bg-[#D84B7E] transition-all flex items-center gap-2 shadow-xs uppercase tracking-wider text-[11px]"
                >
                  Direct Carrier Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
