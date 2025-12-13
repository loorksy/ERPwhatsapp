import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatusCard from '../components/StatusCard';
import { fetchAdminStats } from '../services/admin.service';

const usageSpark = [
  { label: 'الأسبوع -4', value: 6200 },
  { label: 'الأسبوع -3', value: 6800 },
  { label: 'الأسبوع -2', value: 7100 },
  { label: 'الأسبوع -1', value: 7450 },
  { label: 'هذا الأسبوع', value: 7920 },
];

const apiConsumption = [
  { label: 'OpenAI', value: 19420 },
  { label: 'Claude', value: 13210 },
  { label: 'Gemini', value: 10580 },
  { label: 'مخصص', value: 3210 },
];

function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalMessages: 0, apiUsage: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAdminStats();
        setStats(data || {});
      } catch (error) {
        console.error('Failed to load admin stats', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'إجمالي المستخدمين',
        value: loading ? '...' : stats.totalUsers?.toLocaleString('ar-EG'),
        helper: 'العملاء المسجلون في النظام',
      },
      {
        label: 'المستخدمون النشطون',
        value: loading ? '...' : stats.activeUsers?.toLocaleString('ar-EG'),
        helper: 'المتصلون خلال آخر 30 يوماً',
      },
      {
        label: 'إجمالي الرسائل',
        value: loading ? '...' : stats.totalMessages?.toLocaleString('ar-EG'),
        helper: 'الرسائل المتبادلة عبر القنوات',
      },
      {
        label: 'استهلاك واجهات AI',
        value: loading ? '...' : `${stats.apiUsage?.toLocaleString('ar-EG')} طلب`,
        helper: 'الطلبات المجدولة والمباشرة',
      },
    ],
    [loading, stats],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">لوحة تحكم المدير</p>
          <h1 className="text-2xl font-bold text-slate-900">صحة النظام وإجمالي النشاط</h1>
          <p className="mt-2 text-sm text-slate-600">راقب نمو المستخدمين واستهلاك واجهات الذكاء الاصطناعي من مكان واحد.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>محدّث كل 10 دقائق</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatusCard key={card.label} label={card.label} value={card.value || '0'} helper={card.helper} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">نمو الرسائل عبر الأسابيع</h3>
              <p className="text-sm text-slate-500">اتجاه الحجم الكلي للرسائل داخلياً وخارجياً</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">+8% نمو</div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageSpark} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickFormatter={(v) => v.toLocaleString('ar-EG')} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => value.toLocaleString('ar-EG')} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="url(#messagesGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">استهلاك واجهات الذكاء</h3>
              <p className="text-sm text-slate-500">حسب المزود خلال هذا الشهر</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">متعدد المزودين</span>
          </div>
          <div className="mt-4 space-y-3">
            {apiConsumption.map((item) => {
              const percentage = stats.apiUsage ? Math.round((item.value / stats.apiUsage) * 100) : 0;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                    <span>{item.label}</span>
                    <span>{item.value.toLocaleString('ar-EG')} طلب</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${percentage}%` }}
                      aria-label={`${item.label} usage`}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{percentage}% من إجمالي الاستهلاك</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">مراقبة الصحة والأمان</h3>
            <p className="text-sm text-slate-500">إجمالي النشاط اللحظي مع مؤشرات الحالة الأساسية</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">SSL</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">Webhooks</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">Sockets</span>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs text-slate-500">إجمالي الجلسات النشطة</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">84</p>
            <p className="text-xs text-emerald-600">+6 منذ الساعة الماضية</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs text-slate-500">معدل الخطأ</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">0.23%</p>
            <p className="text-xs text-emerald-600">ضمن الحدود الآمنة</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs text-slate-500">متوسط زمن الاستجابة</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">420ms</p>
            <p className="text-xs text-emerald-600">تم تحسينه هذا الأسبوع</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs text-slate-500">التنبيهات الحرجة</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-600">لا يوجد مشاكل حالياً</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
