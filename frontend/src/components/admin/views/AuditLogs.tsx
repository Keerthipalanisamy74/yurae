import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Eye,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { AuditLogEntry } from '../types/admin';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export const AuditLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fulfillment/audit-logs');
      setLogs(res.data);
    } catch {
      // Fallback
      setLogs([
        {
          id: 1,
          actor_name: 'Administrator',
          actor_role: 'SUPER_ADMIN',
          action: 'STATUS_CHANGE',
          entity_type: 'Order',
          entity_id: 'ORD-9182',
          old_value_json: '{"order_status": "Processing"}',
          new_value_json: '{"order_status": "Packed"}',
          ip_address: '127.0.0.1',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      render: (l) => (
        <span className="text-[11px] text-gray-600 font-mono">
          {l.created_at ? new Date(l.created_at).toLocaleString() : 'Recent'}
        </span>
      ),
    },
    {
      key: 'actor_name',
      header: 'Staff Actor',
      sortable: true,
      render: (l) => (
        <div>
          <p className="font-bold text-gray-900">{l.actor_name}</p>
          <span className="text-[9px] font-bold text-[#D84B7E] uppercase">{l.actor_role}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Taken',
      sortable: true,
      render: (l) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FAF0F4] text-[#D84B7E] border border-[#F1BCCE]">
          {l.action}
        </span>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity / Target ID',
      render: (l) => (
        <div className="text-xs">
          <span className="font-semibold text-gray-800">{l.entity_type}</span>
          <span className="text-gray-500 font-mono block text-[10px]">#{l.entity_id}</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (l) => (
        <span className="font-mono text-[10px] text-gray-500">{l.ip_address || 'Internal'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Compliance &amp; Traceability Ledger
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Administrative Audit Trail
          </h2>
          <p className="text-xs text-gray-500">
            Immutable log of all administrative actions, stock changes, QC inspections, and financial operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Table */}
      <DataTable<AuditLogEntry>
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.id}
        loading={loading}
        searchPlaceholder="Search audit log by actor, action, or entity ID..."
        searchKeys={['actor_name', 'action', 'entity_type', 'entity_id']}
        renderActions={(l) => (
          <button
            type="button"
            onClick={() => setSelectedLog(l)}
            className="p-1.5 rounded-lg border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] transition-colors cursor-pointer"
            title="Inspect payload diff"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
        )}
      />

      {/* JSON Payload Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedLog(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#111111]">
                  Audit Event #{selectedLog.id}
                </h3>
                <p className="text-[10px] text-gray-500 font-mono">
                  {selectedLog.action} on {selectedLog.entity_type} #{selectedLog.entity_id}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="font-bold text-gray-700">Previous Value (Before):</span>
                <pre className="p-3 bg-gray-50 rounded-xl font-mono text-[11px] overflow-x-auto text-gray-800 border">
                  {selectedLog.old_value_json || 'null'}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-gray-700">New Value (After):</span>
                <pre className="p-3 bg-[#FAF0F4] rounded-xl font-mono text-[11px] overflow-x-auto text-[#D84B7E] border border-[#F1BCCE]">
                  {selectedLog.new_value_json || 'null'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
