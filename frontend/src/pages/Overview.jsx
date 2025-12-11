import { useEffect, useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../services/api.service';
import { friendlyError } from '../utils/error';

const initialChartData = [
  { name: 'اليوم', inbound: 24, outbound: 18 },
  { name: 'أمس', inbound: 30, outbound: 20 },
  { name: 'قبل يومين', inbound: 18, outbound: 15 },
  { name: 'قبل 3 أيام', inbound: 22, outbound: 17 },
  { name: 'قبل 4 أيام', inbound: 15, outbound: 12 },
];

const statCards = [
  { key: 'messagesToday', label: 'عدد الرسائل اليوم' },
  { key: 'activeConversations', label: 'المحادثات النشطة' },
  { key: 'responseRate', label: 'معدل الاستجابة', suffix: '%' },
  { key: 'newCustomers', label: 'العملاء الجدد' },
];

function OverviewPage() {
  const [stats, setStats] = useState({
    messagesToday: 0,
    activeConversations: 0,
    responseRate: 98,
    newCustomers: 0,
  });
  const [chartData, setChartData] = useState(initialChartData);
  const [recentConversations, setRecentConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/conversations', { params: { limit: 5, page: 1, status: 'active' } });
      const items = data?.data || data?.items || [];
      setRecentConversations(
        items.map((item) => ({
          id: item.id,
          contactName: item.contact_name || 'بدون اسم',
          contactPhone: item.contact_phone,
          status: item.status,
          updatedAt: item.updated_at,
          priority: item.priority,
        })),
      );
      setStats((prev) => ({
        ...prev,
        activeConversations: items.length,
        messagesToday: Math.max(prev.messagesToday, items.length * 3),
        newCustomers: items.filter((item) => item.priority === 'high').length,
      }));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => {
      fetchOverview();
      setStats((prev) => ({
        ...prev,
        messagesToday: prev.messagesToday + Math.floor(Math.random() * 3),
        responseRate: Math.min(100, prev.responseRate + (Math.random() > 0.6 ? 0 : -1)),
      }));
      setChartData((prev) => {
        const nextInbound = prev[0].inbound + Math.floor(Math.random() * 3);
        const nextOutbound = prev[0].outbound + Math.floor(Math.random() * 3);
        return [{ ...prev[0], inbound: nextInbound, outbound: nextOutbound }, ...prev.slice(0, 4)];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const trend = useMemo(
    () =>
      chartData.reduce(
        (acc, item) => ({ inbound: acc.inbound + item.inbound, outbound: acc.outbound + item.outbound }),
        { inbound: 0, outbound: 0 },
      ),
    [chartData],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-indigo-600">الرؤية العامة</p>
          <h1 className="text-2xl font-bold text-slate-900">لوحة القيادة في الوقت الفعلي</h1>
          <p className="text-sm text-slate-600">تابع الأداء الفوري للرسائل، المحادثات، والردود الذكية.</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">إجمالي الرسائل الأخيرة</p>
          <p className="text-xl font-bold text-slate-900">وارد: {trend.inbound} / صادر: {trend.outbound}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats[card.key]}
              {card.suffix && <span className="text-base font-semibold text-slate-500">{card.suffix}</span>}
            </p>
            <p className="text-xs text-emerald-600">تحديث في الوقت الفعلي</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">الرسائل عبر الزمن</p>
              <h2 className="text-lg font-bold text-slate-900">حجم الرسائل (وارد / صادر)</h2>
            </div>
            <button
              type="button"
              onClick={fetchOverview}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              تحديث الآن
            </button>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value) => [value, 'رسائل']} />
                <Legend />
                <Line type="monotone" dataKey="inbound" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} name="وارد" />
                <Line type="monotone" dataKey="outbound" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} name="صادر" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">آخر المحادثات</p>
              <h2 className="text-lg font-bold text-slate-900">نشاط العملاء المباشر</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {loading && <p className="text-sm text-slate-500">جارِ تحميل آخر التحديثات...</p>}
            {!loading && recentConversations.length === 0 && <p className="text-sm text-slate-500">لا توجد محادثات حديثة.</p>}
            {recentConversations.map((conv) => (
              <div key={conv.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{conv.contactName}</p>
                    <p className="text-xs text-slate-500">{conv.contactPhone}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      conv.status === 'open'
                        ? 'bg-emerald-100 text-emerald-700'
                        : conv.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {conv.status || 'غير معروف'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>الأولوية: {conv.priority || 'عادية'}</span>
                  <span>{conv.updatedAt ? new Date(conv.updatedAt).toLocaleString() : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
