import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchSubscriptionPlans, updateSubscriptionPlan } from '../services/admin.service';

const providerOptions = ['OpenAI', 'Claude', 'Gemini', 'مزود مخصص'];

const PlanCard = ({ plan, onEdit }) => (
  <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">الخطة</p>
          <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {plan.subscribers?.toLocaleString('ar-EG')} مشترك
        </span>
      </div>
      <div className="flex items-baseline gap-2 text-slate-900">
        <p className="text-3xl font-bold">${plan.price}</p>
        <p className="text-sm text-slate-500">{plan.currency}</p>
      </div>
      <div className="grid gap-2 text-sm text-slate-700">
        <p>حد الرسائل: {plan.messageLimit?.toLocaleString('ar-EG')} رسالة / شهر</p>
        <p>حسابات واتساب: {plan.whatsappAccounts}</p>
        <p>مزودي AI: {plan.aiProviders?.join('، ')}</p>
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        {plan.features?.map((feature) => (
          <div key={feature.label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                feature.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400'
              }`}
            >
              {feature.enabled ? '✓' : '•'}
            </span>
            <span>{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onEdit(plan)}
      className="mt-6 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
    >
      تعديل الخطة
    </button>
  </div>
);

const PlanModal = ({ isOpen, onClose, plan, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      price: 0,
      messageLimit: 0,
      whatsappAccounts: 1,
      aiProviders: [],
      features: [],
    },
  });

  useEffect(() => {
    if (plan) {
      reset({
        price: plan.price,
        messageLimit: plan.messageLimit,
        whatsappAccounts: plan.whatsappAccounts,
        aiProviders: plan.aiProviders || [],
        features: plan.features || [],
      });
    }
  }, [plan, reset]);

  const selectedProviders = watch('aiProviders');
  const featureValues = watch('features');

  const onSubmit = async (values) => {
    const payload = {
      price: Number(values.price),
      messageLimit: Number(values.messageLimit),
      whatsappAccounts: Number(values.whatsappAccounts),
      aiProviders: values.aiProviders,
      features: values.features,
    };

    await onSave(payload);
    onClose();
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">تعديل الخطة</p>
            <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            إغلاق
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">السعر الشهري (دولار)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('price', { required: 'السعر مطلوب', min: { value: 0, message: 'السعر غير صالح' } })}
              />
              {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price.message}</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">حد الرسائل الشهري</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  {...register('messageLimit', {
                    required: 'حد الرسائل مطلوب',
                    min: { value: 0, message: 'القيمة يجب أن تكون موجبة' },
                  })}
                />
                {errors.messageLimit && <p className="mt-1 text-xs text-rose-600">{errors.messageLimit.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">عدد حسابات واتساب</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  {...register('whatsappAccounts', {
                    required: 'هذا الحقل مطلوب',
                    min: { value: 1, message: 'يجب أن يكون 1 على الأقل' },
                  })}
                />
                {errors.whatsappAccounts && <p className="mt-1 text-xs text-rose-600">{errors.whatsappAccounts.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">مزودو الذكاء الاصطناعي المسموحون</label>
              <div className="grid grid-cols-2 gap-2">
                {providerOptions.map((provider) => (
                  <label
                    key={provider}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      selectedProviders?.includes(provider)
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={provider}
                      className="accent-indigo-600"
                      {...register('aiProviders')}
                    />
                    <span>{provider}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">الميزات المتاحة</h4>
                <span className="text-xs text-slate-500">تفعيل / تعطيل</span>
              </div>
              <div className="mt-3 space-y-2">
                {featureValues?.map((feature, idx) => (
                  <label key={feature.label} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <span>{feature.label}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-600"
                      checked={feature.enabled}
                      onChange={(e) => {
                        const updated = [...featureValues];
                        updated[idx] = { ...feature, enabled: e.target.checked };
                        setValue('features', updated, { shouldDirty: true });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              <p className="font-semibold">تلميح الحوكمة</p>
              <p className="text-slate-700">
                احرص على إبقاء الأسعار والحدود متوافقة مع العقود، وتأكد من أن الميزات المفعّلة تعكس مستوى الدعم المسموح لكل خطة.
              </p>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="text-xs text-slate-500">تأثير التغيير يظهر فور الحفظ.</div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  );
};

function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const data = await fetchSubscriptionPlans();
        setPlans(data || []);
      } catch (error) {
        console.error('Failed to load plans', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const openModal = (plan) => {
    setActivePlan(plan);
    setModalOpen(true);
    setStatus('');
  };

  const handleSave = async (payload) => {
    setStatus('');
    const updated = await updateSubscriptionPlan(activePlan.id, payload);
    setPlans((prev) => prev.map((plan) => (plan.id === activePlan.id ? { ...plan, ...updated } : plan)));
    setStatus('تم حفظ الخطة بنجاح');
  };

  const totalSubscribers = useMemo(
    () => plans.reduce((acc, plan) => acc + (plan.subscribers || 0), 0),
    [plans],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">الخطط والتسعير</p>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الاشتراكات ومزايا كل خطة</h1>
          <p className="mt-1 text-sm text-slate-600">حدّث الأسعار والحدود ومزودي الذكاء الاصطناعي لكل شريحة عملاء.</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          إجمالي المشتركين: {totalSubscribers.toLocaleString('ar-EG')}
        </div>
      </div>

      {status && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{status}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading && <p className="text-sm text-slate-500">جارٍ تحميل الخطط...</p>}
        {!loading &&
          plans.map((plan) => <PlanCard key={plan.id} plan={plan} onEdit={openModal} />)}
      </div>

      <PlanModal isOpen={modalOpen} onClose={() => setModalOpen(false)} plan={activePlan} onSave={handleSave} />
    </div>
  );
}

export default SubscriptionPlans;
