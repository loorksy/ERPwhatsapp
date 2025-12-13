import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchAdvancedSettings, updateAdvancedSettings } from '../services/settings.service';

const WEEK_DAYS = [
  { key: 'saturday', label: 'السبت' },
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
];

const TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Amman',
  'Asia/Beirut',
  'Europe/Berlin',
  'UTC',
];

const DEFAULT_VALUES = {
  timezone: 'Asia/Riyadh',
  operatingHours: WEEK_DAYS.reduce((acc, day) => {
    acc[day.key] = { enabled: day.key !== 'friday', from: '09:00', to: '17:00' };
    return acc;
  }, {}),
  offHoursMessage:
    'شكراً لتواصلك معنا! ساعات عملنا من 9 صباحاً حتى 5 مساءً بتوقيت الرياض. سنعود إليك فوراً في أقرب وقت.',
  welcomeMessages: {
    default: 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
    morning: 'صباح الخير! كيف يمكنني دعمك اليوم؟',
    afternoon: 'مساء الخير! أخبرني كيف يمكنني مساعدتك.',
    evening: 'مساء الخير! أنا هنا لأساعدك.',
    newCustomer: 'أهلاً بك عميلنا الجديد! يسعدنا خدمتك.',
    returningCustomer: 'مرحباً بعودتك! سنهتم بطلبك فوراً.',
  },
  escalation: {
    keywords: ['تحدث مع شخص', 'موظف', 'مدير'],
    maxFailedAttempts: 3,
    notifyOperator: true,
  },
};

function AdvancedSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const keywords = watch('escalation.keywords');
  const timezone = watch('timezone');

  const sortedDays = useMemo(() => WEEK_DAYS, []);

  const loadSettings = async () => {
    setLoading(true);
    setStatus('');
    try {
      const data = await fetchAdvancedSettings();
      if (data) {
        reset({
          timezone: data.timezone || DEFAULT_VALUES.timezone,
          operatingHours: {
            ...DEFAULT_VALUES.operatingHours,
            ...(data.operatingHours || data.schedule || {}),
          },
          offHoursMessage: data.offHoursMessage || data.off_hours_message || DEFAULT_VALUES.offHoursMessage,
          welcomeMessages: {
            ...DEFAULT_VALUES.welcomeMessages,
            ...(data.welcomeMessages || data.welcome_messages || {}),
          },
          escalation: {
            ...DEFAULT_VALUES.escalation,
            ...(data.escalation || {}),
            keywords: data.escalation?.keywords?.length
              ? data.escalation.keywords
              : DEFAULT_VALUES.escalation.keywords,
          },
        });
      }
    } catch (error) {
      setStatus(error?.message || 'تعذر تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addKeyword = (keyword) => {
    if (!keyword) return;
    const existing = new Set(keywords || []);
    if (existing.has(keyword)) return;
    const updated = [...existing, keyword];
    setValue('escalation.keywords', updated, { shouldDirty: true });
  };

  const removeKeyword = (keyword) => {
    const updated = (keywords || []).filter((item) => item !== keyword);
    setValue('escalation.keywords', updated, { shouldDirty: true });
  };

  const onSubmit = async (values) => {
    setSaving(true);
    setStatus('');
    try {
      const payload = {
        timezone: values.timezone,
        operatingHours: values.operatingHours,
        offHoursMessage: values.offHoursMessage,
        welcomeMessages: values.welcomeMessages,
        escalation: {
          keywords: values.escalation.keywords || [],
          maxFailedAttempts: Number(values.escalation.maxFailedAttempts) || 0,
          notifyOperator: Boolean(values.escalation.notifyOperator),
        },
      };
      await updateAdvancedSettings(payload);
      setStatus('تم حفظ الإعدادات بنجاح');
      reset(payload);
    } catch (error) {
      setStatus(error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">الإعدادات المتقدمة</h1>
          <p className="text-sm text-slate-600">تحكم بأوقات التشغيل، الرسائل الترحيبية، وقواعد التحويل للمشغل البشري.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            المنطقة الزمنية الحالية: <span className="font-semibold">{timezone}</span>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
            disabled={loading}
          >
            {loading ? 'يتم التحميل...' : 'إعادة التحميل'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">أوقات التشغيل</h2>
              <p className="text-sm text-slate-600">حدد الأيام والساعات التي يعمل فيها النظام، مع رسالة خارج أوقات العمل.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="timezone" className="text-sm font-semibold text-slate-700">
                المنطقة الزمنية
              </label>
              <select
                id="timezone"
                {...register('timezone', { required: 'المنطقة الزمنية مطلوبة' })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="px-3 py-2 text-right">اليوم</th>
                  <th className="px-3 py-2 text-right">تفعيل</th>
                  <th className="px-3 py-2 text-right">من</th>
                  <th className="px-3 py-2 text-right">إلى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedDays.map((day) => (
                  <tr key={day.key} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-800">{day.label}</td>
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          {...register(`operatingHours.${day.key}.enabled`)}
                        />
                        <span>مفعل</span>
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        {...register(`operatingHours.${day.key}.from`, { required: 'الوقت مطلوب' })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        {...register(`operatingHours.${day.key}.to`, { required: 'الوقت مطلوب' })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">رسالة خارج أوقات العمل</label>
            <textarea
              rows={3}
              {...register('offHoursMessage', { required: 'الرسالة مطلوبة' })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none"
              placeholder="سيتم الرد عليك فوراً خلال ساعات العمل"
            />
            {errors.offHoursMessage && (
              <p className="text-xs text-rose-600">{errors.offHoursMessage.message}</p>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">الرسائل الترحيبية</h2>
            <p className="text-sm text-slate-600">خصص الرسائل الترحيبية حسب الوقت ونوع العميل لدعم تجربة مخصصة.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">رسالة ترحيب افتراضية</label>
              <textarea
                rows={2}
                {...register('welcomeMessages.default', { required: 'الرسالة مطلوبة' })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              {errors.welcomeMessages?.default && (
                <p className="text-xs text-rose-600">{errors.welcomeMessages.default.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">رسالة العملاء الجدد</label>
              <textarea
                rows={2}
                {...register('welcomeMessages.newCustomer', { required: 'الرسالة مطلوبة' })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">صباحاً (6 ص - 12 م)</label>
              <textarea
                rows={2}
                {...register('welcomeMessages.morning', { required: 'الرسالة مطلوبة' })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">ظهراً (12 م - 6 م)</label>
              <textarea
                rows={2}
                {...register('welcomeMessages.afternoon', { required: 'الرسالة مطلوبة' })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">مساءً (6 م - 12 ص)</label>
              <textarea
                rows={2}
                {...register('welcomeMessages.evening', { required: 'الرسالة مطلوبة' })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">رسالة العملاء العائدين</label>
            <textarea
              rows={2}
              {...register('welcomeMessages.returningCustomer', { required: 'الرسالة مطلوبة' })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">شروط التوقف والتحويل</h2>
            <p className="text-sm text-slate-600">حدد الكلمات المفتاحية وقواعد التحويل للمشغل البشري.</p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(keywords || []).map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="text-slate-500 transition hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                id="customKeyword"
                placeholder="أضف كلمة مخصصة"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none sm:max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('customKeyword');
                  addKeyword(input.value.trim());
                  input.value = '';
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none"
              >
                إضافة كلمة
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">التوقف بعد محاولات فاشلة</label>
              <input
                type="number"
                min="1"
                {...register('escalation.maxFailedAttempts', { required: 'هذا الحقل مطلوب', min: 1 })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              {errors.escalation?.maxFailedAttempts && (
                <p className="text-xs text-rose-600">{errors.escalation.maxFailedAttempts.message}</p>
              )}
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  {...register('escalation.notifyOperator')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                إشعار المشغل البشري عند التوقف
              </label>
              <p className="text-xs text-slate-600">سيتم إرسال إشعار فوري للفريق عند الوصول للحد أو ظهور كلمة مفتاحية.</p>
            </div>
          </div>
        </section>

        {status && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              status.includes('نجاح') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
            disabled={!isDirty || saving}
          >
            إلغاء التعديلات
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? 'يتم الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdvancedSettingsPage;
