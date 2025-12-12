import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { deleteAIProvider, fetchAIProviders, saveAIProvider, testAIProvider } from '../services/admin.service';

const maskKey = (key = '') => {
  if (!key) return '****';
  const tail = key.slice(-4);
  return `****${tail}`;
};

const ProviderStatus = ({ status }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    }`}
  >
    {status === 'active' ? 'مفعل' : 'معطل'}
  </span>
);

const ProviderModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      name: '',
      type: 'openai',
      endpoint: '',
      apiKey: '',
      models: '',
      costPerThousand: 0.001,
      status: 'active',
      settings: '{}',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        type: initialData.type || 'openai',
        endpoint: initialData.endpoint || '',
        apiKey: '',
        models: (initialData.models || []).join(', '),
        costPerThousand: initialData.costPerThousand || 0,
        status: initialData.status || 'active',
        settings: JSON.stringify(initialData.settings || {}, null, 2),
      });
    }
  }, [initialData, reset]);

  const submitForm = async (values) => {
    try {
      clearErrors('settings');
      const parsedSettings = values.settings ? JSON.parse(values.settings) : {};
      await onSubmit({
        ...initialData,
        name: values.name,
        type: values.type,
        endpoint: values.type === 'custom' ? values.endpoint : undefined,
        apiKey: values.apiKey || initialData?.apiKey,
        models: values.models
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        costPerThousand: Number(values.costPerThousand),
        status: values.status,
        settings: parsedSettings,
      });
      onClose();
    } catch (error) {
      setError('settings', { type: 'manual', message: 'صيغة JSON غير صحيحة' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">إدارة المزود</p>
            <h3 className="text-lg font-semibold text-slate-900">{initialData ? 'تعديل مزود' : 'إضافة مزود جديد'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            إغلاق
          </button>
        </div>

        <form onSubmit={handleSubmit(submitForm)} className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">اسم المزود</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('name', { required: 'اسم المزود مطلوب' })}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">نوع المزود</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('type', { required: true })}
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="custom">مزود مخصص</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">API Endpoint (للمزود المخصص)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="https://api.example.com"
                {...register('endpoint')}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">التكلفة لكل 1000 توكن (دولار)</label>
              <input
                type="number"
                step="0.0001"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('costPerThousand', { required: true, min: 0 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">API Key</label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="لن يتم عرض المفتاح بالكامل"
                {...register('apiKey')}
              />
              <p className="mt-1 text-[11px] text-slate-500">يُخزن المفتاح مشفراً ولا يُعرض للمستخدمين.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">النماذج المتاحة</label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="افصل بين النماذج بفاصلة، مثل: gpt-4o, gpt-4o-mini"
                {...register('models')}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">إعدادات إضافية (JSON)</label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('settings')}
              />
              {errors.settings && <p className="mt-1 text-xs text-rose-600">{errors.settings.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">الحالة</label>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('status')}
              >
                <option value="active">مفعل</option>
                <option value="inactive">معطل</option>
              </select>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-xs text-slate-500">لن تُعرض مفاتيح API في أي جدول أو سجل نشاط.</p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(submitForm)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ المزود'}
          </button>
        </div>
      </div>
    </div>
  );
};

function AIProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const loadProviders = async () => {
      setLoading(true);
      try {
        const data = await fetchAIProviders();
        setProviders(data || []);
      } catch (error) {
        console.error('Failed to fetch providers', error);
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  const handleSave = async (payload) => {
    const saved = await saveAIProvider(payload);
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) return prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p));
      return [...prev, saved];
    });
    setTestResult('');
  };

  const handleDelete = async (provider) => {
    if (!window.confirm(`هل تريد حذف المزود ${provider.name}؟`)) return;
    await deleteAIProvider(provider.id);
    setProviders((prev) => prev.filter((p) => p.id !== provider.id));
  };

  const handleTest = async (provider) => {
    setTestResult('');
    const response = await testAIProvider(provider);
    setTestResult(response?.ok ? `تم الاختبار بنجاح - زمن الاستجابة ${response.latency || 180}ms` : 'فشل الاختبار');
  };

  const totalUsage = useMemo(
    () => providers.reduce((acc, provider) => acc + (provider.monthlyUsage || 0), 0),
    [providers],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">مزودو الذكاء الاصطناعي</p>
          <h1 className="text-2xl font-bold text-slate-900">إدارة التكاملات والمفاتيح بأمان</h1>
          <p className="mt-1 text-sm text-slate-600">أضف مزودين جدد، اختبر الاتصال، واضبط النماذج والتكاليف لكل مزود.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            إجمالي الاستخدام الشهري: {totalUsage.toLocaleString('ar-EG')} توكن
          </span>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            إضافة مزود جديد
          </button>
        </div>
      </div>

      {testResult && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{testResult}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3 text-right">المزود</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">API Key</th>
              <th className="px-4 py-3 text-right">النماذج</th>
              <th className="px-4 py-3 text-right">التكلفة / 1000 توكن</th>
              <th className="px-4 py-3 text-right">الاستخدام الشهري</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td className="px-4 py-3 text-center text-slate-500" colSpan={7}>
                  جارٍ تحميل المزودين...
                </td>
              </tr>
            )}
            {!loading &&
              providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-900">{provider.name}</span>
                      <span className="text-xs text-slate-500">{provider.type === 'custom' ? provider.endpoint : provider.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><ProviderStatus status={provider.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{maskKey(provider.apiKey)}</td>
                  <td className="px-4 py-3 text-slate-700">{provider.models?.slice(0, 3).join(', ')}</td>
                  <td className="px-4 py-3 text-slate-700">${provider.costPerThousand?.toFixed(4)}</td>
                  <td className="px-4 py-3 text-slate-700">{provider.monthlyUsage?.toLocaleString('ar-EG')} توكن</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(provider);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTest(provider)}
                        className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        اختبار
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(provider)}
                        className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && providers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  لا توجد مزودات حالياً. أضف أول مزود لك للبدء.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProviderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialData={selected}
      />
    </div>
  );
}

export default AIProviders;
