import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef } from 'react';

const statusOptions = [
  { value: '', label: 'الكل' },
  { value: 'open', label: 'نشط' },
  { value: 'pending', label: 'معلق' },
  { value: 'closed', label: 'مغلق' },
  { value: 'archived', label: 'مؤرشف' },
];

const dateOptions = [
  { value: 'all', label: 'كل الوقت' },
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'last7', label: 'آخر ٧ أيام' },
  { value: 'custom', label: 'مخصص' },
];

const priorityOptions = [
  { value: '', label: 'الكل' },
  { value: 'high', label: 'عالية' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'low', label: 'منخفضة' },
];

const searchScopes = [
  { value: 'all', label: 'الكل' },
  { value: 'name', label: 'الاسم' },
  { value: 'phone', label: 'رقم الهاتف' },
  { value: 'messages', label: 'المحتوى' },
];

const sortOptions = [
  { value: 'latest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'active', label: 'الأكثر نشاطاً' },
];

function ConversationFilters({ filters, onChange, resultCount }) {
  const searchInputRef = useRef(null);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  useEffect(() => {
    const listener = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === '/' && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const customRangeEnabled = useMemo(() => filters.dateRange === 'custom', [filters.dateRange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold">الفلاتر</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {resultCount} نتيجة
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>الاختصار: Ctrl/Cmd + K للبحث</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600">شريط البحث</label>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <input
                ref={searchInputRef}
                type="search"
                placeholder="ابحث بالاسم، الهاتف أو محتوى الرسائل"
                value={filters.search}
                onChange={(e) => handleChange('search', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm shadow-sm focus:border-indigo-300 focus:outline-none"
              />
              <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                /
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              {searchScopes.map((scope) => (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => handleChange('searchScope', scope.value)}
                  className={`rounded-full border px-3 py-1 transition hover:border-indigo-200 hover:text-indigo-700 ${
                    filters.searchScope === scope.value
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">الحالة</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('status', option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 hover:text-indigo-700 ${
                    filters.status === option.value
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">الأولوية</label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('priority', option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 hover:text-indigo-700 ${
                    filters.priority === option.value
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">التاريخ</label>
            <div className="flex flex-wrap gap-2">
              {dateOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('dateRange', option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 hover:text-indigo-700 ${
                    filters.dateRange === option.value
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {customRangeEnabled && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none"
                />
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">الفرز</label>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('sort', option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 hover:text-indigo-700 ${
                    filters.sort === option.value
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
      </div>
    </div>
  );
}

ConversationFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    searchScope: PropTypes.oneOf(['all', 'name', 'phone', 'messages']),
    status: PropTypes.string,
    priority: PropTypes.string,
    dateRange: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    sort: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  resultCount: PropTypes.number,
};

ConversationFilters.defaultProps = {
  resultCount: 0,
};

export default ConversationFilters;
