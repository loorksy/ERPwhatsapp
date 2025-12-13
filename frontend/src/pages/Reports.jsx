import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchReportTemplates, scheduleReport, exportReport } from '../services/analytics.service';

const frequencies = [
  { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
];

function ReportsPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedReports, setSelectedReports] = useState(['conversations']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', frequency: 'weekly', time: '09:00' },
  });

  useEffect(() => {
    const loadTemplates = async () => {
      const data = await fetchReportTemplates();
      setTemplates(data);
    };
    loadTemplates();
  }, []);

  const toggleReport = (key) => {
    setSelectedReports((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const selectedTemplates = useMemo(() => templates.filter((t) => selectedReports.includes(t.key)), [templates, selectedReports]);

  const onSubmit = async (values) => {
    setLoading(true);
    setMessage('');
    const payload = { ...values, reports: selectedReports };
    const res = await scheduleReport(payload);
    setMessage(res?.message || 'تم حفظ الجدولة.');
    setLoading(false);
  };

  const handleExport = async (format) => {
    setExporting(true);
    await exportReport(format, { reports: selectedReports });
    setMessage(`تم تجهيز التصدير بصيغة ${format.toUpperCase()}`);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-indigo-600">التقارير</p>
          <h1 className="text-2xl font-bold text-slate-900">لوحة التقارير التفصيلية</h1>
          <p className="text-sm text-slate-600">قم بتوليد، تصدير، وجدولة التقارير الذكية للبريد الإلكتروني.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <span className="text-sm font-semibold text-slate-700">التقارير المحددة: {selectedReports.length}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={exporting}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-60"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">التقارير المتاحة</h2>
            <p className="text-sm text-slate-600">حدد التقارير المطلوب تضمينها، يمكن اختيار أكثر من تقرير.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {templates.map((report) => (
                <button
                  key={report.key}
                  type="button"
                  onClick={() => toggleReport(report.key)}
                  className={`flex flex-col rounded-lg border p-4 text-right transition ${
                    selectedReports.includes(report.key)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{report.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{report.description}</p>
                    </div>
                    <span className="text-lg">{selectedReports.includes(report.key) ? '✔️' : '➕'}</span>
                  </div>
                </button>
              ))}
              {templates.length === 0 && <p className="text-sm text-slate-500">جارِ تحميل التقارير...</p>}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">الجدولة</p>
                <h2 className="text-lg font-bold text-slate-900">إرسال تلقائي عبر البريد</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">موصى به</span>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  البريد الإلكتروني
                  <input
                    type="email"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                    placeholder="email@example.com"
                    {...register('email', { required: 'حقل البريد مطلوب' })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  التكرار
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                    {...register('frequency')}
                  >
                    {frequencies.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  وقت الإرسال
                  <input
                    type="time"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                    {...register('time')}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  لغة التقرير
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                    {...register('language')}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">التقارير المختارة للإرسال:</p>
                {selectedTemplates.length === 0 && <p className="text-slate-500">لم يتم اختيار أي تقرير بعد.</p>}
                <ul className="mt-2 list-disc space-y-1 pr-5">
                  {selectedTemplates.map((report) => (
                    <li key={report.key}>{report.title}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  حفظ الجدولة
                </button>
                {message && <p className="text-sm text-emerald-600">{message}</p>}
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">تقارير مفصلة</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              <li className="rounded-lg bg-slate-50 p-3">تقرير المحادثات: حجم، حالة، والموظف المسؤول.</li>
              <li className="rounded-lg bg-slate-50 p-3">تقرير أداء البوت: دقة الردود ونسب التحويل للمشغل.</li>
              <li className="rounded-lg bg-slate-50 p-3">تقرير الأسئلة الشائعة: الأسئلة المتكررة والردود المقترحة.</li>
              <li className="rounded-lg bg-slate-50 p-3">تقرير أوقات الذروة: ساعات الضغط على الفريق.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">ملاحظات سريعة</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>يتم حفظ آخر تصدير في سجل التنزيلات لديك.</li>
              <li>يمكن ربط الجدولة بتنبيهات البريد للمديرين.</li>
              <li>يدعم التصدير الخط العربي بشكل افتراضي.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
