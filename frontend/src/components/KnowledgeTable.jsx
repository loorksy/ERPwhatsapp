import PropTypes from 'prop-types';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const truncate = (value, length = 90) => {
  if (!value) return '-';
  if (value.length <= length) return value;
  return `${value.slice(0, length)}...`;
};

function KnowledgeTable({
  data,
  loading,
  page,
  pageSize,
  total,
  search,
  category,
  categories,
  sortBy,
  sortDirection,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderSort = (column) => {
    const isActive = sortBy === column;
    const direction = isActive ? sortDirection : undefined;
    return (
      <button
        type="button"
        className={`flex items-center gap-1 text-right text-sm font-semibold ${
          isActive ? 'text-indigo-700' : 'text-slate-700'
        }`}
        onClick={() => onSortChange(column)}
      >
        <span>{column === 'category' ? 'الفئة' : column === 'question' ? 'السؤال' : 'تاريخ الإضافة'}</span>
        <span className="text-xs">{direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}</span>
      </button>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="بحث عن سؤال أو إجابة"
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageChange(1);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
          />
          <select
            value={category}
            onChange={(e) => {
              onCategoryChange(e.target.value);
              onPageChange(1);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:max-w-[180px]"
          >
            <option value="">كل الفئات</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{total} نتيجة</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>الفرز:</span>
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [col, dir] = e.target.value.split('-');
              onSortChange(col, dir);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="created_at-desc">الأحدث</option>
            <option value="created_at-asc">الأقدم</option>
            <option value="question-asc">السؤال (أ-ي)</option>
            <option value="question-desc">السؤال (ي-أ)</option>
            <option value="category-asc">الفئة (أ-ي)</option>
            <option value="category-desc">الفئة (ي-أ)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{renderSort('category')}</th>
              <th className="px-4 py-3">{renderSort('question')}</th>
              <th className="px-4 py-3">الإجابة</th>
              <th className="px-4 py-3">{renderSort('created_at')}</th>
              <th className="px-4 py-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                  لا توجد بيانات حالياً.
                </td>
              </tr>
            )}
            {!loading &&
              data.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.category || '-'}</td>
                  <td className="px-4 py-3 text-slate-800">{item.question}</td>
                  <td className="px-4 py-3 text-slate-600">{truncate(item.answer)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-lg border border-indigo-100 px-3 py-1 text-indigo-700 transition hover:bg-indigo-50"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="rounded-lg border border-rose-100 px-3 py-1 text-rose-700 transition hover:bg-rose-50"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>عدد الصفوف:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">صفحة {page} من {totalPages}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            السابق
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}

KnowledgeTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      category: PropTypes.string,
      question: PropTypes.string,
      answer: PropTypes.string,
      created_at: PropTypes.string,
    }),
  ).isRequired,
  loading: PropTypes.bool,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  search: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string),
  sortBy: PropTypes.string.isRequired,
  sortDirection: PropTypes.oneOf(['asc', 'desc']).isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

KnowledgeTable.defaultProps = {
  loading: false,
  categories: [],
};

export default KnowledgeTable;
