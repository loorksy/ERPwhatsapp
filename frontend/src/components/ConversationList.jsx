import PropTypes from 'prop-types';
import { useMemo } from 'react';

const statusLabels = {
  active: 'نشط',
  pending: 'معلق',
  closed: 'مغلق',
};

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-200 text-slate-700',
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

function ConversationList({
  conversations,
  activeId,
  loading,
  hasMore,
  onSelect,
  onLoadMore,
  search,
  onSearch,
  status,
  onStatusChange,
}) {
  const statusOptions = useMemo(
    () => [
      { value: '', label: 'الكل' },
      { value: 'active', label: 'نشط' },
      { value: 'pending', label: 'معلق' },
      { value: 'closed', label: 'مغلق' },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 border-b border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="ابحث بالاسم أو الرقم"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">الحالة:</span>
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onStatusChange(option.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 hover:text-indigo-700 ${
                  status === option.value
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((item) => {
          const isActive = item.id === activeId;
          const unread = Number(item.unread_count || 0) > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-indigo-50 ${
                isActive ? 'bg-indigo-50' : 'bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.contact_name || item.contact_phone || 'جهة اتصال'}
                  </p>
                  {item.status && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        statusColors[item.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusLabels[item.status] || item.status}
                    </span>
                  )}
                  {unread && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
                <p className="truncate text-xs text-slate-600">{item.last_message || 'لا توجد رسائل بعد'}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
                <span>{formatTime(item.updated_at || item.created_at)}</span>
                {unread && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">جديد</span>}
              </div>
            </button>
          );
        })}

        {!loading && conversations.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-600">لا توجد محادثات مطابقة.</div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          disabled={loading || !hasMore}
          onClick={onLoadMore}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'جاري التحميل...' : hasMore ? 'تحميل المزيد' : 'لا مزيد من النتائج'}
        </button>
      </div>
    </div>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeId: PropTypes.number,
  loading: PropTypes.bool,
  hasMore: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

ConversationList.defaultProps = {
  activeId: null,
  loading: false,
  hasMore: false,
};

export default ConversationList;
