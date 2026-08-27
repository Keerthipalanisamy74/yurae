import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { ContactMessage } from '../../../types';
import { DataTable, Column } from '../components/DataTable';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface SupportMessagesProps {
  messages: ContactMessage[];
  onRefreshMessages: () => void;
}

export const SupportMessages: React.FC<SupportMessagesProps> = ({
  messages,
  onRefreshMessages,
}) => {
  const { showToast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REPLIED'>('ALL');

  const filteredMessages = messages.filter((m) => {
    if (filter === 'UNREAD') return m.status === 'UNREAD';
    if (filter === 'REPLIED') return m.status === 'REPLIED';
    return true;
  });

  const handleOpenMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText('');
    if (msg.status === 'UNREAD') {
      try {
        await api.put(`/contact-messages/${msg.id}/read`);
        onRefreshMessages();
      } catch {
        // Non-blocking
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setIsSendingReply(true);
      await api.post(`/contact-messages/${selectedMessage.id}/reply`, {
        reply_message: replyText,
      });
      showToast(`Reply sent to ${selectedMessage.email}`, 'success');
      setSelectedMessage(null);
      onRefreshMessages();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to send reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: 'name',
      header: 'Sender Profile',
      sortable: true,
      render: (m) => (
        <div className="space-y-0.5">
          <p className="font-bold text-gray-900">{m.name}</p>
          <p className="text-[10px] text-gray-600 font-mono">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Inquiry',
      render: (m) => (
        <div className="space-y-0.5 max-w-xs">
          <p className="font-bold text-gray-900 line-clamp-1">{m.subject || 'Store Inquiry'}</p>
          <p className="text-xs text-gray-600 line-clamp-1">{m.message}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Received Date',
      sortable: true,
      render: (m) => (
        <span className="text-[11px] text-gray-600">
          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            m.status === 'REPLIED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : m.status === 'UNREAD'
              ? 'bg-[#FCE7F0] text-[#D84B7E] border border-[#F1BCCE]'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {m.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
            Customer Support &amp; Concierge
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Support Inquiries &amp; Messages
          </h2>
          <p className="text-xs text-gray-500">
            Client enquiries submitted via contact forms, custom ritual requests, and order questions.
          </p>
        </div>

        <button
          onClick={onRefreshMessages}
          className="px-3.5 py-2 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'ALL' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          All Inquiries ({messages.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'UNREAD' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('REPLIED')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filter === 'REPLIED' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700'
          }`}
        >
          Replied
        </button>
      </div>

      {/* Messages Table */}
      <DataTable<ContactMessage>
        data={filteredMessages}
        columns={columns}
        keyExtractor={(m) => m.id}
        searchPlaceholder="Search message by sender name, email, or keywords..."
        searchKeys={['name', 'email', 'subject', 'message']}
        renderActions={(m) => (
          <button
            type="button"
            onClick={() => handleOpenMessage(m)}
            className="px-3 py-1.5 rounded-xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-[#D84B7E] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read &amp; Reply</span>
          </button>
        )}
      />

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedMessage(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#F1BCCE] z-10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  Inquiry from {selectedMessage.name}
                </h3>
                <p className="text-[10px] text-gray-500 font-mono">{selectedMessage.email}</p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#FAF0F4] rounded-2xl border border-[#F1BCCE]/60 space-y-1.5">
              <span className="font-bold text-gray-900 block">
                Subject: {selectedMessage.subject || 'Inquiry'}
              </span>
              <p className="text-gray-700 leading-relaxed">{selectedMessage.message}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Official Brand Concierge Reply</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Dear patron, thank you for reaching out to Yurae..."
                  className="w-full p-3 bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-5 py-2 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Send Email Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
