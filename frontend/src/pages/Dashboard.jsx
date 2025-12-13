import { useEffect, useMemo, useState } from 'react';
import StatusCard from '../components/StatusCard';
import api from '../services/api.service';
import { friendlyError } from '../utils/error';

function DashboardPage() {
  const [health, setHealth] = useState(null);
  const [form, setForm] = useState({ phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const statusItems = useMemo(
    () => [
      {
        label: 'API',
        value: health?.status === 'ok' ? 'Online' : 'Unknown',
        helper: health ? `Environment: ${health.environment}` : 'Awaiting first ping...',
      },
      {
        label: 'WhatsApp',
        value: 'Pending',
        helper: 'Scan the QR code from the backend console to connect.',
      },
      {
        label: 'PostgreSQL',
        value: 'Pending',
        helper: 'Configure DATABASE_URL to enable persistence.',
      },
      {
        label: 'Redis',
        value: 'Pending',
        helper: 'Configure REDIS_URL to enable queues and caching.',
      },
    ],
    [health],
  );

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth(response.data);
      } catch (error) {
        console.error('Failed to fetch health status', error);
      }
    };

    fetchHealth();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/messages/send', form);
      setToast({ type: 'success', message: 'تم جدولة الرسالة بنجاح' });
      setForm({ phone: '', message: '' });
    } catch (error) {
      setToast({ type: 'error', message: friendlyError(error) });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-indigo-600">ERP WhatsApp Automation</p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">لوحة التحكم</h1>
            <p className="text-sm text-slate-600">مراقبة الاتصال وإرسال رسائل تجريبية بسرعة.</p>
          </div>
          <div className="flex gap-3 text-xs text-slate-600">
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">Production Ready</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Multi-tenant</span>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusItems.map((item) => (
          <StatusCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">إرسال رسالة تجريبية</h2>
            <p className="text-sm text-slate-600">استخدم هذا النموذج لاختبار الاتصال مع WhatsApp.</p>
          </div>
          <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">رقم الهاتف (مع كود الدولة)</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="مثال: 201234567890"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">نص الرسالة</label>
              <textarea
                name="message"
                rows="4"
                value={form.message}
                onChange={handleChange}
                placeholder="مرحباً! هذه رسالة تجريبية من نظام الرد الآلي."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {sending ? '...جاري الإرسال' : 'إرسال الآن'}
              </button>
              <p className="text-xs text-slate-500">سيتم إرسال الرسالة عبر عميل WhatsApp المتصل.</p>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">إرشادات سريعة</h2>
          </div>
          <div className="space-y-3 px-6 py-4 text-sm text-slate-700">
            <p>1. قم بتشغيل الخادم الخلفي لتوليد رمز QR وربط حساب WhatsApp الخاص بك.</p>
            <p>2. حدّث متغيرات البيئة في ملف <code>.env</code> لتوصيل قاعدة البيانات و Redis.</p>
            <p>3. أرسل رسالة تجريبية للتأكد من أن كل شيء يعمل كما هو متوقع.</p>
            <p>4. وسّع منطق <code>message.service.js</code> لإضافة الذكاء الاصطناعي والتكاملات الخاصة بك.</p>
          </div>
        </div>
      </section>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
