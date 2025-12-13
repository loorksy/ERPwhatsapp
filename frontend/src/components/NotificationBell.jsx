import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notification.service';
import { getSocket } from '../services/socket.service';
import { parseApiError } from '../utils/error';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE_STYLES = {
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-rose-50 text-rose-700 border-rose-100',
};

function NotificationBell({ className = '' }) {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const loadNotifications = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchNotifications({ limit: 50 });
      setNotifications(data || []);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => setOpen((prev) => !prev);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !user?.id) return undefined;
    const socket = getSocket(token);
    socket.emit('join', { userId: user.id });

    const handleNew = (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 100));
    };

    const handleRead = ({ id }) => {
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    };

    const handleReadAll = () => {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    };

    const handleDeleted = ({ id }) => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    };

    socket.on('notification:new', handleNew);
    socket.on('notification:read', handleRead);
    socket.on('notification:read-all', handleReadAll);
    socket.on('notification:deleted', handleDeleted);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('notification:read', handleRead);
      socket.off('notification:read-all', handleReadAll);
      socket.off('notification:deleted', handleDeleted);
    };
  }, [token, user?.id]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          handleToggle();
          setError(null);
        }}
        className="relative rounded-full border border-slate-200 p-2 text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
      >
        <span className="sr-only">الإشعارات</span>
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
            <span>الإشعارات</span>
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              وضع علامة على الكل
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto px-4 py-3 text-sm text-slate-700">
            {loading && <p className="text-center text-slate-500">جاري التحميل...</p>}
            {error && <p className="text-center text-rose-500">{error}</p>}
            {!loading && !notifications.length && <p className="text-center text-slate-500">لا توجد إشعارات</p>}
            {notifications.map((item) => {
              const typeStyle = TYPE_STYLES[item.type] || TYPE_STYLES.info;
              return (
                <div
                  key={item.id}
                  className={`mb-2 rounded-lg border px-3 py-2 last:mb-0 ${typeStyle} ${item.is_read ? 'opacity-80' : 'bg-opacity-70'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.title}</p>
                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(item.id)}
                        className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                      >
                        تم القراءة
                      </button>
                    )}
                  </div>
                  {item.message && <p className="mt-1 text-[13px] leading-5 text-slate-700">{item.message}</p>}
                  <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(item.created_at)}</p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-200 px-4 py-2 text-right">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              عرض الكل
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

NotificationBell.propTypes = {
  className: PropTypes.string,
};

export default NotificationBell;
