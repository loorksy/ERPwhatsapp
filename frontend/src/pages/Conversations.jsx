import { useEffect, useMemo, useRef, useState } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import api from '../services/api.service';
import { getSocket } from '../services/socket.service';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/error';

function ConversationsPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    searchScope: 'all',
    status: '',
    priority: '',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    sort: 'latest',
  });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const activeId = selectedConversation?.id || null;

  const resolveDateRange = () => {
    const now = new Date();
    const startOfDay = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    };
    const endOfDay = (date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    };

    switch (filters.dateRange) {
      case 'today':
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case 'yesterday': {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        return { startDate: startOfDay(y), endDate: endOfDay(y) };
      }
      case 'last7': {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 6);
        return { startDate: startOfDay(lastWeek), endDate: endOfDay(now) };
      }
      case 'custom':
        return {
          startDate: filters.startDate ? startOfDay(filters.startDate) : undefined,
          endDate: filters.endDate ? endOfDay(filters.endDate) : undefined,
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const priorityMap = { high: 3, medium: 2, low: 1 };

  const fetchConversations = async (nextPage = 1, append = false) => {
    setLoadingList(true);
    setError(null);
    try {
      const { startDate, endDate } = resolveDateRange();
      const { data } = await api.get('/conversations', {
        params: {
          page: nextPage,
          pageSize: 15,
          search: filters.search || undefined,
          searchScope: filters.searchScope,
          status: filters.status || undefined,
          priority: filters.priority ? priorityMap[filters.priority] : undefined,
          startDate,
          endDate,
          sort: filters.sort,
        },
      });
      const newItems = data?.data || [];
      setHasMore((nextPage * (data?.pageSize || 15)) < (data?.total || 0));
      setConversations((prev) => (append ? [...prev, ...newItems] : newItems));
      setPage(nextPage);
      setTotal(Number(data?.total || 0));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoadingList(false);
    }
  };

  const fetchConversationDetails = async (conversation) => {
    if (!conversation?.id) return;
    setSelectedConversation(conversation);
    setLoadingChat(true);
    setError(null);
    try {
      const { data } = await api.get(`/conversations/${conversation.id}`, { params: { page: 1, pageSize: 100 } });
      setSelectedConversation(data.conversation || conversation);
      setMessages(data.messages || []);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSend = async ({ text, file }) => {
    if (!selectedConversation) return;
    setSending(true);
    setError(null);
    try {
      const payload = new FormData();
      payload.append('phone', selectedConversation.contact_phone);
      payload.append('message', text || '');
      if (file) payload.append('media', file);

      await api.post('/messages/send', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        message_text: text,
        media_url: null,
        sender_type: 'bot',
        is_from_bot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSending(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedConversation) return;
    try {
      await api.post(`/conversations/${selectedConversation.id}/transfer`, { note: 'تحويل للمشغل' });
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  useEffect(() => {
    fetchConversations(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getSocket(token);
    socketRef.current = socket;

    const handleNewMessage = (payload) => {
      if (payload?.conversationId === activeId) {
        setMessages((prev) => [...prev, payload.message]);
      }
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === payload.conversationId);
        if (!existing) return prev;
        return prev.map((c) =>
          c.id === payload.conversationId
            ? {
                ...c,
                last_message: payload.message?.message_text,
                updated_at: payload.message?.timestamp,
                unread_count: (c.unread_count || 0) + (activeId === payload.conversationId ? 0 : 1),
              }
            : c,
        );
      });
    };

    const handleConversationUpdated = (conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c)));
      if (conversation.id === activeId) {
        setSelectedConversation((prev) => ({ ...prev, ...conversation }));
      }
    };

    const handleConversationNew = (conversation) => {
      setConversations((prev) => [conversation, ...prev]);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('conversation:new', handleConversationNew);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('conversation:new', handleConversationNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeId]);

  const layoutState = useMemo(
    () => ({ loadingList, loadingChat, hasMore, filters, error }),
    [loadingList, loadingChat, hasMore, filters, error],
  );

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <div className="h-[calc(100vh-220px)] lg:h-[calc(100vh-180px)]">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          loading={layoutState.loadingList}
          hasMore={layoutState.hasMore}
          onSelect={(c) => fetchConversationDetails(c)}
          onLoadMore={() => fetchConversations(page + 1, true)}
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={total}
        />
      </div>

      <div className="flex h-[calc(100vh-220px)] flex-col lg:h-[calc(100vh-180px)]">
        {error && <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            loading={layoutState.loadingChat}
            sending={sending}
            onSend={handleSend}
            onTransfer={handleTransfer}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-600">
            اختر محادثة من القائمة لعرض الرسائل.
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationsPage;
