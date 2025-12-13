import PropTypes from 'prop-types';
import { useMemo } from 'react';
import ConversationFilters from './ConversationFilters';

const statusLabels = {
  open: 'نشط',
  active: 'نشط',
  pending: 'معلق',
  closed: 'مغلق',
  archived: 'مؤرشف',
};

const statusColors = {
  open: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-200 text-slate-700',
  archived: 'bg-slate-200 text-slate-700',
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
  filters,
  onFiltersChange,
  resultCount,
}) {
  const summaryText = useMemo(() => {
    if (!resultCount) return 'لا توجد نتائج.';
    return `${resultCount} نتيجة`;
  }, [resultCount]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 border-b border-slate-200 p-4">
        <ConversationFilters filters={filters} onChange={onFiltersChange} resultCount={resultCount} />
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
        <div className="mb-2 text-xs text-slate-500">{summaryText}</div>
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
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  resultCount: PropTypes.number,
};

ConversationList.defaultProps = {
  activeId: null,
  loading: false,
  hasMore: false,
  resultCount: 0,
};

export default ConversationList;
