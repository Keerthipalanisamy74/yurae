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
  Phone,
  Package,
  Sparkles,
  Search,
  Filter,
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
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<ContactMessage[]>(messages);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDirect = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/contact');
      if (Array.isArray(res.data)) {
        setLocalMessages(res.data);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDirect();
  }, []);

  React.useEffect(() => {
    if (messages && messages.length > 0) {
      setLocalMessages(messages);
    }
  }, [messages]);

  const activeList = localMessages.length > 0 ? localMessages : messages;

  const filteredMessages = activeList.filter((m) => {
    if (filter === 'UNREAD') return m.status === 'UNREAD';
    if (filter === 'REPLIED') return m.status === 'REPLIED';
    return true;
  });

  const unreadCount = activeList.filter((m) => m.status === 'UNREAD').length;
  const repliedCount = activeList.filter((m) => m.status === 'REPLIED').length;

  const handleOpenMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText(msg.admin_notes || '');
    if (msg.status === 'UNREAD') {
      try {
        await api.put(`/contact/${msg.id}/read`);
        onRefreshMessages();
      } catch {
        // Non-blocking
      }
    }
  };

  const handleApplyPreset = (preset: string) => {
    if (!selectedMessage) return;
    const name = selectedMessage.name || 'Patron';

    switch (preset) {
      case 'GREETING':
        setReplyText(
          `Dear ${name},\n\nThank you for contacting Yurae Beauty Concierge. We have reviewed your query and are delighted to assist you.\n\n`
        );
        break;
      case 'ORDER_STATUS':
        setReplyText(
          `Dear ${name},\n\nThank you for reaching out regarding your order. Your package has been handcrafted with botanical care and is progressing smoothly through our express logistics pipeline.\n\nYou can track live milestones anytime in your account portal.\n\nWarm regards,\nYurae Concierge Atelier`
        );
        break;
      case 'CONSULTATION':
        setReplyText(
          `Dear ${name},\n\nThank you for your skincare consultation inquiry! For optimal glass-skin radiance, we recommend applying our formulations after gentle cleansing and botanical toning, both morning and night.\n\nFeel free to reply if you need personalized ingredient recommendations.\n\nWarm regards,\nYurae Skincare Specialists`
        );
        break;
      case 'REFUND':
        setReplyText(
          `Dear ${name},\n\nYour request has been processed. A refund has been issued to your original payment method and will reflect within 3-5 business days.\n\nThank you for choosing Yurae Beauty.\n\nWarm regards,\nYurae Concierge Atelier`
        );
        break;
      default:
        break;
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setIsSendingReply(true);
      await api.post(`/contact/${selectedMessage.id}/reply`, {
        reply_message: replyText.trim(),
      });
      showToast(`Official reply dispatched to ${selectedMessage.email}`, 'success');
      setSelectedMessage(null);
      onRefreshMessages();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to send reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      setIsDeleting(msgId);
      await api.delete(`/contact/${msgId}`);
      showToast('Inquiry message removed', 'success');
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
      onRefreshMessages();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Could not delete message', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: 'id',
      header: 'Ticket #',
      sortable: true,
      render: (m) => (
        <span className="font-mono font-bold text-gray-900 text-xs">
          #{m.id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Customer Profile',
      sortable: true,
      render: (m) => (
        <div className="space-y-0.5">
          <p className="font-bold text-gray-900 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-[#D84B7E]" />
            {m.name}
          </p>
          <p className="text-[11px] text-gray-500 font-mono">{m.email}</p>
          {m.phone && <p className="text-[10px] text-gray-400">📞 {m.phone}</p>}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Inquiry Content',
      render: (m) => (
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-gray-900 line-clamp-1">{m.subject || 'General Inquiry'}</p>
            {m.order_number && (
              <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-[#D84B7E] font-mono text-[9px] font-bold">
                Ord: #{m.order_number}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{m.message}</p>
          {m.admin_notes && (
            <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 line-clamp-1">
              ✓ Replied: {m.admin_notes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Received On',
      sortable: true,
      render: (m) => (
        <span className="text-[11px] text-gray-600 block">
          {m.created_at ? new Date(m.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            m.status === 'REPLIED'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : m.status === 'UNREAD'
              ? 'bg-[#FCE7F0] text-[#D84B7E] border border-[#F1BCCE]'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          {m.status === 'REPLIED' && '✓ Replied'}
          {m.status === 'UNREAD' && '● New Inquiry'}
          {m.status === 'READ' && 'Read'}
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
            Customer Support &amp; Concierge Desk
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#111111]">
            Customer Inquiries &amp; Support Messages
          </h2>
          <p className="text-xs text-gray-500">
            View customer questions submitted via Contact Us forms and send official branded replies directly to their inboxes from <strong>support@yuraebeauty.com</strong>.
          </p>
        </div>

        <button
          onClick={onRefreshMessages}
          className="px-4 py-2.5 rounded-2xl border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] text-xs font-bold text-gray-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D84B7E]" />
          <span>Refresh Messages</span>
        </button>
      </div>

      {/* Metric & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-[#FAF0F4] border border-[#F1BCCE] rounded-2xl text-xs font-bold w-fit">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            All Inquiries ({messages.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'UNREAD' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${filter === 'UNREAD' ? 'bg-white text-[#D84B7E]' : 'bg-[#D84B7E] text-white'}`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('REPLIED')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === 'REPLIED' ? 'bg-[#D84B7E] text-white shadow-2xs' : 'text-gray-700 hover:text-[#D84B7E]'
            }`}
          >
            Replied ({repliedCount})
          </button>
        </div>

        <div className="text-[11px] text-gray-500">
          Sender Channel: <span className="font-mono font-bold text-[#D84B7E]">support@yuraebeauty.com</span>
        </div>
      </div>

      {/* Messages Table */}
      <DataTable<ContactMessage>
        data={filteredMessages}
        columns={columns}
        keyExtractor={(m) => m.id}
        searchPlaceholder="Search inquiry by customer name, email, subject, or message content..."
        searchKeys={['name', 'email', 'subject', 'message', 'order_number']}
        renderActions={(m) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenMessage(m)}
              className="px-3.5 py-1.5 rounded-xl bg-[#D84B7E] text-white text-xs font-bold hover:bg-[#111111] transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{m.status === 'REPLIED' ? 'View & Re-reply' : 'Read & Reply'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMessage(m.id)}
              disabled={isDeleting === m.id}
              className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete inquiry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Rich Reply Drawer / Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedMessage(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F1BCCE] z-10 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D84B7E] block">
                  Support Ticket #{selectedMessage.id}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#111111]">
                  Inquiry from {selectedMessage.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-gray-500 mt-1">
                  <span className="font-mono text-gray-800 font-bold">✉️ {selectedMessage.email}</span>
                  {selectedMessage.phone && <span>📞 {selectedMessage.phone}</span>}
                  {selectedMessage.order_number && (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-[#D84B7E] font-mono font-bold">
                      Order: #{selectedMessage.order_number}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Original Customer Message Box */}
            <div className="p-4 sm:p-5 bg-[#FFF8FA] rounded-2xl border border-[#F1BCCE] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#D84B7E] uppercase tracking-wider">Customer Message</span>
                <span className="text-gray-400">
                  {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ''}
                </span>
              </div>
              <div className="font-bold text-gray-900 text-sm">
                Subject: {selectedMessage.subject || 'General Inquiry'}
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-white/80 p-3 rounded-xl border border-[#F1BCCE]/40">
                {selectedMessage.message}
              </p>
            </div>

            {/* Previous Admin Reply if exists */}
            {selectedMessage.admin_notes && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-[11px]">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Previously Sent Reply:
                </span>
                <p className="text-emerald-900 leading-relaxed whitespace-pre-wrap bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  {selectedMessage.admin_notes}
                </p>
              </div>
            )}

            {/* Reply Composer Form */}
            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#D84B7E]" />
                    Compose Official Concierge Reply (Sent from support@yuraebeauty.com)
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Quick Templates:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('GREETING')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#FAF0F4] hover:text-[#D84B7E] text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    + Greeting
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ORDER_STATUS')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#FAF0F4] hover:text-[#D84B7E] text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    + Order Status
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('CONSULTATION')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#FAF0F4] hover:text-[#D84B7E] text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    + Skincare Consultation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('REFUND')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#FAF0F4] hover:text-[#D84B7E] text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    + Refund Issued
                  </button>
                </div>

                <textarea
                  rows={5}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Dear ${selectedMessage.name}, thank you for contacting Yurae Beauty...`}
                  className="w-full p-3.5 bg-white border border-[#F1BCCE] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E] text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                  Recipient: <strong className="text-gray-700 font-mono">{selectedMessage.email}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="px-6 py-2.5 rounded-xl bg-[#D84B7E] text-white font-bold hover:bg-[#111111] transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingReply ? 'animate-bounce' : ''}`} />
                    <span>{isSendingReply ? 'Dispatching Reply...' : 'Send Branded Email Reply'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
