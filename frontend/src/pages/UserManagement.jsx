import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  deleteUser,
  exportUsers,
  fetchUserDetails,
  fetchUsers,
  updateUserPlan,
  updateUserStatus,
} from '../services/admin.service';
import { formatDateTime } from '../utils/date';

const plans = ['مجاني', 'أساسي', 'احترافي', 'مؤسسة'];
const statuses = [
  { key: 'active', label: 'نشط' },
  { key: 'suspended', label: 'معطل' },
];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const loadUsers = async (newPage = page, newPageSize = pageSize) => {
    setLoading(true);
    try {
      const { users: list, total: count } = await fetchUsers({
        page: newPage,
        pageSize: newPageSize,
        search,
        plan,
        status,
        startDate,
        endDate,
      });
      setUsers(list || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, plan, status, startDate, endDate]);

  const handleSearch = async (value) => {
    setSearch(value);
    setPage(1);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers(1, pageSize);
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleOpenUser = async (userId) => {
    try {
      const detail = await fetchUserDetails(userId);
      setSelectedUser(detail);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to load user detail', error);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    await updateUserStatus(userId, newStatus);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
  };

  const handlePlanChange = async (userId, newPlan) => {
    await updateUserPlan(userId, newPlan);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));
  };

  const handleDelete = async (userId) => {
    await deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const handleExport = async () => {
    const data = await exportUsers({ plan, status, search, startDate, endDate });
    const rows = Array.isArray(data) ? data : [];
    const header = ['الاسم', 'البريد الإلكتروني', 'الشركة', 'الخطة', 'الحالة', 'تاريخ التسجيل'];
    const content = rows
      .map((row) =>
        [row.full_name, row.email, row.company, row.plan, row.status === 'active' ? 'نشط' : 'معطل', row.created_at]
          .map((cell) => `"${cell || ''}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([`${header.join(',')}\n${content}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">المشرف</p>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1>
          <p className="mt-1 text-sm text-slate-600">إدارة الحسابات، الأدوار، وخطط الاشتراك مع تتبع نشاطهم.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => loadUsers()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
          >
            تحديث القائمة
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            تصدير CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو الشركة"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">كل الخطط</option>
            {plans.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">كل الحالات</option>
            {statuses.map((st) => (
              <option key={st.key} value={st.key}>
                {st.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                setStartDate(date);
                setPage(1);
              }}
              placeholderText="تاريخ التسجيل من"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              dateFormat="yyyy-MM-dd"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => {
                setEndDate(date);
                setPage(1);
              }}
              placeholderText="إلى"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">عدد النتائج: {total}</div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">البريد الإلكتروني</th>
              <th className="px-4 py-3">الشركة</th>
              <th className="px-4 py-3">الخطة</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">تاريخ التسجيل</th>
              <th className="px-4 py-3">آخر نشاط</th>
              <th className="px-4 py-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-slate-500">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-slate-500">
                  لا توجد حسابات مطابقة للبحث الحالي.
                </td>
              </tr>
            )}
            {!loading &&
              users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.full_name}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.company}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <select
                      value={user.plan}
                      onChange={(e) => handlePlanChange(user.id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {plans.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                        user.status === 'active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {statuses.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(user.created_at)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(user.last_active)}</td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-indigo-100 px-3 py-1 text-indigo-700 transition hover:bg-indigo-50"
                        onClick={() => handleOpenUser(user.id)}
                      >
                        عرض
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-amber-100 px-3 py-1 text-amber-700 transition hover:bg-amber-50"
                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                      >
                        {user.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-100 px-3 py-1 text-rose-700 transition hover:bg-rose-50"
                        onClick={() => handleDelete(user.id)}
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

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>عدد الصفوف:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            السابق
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>

      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">تفاصيل المستخدم</p>
                <h3 className="text-xl font-bold text-slate-900">{selectedUser.full_name}</h3>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
                onClick={() => setModalOpen(false)}
              >
                إغلاق
              </button>
            </div>
            <div className="grid gap-4 border-b border-slate-100 px-6 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">البريد: {selectedUser.email}</p>
                <p className="text-sm text-slate-600">الشركة: {selectedUser.company}</p>
                <p className="text-sm text-slate-600">الخطة: {selectedUser.plan}</p>
                <p className="text-sm text-slate-600">الحالة: {selectedUser.status === 'active' ? 'نشط' : 'معطل'}</p>
                <p className="text-sm text-slate-600">التسجيل: {formatDateTime(selectedUser.created_at)}</p>
                <p className="text-sm text-slate-600">آخر نشاط: {formatDateTime(selectedUser.last_active)}</p>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">إحصائيات الاستخدام</p>
                <p className="text-sm text-slate-700">عدد الرسائل: {selectedUser.usage?.messages?.toLocaleString('ar-EG') || 0}</p>
                <p className="text-sm text-slate-700">استهلاك API: {selectedUser.usage?.apiCalls?.toLocaleString('ar-EG') || 0}</p>
                <p className="text-sm text-slate-700">نطاق الخطة الحالي يتيح 10k رسالة / 2k طلب شهرياً.</p>
              </div>
            </div>
            <div className="grid gap-4 px-6 py-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">تعديل الصلاحيات والخطة</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {plans.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePlanChange(selectedUser.id, p)}
                      className={`rounded-lg border px-3 py-2 font-semibold transition ${
                        selectedUser.plan === p
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-700 hover:border-indigo-200 hover:text-indigo-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">سجل النشاط</p>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  {(selectedUser.activity && selectedUser.activity.length > 0 ? selectedUser.activity : [
                    'تم إنشاء الحساب',
                    'تم تفعيل خطة أساسي',
                    'تم ربط واتساب الأول',
                  ]).map((item, idx) => (
                    <p key={item + idx} className="rounded bg-slate-50 px-2 py-1">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">دور: مدير</span>
                <span className="rounded-full bg-indigo-100 px-2 py-1 font-semibold text-indigo-700">مصادقة 2FA</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className="rounded-lg border border-amber-100 px-3 py-2 font-semibold text-amber-700 hover:bg-amber-50"
                  onClick={() => handleStatusChange(selectedUser.id, selectedUser.status === 'active' ? 'suspended' : 'active')}
                >
                  {selectedUser.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-rose-100 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50"
                  onClick={() => handleDelete(selectedUser.id)}
                >
                  حذف الحساب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
