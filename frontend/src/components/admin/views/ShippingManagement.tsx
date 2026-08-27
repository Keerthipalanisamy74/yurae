import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Settings,
  ExternalLink,
  Save,
  RefreshCw,
  Search,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { Order, ShippingSettings } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { ShippingLabelModal } from '../../common/ShippingLabelModal';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface ShippingManagementProps {
  orders: Order[];
  onRefreshOrders: () => void;
}

export const ShippingManagement: React.FC<ShippingManagementProps> = ({
  orders,
  onRefreshOrders,
}) => {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'shipments' | 'settings'>('shipments');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null);

  // Filtered orders that have shipments or are in fulfillment pipeline
  const shipments = orders.filter((o) =>
    ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(o.order_status)
  );

  useEffect(() => {
    fetchShippingSettings();
  }, []);

  const fetchShippingSettings = async () => {
    try {
      const res = await api.get('/admin/shipping-settings');
      setShippingSettings(res.data);
    } catch {
      // Default fallback
      setShippingSettings({
        shipping_provider: 'Shiprocket',
        shipping_mode: 'AIR_EXPRESS',
        cod_enabled: true,
        flat_shipping_fee: 100,
        free_shipping_threshold: 1500,
        cod_surcharge: 50,
        default_package_weight_kg: 0.5,
        default_package_length_cm: 15,
        default_package_breadth_cm: 10,
        default_package_height_cm: 8,
        warehouse_contact_name: 'Yurae Atelier Dispatch',
        warehouse_email: 'dispatch@yurae.com',
        warehouse_phone: '+91 80 4920 1829',
        warehouse_address: 'Yurae Atelier Logistics Hub, Level 2, Indiranagar',
        warehouse_city: 'Bengaluru',
        warehouse_state: 'Karnataka',
        warehouse_pincode: '560038',
        warehouse_country: 'India',
        is_shiprocket_connected: true,
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingSettings) return;

    try {
      setIsSavingSettings(true);
      await api.put('/admin/shipping-settings', shippingSettings);
      showToast('Shipping settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save shipping settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      header: 'Order & Recipient',
      sortable: true,
      render: (o) => (
        <div className="space-y-0.5">
          <p className="font-bold text-gray-900">#{o.order_number}</p>
          <p className="text-[10px] text-gray-600">
            {o.user ? `${o.user.first_name} ${o.user.last_name}` : 'Client'}
          </p>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (o) => (
        <div className="text-[11px] text-gray-700">
          <p className="font-semibold">{o.address?.city || 'Bengaluru'}</p>
          <p className="text-[10px] text-gray-600">
            {o.address?.state || 'KA'} - {o.address?.postal_code || '560001'}
          </p>
        </div>
      ),
    },
    {
      key: 'courier_name',
      header: 'Courier Partner',
      sortable: true,
      render: (o) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE]">
          {o.courier_name || 'Shiprocket / Delhivery'}
        </span>
      ),
    },
    {
      key: 'awb_code',
      header: 'AWB Tracking Code',
      sortable: true,
      render: (o) => (
        <span className="font-mono text-xs font-bold text-gray-900">
          {o.awb_code || `AWB-${o.id}9824`}
        </span>
      ),
    },
    {
      key: 'order_status',
      header: 'Shipment Status',
      sortable: true,
      render: (o) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            o.order_status === 'Delivered'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : o.order_status === 'Shipped'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {o.order_status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & SubTab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Logistics &amp; Courier Operations
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Shipping &amp; Logistics Hub
          </h2>
          <p className="text-xs text-gray-500">
            Multi-carrier dispatch management, AWB label generation, and domestic/international rate rules.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold">
          <button
            onClick={() => setSubTab('shipments')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              subTab === 'shipments'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Live Shipments ({shipments.length})
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              subTab === 'settings'
                ? 'bg-[#D84B7E] text-white shadow-2xs'
                : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Shipping Rate Rules
          </button>
        </div>
      </div>

      {subTab === 'shipments' ? (
        <DataTable<Order>
          data={shipments}
          columns={columns}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search by AWB code, courier, order number, or client..."
          searchKeys={['awb_code', 'courier_name', 'order_number']}
          renderActions={(o) => (
            <button
              type="button"
              onClick={() => setSelectedOrderForLabel(o)}
              className="px-3 py-1.5 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Courier Label</span>
            </button>
          )}
        />
      ) : (
        /* Shipping Rate & Logistics Rule Settings */
        shippingSettings && (
          <form
            onSubmit={handleSaveSettings}
            className="max-w-2xl bg-white p-6 rounded-3xl border border-[#F1BCCE]/70 shadow-xs space-y-4 text-xs"
          >
            <h3 className="font-serif text-lg font-bold text-[#111111] border-b border-gray-100 pb-2">
              Logistics &amp; Dispatch Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Free Shipping Threshold (INR) *</label>
                <input
                  type="number"
                  required
                  value={shippingSettings.free_shipping_threshold}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      free_shipping_threshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Standard Shipping Fee (INR) *</label>
                <input
                  type="number"
                  required
                  value={shippingSettings.flat_shipping_fee}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      flat_shipping_fee: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">COD Extra Handling Fee (INR)</label>
                <input
                  type="number"
                  value={shippingSettings.cod_surcharge || 0}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      cod_surcharge: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Logistics Carrier Provider</label>
                <input
                  type="text"
                  value={shippingSettings.shipping_provider}
                  onChange={(e) =>
                    setShippingSettings({
                      ...shippingSettings,
                      shipping_provider: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Atelier Warehouse Origin Address</label>
              <textarea
                rows={2}
                value={shippingSettings.warehouse_address}
                onChange={(e) =>
                  setShippingSettings({
                    ...shippingSettings,
                    warehouse_address: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving...' : 'Save Shipping Settings'}</span>
              </button>
            </div>
          </form>
        )
      )}

      {/* Shipping Label Modal */}
      {selectedOrderForLabel && (
        <ShippingLabelModal
          isOpen={Boolean(selectedOrderForLabel)}
          order={selectedOrderForLabel}
          onClose={() => setSelectedOrderForLabel(null)}
        />
      )}
    </div>
  );
};
